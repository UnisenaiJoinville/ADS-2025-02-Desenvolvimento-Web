import { pool } from "../../config/database.js";

const PRODUCT_COLUMNS = `
         p.id,
         p.name,
         p.sku,
         p.quantity,
         p.minimum_stock             AS minimumStock,
         p.cost_price                AS costPrice,
         p.sale_price                AS salePrice,
         p.active,
         p.created_at                AS createdAt,
         c.id                        AS categoryId,
         COALESCE(c.name, 'Sem categoria') AS categoryName,
         (p.quantity * p.cost_price) AS stockCostValue,
         (p.quantity * p.sale_price) AS stockSaleValue,
         CASE
           WHEN p.quantity = 0                THEN 'OUT'
           WHEN p.quantity <= p.minimum_stock THEN 'LOW'
           ELSE 'OK'
         END AS stockStatus
`;

const FROM_PRODUCT = `
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

function buildProductWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.onlyActive) {
    conditions.push("p.active = TRUE");
  }

  if (filters.search) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function findProducts(filters) {
  const { where, params } = buildProductWhere(filters);
  const [rows] = await pool.query(
    `SELECT ${PRODUCT_COLUMNS}
     ${FROM_PRODUCT}
     ${where}
     ORDER BY ${filters.sort.column} ${filters.direction}, p.id
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map(toProductRow);
}

export async function countProducts(filters) {
  const { where, params } = buildProductWhere(filters);
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     ${FROM_PRODUCT}
     ${where}`,
    params
  );

  return Number(rows[0].total);
}

export async function sumProducts(filters) {
  const { where, params } = buildProductWhere(filters);
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(p.quantity), 0)                AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue
     ${FROM_PRODUCT}
     ${where}`,
    params
  );

  return rows[0];
}

export async function getStockSummary() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS productCount,
            COUNT(DISTINCT p.category_id) AS categoryCount,
            COALESCE(SUM(p.quantity), 0) AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue,
            COALESCE(AVG(p.cost_price), 0) AS averageCostPrice,
            COALESCE(MIN(p.sale_price), 0) AS minSalePrice,
            COALESCE(MAX(p.sale_price), 0) AS maxSalePrice,
            SUM(CASE WHEN p.quantity = 0 THEN 1 ELSE 0 END) AS outOfStockCount,
            SUM(CASE WHEN p.quantity > 0 AND p.quantity <= p.minimum_stock
                     THEN 1 ELSE 0 END) AS lowStockCount
       FROM products p
      WHERE p.active = TRUE`
  );

  return rows[0];
}

export async function getStockByCategory() {
  const [rows] = await pool.query(
    `SELECT c.id AS categoryId,
            c.name AS categoryName,
            COUNT(p.id) AS productCount,
            COALESCE(SUM(p.quantity), 0) AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
      GROUP BY c.id, c.name

      UNION ALL

     SELECT NULL AS categoryId,
            'Sem categoria' AS categoryName,
            COUNT(p.id) AS productCount,
            COALESCE(SUM(p.quantity), 0) AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue
       FROM products p
      WHERE p.category_id IS NULL
        AND p.active = TRUE
     HAVING productCount > 0

      ORDER BY totalCostValue DESC, categoryName`
  );

  return rows;
}

export async function findProductsWithoutMovement() {
  const [rows] = await pool.query(
    `SELECT p.id,
            p.name,
            p.sku,
            p.quantity,
            p.created_at AS createdAt,
            COALESCE(c.name, 'Sem categoria') AS categoryName
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE m.id IS NULL
        AND p.active = TRUE
      ORDER BY p.created_at DESC, p.name`
  );

  return rows.map((row) => ({ ...row, quantity: Number(row.quantity) }));
}

function toProductRow(row) {
  return {
    ...row,
    active: Boolean(row.active),
    quantity: Number(row.quantity),
    minimumStock: Number(row.minimumStock),
    stockCostValue: Number(row.stockCostValue),
    stockSaleValue: Number(row.stockSaleValue),
  };
}
