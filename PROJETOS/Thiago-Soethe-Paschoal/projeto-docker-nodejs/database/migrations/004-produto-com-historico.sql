-- ============================================================
-- Migracao 004 - produto com historico nao pode ser apagado (Aula 65)
-- ------------------------------------------------------------
-- A FK de stock_movements.product_id nasceu com ON DELETE CASCADE:
-- apagar um produto apagava TODAS as movimentacoes dele.
-- Aqui ela passa a RESTRICT: o MySQL recusa a exclusao.
--
-- O MySQL nao tem "ALTER FOREIGN KEY": apagamos e criamos de novo.
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/004-produto-com-historico.sql
--
-- PARA DESFAZER: database/migrations/004-rollback.sql
-- ============================================================

ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_product;

ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_product
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON DELETE RESTRICT;

SHOW CREATE TABLE stock_movements;
