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

-- ============================================================
-- Modulo de autenticacao (Etapa 24)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Usuario de demonstracao para testar o login antes de existir a tela.
-- A senha em texto puro e "123456" - o que esta gravado abaixo e o HASH.
-- NUNCA deixe um usuario com senha conhecida em um sistema real.
INSERT INTO users (name, email, password_hash) VALUES
  ('Professor Demo',
   'professor@estoquefacil.com',
   '$2b$10$xkAjZ..MHKdp.7cnXFMvVON.XZmd/foxiswJJS61thFcP/WLquT6m');

-- ============================================================
-- Dados de apoio do modulo de relatorios (Aula 33)
-- ------------------------------------------------------------
-- As excecoes que tornam INNER JOIN e LEFT JOIN visivelmente
-- diferentes: categoria sem produto, produto sem categoria,
-- produto sem movimentacao, estoque zerado e historico de
-- varios meses. O mesmo conteudo esta em
-- database/migrations/002-dados-relatorios.sql, para quem ja
-- tinha o banco criado.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Categoria sem nenhum produto
-- ------------------------------------------------------------
-- O name e UNIQUE, entao INSERT IGNORE basta para nao duplicar.
INSERT IGNORE INTO categories (name) VALUES ('Ferramentas');

-- ------------------------------------------------------------
-- 2. Produtos novos
-- ------------------------------------------------------------
-- O sku e UNIQUE, entao INSERT IGNORE tambem resolve aqui.

-- Produto SEM categoria: category_id fica NULL de proposito.
INSERT IGNORE INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
VALUES
  ('Fita adesiva transparente', 'DIV-001', NULL, 2.50, 6.90, 24, 10, TRUE);

-- Os demais precisam do id da categoria, que descobrimos pelo nome.
INSERT IGNORE INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
SELECT d.name, d.sku, c.id, d.cost_price, d.sale_price, d.quantity, d.minimum_stock, TRUE
  FROM (
          SELECT 'Cabo HDMI 2m'              AS name, 'INF-003' AS sku, 'Informatica' AS category,
                 12.00 AS cost_price, 29.90 AS sale_price, 15 AS quantity,  5 AS minimum_stock
    UNION SELECT 'Alcool em gel 500ml',            'LIM-002',       'Limpeza',
                  4.20,        9.90,       0,        12
    UNION SELECT 'Cha verde 50 saches',            'BEB-003',       'Bebidas',
                  8.90,       19.90,      45,        15
    UNION SELECT 'Bloco de notas adesivas',        'PAP-003',       'Papelaria',
                  3.40,        8.50,       7,        20
       ) d
  INNER JOIN categories c ON c.name = d.category;

-- ------------------------------------------------------------
-- 3. Historico de movimentacoes espalhado por varios meses
-- ------------------------------------------------------------
-- Repare que o produto INF-003 (Cabo HDMI) NAO aparece aqui:
-- ele foi cadastrado com saldo inicial 15 e nunca foi movimentado.
-- E justamente ele que vai sumir do INNER JOIN na Aula 37.
--
-- As quantidades fecham com o saldo de cada produto:
--   DIV-001:  +40 -16              = 24
--   LIM-002:  +24 -24              =  0
--   BEB-003:  +60 -5 -10 +20 -20   = 45
--   PAP-003:  +30 -12 -11          =  7
--
-- O NOT EXISTS no final garante que rodar o script duas vezes
-- nao duplique as linhas: (produto + data) ja identifica a linha.
INSERT INTO stock_movements (product_id, type, quantity, note, created_at)
SELECT p.id, d.type, d.quantity, d.note, d.created_at
  FROM (
          SELECT 'DIV-001' AS sku, 'IN'  AS type, 40 AS quantity,
                 'Compra trimestral'      AS note, '2026-06-10 09:15:00' AS created_at
    UNION SELECT 'DIV-001',        'OUT', 16, 'Venda balcao',        '2026-08-14 15:40:00'

    UNION SELECT 'LIM-002',        'IN',  24, 'Compra inicial',      '2026-05-20 08:30:00'
    UNION SELECT 'LIM-002',        'OUT', 24, 'Consumo interno',     '2026-09-02 11:05:00'

    UNION SELECT 'BEB-003',        'IN',  60, 'Compra inicial',      '2026-05-08 10:00:00'
    UNION SELECT 'BEB-003',        'OUT',  5, 'Venda balcao',        '2026-06-19 14:20:00'
    UNION SELECT 'BEB-003',        'OUT', 10, 'Venda balcao',        '2026-07-23 16:45:00'
    UNION SELECT 'BEB-003',        'IN',  20, 'Reposicao',           '2026-08-11 09:50:00'
    UNION SELECT 'BEB-003',        'OUT', 20, 'Venda corporativa',   '2026-09-15 13:30:00'

    UNION SELECT 'PAP-003',        'IN',  30, 'Compra inicial',      '2026-06-02 08:10:00'
    UNION SELECT 'PAP-003',        'OUT', 12, 'Uso interno',         '2026-07-18 10:25:00'
    UNION SELECT 'PAP-003',        'OUT', 11, 'Uso interno',         '2026-09-09 17:00:00'
       ) d
  INNER JOIN products p ON p.sku = d.sku
 WHERE NOT EXISTS (
         SELECT 1
           FROM stock_movements m
          WHERE m.product_id = p.id
            AND m.created_at = d.created_at
       );

