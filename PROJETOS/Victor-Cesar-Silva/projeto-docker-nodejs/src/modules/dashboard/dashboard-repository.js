import { pool } from "../../config/database.js";

// Quem faz as contas e o banco: trafega um numero em vez de milhares de linhas.
// COALESCE protege o caso do conjunto vazio (SUM de tabela vazia e NULL).
export async function getSummary() {
  const [rows] = await pool.query(
    `SELECT COUNT(*)                                   AS totalProducts,
            COALESCE(SUM(quantity), 0)                 AS totalUnits,
            COALESCE(SUM(quantity * cost_price), 0)    AS stockCostValue,
            COALESCE(SUM(quantity * sale_price), 0)    AS stockSaleValue,
            SUM(CASE WHEN quantity <= minimum_stock THEN 1 ELSE 0 END) AS lowStockCount,
            SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END)              AS outOfStockCount
       FROM products
      WHERE active = TRUE`
  );

  return rows[0];
}

export async function getMonthTotals() {
  // SUM(CASE WHEN ...) separa entradas e saidas em uma unica varredura
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS unitsOut
       FROM stock_movements
      WHERE YEAR(created_at)  = YEAR(CURRENT_DATE())
        AND MONTH(created_at) = MONTH(CURRENT_DATE())`
  );

  return rows[0];
}

export async function getStockByCategory() {
  const [rows] = await pool.query(
    `SELECT COALESCE(c.name, 'Sem categoria')            AS categoryName,
            COUNT(p.id)                                  AS productCount,
            COALESCE(SUM(p.quantity), 0)                 AS units,
            COALESCE(SUM(p.quantity * p.cost_price), 0)  AS costValue
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = TRUE
      GROUP BY c.id, c.name
      ORDER BY costValue DESC`
  );

  return rows;
}

export async function getLowStockProducts(limit = 5) {
  // Ordena pela GRAVIDADE (quantity - minimum_stock), nao pela quantidade
  const [rows] = await pool.query(
    `SELECT id,
            name,
            sku,
            quantity,
            minimum_stock AS minimumStock
       FROM products
      WHERE active = TRUE
        AND quantity <= minimum_stock
      ORDER BY (quantity - minimum_stock) ASC, name
      LIMIT ?`,
    [limit]
  );

  return rows;
}

export async function getRecentMovements(limit = 8) {
  const [rows] = await pool.query(
    `SELECT m.id,
            m.type,
            m.quantity,
            m.created_at AS createdAt,
            p.name       AS productName,
            p.sku        AS productSku
       FROM stock_movements m
       INNER JOIN products p ON p.id = m.product_id
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ?`,
    [limit]
  );

  return rows;
}
