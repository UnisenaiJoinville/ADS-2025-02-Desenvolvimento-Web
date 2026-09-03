"use strict";

/**
 * API minima do Cenario 2 (ReactJS + PostgreSQL + Node/Express + Redis +
 * RabbitMQ, atras de um proxy reverso Nginx). O foco desta atividade e a
 * estrutura de containers (material de Docker Compose, secao 7), nao a
 * implementacao de regras de negocio - por isso o Express e usado aqui so
 * como framework HTTP minimalista (ver 14.1 do Modulo 0), sem nenhuma rota
 * de dominio real.
 *
 * Simplificacao assumida (documentada tambem no README): o material cita
 * "Node/Express/Inertia", mas o Inertia.js resolve um problema de SPA
 * server-driven que so faz sentido junto de paginas/telas reais - como este
 * cenario nao implementa telas de negocio (apenas prova de estrutura), o
 * adaptador Inertia foi deliberadamente omitido para nao adicionar
 * complexidade sem funcao demonstravel.
 *
 *   GET /health   -> healthcheck simples
 *   GET /status   -> testa postgres, redis e rabbitmq (chamado via
 *                    /api/status atraves do proxy Nginx, que remove o
 *                    prefixo /api/ antes de encaminhar para a api)
 */

const express = require("express");
const { Client } = require("pg");
const Redis = require("ioredis");
const amqplib = require("amqplib");

const PORT = process.env.PORT || 3000;
const app = express();

const DB_HOST = process.env.DB_HOST || "postgres";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "rabbitmq";
const RABBITMQ_PORT = Number(process.env.RABBITMQ_PORT || 5672);

async function checkPostgres() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });
  await client.connect();
  const { rows } = await client.query("SELECT COUNT(*)::int AS total FROM eventos");
  await client.end();
  return { ok: true, totalEventos: rows[0].total };
}

async function checkRedis() {
  const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, lazyConnect: true, maxRetriesPerRequest: 1 });
  await redis.connect();
  await redis.set("cenario2:ultima-verificacao", new Date().toISOString());
  const valor = await redis.get("cenario2:ultima-verificacao");
  await redis.quit();
  return { ok: true, valor };
}

async function checkRabbitmq() {
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
  const conn = await amqplib.connect(url);
  const channel = await conn.createChannel();
  await channel.assertQueue("cenario2.eventos", { durable: true });
  await channel.sendToQueue(
    "cenario2.eventos",
    Buffer.from(JSON.stringify({ tipo: "status-check", em: new Date().toISOString() })),
  );
  await channel.close();
  await conn.close();
  return { ok: true, fila: "cenario2.eventos" };
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/status", async (_req, res) => {
  const resultado = {};
  for (const [nome, fn] of Object.entries({
    postgres: checkPostgres,
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
  res.json(resultado);
});

app.listen(PORT, () => {
  console.log(`API do Cenario 2 ouvindo na porta ${PORT}`);
  console.log("Acessivel atraves do proxy Nginx em http://localhost:8080/api/health e /api/status");
});
