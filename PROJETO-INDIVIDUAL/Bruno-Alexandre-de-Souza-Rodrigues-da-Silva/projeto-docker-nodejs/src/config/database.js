import mysql from "mysql2/promise";

import { env } from "./env.js";

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
  decimalNumbers: true,
});

// O container do MySQL demora alguns segundos para aceitar conexoes.
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
