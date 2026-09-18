import { pool } from "../../config/database.js";

export async function getSummary() {
  const query = `
    SELECT
      COUNT(id) AS totalProducts,
      COALESCE(SUM(quantity), 0) AS totalUnits,
      COALESCE(SUM(cost_price * quantity), 0) AS stockCostValue,
      COALESCE(SUM(sale_price * quantity), 0) AS stockSaleValue,
      COALESCE(AVG(sale_price), 0) AS averageSalePrice,
      COUNT(CASE WHEN quantity <= minimum_stock THEN 1 END) AS lowStockCount,
      COUNT(CASE WHEN quantity = 0 THEN 1 END) AS outOfStockCount
    FROM products
    WHERE active = TRUE;
  `;

  const [rows] = await pool.query(query);
  return rows[0];
}

export async function getMonthTotals() {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) AS unitsIn,
      COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS unitsOut
    FROM stock_movements
    WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
      AND YEAR(created_at) = YEAR(CURRENT_DATE());
  `;

  const [rows] = await pool.query(query);
  return rows[0];
}

export async function getStockByCategory() {
  const query = `
    SELECT
      c.name AS categoryName,
      COUNT(p.id) AS productCount,
      COALESCE(SUM(p.quantity), 0) AS units,
      COALESCE(SUM(p.cost_price * p.quantity), 0) AS costValue
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
    GROUP BY c.id, c.name
    ORDER BY costValue DESC;
  `;

  const [rows] = await pool.query(query);
  return rows;
}

export async function getLowStockProducts(limit = 5) {
  const query = `
    SELECT
      id,
      name,
      sku,
      quantity,
      minimum_stock AS minimumStock
    FROM products
    WHERE active = TRUE
      AND quantity <= minimum_stock
    ORDER BY quantity ASC
    LIMIT ?;
  `;

  const [rows] = await pool.query(query, [limit]);
  return rows;
}

export async function getRecentMovements(limit = 8) {
  const query = `
    SELECT
      m.id,
      p.name AS productName,
      p.sku AS productSku,
      m.type,
      m.quantity,
      m.created_at AS createdAt
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT ?;
  `;

  const [rows] = await pool.query(query, [limit]);
  return rows;
}