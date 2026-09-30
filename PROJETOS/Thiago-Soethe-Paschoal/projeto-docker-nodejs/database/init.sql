-- ============================================================
-- Estoque Facil - estrutura inicial do banco
-- Este arquivo roda automaticamente na PRIMEIRA vez que o
-- container do MySQL e criado (pasta docker-entrypoint-initdb.d).
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(40) NOT NULL UNIQUE,
  supplier VARCHAR(120) NULL,
  category_id INT NULL,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('IN', 'OUT') NOT NULL,
  quantity INT NOT NULL,
  note VARCHAR(180) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
);

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_movements_product ON stock_movements (product_id);
CREATE INDEX idx_movements_created_at ON stock_movements (created_at);

-- ------------------------------------------------------------
-- Dados de exemplo
-- ------------------------------------------------------------

INSERT INTO categories (name) VALUES
  ('Bebidas'),
  ('Limpeza'),
  ('Papelaria'),
  ('Informatica');

INSERT INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock)
VALUES
  ('Cafe em graos 1kg',      'BEB-001', 1, 28.00,  45.90, 40, 10),
  ('Agua mineral 500ml',     'BEB-002', 1,  0.90,   2.50, 8,  20),
  ('Detergente neutro 500ml','LIM-001', 2,  1.80,   3.90, 60, 15),
  ('Papel A4 500 folhas',    'PAP-001', 3, 22.00,  34.90, 12, 10),
  ('Caneta esferografica',   'PAP-002', 3,  0.70,   2.00, 5,  25),
  ('Mouse sem fio',          'INF-001', 4, 39.00,  79.90, 18,  5),
  ('Teclado mecanico',       'INF-002', 4, 180.00, 299.00, 3,  4);

INSERT INTO stock_movements (product_id, type, quantity, note) VALUES
  (1, 'IN',  50, 'Compra inicial'),
  (1, 'OUT', 10, 'Venda balcao'),
  (2, 'IN',  30, 'Compra inicial'),
  (2, 'OUT', 22, 'Venda balcao'),
  (3, 'IN',  60, 'Compra inicial'),
  (4, 'IN',  20, 'Compra inicial'),
  (4, 'OUT',  8, 'Uso interno'),
  (5, 'IN',  30, 'Compra inicial'),
  (5, 'OUT', 25, 'Venda balcao'),
  (6, 'IN',  18, 'Compra inicial'),
  (7, 'IN',   5, 'Compra inicial'),
  (7, 'OUT',  2, 'Venda balcao');
