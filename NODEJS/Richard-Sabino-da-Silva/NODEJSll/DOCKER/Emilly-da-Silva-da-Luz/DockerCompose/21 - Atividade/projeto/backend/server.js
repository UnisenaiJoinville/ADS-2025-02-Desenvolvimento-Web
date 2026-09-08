import express from 'express';
import mysql from 'mysql2/promise';
import Redis from 'ioredis';
import amqp from 'amqplib';

const app = express();
app.use(express.json());
const pool = mysql.createPool({host: process.env.DB_HOST, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE});
const redis = new Redis({host: process.env.REDIS_HOST});

app.get('/health', (_req,res)=>res.json({status:'ok', service:'catalog-api'}));
app.get('/books', async (_req,res)=>{
  const cached = await redis.get('books:list');
  if (cached) return res.json({source:'redis', data:JSON.parse(cached)});
  const [rows] = await pool.query('SELECT * FROM books ORDER BY id');
  await redis.set('books:list', JSON.stringify(rows), 'EX', 30);
  res.json({source:'mysql', data:rows});
});
app.post('/books', async (req,res)=>{
  const title = String(req.body.title || '').trim();
  if (!title) return res.status(400).json({error:'title is required'});
  const [result] = await pool.execute('INSERT INTO books(title) VALUES (?)',[title]);
  await redis.del('books:list');
  try {
    const conn = await amqp.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}`);
    const ch = await conn.createChannel(); await ch.assertQueue('book.created',{durable:true});
    ch.sendToQueue('book.created',Buffer.from(JSON.stringify({id:result.insertId,title})),{persistent:true});
    setTimeout(()=>conn.close(),100);
  } catch(e) { console.error('rabbitmq:', e.message); }
  res.status(201).json({id:result.insertId,title});
});
app.listen(3000,'0.0.0.0',()=>console.log('catalog-api ready on 3000'));
