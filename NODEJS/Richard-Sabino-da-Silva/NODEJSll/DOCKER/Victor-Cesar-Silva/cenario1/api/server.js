import express from 'express';
import mysql from 'mysql2/promise';
import { createClient } from 'redis';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FILA = 'agendamentos';

// Todos os hosts vem por variavel de ambiente e apontam para o NOME do servico
// no compose (mysql, redis, rabbitmq) - nunca localhost.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const redis = createClient({ url: `redis://${process.env.REDIS_HOST}:6379` });
redis.on('error', (e) => console.error('[redis]', e.message));

let canal = null;

// Cria a tabela e conecta nos servicos auxiliares no boot.
async function iniciar() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      paciente VARCHAR(120) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[mysql] conectado e tabela pronta');

  await redis.connect();
  console.log('[redis] conectado');

  const conn = await amqp.connect(
    `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:5672`,
  );
  canal = await conn.createChannel();
  await canal.assertQueue(FILA, { durable: true });
  console.log('[rabbitmq] conectado');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servico: 'api' });
});

// Leitura com cache: primeiro tenta o Redis, so vai ao MySQL se der miss.
app.get('/agendamentos', async (req, res) => {
  const cache = await redis.get('agendamentos');
  if (cache) {
    return res.json({ origem: 'redis', dados: JSON.parse(cache) });
  }

  const [linhas] = await db.query('SELECT * FROM agendamentos ORDER BY id DESC');
  await redis.set('agendamentos', JSON.stringify(linhas), { EX: 30 });
  res.json({ origem: 'mysql', dados: linhas });
});

// Escrita: grava no banco, invalida o cache e publica o evento na fila.
app.post('/agendamentos', async (req, res) => {
  const { paciente } = req.body;
  if (!paciente) {
    return res.status(400).json({ erro: 'campo paciente e obrigatorio' });
  }

  const [r] = await db.query('INSERT INTO agendamentos (paciente) VALUES (?)', [paciente]);
  await redis.del('agendamentos');
  canal.sendToQueue(FILA, Buffer.from(JSON.stringify({ id: r.insertId, paciente })), {
    persistent: true,
  });

  res.status(201).json({ id: r.insertId, paciente, evento: 'publicado na fila' });
});

iniciar()
  .then(() => app.listen(PORT, () => console.log(`API na porta ${PORT}`)))
  .catch((e) => {
    console.error('Falha ao iniciar:', e.message);
    process.exit(1);
  });
