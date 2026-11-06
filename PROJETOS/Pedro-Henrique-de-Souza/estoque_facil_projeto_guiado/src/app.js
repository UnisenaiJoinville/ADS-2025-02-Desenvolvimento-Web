import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { env } from "./config/env.js";
import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "..", "public");

export const app = express();

// Atras do Caddy (producao), o IP real do cliente vem no cabecalho
// X-Forwarded-For. "1" = confie em UM proxy: o Caddy (Aula 67).
// Sem isto, o limite de login bloquearia todo mundo junto.
if (env.trustProxy) {
  app.set("trust proxy", 1);
}

// Interpreta o corpo das requisicoes em JSON
app.use(express.json());

// Log simples de cada requisicao (util em desenvolvimento)
app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
});

// Front-end estatico (HTML + Tailwind + JS)
app.use(express.static(publicDir));

// Todas as rotas da API ficam sob /api
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);