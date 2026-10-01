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
         p.supplier,
         p.active,
         p.created_at    AS createdAt,
         p.updated_at    AS updatedAt
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

export async function findAll({
  search = "",
  categoryId = null,
  onlyLowStock = false,
  includeInactive = false,
  page = 1,
  perPage = 20,
} = {}) {
  const conditions = [];
  const params = [];

  // Por padrão, esconde inativos a menos que includeInactive seja true
  if (!includeInactive) {
    conditions.push("p.active = TRUE");
  }

  if (search) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ? OR p.supplier LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (categoryId) {
    conditions.push("p.category_id = ?");
    params.push(categoryId);
  }

  if (onlyLowStock) {
    conditions.push("p.quantity <= p.minimum_stock");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * perPage;

  // Consultas executadas simultaneamente via Promise.all
  const [dataPromise, countPromise] = await Promise.all([
    pool.query(
      `${SELECT_PRODUCT} ${where} ORDER BY p.name LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM products p ${where}`,
      params
    ),
  ]);

  const [dataRows] = dataPromise;
  const [countRows] = countPromise;

  return {
    data: dataRows.map(toProduct),
    total: Number(countRows[0].total),
    page,
    perPage,
  };
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
       (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, supplier, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.sku,
      data.categoryId,
      data.costPrice,
      data.salePrice,
      data.quantity,
      data.minimumStock,
      data.supplier ?? null,
      data.active,
    ]
  );

  return findById(result.insertId);
}

export async function update(id, data) {
  await pool.query(
    `UPDATE products
        SET name = ?,
            sku = ?,
            category_id = ?,
            cost_price = ?,
            sale_price = ?,
            quantity = ?,
            minimum_stock = ?,
            supplier = ?,
            active = ?
      WHERE id = ?`,
    [
      data.name,
      data.sku,
      data.categoryId,
      data.costPrice,
      data.salePrice,
      data.quantity,
      data.minimumStock,
      data.supplier ?? null,
      data.active,
      id,
    ]
  );

  return findById(id);
}

// Implementação do Soft Delete
export async function remove(id) {
  const [result] = await pool.query(
    "UPDATE products SET active = FALSE WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

function toProduct(row) {
  return {
    ...row,
    active: Boolean(row.active),
    lowStock: row.quantity <= row.minimumStock,
  };
}