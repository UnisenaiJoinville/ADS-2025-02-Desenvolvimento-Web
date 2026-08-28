"use strict";

/**
 * API minima do Cenario 1 (VueJS + NodeJS + MySQL + Redis + RabbitMQ).
 *
 * O foco desta atividade e a ESTRUTURA de containers (ver material de Docker
 * Compose, secao 6), nao a implementacao de regras de negocio. Por isso esta
 * API nao tem rotas de negocio: ela so expoe duas rotas que provam, de forma
 * verificavel (Atividades parciais 6.3 e pergunta 8.2 "como a equipe provara
 * que o backend conversa com banco, Redis e mensageria"), que a API consegue
 * falar com os tres serviços de apoio pelo NOME do serviço na rede do
 * Compose (mysql, redis, rabbitmq), nunca por localhost.
 *
 *   GET /health      -> healthcheck simples (sem tocar nas dependencias)
 *   GET /api/status  -> testa mysql, redis e rabbitmq e devolve o resultado
 */

const http = require("node:http");
const mysql = require("mysql2/promise");
const Redis = require("ioredis");
const amqplib = require("amqplib");

const PORT = process.env.PORT || 3000;

const DB_HOST = process.env.DB_HOST || "mysql";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "rabbitmq";
const RABBITMQ_PORT = Number(process.env.RABBITMQ_PORT || 5672);

async function checkMysql() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS total FROM eventos",
  );
  await conn.end();
  return { ok: true, totalEventos: rows[0].total };
}

async function checkRedis() {
  const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, lazyConnect: true, maxRetriesPerRequest: 1 });
  await redis.connect();
  await redis.set("cenario1:ultima-verificacao", new Date().toISOString());
  const valor = await redis.get("cenario1:ultima-verificacao");
  await redis.quit();
  return { ok: true, valor };
}

async function checkRabbitmq() {
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
  const conn = await amqplib.connect(url);
  const channel = await conn.createChannel();
  await channel.assertQueue("cenario1.eventos", { durable: true });
  await channel.sendToQueue(
    "cenario1.eventos",
    Buffer.from(JSON.stringify({ tipo: "status-check", em: new Date().toISOString() })),
  );
  await channel.close();
  await conn.close();
  return { ok: true, fila: "cenario1.eventos" };
}

async function handleStatus(res) {
  const resultado = {};
  for (const [nome, fn] of Object.entries({
    mysql: checkMysql,
    redis: checkRedis,
    rabbitmq: checkRabbitmq,
  })) {
    try {
      resultado[nome] = await fn();
      console.log(`[status] ${nome}: OK`, resultado[nome]);
    } catch (err) {
      resultado[nome] = { ok: false, erro: err.message };
      console.error(`[status] ${nome}: FALHOU - ${err.message}`);
    }
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(resultado, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (req.url === "/api/status") {
    handleStatus(res).catch((err) => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, erro: err.message }));
    });
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ erro: "rota nao encontrada" }));
});

server.listen(PORT, () => {
  console.log(`API do Cenario 1 ouvindo na porta ${PORT}`);
  console.log(`GET /health      -> healthcheck simples`);
  console.log(`GET /api/status  -> testa mysql, redis e rabbitmq`);
});
