import { pool } from "../../config/database.js";

const SELECT_MOVEMENT = `
  SELECT m.id,
         m.product_id AS productId,
         p.name       AS productName,
         p.sku        AS productSku,
         m.type,
         m.quantity,
         m.note,
         m.created_at AS createdAt
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
`;

export async function findAll({ productId = null, type = null, limit = 100 } = {}) {
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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${SELECT_MOVEMENT} ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
    [...params, limit]
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
export async function createWithStockUpdate({ productId, type, quantity, note }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // FOR UPDATE trava a linha do produto ate o fim da transacao,
    // evitando que duas requisicoes simultaneas leiam o mesmo saldo.
    const [productRows] = await connection.query(
      "SELECT id, name, quantity FROM products WHERE id = ? FOR UPDATE",
      [productId]
    );

    const product = productRows[0];

    if (!product) {
      await connection.rollback();
      return { status: "PRODUCT_NOT_FOUND" };
    }

    const delta = type === "IN" ? quantity : -quantity;
    const newQuantity = product.quantity + delta;

    if (newQuantity < 0) {
      await connection.rollback();
      return {
        status: "INSUFFICIENT_STOCK",
        available: product.quantity,
      };
    }

    const [result] = await connection.query(
      "INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)",
      [productId, type, quantity, note]
    );

    await connection.query(
      "UPDATE products SET quantity = ? WHERE id = ?",
      [newQuantity, productId]
    );

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
