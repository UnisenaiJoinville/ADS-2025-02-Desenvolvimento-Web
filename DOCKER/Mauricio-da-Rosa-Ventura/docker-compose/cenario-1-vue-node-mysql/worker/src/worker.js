"use strict";

/**
 * Worker minimo do Cenario 1. Processo separado da API (container proprio,
 * ver 6 - estrutura de pastas sugerida), que so consome a fila
 * "cenario1.eventos" publicada pela API em GET /api/status e imprime cada
 * mensagem recebida - prova de que a mensageria assincrona (RabbitMQ)
 * conecta dois containers diferentes sem eles se conhecerem diretamente.
 */

const amqplib = require("amqplib");

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "rabbitmq";
const RABBITMQ_PORT = Number(process.env.RABBITMQ_PORT || 5672);
const QUEUE = "cenario1.eventos";

async function main() {
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

  let conn;
  for (let tentativa = 1; tentativa <= 10; tentativa++) {
    try {
      conn = await amqplib.connect(url);
      break;
    } catch (err) {
      console.log(`[worker] RabbitMQ ainda nao disponivel (tentativa ${tentativa}/10): ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!conn) {
    console.error("[worker] nao foi possivel conectar ao RabbitMQ, encerrando.");
    process.exit(1);
  }

  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  console.log(`[worker] conectado ao RabbitMQ, aguardando mensagens em "${QUEUE}"...`);

  channel.consume(QUEUE, (msg) => {
    if (!msg) return;
    const conteudo = JSON.parse(msg.content.toString());
    console.log("[worker] mensagem recebida:", conteudo);
    channel.ack(msg);
  });
}

main().catch((err) => {
  console.error("[worker] erro fatal:", err);
  process.exit(1);
});
