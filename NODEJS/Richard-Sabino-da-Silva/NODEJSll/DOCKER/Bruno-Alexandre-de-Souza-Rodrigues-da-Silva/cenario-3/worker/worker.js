import amqp from 'amqplib';

const FILA = 'emprestimos';

async function iniciar() {
  const host = process.env.RABBITMQ_HOST || 'rabbitmq';
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${host}:5672`;

  const conexao = await amqp.connect(url);
  const canal = await conexao.createChannel();
  await canal.assertQueue(FILA, { durable: true });

  console.log('Worker no ar, esperando mensagens na fila', FILA);

  canal.consume(FILA, async (msg) => {
    if (!msg) return;

    const dados = JSON.parse(msg.content.toString());
    console.log(`Gerando comprovante do emprestimo ${dados.emprestimoId} para ${dados.aluno}`);

    // simula um trabalho demorado que nao pode travar a resposta HTTP
    await new Promise((r) => setTimeout(r, 1500));

    console.log(`Comprovante do emprestimo ${dados.emprestimoId} pronto`);
    canal.ack(msg);
  });
}

iniciar().catch((e) => {
  console.error('Falha no worker:', e.message);
  process.exit(1);
});
