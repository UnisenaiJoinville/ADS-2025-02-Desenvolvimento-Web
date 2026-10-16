-- Migration 002: deterministic test records for report lessons.
-- Safe to rerun: categories/products use unique keys and movements use
-- (product_id, created_at) as an idempotency check.
INSERT IGNORE INTO categories (name) VALUES ('Ferramentas');

INSERT IGNORE INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
VALUES
  ('Fita adesiva transparente', 'DIV-001', NULL, 2.50, 6.90, 24, 10, TRUE);

INSERT IGNORE INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
SELECT d.name, d.sku, c.id, d.cost_price, d.sale_price, d.quantity, d.minimum_stock, TRUE
  FROM (
          SELECT 'Cabo HDMI 2m' AS name, 'INF-003' AS sku, 'Informatica' AS category,
                 12.00 AS cost_price, 29.90 AS sale_price, 15 AS quantity, 5 AS minimum_stock
    UNION SELECT 'Alcool em gel 500ml', 'LIM-002', 'Limpeza', 4.20, 9.90, 0, 12
    UNION SELECT 'Cha verde 50 saches', 'BEB-003', 'Bebidas', 8.90, 19.90, 45, 15
    UNION SELECT 'Bloco de notas adesivas', 'PAP-003', 'Papelaria', 3.40, 8.50, 7, 20
       ) d
  INNER JOIN categories c ON c.name = d.category;

INSERT INTO stock_movements (product_id, type, quantity, note, created_at)
SELECT p.id, d.type, d.quantity, d.note, d.created_at
  FROM (
          SELECT 'DIV-001' AS sku, 'IN' AS type, 40 AS quantity,
                 'Compra trimestral' AS note, '2026-06-10 09:15:00' AS created_at
    UNION SELECT 'DIV-001', 'OUT', 16, 'Venda balcao', '2026-08-14 15:40:00'
    UNION SELECT 'LIM-002', 'IN', 24, 'Compra inicial', '2026-05-20 08:30:00'
    UNION SELECT 'LIM-002', 'OUT', 24, 'Consumo interno', '2026-09-02 11:05:00'
    UNION SELECT 'BEB-003', 'IN', 60, 'Compra inicial', '2026-05-08 10:00:00'
    UNION SELECT 'BEB-003', 'OUT', 5, 'Venda balcao', '2026-06-19 14:20:00'
    UNION SELECT 'BEB-003', 'OUT', 10, 'Venda balcao', '2026-07-23 16:45:00'
    UNION SELECT 'BEB-003', 'IN', 20, 'Reposicao', '2026-08-11 09:50:00'
    UNION SELECT 'BEB-003', 'OUT', 20, 'Venda corporativa', '2026-09-15 13:30:00'
    UNION SELECT 'PAP-003', 'IN', 30, 'Compra inicial', '2026-06-02 08:10:00'
    UNION SELECT 'PAP-003', 'OUT', 12, 'Uso interno', '2026-07-18 10:25:00'
    UNION SELECT 'PAP-003', 'OUT', 11, 'Uso interno', '2026-09-09 17:00:00'
       ) d
  INNER JOIN products p ON p.sku = d.sku
 WHERE NOT EXISTS (
         SELECT 1
           FROM stock_movements m
          WHERE m.product_id = p.id
            AND m.created_at = d.created_at
       );

INSERT IGNORE INTO users (name, email, password_hash) VALUES
  ('Ana Paula Souza',
   'ana@estoquefacil.com',
   '$2b$10$iQHvaAxA22NsuZUXJGsXwO5JIjSkDwbJpKm.h7s32PwLIiUrd6TJq');

SELECT 'categories' AS indicator, COUNT(*) AS total FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'stock_movements', COUNT(*) FROM stock_movements
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'products without category', COUNT(*) FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'categories without products', COUNT(*)
  FROM categories c
 WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
UNION ALL
SELECT 'products without movements', COUNT(*)
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);
