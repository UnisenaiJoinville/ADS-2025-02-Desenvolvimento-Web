-- Caderno das aulas 33 a 35. Execute uma consulta por vez.
SHOW TABLES;
DESCRIBE products;
SELECT name,sku,quantity,quantity*cost_price AS valor_em_estoque FROM products ORDER BY name;
SELECT CASE WHEN quantity=0 THEN 'OUT' WHEN quantity<=minimum_stock THEN 'LOW' ELSE 'OK' END situacao,COUNT(*) total FROM products GROUP BY situacao;
SELECT DATE_FORMAT(created_at,'%Y-%m') periodo,SUM(CASE WHEN type='IN' THEN quantity ELSE 0 END) entradas,SUM(CASE WHEN type='OUT' THEN quantity ELSE 0 END) saidas FROM stock_movements GROUP BY periodo ORDER BY periodo;
