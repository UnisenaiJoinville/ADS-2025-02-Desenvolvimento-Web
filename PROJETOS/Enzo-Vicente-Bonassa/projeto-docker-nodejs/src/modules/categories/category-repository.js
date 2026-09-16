import { pool } from "../../config/database.js";

export async function findAll() {
  const [rows] = await pool.query(
    `SELECT c.id,
            c.name,
            c.created_at AS createdAt,
            COUNT(p.id) AS productCount
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.created_at
      ORDER BY c.name`
  );

  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, created_at AS createdAt FROM categories WHERE id = ?",
    [id]
  );

  return rows[0];
}

export async function findByName(name) {
  const [rows] = await pool.query(
    "SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)",
    [name]
  );

  return rows[0];
}

export async function create({ name }) {
  const [result] = await pool.query(
    "INSERT INTO categories (name) VALUES (?)",
    [name]
  );

  return findById(result.insertId);
}

export async function update(id, { name }) {
  await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);

  return findById(id);
}

export async function remove(id) {
  const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);

  return result.affectedRows > 0;
}