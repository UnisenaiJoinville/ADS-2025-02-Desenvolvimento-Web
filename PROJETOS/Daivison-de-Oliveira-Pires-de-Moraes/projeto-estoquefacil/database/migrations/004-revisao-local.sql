ALTER TABLE products ADD COLUMN supplier VARCHAR(120) NULL AFTER sku;
ALTER TABLE users ADD COLUMN role ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR' AFTER password_hash,
  ADD COLUMN last_login_at TIMESTAMP NULL AFTER active,
  ADD COLUMN token_version INT NOT NULL DEFAULT 0,
  ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until TIMESTAMP NULL;
UPDATE users SET role = 'ADMIN' WHERE email = 'professor@estoquefacil.com';
ALTER TABLE stock_movements MODIFY type ENUM('IN','OUT','ADJUST') NOT NULL,
  ADD COLUMN previous_quantity INT NULL,
  ADD COLUMN resulting_quantity INT NULL;
ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_product;
ALTER TABLE stock_movements ADD CONSTRAINT fk_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
CREATE TABLE auth_tokens (
  token_hash CHAR(64) PRIMARY KEY, user_id INT NOT NULL,
  purpose ENUM('REFRESH','RESET') NOT NULL, expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auth_tokens_user (user_id, purpose)
);
CREATE TABLE auth_lock (id INT PRIMARY KEY);
INSERT INTO auth_lock VALUES (1);
