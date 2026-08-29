import amqp from 'amqplib';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';

async function iniciar() {
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:5672`;
  const conexao = await amqp.connect(url);
  const canal = await conexao.createChannel();

  await canal.assertQueue('tarefas', { durable: true });
  console.log('Worker no ar, esperando mensagens na fila "tarefas"');

  canal.consume('tarefas', (msg) => {
    if (msg) {
      console.log('Mensagem recebida:', msg.content.toString());
      canal.ack(msg);
    }
  });
}

iniciar().catch((e) => {
  console.error('Falha no worker:', e.message);
  process.exit(1);
});
