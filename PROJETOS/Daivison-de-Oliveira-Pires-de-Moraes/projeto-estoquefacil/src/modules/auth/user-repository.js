import { pool } from "../../config/database.js";

// Colunas que podem sair daqui para o resto do sistema.
// password_hash NUNCA entra nesta lista.
const PUBLIC_COLUMNS = `id,
       name,
       email,
       active,
       role,
       token_version AS tokenVersion,
       last_login_at AS lastLoginAt,
       created_at AS createdAt`;

// O MySQL devolve BOOLEAN como 0/1. Normalizamos para true/false.
function toUser(row) {
  if (!row) return undefined;

  return { ...row, active: Boolean(row.active) };
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`,
    [id],
  );

  return toUser(rows[0]);
}

// A UNICA funcao que devolve o hash - e ela existe so para o login.
export async function findByEmailWithPassword(email) {
  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash AS passwordHash, active, role, token_version AS tokenVersion, failed_attempts AS failedAttempts, locked_until AS lockedUntil
       FROM users
      WHERE email = ?`,
    [email],
  );

  return toUser(rows[0]);
}

export async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ?`,
    [email],
  );

  return toUser(rows[0]);
}

export async function create({ name, email, passwordHash }) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    // Serializa apenas o cadastro inicial para haver exatamente um primeiro ADMIN.
    await c.query("SELECT id FROM auth_lock WHERE id = 1 FOR UPDATE");
    const [users] = await c.query("SELECT id FROM users LIMIT 1");
    const role = users.length ? "OPERATOR" : "ADMIN";
    const [result] = await c.query(
      "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
      [name, email, passwordHash, role],
    );
    await c.commit();
    return findById(result.insertId);
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function updateName(id, name) {
  await pool.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
  return findById(id);
}
export async function updatePassword(id, hash) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    await c.query(
      "UPDATE users SET password_hash = ?, token_version = token_version+1 WHERE id = ?",
      [hash, id],
    );
    await c.query("DELETE FROM auth_tokens WHERE user_id = ?", [id]);
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function recordLogin(id) {
  await pool.query(
    "UPDATE users SET last_login_at = CURRENT_TIMESTAMP, failed_attempts = 0, locked_until = NULL WHERE id = ?",
    [id],
  );
  return findById(id);
}
export async function recordFailure(id) {
  await pool.query(
    `UPDATE users SET failed_attempts = IF(locked_until IS NOT NULL AND locked_until <= CURRENT_TIMESTAMP,1,failed_attempts+1),
    locked_until = IF(failed_attempts >= 5, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE), NULL) WHERE id = ?`,
    [id],
  );
}
export async function storeToken(hash, userId, purpose, expiresAt) {
  await pool.query(
    "DELETE FROM auth_tokens WHERE expires_at <= CURRENT_TIMESTAMP",
  );
  await pool.query(
    "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES (?,?,?,?)",
    [hash, userId, purpose, expiresAt],
  );
}
export async function consumeToken(hash, purpose) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [rows] = await c.query(
      "SELECT user_id AS userId FROM auth_tokens WHERE token_hash = ? AND purpose = ? AND expires_at > CURRENT_TIMESTAMP FOR UPDATE",
      [hash, purpose],
    );
    if (rows[0])
      await c.query("DELETE FROM auth_tokens WHERE token_hash = ?", [hash]);
    await c.commit();
    return rows[0];
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function revokeRefresh(hash) {
  await pool.query(
    "DELETE FROM auth_tokens WHERE token_hash = ? AND purpose = 'REFRESH'",
    [hash],
  );
}
