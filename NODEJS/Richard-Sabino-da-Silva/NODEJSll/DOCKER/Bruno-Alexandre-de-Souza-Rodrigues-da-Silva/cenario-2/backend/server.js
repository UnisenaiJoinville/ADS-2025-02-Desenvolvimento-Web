import express from 'express';
import pg from 'pg';
import { createClient } from 'redis';

const app = express();
const PORT = 3000;

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servico: 'api-cenario-2' });
});

app.get('/produtos', async (req, res) => {
  const cache = await redisClient.get('produtos');
  if (cache) {
    return res.json({ origem: 'redis', dados: JSON.parse(cache) });
  }
  const { rows } = await pool.query('SELECT * FROM produtos');
  await redisClient.setEx('produtos', 30, JSON.stringify(rows));
  res.json({ origem: 'postgres', dados: rows });
});

await redisClient.connect();
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
