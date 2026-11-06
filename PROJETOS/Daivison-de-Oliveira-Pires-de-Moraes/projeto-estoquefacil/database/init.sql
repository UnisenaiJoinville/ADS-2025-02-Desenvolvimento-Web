-- Schema final para MySQL 8.0.16+.
-- Sem contas de demonstracao.

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  token_version INT NOT NULL DEFAULT 0,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(40) NOT NULL UNIQUE,
  supplier VARCHAR(120) NULL,
  category_id INT NULL,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_product_quantity
    CHECK (quantity >= 0),

  CONSTRAINT chk_product_minimum
    CHECK (minimum_stock >= 0),

  CONSTRAINT chk_product_prices
    CHECK (cost_price >= 0 AND sale_price >= cost_price)
) ENGINE=InnoDB;

CREATE TABLE stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NULL,
  type ENUM('IN', 'OUT', 'ADJUST') NOT NULL,
  quantity INT NOT NULL,
  note VARCHAR(180) NULL,
  previous_quantity INT NULL,
  resulting_quantity INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_movements_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_movements_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_movement_quantity
    CHECK (
      quantity >= 0
      AND (type = 'ADJUST' OR quantity > 0)
    )
) ENGINE=InnoDB;

CREATE INDEX idx_products_category
  ON products(category_id);

CREATE INDEX idx_movements_product
  ON stock_movements(product_id);

CREATE INDEX idx_movements_created_at
  ON stock_movements(created_at);

CREATE INDEX idx_movements_user
  ON stock_movements(user_id);

CREATE INDEX idx_movements_date_type
  ON stock_movements(created_at, type);

CREATE TABLE auth_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  purpose ENUM('REFRESH', 'RESET') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  INDEX idx_auth_tokens_user (user_id, purpose)
) ENGINE=InnoDB;

CREATE TABLE auth_lock (
  id INT PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO auth_lock VALUES (1);

-- ------------------------------------------------------------
-- Categorias iniciais
-- ------------------------------------------------------------

INSERT INTO categories (name) VALUES
  ('Bebidas'),
  ('Limpeza'),
  ('Papelaria'),
  ('Informatica');

-- ------------------------------------------------------------
-- Produtos iniciais
-- ------------------------------------------------------------

INSERT INTO products
  (
    name,
    sku,
    category_id,
    cost_price,
    sale_price,
    quantity,
    minimum_stock
  )
VALUES
  ('Cafe em graos 1kg',       'BEB-001', 1, 28.00,  45.90, 40, 10),
  ('Agua mineral 500ml',      'BEB-002', 1,  0.90,   2.50,  8, 20),
  ('Detergente neutro 500ml', 'LIM-001', 2,  1.80,   3.90, 60, 15),
  ('Papel A4 500 folhas',     'PAP-001', 3, 22.00,  34.90, 12, 10),
  ('Caneta esferografica',    'PAP-002', 3,  0.70,   2.00,  5, 25),
  ('Mouse sem fio',          'INF-001', 4, 39.00,  79.90, 18,  5),
  ('Teclado mecanico',       'INF-002', 4, 180.00, 299.00, 3,  4);

-- ------------------------------------------------------------
-- Movimentacoes iniciais
-- ------------------------------------------------------------

INSERT INTO stock_movements
  (product_id, type, quantity, note)
VALUES
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

-- ------------------------------------------------------------
-- Dados de apoio dos relatorios
-- Categoria vazia e produto sem categoria
-- ------------------------------------------------------------

INSERT IGNORE INTO categories (name)
VALUES ('Ferramentas');

INSERT IGNORE INTO products
  (
    name,
    sku,
    category_id,
    cost_price,
    sale_price,
    quantity,
    minimum_stock,
    active
  )
VALUES
  (
    'Fita adesiva transparente',
    'DIV-001',
    NULL,
    2.50,
    6.90,
    24,
    10,
    TRUE
  );

-- Produtos adicionais.
-- Cabo HDMI tem saldo inicial, mas nao possui movimentacoes.

INSERT IGNORE INTO products
  (
    name,
    sku,
    category_id,
    cost_price,
    sale_price,
    quantity,
    minimum_stock,
    active
  )
SELECT
  d.name,
  d.sku,
  c.id,
  d.cost_price,
  d.sale_price,
  d.quantity,
  d.minimum_stock,
  TRUE
FROM (
  SELECT
    'Cabo HDMI 2m' AS name,
    'INF-003' AS sku,
    'Informatica' AS category,
    12.00 AS cost_price,
    29.90 AS sale_price,
    15 AS quantity,
    5 AS minimum_stock

  UNION ALL

  SELECT
    'Alcool em gel 500ml',
    'LIM-002',
    'Limpeza',
    4.20,
    9.90,
    0,
    12

  UNION ALL

  SELECT
    'Cha verde 50 saches',
    'BEB-003',
    'Bebidas',
    8.90,
    19.90,
    45,
    15

  UNION ALL

  SELECT
    'Bloco de notas adesivas',
    'PAP-003',
    'Papelaria',
    3.40,
    8.50,
    7,
    20
) d
INNER JOIN categories c ON c.name = d.category;

-- ------------------------------------------------------------
-- Historico de movimentacoes em varios meses
-- ------------------------------------------------------------

INSERT INTO stock_movements
  (product_id, type, quantity, note, created_at)
SELECT
  p.id,
  d.type,
  d.quantity,
  d.note,
  d.created_at
FROM (
  SELECT
    'DIV-001' AS sku,
    'IN' AS type,
    40 AS quantity,
    'Compra trimestral' AS note,
    '2026-06-10 09:15:00' AS created_at

  UNION ALL
  SELECT
    'DIV-001', 'OUT', 16,
    'Venda balcao', '2026-08-14 15:40:00'

  UNION ALL
  SELECT
    'LIM-002', 'IN', 24,
    'Compra inicial', '2026-05-20 08:30:00'

  UNION ALL
  SELECT
    'LIM-002', 'OUT', 24,
    'Consumo interno', '2026-09-02 11:05:00'

  UNION ALL
  SELECT
    'BEB-003', 'IN', 60,
    'Compra inicial', '2026-05-08 10:00:00'

  UNION ALL
  SELECT
    'BEB-003', 'OUT', 5,
    'Venda balcao', '2026-06-19 14:20:00'

  UNION ALL
  SELECT
    'BEB-003', 'OUT', 10,
    'Venda balcao', '2026-07-23 16:45:00'

  UNION ALL
  SELECT
    'BEB-003', 'IN', 20,
    'Reposicao', '2026-08-11 09:50:00'

  UNION ALL
  SELECT
    'BEB-003', 'OUT', 20,
    'Venda corporativa', '2026-09-15 13:30:00'

  UNION ALL
  SELECT
    'PAP-003', 'IN', 30,
    'Compra inicial', '2026-06-02 08:10:00'

  UNION ALL
  SELECT
    'PAP-003', 'OUT', 12,
    'Uso interno', '2026-07-18 10:25:00'

  UNION ALL
  SELECT
    'PAP-003', 'OUT', 11,
    'Uso interno', '2026-09-09 17:00:00'
) d
INNER JOIN products p ON p.sku = d.sku
WHERE NOT EXISTS (
  SELECT 1
  FROM stock_movements m
  WHERE m.product_id = p.id
    AND m.created_at = d.created_at
);