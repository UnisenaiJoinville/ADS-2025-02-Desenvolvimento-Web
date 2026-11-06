-- Schema final para MySQL 8.0.16+; sem contas de demonstracao.
CREATE TABLE categories (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(160) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, role ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR',
 active BOOLEAN NOT NULL DEFAULT TRUE, last_login_at TIMESTAMP NULL,
 token_version INT NOT NULL DEFAULT 0, failed_attempts INT NOT NULL DEFAULT 0, locked_until TIMESTAMP NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE products (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, sku VARCHAR(40) NOT NULL UNIQUE,
 supplier VARCHAR(120) NULL, category_id INT NULL, cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
 sale_price DECIMAL(10,2) NOT NULL DEFAULT 0, quantity INT NOT NULL DEFAULT 0,
 minimum_stock INT NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_products_category FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
 CONSTRAINT chk_product_quantity CHECK(quantity >= 0), CONSTRAINT chk_product_minimum CHECK(minimum_stock >= 0),
 CONSTRAINT chk_product_prices CHECK(cost_price >= 0 AND sale_price >= cost_price)
) ENGINE=InnoDB;
CREATE TABLE stock_movements (
 id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, user_id INT NULL,
 type ENUM('IN','OUT','ADJUST') NOT NULL, quantity INT NOT NULL, note VARCHAR(180) NULL,
 previous_quantity INT NULL, resulting_quantity INT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_movements_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT,
 CONSTRAINT fk_movements_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
 CONSTRAINT chk_movement_quantity CHECK(quantity >= 0 AND (type='ADJUST' OR quantity > 0))
) ENGINE=InnoDB;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_movements_user ON stock_movements(user_id);
CREATE INDEX idx_movements_date_type ON stock_movements(created_at,type);
CREATE TABLE auth_tokens (
 token_hash CHAR(64) PRIMARY KEY, user_id INT NOT NULL, purpose ENUM('REFRESH','RESET') NOT NULL,
 expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_auth_tokens_user(user_id,purpose)
) ENGINE=InnoDB;
CREATE TABLE auth_lock(id INT PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO auth_lock VALUES(1);
