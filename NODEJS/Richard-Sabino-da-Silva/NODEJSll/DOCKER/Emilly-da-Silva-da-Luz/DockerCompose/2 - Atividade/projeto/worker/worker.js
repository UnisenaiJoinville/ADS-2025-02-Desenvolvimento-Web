import amqp from 'amqplib';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
while(true){try{const c=await amqp.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}`); const ch=await c.createChannel(); await ch.assertQueue('book.created',{durable:true}); console.log('worker aguardando book.created'); ch.consume('book.created',msg=>{if(!msg)return; console.log('novo livro:',msg.content.toString()); ch.ack(msg);}); break;}catch(e){console.log('aguardando RabbitMQ...',e.message); await sleep(3000);}}
