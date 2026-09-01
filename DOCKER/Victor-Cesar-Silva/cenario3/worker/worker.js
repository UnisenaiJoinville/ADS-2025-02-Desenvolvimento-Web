import amqp from 'amqplib';

const FILA = 'tarefas';

// Consome os eventos publicados pela API de forma assincrona,
// sem travar a resposta HTTP de quem criou o agendamento.
async function iniciar() {
  const conn = await amqp.connect(
    `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:5672`,
  );
  const canal = await conn.createChannel();
  await canal.assertQueue(FILA, { durable: true });

  // prefetch 1: pega uma mensagem por vez, so busca a proxima apos o ack.
  canal.prefetch(1);
  console.log('[worker] aguardando mensagens na fila', FILA);

  canal.consume(FILA, (msg) => {
    if (!msg) return;
    const evento = JSON.parse(msg.content.toString());
    console.log(`[worker] processando tarefa ${evento.id}: ${evento.titulo}`);
    // Aqui entraria o trabalho pesado real: enviar e-mail, gerar PDF, etc.
    canal.ack(msg);
  });
}

iniciar().catch((e) => {
  console.error('[worker] falha:', e.message);
  process.exit(1);
});
