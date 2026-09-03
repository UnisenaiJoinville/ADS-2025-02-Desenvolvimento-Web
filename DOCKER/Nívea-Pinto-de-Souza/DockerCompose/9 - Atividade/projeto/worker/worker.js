import amqp from 'amqplib';
const url=`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST||'rabbitmq'}:5672`;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(;;){try{const c=await amqp.connect(url);const ch=await c.createChannel();await ch.assertQueue('jobs',{durable:true});console.log('Worker pronto');ch.consume('jobs',m=>{if(m){console.log('Processado:',m.content.toString());ch.ack(m);}});break;}catch(e){console.log('Aguardando RabbitMQ');await wait(3000);}}
