

ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_user;

DROP INDEX idx_movements_user ON stock_movements;

ALTER TABLE stock_movements DROP COLUMN user_id;

DESCRIBE stock_movements;
