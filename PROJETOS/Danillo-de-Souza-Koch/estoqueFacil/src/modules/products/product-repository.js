import { pool } from "../../config/database.js";

const SELECT_PRODUCT = `
  SELECT p.id,
         p.name,
         p.sku,
         p.category_id   AS categoryId,
         c.name          AS categoryName,
         p.cost_price    AS costPrice,
         p.sale_price    AS salePrice,
         p.quantity,
         p.minimum_stock AS minimumStock,
         p.active,
         p.created_at    AS createdAt,
         p.updated_at    AS updatedAt
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

function escapeLike(text) {
  return text.replace(/[\\%_]/g, "\\$&");
}

function buildListFilters({ search = "", categoryId = null, onlyLowStock = false }) {
  const conditions = [];
  const params = [];

  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
    params.push(pattern, pattern);
  }

  if (categoryId) {
    conditions.push("p.category_id = ?");
    params.push(categoryId);
  }

  if (onlyLowStock) {
    conditions.push("p.quantity <= p.minimum_stock");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export async function findAll(filters = {}) {
  const { where, params } = buildListFilters(filters);
  const [rows] = await pool.query(
    `${SELECT_PRODUCT} ${where} ORDER BY p.name, p.id LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map(toProduct);
}

export async function countAll(filters = {}) {
  const { where, params } = buildListFilters(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${where}`, params);

  return Number(rows[0].total);
}

export async function search({ term, limit }) {
  const escaped = escapeLike(term);
  const [rows] = await pool.query(
    `${SELECT_PRODUCT}
      WHERE p.active = TRUE
        AND (p.name LIKE ? OR p.sku LIKE ?)
      ORDER BY (p.sku = ?) DESC,
               (p.name LIKE ?) DESC,
               p.name
      LIMIT ?`,
    [`%${escaped}%`, `%${escaped}%`, term, `${escaped}%`, limit]
  );

  return rows.map(toProduct);
}

export async function findById(id) {
  const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [id]);
  return rows[0] ? toProduct(rows[0]) : undefined;
}

export async function findBySku(sku) {
  const [rows] = await pool.query(
    "SELECT id, sku FROM products WHERE sku = ?",
    [sku]
  );

  return rows[0];
}

export async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO products
       (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.sku,
      data.categoryId,
      data.costPrice,
      data.salePrice,
      data.quantity,
      data.minimumStock,
      data.active,
    ]
  );

  return findById(result.insertId);
}

export async function update(id, data) {
  await pool.query(
    `UPDATE products
        SET name = ?, sku = ?, category_id = ?, cost_price = ?, sale_price = ?,
            quantity = ?, minimum_stock = ?, active = ?
      WHERE id = ?`,
    [
      data.name,
      data.sku,
      data.categoryId,
      data.costPrice,
      data.salePrice,
      data.quantity,
      data.minimumStock,
      data.active,
      id,
    ]
  );

  return findById(id);
}

export async function remove(id) {
  const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

function toProduct(row) {
  return {
    ...row,
    active: Boolean(row.active),
    lowStock: row.quantity <= row.minimumStock,
  };
}
