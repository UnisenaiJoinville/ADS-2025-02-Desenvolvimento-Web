import express from 'express';
import pg from 'pg';
import { createClient } from 'redis';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FILA = 'tarefas';

// Nenhum host e "localhost": todos sao nomes de servico da rede interna.
const db = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

const redis = createClient({ url: `redis://${process.env.REDIS_HOST}:6379` });
redis.on('error', (e) => console.error('[redis]', e.message));

let canal = null;

async function iniciar() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tarefas (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('[postgres] conectado e tabela pronta');

  await redis.connect();
  console.log('[redis] conectado');

  const conn = await amqp.connect(
    `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:5672`,
  );
  canal = await conn.createChannel();
  await canal.assertQueue(FILA, { durable: true });
  console.log('[rabbitmq] conectado');
}

// Endpoint obrigatorio: reporta o estado das tres dependencias.
app.get('/health', async (req, res) => {
  const saude = { status: 'ok', postgres: 'off', redis: 'off', rabbitmq: 'off' };
  try {
    await db.query('SELECT 1');
    saude.postgres = 'ok';
  } catch {
    saude.status = 'degradado';
  }
  saude.redis = redis.isOpen ? 'ok' : ((saude.status = 'degradado'), 'off');
  saude.rabbitmq = canal ? 'ok' : ((saude.status = 'degradado'), 'off');
  res.status(saude.status === 'ok' ? 200 : 503).json(saude);
});

// Leitura com cache no Redis (TTL de 30s).
app.get('/tarefas', async (req, res) => {
  const cache = await redis.get('tarefas');
  if (cache) return res.json({ origem: 'redis', dados: JSON.parse(cache) });

  const r = await db.query('SELECT * FROM tarefas ORDER BY id DESC');
  await redis.set('tarefas', JSON.stringify(r.rows), { EX: 30 });
  res.json({ origem: 'postgres', dados: r.rows });
});

// Escrita: grava, invalida o cache e publica na fila para o worker.
app.post('/tarefas', async (req, res) => {
  const { titulo } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'campo titulo e obrigatorio' });

  const r = await db.query('INSERT INTO tarefas (titulo) VALUES ($1) RETURNING id', [titulo]);
  const id = r.rows[0].id;
  await redis.del('tarefas');
  canal.sendToQueue(FILA, Buffer.from(JSON.stringify({ id, titulo })), { persistent: true });

  res.status(201).json({ id, titulo, evento: 'publicado na fila' });
});

iniciar()
  .then(() => app.listen(PORT, () => console.log(`Backend na porta ${PORT}`)))
  .catch((e) => {
    console.error('Falha ao iniciar:', e.message);
    process.exit(1);
  });
