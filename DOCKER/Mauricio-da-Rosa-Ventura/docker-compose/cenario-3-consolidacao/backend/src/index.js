"use strict";

/**
 * API do Cenario 3 (atividade de consolidacao). Escolha propria de
 * arquitetura: Vue (frontend) + Fastify (backend) + PostgreSQL + Redis +
 * RabbitMQ + worker dedicado. Fastify foi escolhido no lugar do Express (ja
 * usado no Cenario 2) por ser a alternativa citada no Modulo 0 (secao 14.1)
 * com foco em desempenho e validacao de schema integrada (JSON Schema) - o
 * schema abaixo em POST /eventos usa exatamente esse recurso nativo.
 *
 * Como nos demais cenarios, o foco e a estrutura de containers: as rotas
 * existem para provar a comunicacao real com banco, cache e mensageria, nao
 * para implementar regra de negocio.
 */

const Fastify = require("fastify");
const { Client } = require("pg");
const Redis = require("ioredis");
const amqplib = require("amqplib");

const PORT = process.env.PORT || 3000;
const app = Fastify({ logger: true });

const DB_HOST = process.env.DB_HOST || "postgres";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "rabbitmq";
const RABBITMQ_PORT = Number(process.env.RABBITMQ_PORT || 5672);
const QUEUE = "cenario3.eventos";

async function withPostgres(fn) {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

app.get("/health", async () => ({ status: "ok" }));

app.get("/status", async () => {
  const resultado = {};

  try {
    const total = await withPostgres((c) => c.query("SELECT COUNT(*)::int AS total FROM eventos"));
    resultado.postgres = { ok: true, totalEventos: total.rows[0].total };
  } catch (err) {
    resultado.postgres = { ok: false, erro: err.message };
  }

  try {
    const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, lazyConnect: true, maxRetriesPerRequest: 1 });
    await redis.connect();
    await redis.set("cenario3:ultima-verificacao", new Date().toISOString());
    const valor = await redis.get("cenario3:ultima-verificacao");
    await redis.quit();
    resultado.redis = { ok: true, valor };
  } catch (err) {
    resultado.redis = { ok: false, erro: err.message };
  }

  try {
    const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
    const conn = await amqplib.connect(url);
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.close();
    await conn.close();
    resultado.rabbitmq = { ok: true, fila: QUEUE };
  } catch (err) {
    resultado.rabbitmq = { ok: false, erro: err.message };
  }

  return resultado;
});

// POST /eventos: unica rota "de negocio" deste cenario, deliberadamente
// simples - grava o evento no Postgres e publica na fila para o worker
// processar de forma assincrona. Usa validacao de schema nativa do Fastify
// (JSON Schema), o diferencial citado no material para esse framework.
app.post(
  "/eventos",
  {
    schema: {
      body: {
        type: "object",
        required: ["tipo"],
        properties: {
          tipo: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
    },
  },
  async (request, reply) => {
    const { tipo } = request.body;

    await withPostgres((c) => c.query("INSERT INTO eventos (tipo) VALUES ($1)", [tipo]));

    const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
    const conn = await amqplib.connect(url);
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify({ tipo, em: new Date().toISOString() })));
    await channel.close();
    await conn.close();

    reply.code(201).send({ ok: true, tipo });
  },
);

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  app.log.info(`API do Cenario 3 (Fastify) ouvindo na porta ${PORT}`);
});
