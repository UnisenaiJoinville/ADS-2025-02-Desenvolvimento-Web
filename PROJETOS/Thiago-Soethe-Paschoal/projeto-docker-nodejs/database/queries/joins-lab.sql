-- Caderno das aulas 36 a 39. Execute uma consulta por vez.
SELECT p.name,c.name categoria FROM products p INNER JOIN categories c ON c.id=p.category_id;
SELECT p.name,COALESCE(c.name,'Sem categoria') categoria FROM products p LEFT JOIN categories c ON c.id=p.category_id;
SELECT p.name FROM products p LEFT JOIN stock_movements m ON m.product_id=p.id WHERE m.id IS NULL;
SELECT m.created_at,p.name produto,COALESCE(c.name,'Sem categoria') categoria,COALESCE(u.name,'Nao informado') responsavel,m.type,m.quantity FROM stock_movements m JOIN products p ON p.id=m.product_id LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN users u ON u.id=m.user_id ORDER BY m.created_at DESC;
