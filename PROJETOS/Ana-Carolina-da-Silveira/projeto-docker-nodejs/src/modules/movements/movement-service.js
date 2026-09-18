import { pool } from "../../config/database.js";

const SELECT_MOVEMENT = `
  SELECT m.id,
         m.product_id AS productId,
         p.name       AS productName,
         p.sku        AS productSku,
         m.type,
         m.quantity,
         m.note,
         m.created_at AS createdAt
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
`;

export async function findAll({ productId = null, type = null, limit = 100, from = null, to = null } = {}) {
  const conditions = [];
  const params = [];

  if (productId) {
    conditions.push("m.product_id = ?");
    params.push(productId);
  }

  if (type) {
    conditions.push("m.type = ?");
    params.push(type);
  }

  if (from) {
    conditions.push("m.created_at >= ?");
    params.push(`${from} 00:00:00`);
  }

  if (to) {
    conditions.push("m.created_at <= ?");
    params.push(`${to} 23:59:59`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${SELECT_MOVEMENT} ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
    [...params, limit]
  );

  return rows;
}