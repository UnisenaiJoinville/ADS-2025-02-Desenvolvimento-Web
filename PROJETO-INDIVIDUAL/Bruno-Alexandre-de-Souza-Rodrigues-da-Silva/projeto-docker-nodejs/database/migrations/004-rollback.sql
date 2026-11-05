-- ============================================================
-- Rollback da migracao 004 (Aula 65)
-- Volta a FK de product_id para ON DELETE CASCADE.
--
-- ATENCAO: depois disto, excluir um produto volta a apagar o
-- historico dele. So use para voltar ao comportamento da Aula 06.
--
-- COMO RODAR:
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/004-rollback.sql
-- ============================================================

ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_product;

ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_product
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON DELETE CASCADE;

SHOW CREATE TABLE stock_movements;
