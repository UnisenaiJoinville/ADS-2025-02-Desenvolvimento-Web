-- Rollback for migration 002. Removes only the report lesson seed SKUs.
DELETE m
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 WHERE p.sku IN ('DIV-001', 'INF-003', 'LIM-002', 'BEB-003', 'PAP-003');

DELETE FROM products
 WHERE sku IN ('DIV-001', 'INF-003', 'LIM-002', 'BEB-003', 'PAP-003');

DELETE FROM categories
 WHERE name = 'Ferramentas'
   AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = categories.id);

DELETE FROM users WHERE email = 'ana@estoquefacil.com';
