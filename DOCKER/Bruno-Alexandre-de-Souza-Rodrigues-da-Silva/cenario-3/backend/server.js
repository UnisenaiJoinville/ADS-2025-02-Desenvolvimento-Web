import express from 'express';
import pg from 'pg';
import { createClient } from 'redis';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const PORT = 3000;
const FILA = 'emprestimos';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'postgres',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:6379`,
});
redisClient.on('error', (e) => console.error('Redis:', e.message));

let canalRabbit;

async function conectarRabbit() {
  const host = process.env.RABBITMQ_HOST || 'rabbitmq';
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${host}:5672`;
  const conexao = await amqp.connect(url);
  canalRabbit = await conexao.createChannel();
  await canalRabbit.assertQueue(FILA, { durable: true });
  console.log('RabbitMQ conectado');
}

app.get('/health', async (req, res) => {
  const dependencias = { postgres: false, redis: false, rabbitmq: false };

  try {
    await pool.query('SELECT 1');
    dependencias.postgres = true;
  } catch {
    dependencias.postgres = false;
  }

  try {
    await redisClient.ping();
    dependencias.redis = true;
  } catch {
    dependencias.redis = false;
  }

  dependencias.rabbitmq = canalRabbit !== undefined;

  const tudoOk = Object.values(dependencias).every((v) => v === true);
  res.status(tudoOk ? 200 : 503).json({
    status: tudoOk ? 'ok' : 'degradado',
    servico: 'api-biblioteca',
    dependencias,
  });
});

// leitura com cache: primeira vez busca no banco, depois vem do redis
app.get('/livros', async (req, res) => {
  const cache = await redisClient.get('livros');
  if (cache) {
    return res.json({ origem: 'redis', dados: JSON.parse(cache) });
  }

  const { rows } = await pool.query('SELECT * FROM livros ORDER BY id');
  await redisClient.setEx('livros', 30, JSON.stringify(rows));
  res.json({ origem: 'postgres', dados: rows });
});

// escrita: grava no banco, invalida o cache e manda o trabalho pesado pra fila
app.post('/emprestimos', async (req, res) => {
  const { livroId, aluno } = req.body;

  if (!livroId || !aluno) {
    return res.status(400).json({ erro: 'informe livroId e aluno' });
  }

  const { rows } = await pool.query(
    'INSERT INTO emprestimos (livro_id, aluno) VALUES ($1, $2) RETURNING *',
    [livroId, aluno],
  );

  await pool.query('UPDATE livros SET disponivel = FALSE WHERE id = $1', [
    livroId,
  ]);

  // o cache ficou velho depois da escrita
  await redisClient.del('livros');

  // o comprovante nao pode travar a resposta, entao vai pra fila
  canalRabbit.sendToQueue(
    FILA,
    Buffer.from(JSON.stringify({ emprestimoId: rows[0].id, aluno })),
    { persistent: true },
  );

  res.status(201).json({ emprestimo: rows[0], comprovante: 'na fila' });
});

async function iniciar() {
  await redisClient.connect();
  await conectarRabbit();
  app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
}

iniciar().catch((e) => {
  console.error('Falha ao iniciar:', e.message);
  process.exit(1);
});
