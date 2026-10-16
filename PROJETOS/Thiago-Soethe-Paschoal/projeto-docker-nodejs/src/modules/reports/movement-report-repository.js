import { pool } from "../../config/database.js";

const MOVEMENT_COLUMNS = `m.id,m.type,m.quantity,m.note,m.created_at AS createdAt,
  p.id AS productId,p.name AS productName,p.sku AS productSku,
  c.id AS categoryId,COALESCE(c.name,'Sem categoria') AS categoryName,
  u.id AS userId,COALESCE(u.name,'Nao informado') AS userName,
  CASE WHEN m.type='IN' THEN m.quantity ELSE -m.quantity END AS signedQuantity`;
const FROM_MOVEMENT = `FROM stock_movements m INNER JOIN products p ON p.id=m.product_id
  LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN users u ON u.id=m.user_id`;

function buildMovementWhere(filters) {
  const conditions=[], params=[];
  if (filters.productId) { conditions.push("m.product_id=?"); params.push(filters.productId); }
  if (filters.categoryId) { conditions.push("p.category_id=?"); params.push(filters.categoryId); }
  if (filters.userId) { conditions.push("m.user_id=?"); params.push(filters.userId); }
  if (filters.type) { conditions.push("m.type=?"); params.push(filters.type); }
  if (filters.startDate) { conditions.push("m.created_at>=?"); params.push(`${filters.startDate} 00:00:00`); }
  if (filters.endDate) { conditions.push("m.created_at<DATE_ADD(?,INTERVAL 1 DAY)"); params.push(filters.endDate); }
  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

export async function findMovements(filters) {
  const {where,params}=buildMovementWhere(filters);
  const [rows]=await pool.query(`SELECT ${MOVEMENT_COLUMNS} ${FROM_MOVEMENT} ${where}
    ORDER BY ${filters.sort.column} ${filters.direction},m.id DESC LIMIT ? OFFSET ?`,[...params,filters.pageSize,filters.offset]);
  return rows.map(r=>({...r,quantity:Number(r.quantity),signedQuantity:Number(r.signedQuantity)}));
}
export async function countMovements(filters) {
  const {where,params}=buildMovementWhere(filters);
  const [rows]=await pool.query(`SELECT COUNT(*) AS total ${FROM_MOVEMENT} ${where}`,params);
  return Number(rows[0].total);
}
export async function sumMovements(filters) {
  const {where,params}=buildMovementWhere(filters);
  const [rows]=await pool.query(`SELECT COALESCE(SUM(CASE WHEN m.type='IN' THEN m.quantity ELSE 0 END),0) AS unitsIn,
    COALESCE(SUM(CASE WHEN m.type='OUT' THEN m.quantity ELSE 0 END),0) AS unitsOut ${FROM_MOVEMENT} ${where}`,params);
  return rows[0];
}
export async function getMovementsByUser(filters) {
  const {where,params}=buildMovementWhere(filters);
  const [rows]=await pool.query(`SELECT u.id AS userId,COALESCE(u.name,'Nao informado') AS userName,u.email AS userEmail,
    COUNT(*) AS movementCount,SUM(m.type='IN') AS entriesCount,SUM(m.type='OUT') AS exitsCount,
    COALESCE(SUM(CASE WHEN m.type='IN' THEN m.quantity ELSE 0 END),0) AS unitsIn,
    COALESCE(SUM(CASE WHEN m.type='OUT' THEN m.quantity ELSE 0 END),0) AS unitsOut,
    COUNT(DISTINCT m.product_id) AS productCount,MIN(m.created_at) AS firstMovementAt,MAX(m.created_at) AS lastMovementAt
    ${FROM_MOVEMENT} ${where} GROUP BY u.id,u.name,u.email ORDER BY movementCount DESC,userName`,params);
  return rows;
}
export async function getTopProducts(filters,{minUnits=1,limit=10}={}) {
  const {where,params}=buildMovementWhere(filters);
  const [rows]=await pool.query(`SELECT p.id AS productId,p.name AS productName,p.sku AS productSku,
    COALESCE(c.name,'Sem categoria') AS categoryName,p.quantity AS currentStock,COUNT(*) AS movementCount,
    COALESCE(SUM(CASE WHEN m.type='IN' THEN m.quantity ELSE 0 END),0) AS unitsIn,
    COALESCE(SUM(CASE WHEN m.type='OUT' THEN m.quantity ELSE 0 END),0) AS unitsOut,SUM(m.quantity) AS unitsMoved
    ${FROM_MOVEMENT} ${where} GROUP BY p.id,p.name,p.sku,c.name,p.quantity HAVING unitsMoved>=?
    ORDER BY unitsMoved DESC,productName LIMIT ?`,[...params,minUnits,limit]);
  return rows;
}
export async function getMovementsByMonth(filters) {
  const {where,params}=buildMovementWhere(filters);
  const [rows]=await pool.query(`SELECT DATE_FORMAT(m.created_at,'%Y-%m') AS period,COUNT(*) AS movementCount,
    COALESCE(SUM(CASE WHEN m.type='IN' THEN m.quantity ELSE 0 END),0) AS unitsIn,
    COALESCE(SUM(CASE WHEN m.type='OUT' THEN m.quantity ELSE 0 END),0) AS unitsOut,
    COUNT(DISTINCT m.product_id) AS productCount ${FROM_MOVEMENT} ${where} GROUP BY period ORDER BY period`,params);
  return rows.map(r=>({...r,movementCount:Number(r.movementCount),unitsIn:Number(r.unitsIn),unitsOut:Number(r.unitsOut),productCount:Number(r.productCount),balance:Number(r.unitsIn)-Number(r.unitsOut)}));
}
