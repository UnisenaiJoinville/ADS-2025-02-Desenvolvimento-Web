// Le e VALIDA as variaveis de ambiente uma unica vez.
// Lembre-se: tudo que vem de process.env chega como string.

function requireEnv(key) {
  const value = process.env[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }

  return value.trim();
}

function positiveInt(key, fallback) {
  const value = Number(process.env[key] ?? fallback);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Variavel de ambiente ${key} invalida: ${process.env[key]}`);
  }

  return value;
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
  // Endereco publico do sistema: usado para montar o link de reset de senha.
  appUrl: (process.env.APP_URL?.trim() || "http://localhost:3001").replace(/\/+$/, ""),
  database: {
    host: requireEnv("DB_HOST"),
    port: requirePort("DB_PORT", 3306),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    name: requireEnv("DB_NAME"),
  },
  auth: {
    jwtSecret,
    // Token de ACESSO: curto de proposito (3.2). Quem renova e o refresh token.
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "15m",
    // Token de RENOVACAO: longo, guardado (em hash) no banco (3.2).
    refreshExpiresInDays: positiveInt("REFRESH_EXPIRES_IN_DAYS", 7),
    // Protecao contra forca bruta (3.3).
    maxLoginAttempts: positiveInt("MAX_LOGIN_ATTEMPTS", 5),
    lockMinutes: positiveInt("LOGIN_LOCK_MINUTES", 15),
    // Reset de senha (3.4).
    resetTokenMinutes: positiveInt("RESET_TOKEN_MINUTES", 30),
    // Custo do bcrypt: 2^10 = 1024 rodadas. Quanto maior, mais lento
    // para nos e para quem tentar quebrar a senha na forca bruta.
    saltRounds: 10,
  },
};