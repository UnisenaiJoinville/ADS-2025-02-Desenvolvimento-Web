-- SQL lab for lessons 33-35. Run one statement at a time in MySQL.

-- Lesson 33: inspect schema and edge-case records.
SHOW TABLES;
DESCRIBE products;
SHOW CREATE TABLE products\G

SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = 'estoque_db'
   AND REFERENCED_TABLE_NAME IS NOT NULL
 ORDER BY TABLE_NAME, COLUMN_NAME;

SELECT 'categories' AS table_name, COUNT(*) AS row_count FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'stock_movements', COUNT(*) FROM stock_movements
UNION ALL SELECT 'users', COUNT(*) FROM users;

SELECT 'products without category' AS situation, COUNT(*) AS total
  FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'categories without products', COUNT(*)
  FROM categories c
 WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
UNION ALL
SELECT 'products without movements', COUNT(*)
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);

-- Lesson 34: SELECT, filters, ordering, and pagination.
SELECT name, sku, quantity FROM products WHERE active = TRUE;

SELECT name, sku, quantity, minimum_stock
  FROM products
 WHERE active = TRUE
   AND quantity <= minimum_stock
 ORDER BY quantity, name;

SELECT name, sku FROM products WHERE name LIKE '%cafe%' OR sku LIKE '%PAP%';
SELECT name, sku FROM products WHERE sku IN ('BEB-001', 'BEB-003', 'INF-003');
SELECT name, category_id FROM products WHERE category_id IS NULL;

SELECT name, quantity
  FROM products
 WHERE active = TRUE
 ORDER BY quantity DESC, name ASC
 LIMIT 5 OFFSET 5;

SELECT name, quantity, minimum_stock,
       CASE
         WHEN quantity = 0 THEN 'ZERADO'
         WHEN quantity <= minimum_stock THEN 'ABAIXO DO MINIMO'
         ELSE 'OK'
       END AS stock_status
  FROM products
 WHERE active = TRUE;

-- Lesson 35: aggregation and groups.
SELECT COUNT(*) AS products,
       SUM(quantity) AS units,
       ROUND(SUM(quantity * cost_price), 2) AS cost_value,
       ROUND(AVG(cost_price), 2) AS average_cost,
       MIN(sale_price) AS min_price,
       MAX(sale_price) AS max_price
  FROM products
 WHERE active = TRUE;

SELECT category_id,
       COUNT(*) AS product_count,
       SUM(quantity) AS total_units,
       ROUND(SUM(quantity * cost_price), 2) AS cost_value
  FROM products
 WHERE active = TRUE
 GROUP BY category_id
HAVING COUNT(*) >= 1
 ORDER BY cost_value DESC;

SELECT type, COUNT(*) AS movements, SUM(quantity) AS units
  FROM stock_movements
 GROUP BY type;
