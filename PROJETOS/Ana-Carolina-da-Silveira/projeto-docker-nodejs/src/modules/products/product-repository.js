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

// Monta o WHERE da listagem. Usado pelo findAll E pelo countAll:
// as duas consultas PRECISAM filtrar exatamente igual (Aula 64).
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
    // p.id no fim do ORDER BY: desempate estavel entre nomes iguais.
    `${SELECT_PRODUCT} ${where} ORDER BY p.name, p.id LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map(toProduct);
}

export async function countAll(filters = {}) {
  const { where, params } = buildListFilters(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${where}`,
    params
  );

  return Number(rows[0].total);
}

  // Busca enxuta para o campo de autocomplete (Aula 62).
// Devolve poucos produtos, so os ativos, e os mais parecidos primeiro.
export async function search({ term, limit }) {
  // % e _ sao CURINGAS do LIKE. Se o usuario digitar "50%", queremos
  // procurar o texto "50%", e nao "50 seguido de qualquer coisa".
  // A barra invertida diz ao MySQL: "o proximo caractere e literal".
  const escaped = term.replace(/[\\%_]/g, "\\$&");

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