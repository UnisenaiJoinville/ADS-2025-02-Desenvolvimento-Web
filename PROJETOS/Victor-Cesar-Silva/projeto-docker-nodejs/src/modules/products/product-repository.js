import { pool } from "../../config/database.js";

// O mesmo SELECT serve a findAll e findById
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

export async function findAll({ search = "", categoryId = null, onlyLowStock = false } = {}) {
  // Montamos duas listas em paralelo: pedacos de SQL e valores
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
    // Os curingas % fazem parte do VALOR, nao do SQL
    params.push(`%${search}%`, `%${search}%`);
  }

  if (categoryId) {
    conditions.push("p.category_id = ?");
    params.push(categoryId);
  }

  if (onlyLowStock) {
    conditions.push("p.quantity <= p.minimum_stock");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${SELECT_PRODUCT} ${where} ORDER BY p.name`,
    params
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
        SET name = ?,
            sku = ?,
            category_id = ?,
            cost_price = ?,
            sale_price = ?,
            quantity = ?,
            minimum_stock = ?,
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

// O MySQL devolve BOOLEAN como 0/1. Normalizamos para true/false.
// lowStock e um campo calculado: nao existe no banco.
function toProduct(row) {
  return {
    ...row,
    active: Boolean(row.active),
    lowStock: row.quantity <= row.minimumStock,
  };
}
