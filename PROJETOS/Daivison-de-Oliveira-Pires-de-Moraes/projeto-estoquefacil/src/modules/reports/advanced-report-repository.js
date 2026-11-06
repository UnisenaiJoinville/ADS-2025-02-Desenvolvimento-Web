import { pool } from "../../config/database.js";
export async function stagnantProducts() {
  // Nunca movimentados ficam no relatorio proprio, sem se confundir com giro parado.
  const [rows] =
    await pool.query(`SELECT p.id,p.name,p.sku,p.quantity,MAX(m.created_at) AS lastMovementAt
    FROM products p INNER JOIN stock_movements m ON m.product_id=p.id WHERE p.active=TRUE
    GROUP BY p.id,p.name,p.sku,p.quantity HAVING MAX(m.created_at) < DATE_SUB(NOW(),INTERVAL 90 DAY)
    ORDER BY lastMovementAt,p.id`);
  return rows;
}
export async function turnoverByCategory({ startDate, endDate }) {
  const conditions = [],
    params = [];
  if (startDate) {
    conditions.push("m.created_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("m.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(endDate);
  }
  const period = conditions.length ? " AND " + conditions.join(" AND ") : "";
  // Filtro no ON preserva categoria vazia. A segunda metade preserva produtos sem categoria.
  const [rows] = await pool.query(
    `SELECT c.id AS categoryId,c.name AS categoryName,
    COALESCE(SUM(CASE WHEN m.type='IN' THEN m.quantity ELSE 0 END),0) AS unitsIn,
    COALESCE(SUM(CASE WHEN m.type='OUT' THEN m.quantity ELSE 0 END),0) AS unitsOut
    FROM categories c LEFT JOIN products p ON p.category_id=c.id
    LEFT JOIN stock_movements m ON m.product_id=p.id ${period}
    GROUP BY c.id,c.name
    UNION ALL SELECT NULL,'Sem categoria',
    COALESCE(SUM(CASE WHEN m.type='IN' THEN m.quantity ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN m.type='OUT' THEN m.quantity ELSE 0 END),0)
    FROM products p LEFT JOIN stock_movements m ON m.product_id=p.id ${period} WHERE p.category_id IS NULL
    ORDER BY categoryName`,
    [...params, ...params],
  );
  return rows;
}
export async function comparePeriods(periodA, periodB) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at,'%Y-%m') AS period,
    SUM(CASE WHEN type='IN' THEN quantity ELSE 0 END) AS unitsIn,
    SUM(CASE WHEN type='OUT' THEN quantity ELSE 0 END) AS unitsOut
    FROM stock_movements WHERE (created_at >= ? AND created_at < DATE_ADD(?,INTERVAL 1 MONTH))
    OR (created_at >= ? AND created_at < DATE_ADD(?,INTERVAL 1 MONTH)) GROUP BY period`,
    [periodA + "-01", periodA + "-01", periodB + "-01", periodB + "-01"],
  );
  return rows;
}
export async function stockoutForecast() {
  const [rows] = await pool.query(`SELECT p.id,p.name,p.sku,p.quantity,
    COALESCE(SUM(m.quantity),0)/60 AS averageDailyOut,
    p.quantity / NULLIF(COALESCE(SUM(m.quantity),0)/60,0) AS daysRemaining
    FROM products p LEFT JOIN stock_movements m ON m.product_id=p.id AND m.type='OUT'
      AND m.created_at >= DATE_SUB(CURRENT_DATE(),INTERVAL 59 DAY) AND m.created_at < DATE_ADD(CURRENT_DATE(),INTERVAL 1 DAY)
    WHERE p.active=TRUE GROUP BY p.id,p.name,p.sku,p.quantity ORDER BY (daysRemaining IS NULL),daysRemaining,p.id`);
  return rows;
}
