import { pool } from "../../config/database.js";

// ------------------------------------------------------------------
// Relatorios centrados em MOVIMENTACOES.
// ------------------------------------------------------------------

const MOVEMENT_COLUMNS = `
         m.id,
         m.type,
         m.quantity,
         m.note,
         m.created_at                      AS createdAt,
         p.id                              AS productId,
         p.name                            AS productName,
         p.sku                             AS productSku,
         c.id                              AS categoryId,
         COALESCE(c.name, 'Sem categoria') AS categoryName,
         u.id                              AS userId,
         COALESCE(u.name, 'Nao informado') AS userName,
         (CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END) AS signedQuantity
`;

// Tres JOINs, e cada um com o tipo certo pelo seu proprio motivo:
//
//   products    INNER - toda movimentacao TEM produto (NOT NULL + FK).
//                       Um INNER aqui nao descarta nada.
//   categories  LEFT  - o produto pode nao ter categoria.
//   users       LEFT  - o historico anterior a Aula 27 nao tem dono.
//
// Trocar qualquer um dos LEFT por INNER faria linhas sumirem
// silenciosamente do relatorio. Veja a Aula 38.
const FROM_MOVEMENT = `
    FROM stock_movements m
    INNER JOIN products   p ON p.id = m.product_id
    LEFT  JOIN categories c ON c.id = p.category_id
    LEFT  JOIN users      u ON u.id = m.user_id
`;

function buildMovementWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.productId) {
    conditions.push("m.product_id = ?");
    params.push(filters.productId);
  }

  if (filters.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.userId) {
    conditions.push("m.user_id = ?");
    params.push(filters.userId);
  }

  if (filters.type) {
    conditions.push("m.type = ?");
    params.push(filters.type);
  }

  // A ARMADILHA DA DATA COM HORA
  // created_at e TIMESTAMP: guarda data E hora.
  // "created_at <= '2026-09-15'" significa "<= 2026-09-15 00:00:00",
  // ou seja, perde o dia 15 inteiro.
  // Por isso o fim do intervalo e "< dia seguinte", e nao "<= dia".
  if (filters.startDate) {
    conditions.push("m.created_at >= ?");
    params.push(`${filters.startDate} 00:00:00`);
  }

  if (filters.endDate) {
    conditions.push("m.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(filters.endDate);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function findMovements(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT ${MOVEMENT_COLUMNS}
     ${FROM_MOVEMENT}
     ${where}
     ORDER BY ${filters.sort.column} ${filters.direction}, m.id DESC
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map(toMovementRow);
}

export async function countMovements(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     ${FROM_MOVEMENT}
     ${where}`,
    params
  );

  return Number(rows[0].total);
}

// Totais da selecao inteira (nao da pagina).
export async function sumMovements(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0) AS unitsOut
     ${FROM_MOVEMENT}
     ${where}`,
    params
  );

  return rows[0];
}

// JOIN + GROUP BY: uma linha por usuario, com as movimentacoes somadas.
// O LEFT JOIN em users e o COALESCE fazem o grupo "Nao informado"
// aparecer no relatorio em vez de sumir.
export async function getMovementsByUser(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT u.id                              AS userId,
            COALESCE(u.name, 'Nao informado') AS userName,
            u.email                           AS userEmail,
            COUNT(*)                                                               AS movementCount,
            SUM(CASE WHEN m.type = 'IN'  THEN 1 ELSE 0 END)                        AS entriesCount,
            SUM(CASE WHEN m.type = 'OUT' THEN 1 ELSE 0 END)                        AS exitsCount,
            COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0)  AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0)  AS unitsOut,
            COUNT(DISTINCT m.product_id)                                           AS productCount,
            MIN(m.created_at)                                                      AS firstMovementAt,
            MAX(m.created_at)                                                      AS lastMovementAt
     ${FROM_MOVEMENT}
     ${where}
     GROUP BY u.id, u.name, u.email
     ORDER BY movementCount DESC, userName`,
    params
  );

  return rows;
}

// Ranking de produtos mais movimentados.
// HAVING filtra DEPOIS do agrupamento - e so por isso conseguimos
// usar SUM(...) como condicao. No WHERE isso seria um erro.
export async function getTopProducts(filters, { minUnits = 1, limit = 10 } = {}) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT p.id                              AS productId,
            p.name                            AS productName,
            p.sku                             AS productSku,
            COALESCE(c.name, 'Sem categoria') AS categoryName,
            p.quantity                        AS currentStock,
            COUNT(*)                                                              AS movementCount,
            COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0) AS unitsOut,
            SUM(m.quantity)                                                       AS unitsMoved
     ${FROM_MOVEMENT}
     ${where}
     GROUP BY p.id, p.name, p.sku, c.name, p.quantity
     HAVING unitsMoved >= ?
     ORDER BY unitsMoved DESC, productName
     LIMIT ?`,
    [...params, minUnits, limit]
  );

  return rows;
}

// Agrupamento por mes. DATE_FORMAT transforma a data numa chave
// de texto ('2026-09'), e o GROUP BY junta tudo que cair nela.
export async function getMovementsByMonth(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(m.created_at, '%Y-%m') AS period,
            COUNT(*)                                                              AS movementCount,
            COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0) AS unitsOut,
            COUNT(DISTINCT m.product_id)                                          AS productCount
     ${FROM_MOVEMENT}
     ${where}
     GROUP BY period
     ORDER BY period`,
    params
  );

  return rows.map((row) => ({
    ...row,
    movementCount: Number(row.movementCount),
    unitsIn: Number(row.unitsIn),
    unitsOut: Number(row.unitsOut),
    productCount: Number(row.productCount),
    balance: Number(row.unitsIn) - Number(row.unitsOut),
  }));
}

function toMovementRow(row) {
  return {
    ...row,
    quantity: Number(row.quantity),
    signedQuantity: Number(row.signedQuantity),
  };
}
