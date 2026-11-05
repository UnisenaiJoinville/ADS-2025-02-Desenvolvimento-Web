-- ============================================================
-- Migracao 004 - produto com historico nao pode ser apagado (Aula 65)
-- ------------------------------------------------------------
-- POR QUE ESTA MIGRACAO EXISTE
-- A FK de stock_movements.product_id nasceu com ON DELETE CASCADE
-- (Aula 06): apagar um produto apagava TODAS as movimentacoes dele.
-- Depois dos relatorios (Aulas 33 a 45), isso virou um risco:
-- uma exclusao alterava o passado do estoque sem deixar rastro.
--
-- O QUE ELA FAZ
--   troca a regra da FK de CASCADE para RESTRICT: o MySQL passa
--   a RECUSAR a exclusao de um produto que tenha movimentacoes.
--
-- O MySQL nao tem "ALTER FOREIGN KEY". Para mudar a regra,
-- apagamos a FK e criamos de novo, com o mesmo nome.
-- O indice idx_movements_product continua existindo: apagar a FK
-- nao apaga o indice que ela usava.
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

-- Confira: a linha da FK deve terminar em "ON DELETE RESTRICT"
-- (ou sem ON DELETE nenhum: RESTRICT e o padrao e o MySQL as vezes omite).
SHOW CREATE TABLE stock_movements;