ALTER TABLE products ADD CONSTRAINT chk_product_quantity CHECK (quantity >= 0),
  ADD CONSTRAINT chk_product_minimum CHECK (minimum_stock >= 0),
  ADD CONSTRAINT chk_product_prices CHECK (cost_price >= 0 AND sale_price >= cost_price);
ALTER TABLE stock_movements ADD CONSTRAINT chk_movement_quantity CHECK (quantity >= 0 AND (type = 'ADJUST' OR quantity > 0));
CREATE INDEX idx_movements_date_type ON stock_movements(created_at,type);
