import mysql from "mysql2/promise";

import { env } from "./env.js";

// Um POOL mantem varias conexoes prontas e as reaproveita.
// E a forma recomendada em aplicacoes web.
export const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  // DECIMAL volta como string por padrao (para nao perder precisao).
  // Como nossos valores sao pequenos, convertemos para Number.
  decimalNumbers: true,
});

// O container do MySQL demora alguns segundos para aceitar conexoes.
// Tentamos algumas vezes antes de desistir.
export async function connectWithRetry(attempts = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      connection.release();

      console.log("Conexao com o MySQL estabelecida");
      return;
    } catch (error) {
      console.warn(
        `Tentativa ${attempt}/${attempts} de conectar ao MySQL falhou: ${error.message}`
      );

      if (attempt === attempts) {
        throw new Error("Nao foi possivel conectar ao MySQL");
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
