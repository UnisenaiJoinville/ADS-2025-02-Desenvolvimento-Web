import { pool } from "../../config/database.js";

// ------------------------------------------------------------------
// Relatorios centrados em PRODUTOS, CATEGORIAS e ESTOQUE.
// Aqui mora todo o SQL deste lado do modulo - e so ele.
// ------------------------------------------------------------------

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
           WHEN p.quantity = 0                 THEN 'OUT'
           WHEN p.quantity <= p.minimum_stock  THEN 'LOW'
           ELSE 'OK'
         END                         AS stockStatus
`;

// LEFT JOIN, e nao INNER JOIN: produto sem categoria TEM que aparecer
// no relatorio de produtos. Veja a Aula 37.
const FROM_PRODUCT = `
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

// LEFT JOIN, e nao INNER JOIN: produto sem categoria TEM que aparecer
// no relatorio de produtos. Veja a Aula 37.

// LEFT JOIN + IS NULL: o jeito classico de perguntar
// "quem NAO tem correspondencia do outro lado?"
export async function findProductsWithoutMovement() {
  const [rows] = await pool.query(
    `SELECT p.id,
            p.name,
            p.sku,
            p.quantity,
            p.created_at                      AS createdAt,
            COALESCE(c.name, 'Sem categoria') AS categoryName
       FROM products p
       LEFT JOIN categories c      ON c.id = p.category_id
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE m.id IS NULL
        AND p.active = TRUE
      ORDER BY p.created_at DESC, p.name`
  );

  return rows;
}

// Monta o WHERE a partir dos filtros ja validados.
// Devolve o texto e a lista de valores na MESMA ordem dos "?".
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

  if (filters.withoutCategory) conditions.push("p.category_id IS NULL");
  if (filters.stockStatus === "OUT") conditions.push("p.quantity = 0");
  if (filters.stockStatus === "LOW") conditions.push("p.quantity > 0 AND p.quantity <= p.minimum_stock");
  if (filters.stockStatus === "OK") conditions.push("p.quantity > p.minimum_stock");

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

  // filters.sort.column e filters.direction NAO vem do usuario:
  // vieram da lista branca do report-filters.js. Por isso podem
  // ser interpolados sem risco.
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
    `SELECT COALESCE(SUM(p.quantity), 0)                 AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0)  AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0)  AS totalSaleValue
     ${FROM_PRODUCT}
     ${where}`,
    params
  );

  return rows[0];
}

export async function getStockSummary() {
  const [rows] = await pool.query(
    `SELECT COUNT(*)                                  AS productCount,
            COUNT(DISTINCT p.category_id)             AS categoryCount,
            COALESCE(SUM(p.quantity), 0)              AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue,
            COALESCE(AVG(p.cost_price), 0)            AS averageCostPrice,
            COALESCE(MIN(p.sale_price), 0)            AS minSalePrice,
            COALESCE(MAX(p.sale_price), 0)            AS maxSalePrice,
            SUM(CASE WHEN p.quantity = 0 THEN 1 ELSE 0 END)                        AS outOfStockCount,
            SUM(CASE WHEN p.quantity > 0 AND p.quantity <= p.minimum_stock
                     THEN 1 ELSE 0 END)                                            AS lowStockCount
       FROM products p
      WHERE p.active = TRUE`
  );

  return rows[0];
}

export async function getStockByCategory() {
  const [rows] = await pool.query(
    `SELECT c.id                                        AS categoryId,
            c.name                                      AS categoryName,
            COUNT(p.id)                                 AS productCount,
            COALESCE(SUM(p.quantity), 0)                AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
      GROUP BY c.id, c.name

      UNION ALL

     SELECT NULL                                        AS categoryId,
            'Sem categoria'                             AS categoryName,
            COUNT(p.id)                                 AS productCount,
            COALESCE(SUM(p.quantity), 0)                AS totalUnits,
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

export async function getAbcCurve() {
  const [rows] = await pool.query(
    `SELECT base.id,
            base.name,
            base.sku,
            base.categoryName,
            base.stockCostValue,
            ROUND(100 * base.stockCostValue / NULLIF(base.totalValue, 0), 2) AS sharePercent,
            CASE
              WHEN 100 * base.stockCostValue / NULLIF(base.totalValue, 0) >= 20 THEN 'A'
              WHEN 100 * base.stockCostValue / NULLIF(base.totalValue, 0) >=  5 THEN 'B'
              ELSE 'C'
            END AS abcClass
       FROM (
             SELECT p.id,
                    p.name,
                    p.sku,
                    COALESCE(c.name, 'Sem categoria') AS categoryName,
                    (p.quantity * p.cost_price)       AS stockCostValue,
                    (SELECT COALESCE(SUM(p2.quantity * p2.cost_price), 0)
                       FROM products p2
                      WHERE p2.active = TRUE)         AS totalValue
               FROM products p
               LEFT JOIN categories c ON c.id = p.category_id
              WHERE p.active = TRUE
            ) AS base
      ORDER BY base.stockCostValue DESC, base.name`
  );

  return rows;
}

function toProductRow(row) { return { ...row, quantity: Number(row.quantity), minimumStock: Number(row.minimumStock), costPrice: Number(row.costPrice), salePrice: Number(row.salePrice), stockCostValue: Number(row.stockCostValue), stockSaleValue: Number(row.stockSaleValue) }; }
