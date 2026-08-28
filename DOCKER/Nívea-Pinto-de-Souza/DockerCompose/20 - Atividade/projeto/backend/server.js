import express from 'express';
import mysql from 'mysql2/promise';
import { createClient } from 'redis';
import amqp from 'amqplib';

const app = express();
app.use(express.json());
const port = 3000;

const db = await mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});
const redis = createClient({ url: `redis://${process.env.REDIS_HOST || 'redis'}:6379` });
await redis.connect();

app.get('/health', async (_req,res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({status:'ok', mysql:'ok', redis:'ok'});
  } catch (e) { res.status(500).json({status:'error', error:e.message}); }
});
app.get('/messages', async (_req,res) => {
  const cached = await redis.get('messages');
  if (cached) return res.json({source:'redis', data:JSON.parse(cached)});
  const [rows] = await db.query('SELECT * FROM messages ORDER BY id');
  await redis.set('messages', JSON.stringify(rows), { EX: 30 });
  res.json({source:'mysql', data:rows});
});
app.post('/publish', async (req,res) => {
  const conn = await amqp.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST || 'rabbitmq'}:5672`);
  const ch = await conn.createChannel();
  await ch.assertQueue('jobs', {durable:true});
  const msg = JSON.stringify({text:req.body.text || 'mensagem de teste'});
  ch.sendToQueue('jobs', Buffer.from(msg), {persistent:true});
  setTimeout(() => conn.close(), 300);
  res.status(202).json({queued:true, message:JSON.parse(msg)});
});
app.listen(port, '0.0.0.0', () => console.log(`API ativa na porta ${port}`));
