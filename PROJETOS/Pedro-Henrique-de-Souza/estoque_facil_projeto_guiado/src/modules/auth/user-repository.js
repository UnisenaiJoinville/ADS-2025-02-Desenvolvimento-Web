import { pool } from "../../config/database.js";

// Colunas que podem sair daqui para o resto do sistema.
// password_hash NUNCA entra nesta lista.
const PUBLIC_COLUMNS = `id,
       name,
       email,
       active,
       created_at AS createdAt`;

// O MySQL devolve BOOLEAN como 0/1. Normalizamos para true/false.
function toUser(row) {
  if (!row) return undefined;

  return { ...row, active: Boolean(row.active) };
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`,
    [id]
  );

  return toUser(rows[0]);
}

// A UNICA funcao que devolve o hash - e ela existe so para o login.
export async function findByEmailWithPassword(email) {
  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash AS passwordHash, active
       FROM users
      WHERE email = ?`,
    [email]
  );

  return toUser(rows[0]);
}

export async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ?`,
    [email]
  );

  return toUser(rows[0]);
}

export async function create({ name, email, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  );

  return findById(result.insertId);
}