import { existsSync } from "node:fs";
// Docker injeta o ambiente; execucao direta carrega o .env da raiz.
if (existsSync(".env")) process.loadEnvFile(".env");
// Le e VALIDA as variaveis de ambiente uma unica vez.
// Lembre-se: tudo que vem de process.env chega como string.

function requireEnv(key) {
  const value = process.env[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }

  return value.trim();
}

function requirePort(key, fallback) {
  const port = Number(process.env[key] ?? fallback);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Variavel de ambiente ${key} invalida: ${process.env[key]}`,
    );
  }

  return port;
}

const jwtSecret = requireEnv("JWT_SECRET");

if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres");
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN?.trim() || "15m";
if (!/^[1-9]\d*(s|m|h|d)$/.test(jwtExpiresIn))
  throw new Error("JWT_EXPIRES_IN deve ter duracao positiva com s, m, h ou d");

export const env = {
  trustProxy: process.env.TRUST_PROXY === "true",
  registrationOpen: process.env.REGISTRATION_OPEN !== "false",
  port: requirePort("PORT", 3000),

  database: {
    host: requireEnv("DB_HOST"),
    port: requirePort("DB_PORT", 3306),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    name: requireEnv("DB_NAME"),
  },

  auth: {
    jwtSecret,
    jwtExpiresIn,
    saltRounds: 10,
  },
};
