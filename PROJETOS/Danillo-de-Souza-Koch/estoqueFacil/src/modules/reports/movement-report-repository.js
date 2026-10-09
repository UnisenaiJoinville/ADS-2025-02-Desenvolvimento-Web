import { pool } from "../../config/database.js";

const MOVEMENT_COLUMNS = `
         m.id,
         m.type,
         m.quantity,
         m.note,
         m.created_at AS createdAt,
         p.id AS productId,
         p.name AS productName,
         p.sku AS productSku,
         c.id AS categoryId,
         COALESCE(c.name, 'Sem categoria') AS categoryName,
         u.id AS userId,
         COALESCE(u.name, 'Nao informado') AS userName,
         CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END AS signedQuantity
`;

const FROM_MOVEMENT = `
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = m.user_id
`;

function buildMovementWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.productId) {
    conditions.push("m.product_id = ?");
    params.push(filters.productId);
  }

  if (filters.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.userId) {
    conditions.push("m.user_id = ?");
    params.push(filters.userId);
  }

  if (filters.type) {
    conditions.push("m.type = ?");
    params.push(filters.type);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function findMovements(filters) {
  const { where, params } = buildMovementWhere(filters);
  const [rows] = await pool.query(
    `SELECT ${MOVEMENT_COLUMNS}
     ${FROM_MOVEMENT}
     ${where}
     ORDER BY ${filters.sort.column} ${filters.direction}, m.id DESC
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map((row) => ({
    ...row,
    quantity: Number(row.quantity),
    signedQuantity: Number(row.signedQuantity),
  }));
}

export async function countMovements(filters) {
  const { where, params } = buildMovementWhere(filters);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     ${FROM_MOVEMENT}
     ${where}`,
    params
  );

  return Number(rows[0].total);
}
