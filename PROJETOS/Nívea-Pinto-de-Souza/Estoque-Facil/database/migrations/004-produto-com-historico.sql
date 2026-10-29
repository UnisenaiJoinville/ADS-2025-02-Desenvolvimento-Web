ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_product;
ALTER TABLE stock_movements ADD CONSTRAINT fk_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
