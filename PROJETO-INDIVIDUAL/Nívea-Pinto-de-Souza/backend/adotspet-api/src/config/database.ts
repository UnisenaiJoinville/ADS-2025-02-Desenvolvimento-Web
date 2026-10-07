import mysql from 'mysql2/promise'

import { env } from './env.js'

export const database = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  dateStrings: true,
  decimalNumbers: true,
})

export async function testarConexaoBanco() {
  const conexao = await database.getConnection()

  try {
    await conexao.ping()

    console.log('MySQL conectado com sucesso')
  } finally {
    conexao.release()
  }
}