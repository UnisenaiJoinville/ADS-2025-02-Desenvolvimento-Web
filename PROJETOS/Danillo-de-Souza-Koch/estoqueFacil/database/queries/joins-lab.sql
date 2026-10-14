-- SQL lab for lessons 36-38. Run one statement at a time in MySQL.

-- Lesson 36: INNER JOIN keeps only matching rows.
SELECT p.name AS product, p.sku, c.name AS category
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 ORDER BY product;

SELECT m.id, m.created_at, p.name AS product, p.sku,
       m.type, m.quantity,
       CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END AS signed_quantity
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 ORDER BY m.created_at DESC, m.id DESC;

-- Lesson 37: LEFT JOIN keeps the left side even without a match.
SELECT p.name AS product, COALESCE(c.name, 'Sem categoria') AS category
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY category, product;

SELECT c.name AS category, COUNT(p.id) AS product_count,
       COALESCE(SUM(p.quantity), 0) AS total_units
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
 GROUP BY c.id, c.name
 ORDER BY c.name;

SELECT p.name AS product, p.sku
  FROM products p
  LEFT JOIN stock_movements m ON m.product_id = p.id
 WHERE m.id IS NULL
   AND p.active = TRUE;

-- Lesson 38: join movement -> product -> category and user.
SELECT m.created_at, p.name AS product, c.name AS category,
       m.type, m.quantity, COALESCE(u.name, 'Nao informado') AS user_name
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN users u ON u.id = m.user_id
 ORDER BY m.created_at DESC, m.id DESC;

SELECT COALESCE(u.name, '(sem responsavel)') AS user_name, COUNT(*) AS movement_count
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
 ORDER BY movement_count DESC;

-- Lesson 39: aggregate after joining and filter groups with HAVING.
SELECT c.name AS category,
       COUNT(p.id) AS product_count,
       COALESCE(SUM(p.quantity), 0) AS total_units
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
HAVING COUNT(p.id) > 2
 ORDER BY product_count DESC;

SELECT COALESCE(u.name, 'Nao informado') AS user_name,
       COUNT(*) AS movement_count,
       COUNT(DISTINCT m.product_id) AS product_count,
       COALESCE(SUM(CASE WHEN m.type = 'IN' THEN m.quantity ELSE 0 END), 0) AS units_in,
       COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0) AS units_out
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
HAVING COUNT(*) >= 1
 ORDER BY movement_count DESC;

SELECT c.name AS category,
       COUNT(DISTINCT p.id) AS products,
       SUM(m.quantity) AS units_moved_out
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 INNER JOIN categories c ON c.id = p.category_id
 WHERE m.type = 'OUT'
 GROUP BY c.id, c.name
HAVING SUM(m.quantity) > 10
 ORDER BY units_moved_out DESC
 LIMIT 5;
