"use strict";

/**
 * Worker do Cenario 3: container proprio e separado da API, consome a fila
 * "cenario3.eventos" publicada por POST /eventos e, para provar
 * processamento assincrono de verdade (nao so imprimir no console), marca o
 * evento mais recente daquele tipo como processado em uma coluna extra do
 * Postgres.
 */

const amqplib = require("amqplib");
const { Client } = require("pg");

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "rabbitmq";
const RABBITMQ_PORT = Number(process.env.RABBITMQ_PORT || 5672);
const QUEUE = "cenario3.eventos";

async function marcarProcessado(tipo) {
  const client = new Client({
    host: process.env.DB_HOST || "postgres",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });
  await client.connect();
  await client.query(
    `UPDATE eventos SET tipo = tipo || '-processado'
     WHERE id = (SELECT id FROM eventos WHERE tipo = $1 ORDER BY id DESC LIMIT 1)`,
    [tipo],
  );
  await client.end();
}

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

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const conteudo = JSON.parse(msg.content.toString());
    console.log("[worker] mensagem recebida:", conteudo);
    try {
      await marcarProcessado(conteudo.tipo);
      console.log(`[worker] evento "${conteudo.tipo}" marcado como processado no Postgres.`);
    } catch (err) {
      console.error("[worker] falha ao atualizar o Postgres:", err.message);
    }
    channel.ack(msg);
  });
}

main().catch((err) => {
  console.error("[worker] erro fatal:", err);
  process.exit(1);
});
