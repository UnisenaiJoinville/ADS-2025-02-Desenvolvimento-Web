import { pool } from "../../config/database.js";

const SELECT_PRODUCT = `
  SELECT p.id,
         p.name,
         p.sku,
         p.supplier,
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

// Exercicio 1.2 — lista branca de colunas aceitas em ORDER BY.
// Nome de coluna nao pode vir como parametro (?): o driver trataria como
// valor/string, nao como identificador. Concatenar direto seria SQL Injection.
const ALLOWED_ORDER_COLUMNS = {
  name: "p.name",
  quantity: "p.quantity",
  salePrice: "p.sale_price",
  costPrice: "p.cost_price",
  createdAt: "p.created_at",
};

function buildOrderClause(orderBy, orderDir) {
  const column = ALLOWED_ORDER_COLUMNS[orderBy] ?? ALLOWED_ORDER_COLUMNS.name;
  const direction = orderDir === "desc" ? "DESC" : "ASC";

  return `ORDER BY ${column} ${direction}`;
}

// Exercicio 2.2 — paginacao. Devolve { data, total }.
export async function findAll({
  search = "",
  categoryId = null,
  onlyLowStock = false,
  includeInactive = false,
  orderBy = "name",
  orderDir = "asc",
  page = 1,
  perPage = 20,
} = {}) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push("p.active = TRUE");
  }

  if (search) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
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
  const orderClause = buildOrderClause(orderBy, orderDir);
  const offset = (page - 1) * perPage;

  // Duas consultas independentes: dados da pagina e total geral.
  // Promise.all executa as duas em paralelo (Etapa 14).
  const [[rows], [countRows]] = await Promise.all([
    pool.query(
      `${SELECT_PRODUCT} ${where} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    ),
    pool.query(`SELECT COUNT(*) AS total FROM products p ${where}`, params),
  ]);

  return {
    data: rows.map(toProduct),
    total: Number(countRows[0].total),
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
       (name, sku, supplier, category_id, cost_price, sale_price, quantity, minimum_stock, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.sku,
      data.supplier,
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
            supplier = ?,
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
      data.supplier,
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

// Exclusao definitiva (usada apenas internamente / se necessario).
// Exercicio 3.2 — exportacao: busca TODOS os produtos, sem paginar.
export async function findAllForExport() {
  const [rows] = await pool.query(`${SELECT_PRODUCT} ORDER BY p.name`);

  return rows.map(toProduct);
}

export async function remove(id) {
  const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);

  return result.affectedRows > 0;
}

// Exercicio 2.1 — soft delete: desativa em vez de apagar.
// Preserva o historico de movimentacoes (evita o ON DELETE CASCADE).
export async function deactivate(id) {
  const [result] = await pool.query(
    "UPDATE products SET active = FALSE WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

export async function reactivate(id) {
  const [result] = await pool.query(
    "UPDATE products SET active = TRUE WHERE id = ?",
    [id]
  );

  return result.affectedRows > 0;
}

// O MySQL devolve BOOLEAN como 0/1. Normalizamos para true/false.
function toProduct(row) {
  return {
    ...row,
    active: Boolean(row.active),
    lowStock: row.quantity <= row.minimumStock,
  };
}
