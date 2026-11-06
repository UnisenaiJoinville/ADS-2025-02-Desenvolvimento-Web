-- Migracao 004: preserva historico; aplicar uma vez em base anterior.
-- DDL tem commit implicito. Testar antes em copia isolada.
-- MySQL 8 recusa DROP + ADD com o mesmo nome no mesmo ALTER.
-- Cada ALTER abaixo troca uma FK por outra, sem periodo sem restricao.
ALTER TABLE stock_movements
  DROP FOREIGN KEY fk_movements_product,
  ADD CONSTRAINT fk_movements_product_transition FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE RESTRICT;
ALTER TABLE stock_movements
  DROP FOREIGN KEY fk_movements_product_transition,
  ADD CONSTRAINT fk_movements_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE RESTRICT;
SHOW CREATE TABLE stock_movements;
