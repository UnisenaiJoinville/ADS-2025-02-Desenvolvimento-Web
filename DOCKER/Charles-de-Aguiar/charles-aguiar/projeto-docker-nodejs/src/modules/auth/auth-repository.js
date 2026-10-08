import { pool } from "../../config/database.js";

export async function findByEmail(email) {
  // Adicionamos explicitamente a coluna role no SELECT do banco
  const [rows] = await pool.query(
    "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
    [email]
  );
  return rows[0];
}

export async function create({ name, email, passwordHash }) {
  // Por padrão, novos cadastros nascem como OPERATOR
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'OPERATOR')",
    [name, email, passwordHash]
  );
  
  const [rows] = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    [result.insertId]
  );
  return rows[0];
}

export async function findById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
}
