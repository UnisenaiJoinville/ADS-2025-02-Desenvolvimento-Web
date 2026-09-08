import express from 'express'; import pg from 'pg'; import Redis from 'ioredis';
const {Pool}=pg; const app=express(); app.use(express.json());
const pool=new Pool({host:process.env.DB_HOST,user:process.env.POSTGRES_USER,password:process.env.POSTGRES_PASSWORD,database:process.env.POSTGRES_DB});
const redis=new Redis({host:process.env.REDIS_HOST});
app.get('/health',(_q,r)=>r.json({status:'healthy',service:'tasks-api'}));
app.get('/tasks',async(_q,r)=>{let c=await redis.get('tasks'); if(c)return r.json({source:'redis',data:JSON.parse(c)}); const x=await pool.query('SELECT * FROM tasks ORDER BY id'); await redis.set('tasks',JSON.stringify(x.rows),'EX',20); r.json({source:'postgres',data:x.rows});});
app.listen(3000,'0.0.0.0',()=>console.log('tasks-api ready'));
