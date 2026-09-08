import amqp from 'amqplib';
import mysql from 'mysql2/promise';
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (;;) {
  try {
    const conn = await amqp.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST || 'rabbitmq'}:5672`);
    const ch = await conn.createChannel();
    await ch.assertQueue('jobs', {durable:true});
    const db = await mysql.createPool({host:process.env.DB_HOST||'mysql',user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE});
    console.log('Worker aguardando mensagens em jobs...');
    ch.consume('jobs', async msg => {
      if (!msg) return;
      const body = JSON.parse(msg.content.toString());
      await db.query('INSERT INTO messages(text) VALUES (?)', [body.text]);
      console.log('Mensagem processada:', body.text);
      ch.ack(msg);
    });
    break;
  } catch (e) { console.log('Aguardando dependências...', e.message); await sleep(3000); }
}