-- ------------------------------------------------------------
-- 4. Um segundo usuario
-- ------------------------------------------------------------
-- Senha em texto puro: "123456" (o que esta gravado e o HASH).
-- Serve para os relatorios de movimentacoes por usuario (Aula 38).
INSERT IGNORE INTO users (name, email, password_hash) VALUES
  ('Ana Paula Souza',
   'ana@estoquefacil.com',
   '$2b$10$iQHvaAxA22NsuZUXJGsXwO5JIjSkDwbJpKm.h7s32PwLIiUrd6TJq');

-- ============================================================
-- Quem registrou cada movimentacao (Aula 38)
-- ------------------------------------------------------------
-- Entra como ALTER, e nao dentro do CREATE TABLE la em cima,
-- por um motivo de ordem: stock_movements e criada ANTES de
-- users neste arquivo, e uma chave estrangeira so pode apontar
-- para uma tabela que ja existe.
-- ============================================================

-- ------------------------------------------------------------
-- 1. A coluna
-- ------------------------------------------------------------
-- NULL e permitido: o historico anterior nao tem dono.
-- Se fosse NOT NULL, o ALTER TABLE falharia nas linhas antigas.
ALTER TABLE stock_movements
  ADD COLUMN user_id INT NULL AFTER product_id;

-- ------------------------------------------------------------
-- 2. A chave estrangeira
-- ------------------------------------------------------------
-- ON DELETE SET NULL: se um usuario for excluido, a movimentacao
-- CONTINUA existindo - ela e um fato do estoque. Perde-se apenas
-- o responsavel.
--
-- Compare com a FK de product_id, que usa ON DELETE CASCADE:
-- movimentacao de um produto que nao existe mais nao faz sentido.
ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_user
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 3. O indice
-- ------------------------------------------------------------
-- Toda coluna usada em JOIN ou em WHERE merece um indice.
-- Sem ele, filtrar por usuario varre a tabela inteira.
CREATE INDEX idx_movements_user ON stock_movements (user_id);

-- ------------------------------------------------------------
-- 4. Atribuindo responsavel as movimentacoes recentes
-- ------------------------------------------------------------
-- Dividimos entre os dois usuarios para o relatorio ter o que
-- comparar. O criterio (dia par / dia impar) e arbitrario: serve
-- so para gerar dados de teste variados.
UPDATE stock_movements m
 INNER JOIN products p ON p.id = m.product_id
   SET m.user_id = (SELECT id FROM users WHERE email = 'professor@estoquefacil.com')
 WHERE p.sku IN ('DIV-001', 'LIM-002', 'BEB-003', 'PAP-003')
   AND DAY(m.created_at) % 2 = 0;

UPDATE stock_movements m
 INNER JOIN products p ON p.id = m.product_id
   SET m.user_id = (SELECT id FROM users WHERE email = 'ana@estoquefacil.com')
 WHERE p.sku IN ('DIV-001', 'LIM-002', 'BEB-003', 'PAP-003')
   AND DAY(m.created_at) % 2 = 1;

