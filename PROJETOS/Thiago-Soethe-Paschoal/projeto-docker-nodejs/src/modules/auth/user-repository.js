import { pool } from "../../config/database.js";

const PUBLIC_COLUMNS = `id,
       name,
       email,
       active,
       created_at AS createdAt`;

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
