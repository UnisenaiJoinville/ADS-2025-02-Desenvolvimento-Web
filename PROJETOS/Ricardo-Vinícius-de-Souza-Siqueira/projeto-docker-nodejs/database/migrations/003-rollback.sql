-- ============================================================
-- Rollback da migracao 003 (Aula 38)
-- ------------------------------------------------------------
-- A ORDEM IMPORTA e e o contrario da ida:
--   1. a chave estrangeira (ela depende da coluna)
--   2. o indice
--   3. a coluna
--
-- Tentar apagar a coluna antes da FK da erro:
--   "Cannot drop column 'user_id': needed in a foreign key constraint"
--
-- COMO RODAR:
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/003-rollback.sql
--
-- ATENCAO: isto apaga para sempre a informacao de quem registrou
-- cada movimentacao. Nao existe como recuperar depois.
-- ============================================================

ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_user;

DROP INDEX idx_movements_user ON stock_movements;

ALTER TABLE stock_movements DROP COLUMN user_id;

DESCRIBE stock_movements;
