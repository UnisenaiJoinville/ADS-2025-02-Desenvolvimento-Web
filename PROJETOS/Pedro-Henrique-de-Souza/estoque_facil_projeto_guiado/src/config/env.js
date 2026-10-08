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
    throw new Error(`Variavel de ambiente ${key} invalida: ${process.env[key]}`);
  }

  return port;
}

const jwtSecret = requireEnv("JWT_SECRET");

// Fail fast: um segredo curto e o mesmo que nenhum segredo.
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres");
}

export const env = {
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
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "1d",
    // Custo do bcrypt: 2^10 = 1024 rodadas. Quanto maior, mais lento
    // para nos e para quem tentar quebrar a senha na forca bruta.
    saltRounds: 10,
  },
};