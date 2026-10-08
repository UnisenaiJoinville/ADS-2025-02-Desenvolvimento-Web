-- ============================================================
-- Migracao 002 - dados de apoio para o modulo de relatorios
--                (Aula 33)
-- ------------------------------------------------------------
-- POR QUE ESTA MIGRACAO EXISTE
-- Os dados que o projeto ja tinha sao "bem comportados demais":
-- todo produto tem categoria, toda categoria tem produto e todo
-- produto tem movimentacao. Com dados assim, INNER JOIN e
-- LEFT JOIN devolvem SEMPRE o mesmo resultado - e a diferenca
-- entre os dois, que e o coracao das aulas 36 e 37, fica invisivel.
--
-- Entao acrescentamos, de proposito, as excecoes:
--   1. uma categoria SEM nenhum produto  -> 'Ferramentas'
--   2. um produto SEM categoria          -> 'DIV-001' (category_id NULL)
--   3. um produto SEM movimentacao       -> 'INF-003'
--   4. um produto com estoque ZERADO     -> 'LIM-002'
--   5. um produto ABAIXO do minimo       -> 'PAP-003'
--   6. historico espalhado por 5 meses   -> relatorios por periodo
--   7. um segundo usuario                -> relatorios por usuario
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/002-dados-relatorios.sql
--
-- Pode ser executado mais de uma vez sem duplicar nada.
--
-- PARA DESFAZER: veja database/migrations/002-rollback.sql
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


-- ------------------------------------------------------------
-- 5. Conferencia
-- ------------------------------------------------------------
SELECT 'categorias'                AS indicador, COUNT(*) AS total FROM categories
UNION ALL
SELECT 'produtos',                  COUNT(*) FROM products
UNION ALL
SELECT 'movimentacoes',             COUNT(*) FROM stock_movements
UNION ALL
SELECT 'usuarios',                  COUNT(*) FROM users
UNION ALL
SELECT 'produtos sem categoria',    COUNT(*) FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'categorias sem produto',    COUNT(*) FROM categories c
 WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
UNION ALL
SELECT 'produtos sem movimentacao', COUNT(*) FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);
