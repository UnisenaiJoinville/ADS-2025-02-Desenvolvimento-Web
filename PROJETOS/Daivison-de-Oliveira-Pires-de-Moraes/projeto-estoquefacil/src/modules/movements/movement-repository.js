import { pool } from "../../config/database.js";

const SELECT_MOVEMENT = `
  SELECT m.id,
         m.product_id AS productId,
         p.name       AS productName,
         p.sku        AS productSku,
         m.type,
         m.quantity,
         m.previous_quantity AS previousQuantity,
         m.resulting_quantity AS resultingQuantity,
         m.note,
         m.created_at AS createdAt,
         m.user_id    AS userId,
         COALESCE(u.name, 'Nao informado') AS userName
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
    LEFT  JOIN users    u ON u.id = m.user_id
`;

export async function findAll({
  productId = null,
  type = null,
  limit = 100,
  startDate,
  endDate,
} = {}) {
  const conditions = [];
  const params = [];

  if (productId) {
    conditions.push("m.product_id = ?");
    params.push(productId);
  }

  if (type) {
    conditions.push("m.type = ?");
    params.push(type);
  }

  if (startDate) {
    conditions.push("m.created_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("m.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(endDate);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${SELECT_MOVEMENT} ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
    [...params, limit],
  );

  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(`${SELECT_MOVEMENT} WHERE m.id = ?`, [id]);

  return rows[0];
}

/**
 * Registra a movimentacao E atualiza a quantidade do produto.
 *
 * As duas operacoes precisam acontecer JUNTAS: ou as duas dao certo,
 * ou nenhuma acontece. Isso e uma TRANSACAO.
 */
export async function createWithStockUpdate({
  productId,
  userId = null,
  type,
  quantity,
  note,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // FOR UPDATE trava a linha do produto ate o fim da transacao,
    // evitando que duas requisicoes simultaneas leiam o mesmo saldo.
    const [productRows] = await connection.query(
      "SELECT id, name, quantity, active FROM products WHERE id = ? FOR UPDATE",
      [productId],
    );

    const product = productRows[0];

    if (!product) {
      await connection.rollback();
      return { status: "PRODUCT_NOT_FOUND" };
    }

    if (!product.active) {
      await connection.rollback();
      return { status: "INACTIVE_PRODUCT" };
    }
    const newQuantity =
      type === "ADJUST"
        ? quantity
        : product.quantity + (type === "IN" ? quantity : -quantity);
    if (newQuantity > 2147483647) {
      await connection.rollback();
      return { status: "STOCK_OVERFLOW" };
    }

    if (newQuantity < 0) {
      await connection.rollback();
      return {
        status: "INSUFFICIENT_STOCK",
        available: product.quantity,
      };
    }

    const [result] = await connection.query(
      "INSERT INTO stock_movements (product_id, user_id, type, quantity, note, previous_quantity, resulting_quantity) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [productId, userId, type, quantity, note, product.quantity, newQuantity],
    );

    await connection.query("UPDATE products SET quantity = ? WHERE id = ?", [
      newQuantity,
      productId,
    ]);

    await connection.commit();

    return {
      status: "CREATED",
      movementId: result.insertId,
      newQuantity,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    // SEMPRE devolve a conexao para o pool.
    connection.release();
  }
}
