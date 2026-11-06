-- 45 / 1.1 Produtos com categorias, incluindo ausentes.
SELECT p.name, COALESCE(c.name,'Sem categoria') AS categoryName FROM products p
LEFT JOIN categories c ON c.id=p.category_id ORDER BY categoryName,p.name;
-- 45 / 1.2 Produtos distintos por responsavel.
SELECT COALESCE(u.name,'Nao informado'),COUNT(DISTINCT m.product_id) AS products
FROM stock_movements m LEFT JOIN users u ON u.id=m.user_id GROUP BY u.id,u.name;
-- 45 / 1.3 Categoria de maior preco medio de venda.
SELECT c.id,c.name,AVG(p.sale_price) AS averageSalePrice FROM categories c
JOIN products p ON p.category_id=c.id GROUP BY c.id,c.name ORDER BY averageSalePrice DESC,c.id LIMIT 1;
-- 45 / 1.4 Setembro completo, sem perder o ultimo dia.
SELECT m.id,p.name,c.name AS categoryName,u.name AS userName,m.type,m.quantity,m.created_at
FROM stock_movements m JOIN products p ON p.id=m.product_id LEFT JOIN categories c ON c.id=p.category_id
LEFT JOIN users u ON u.id=m.user_id WHERE m.created_at >= '2026-09-01' AND m.created_at < '2026-10-01';
-- 45 / 1.5 As duas formas de nunca ter SAIDA.
SELECT p.id,p.name FROM products p LEFT JOIN stock_movements m ON m.product_id=p.id AND m.type='OUT' WHERE m.id IS NULL;
SELECT p.id,p.name FROM products p WHERE NOT EXISTS(SELECT 1 FROM stock_movements m WHERE m.product_id=p.id AND m.type='OUT');
-- 45 / 3.4 Compare type=ALL (possivel varredura) com range no indice da data.
EXPLAIN SELECT id FROM stock_movements WHERE DATE(created_at) = '2026-09-15';
EXPLAIN SELECT id FROM stock_movements WHERE created_at >= '2026-09-15' AND created_at < '2026-09-16';
