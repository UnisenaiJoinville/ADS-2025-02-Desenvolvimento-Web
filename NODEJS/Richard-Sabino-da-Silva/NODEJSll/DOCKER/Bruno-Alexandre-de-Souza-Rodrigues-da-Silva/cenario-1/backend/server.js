import express from 'express';
import mysql from 'mysql2/promise';
import { createClient } from 'redis';
import amqp from 'amqplib';

const app = express();
const PORT = process.env.PORT || 3000;

// os hosts sao o nome do servico no compose, nao localhost
const DB_HOST = process.env.DB_HOST || 'mysql';
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';

let redisClient;
let rabbitChannel;

async function conectarRedis() {
  redisClient = createClient({ url: `redis://${REDIS_HOST}:6379` });
  redisClient.on('error', (e) => console.error('Redis:', e.message));
  await redisClient.connect();
  console.log('Redis conectado');
}

async function conectarRabbit() {
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:5672`;
  const conexao = await amqp.connect(url);
  rabbitChannel = await conexao.createChannel();
  await rabbitChannel.assertQueue('tarefas', { durable: true });
  console.log('RabbitMQ conectado');
}

async function conectarMysql() {
  return mysql.createPool({
    host: DB_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
  });
}

let pool;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servico: 'api-cenario-1' });
});

// prova que a api fala com os tres servicos
app.get('/status', async (req, res) => {
  const resultado = { mysql: false, redis: false, rabbitmq: false };

  try {
    const [linhas] = await pool.query('SELECT 1 AS ok');
    resultado.mysql = linhas[0].ok === 1;
  } catch (e) {
    resultado.erroMysql = e.message;
  }

  try {
    await redisClient.set('ultimo-acesso', new Date().toISOString());
    resultado.redis = (await redisClient.get('ultimo-acesso')) !== null;
  } catch (e) {
    resultado.erroRedis = e.message;
  }

  try {
    rabbitChannel.sendToQueue('tarefas', Buffer.from('acesso ao /status'));
    resultado.rabbitmq = true;
  } catch (e) {
    resultado.erroRabbit = e.message;
  }

  res.json(resultado);
});

// exemplo de cache: primeira chamada busca no banco, as seguintes vem do redis
app.get('/agenda', async (req, res) => {
  const cache = await redisClient.get('agenda');
  if (cache) {
    return res.json({ origem: 'redis', dados: JSON.parse(cache) });
  }

  const [linhas] = await pool.query('SELECT * FROM horarios');
  await redisClient.setEx('agenda', 30, JSON.stringify(linhas));
  res.json({ origem: 'mysql', dados: linhas });
});

async function iniciar() {
  pool = await conectarMysql();
  await conectarRedis();
  await conectarRabbit();

  app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
  });
}

iniciar().catch((e) => {
  console.error('Falha ao iniciar:', e.message);
  process.exit(1);
});
