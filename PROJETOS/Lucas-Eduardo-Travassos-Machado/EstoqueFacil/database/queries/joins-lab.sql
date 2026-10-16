-- Caderno SQL das etapas 36 a 45. Executar uma consulta por vez.
-- Alguns exemplos demonstram erros de proposito; leia os comentarios.

-- Etapa 36
SELECT name, sku, category_id FROM products ORDER BY name LIMIT 5;

SELECT id, name FROM categories ORDER BY id;

SELECT products.name   AS produto,
       categories.name AS categoria
  FROM products
 INNER JOIN categories ON categories.id = products.category_id
 ORDER BY produto;

SELECT p.name AS produto,
       p.sku,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 ORDER BY produto;

SELECT name FROM products p INNER JOIN categories c ON c.id = p.category_id;

SELECT COUNT(*) AS linhas_no_inner_join
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id;

SELECT COUNT(*) FROM products;

SELECT name, sku, category_id FROM products WHERE category_id IS NULL;

SELECT p.name AS produto,
       p.quantity,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 WHERE c.name = 'Bebidas'
 ORDER BY p.name;

SELECT p.name AS produto,
       p.quantity,
       p.minimum_stock AS minimo,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 WHERE p.quantity <= p.minimum_stock
   AND c.name IN ('Bebidas', 'Papelaria')
 ORDER BY c.name, p.name;

SELECT m.created_at AS data,
       p.name       AS produto,
       m.type       AS tipo,
       m.quantity   AS qtd
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 ORDER BY m.created_at DESC
 LIMIT 5;

SELECT COUNT(*) AS linhas_sem_o_on FROM products p, categories c;

SELECT COUNT(*) AS linhas_com_o_on
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id;

SELECT COUNT(*) FROM stock_movements;

-- Etapa 37
SELECT p.name AS produto,
       p.sku,
       c.name AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY p.name;

SELECT COUNT(*) AS linhas_no_left_join
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id;

SELECT p.name AS produto, c.name AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.id IS NULL;

SELECT p.name AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY categoria, produto;

SELECT c.name  AS categoria,
       p.name  AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 ORDER BY c.name, p.name;

SELECT c.name AS categoria, p.name AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 WHERE p.id IS NULL;

SELECT p.name AS produto,
       p.sku,
       p.quantity AS saldo
  FROM products p
  LEFT JOIN stock_movements m ON m.product_id = p.id
 WHERE m.id IS NULL
 ORDER BY p.name;

SELECT p.name AS produto, p.sku
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id)
 ORDER BY p.name;

SELECT COUNT(*) AS com_a_condicao_no_where
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.name <> 'Bebidas';

SELECT COUNT(*) AS com_a_condicao_no_on
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id AND c.name <> 'Bebidas';

SELECT COUNT(*) AS aceitando_o_null
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.name <> 'Bebidas' OR c.name IS NULL;

-- com RIGHT JOIN
SELECT c.name AS categoria, p.name AS produto
  FROM products p
 RIGHT JOIN categories c ON c.id = p.category_id
 ORDER BY c.name, p.name;

-- o MESMO, com LEFT JOIN
SELECT c.name AS categoria, p.name AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 ORDER BY c.name, p.name;

SELECT COALESCE(c.name, 'Sem categoria') AS categoria,
       COALESCE(p.name, '(sem produto)') AS produto
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 UNION
SELECT COALESCE(c.name, 'Sem categoria'),
       COALESCE(p.name, '(sem produto)')
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 ORDER BY categoria, produto;

SELECT c.name      AS categoria,
       COUNT(*)    AS count_estrela,
       COUNT(p.id) AS count_da_coluna
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
 ORDER BY count_da_coluna;

-- Etapa 38: quatro tabelas sem perder categoria ou responsavel nulo.
SELECT m.id, p.name AS productName,
       COALESCE(c.name, 'Sem categoria') AS categoryName,
       COALESCE(u.name, 'Nao informado') AS userName
  FROM stock_movements m
  INNER JOIN products p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN users u ON u.id = m.user_id
 ORDER BY m.created_at, m.id;

-- Etapa 39
SELECT c.name      AS categoria,
       COUNT(p.id) AS produtos
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
 ORDER BY produtos DESC;

SELECT c.name      AS categoria,
       COUNT(*)    AS count_estrela,
       COUNT(p.id) AS count_da_coluna
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
 ORDER BY count_da_coluna;

SELECT c.name AS categoria,
       COUNT(p.id)                              AS produtos,
       COALESCE(SUM(p.quantity), 0)             AS unidades,
       ROUND(COALESCE(SUM(p.quantity * p.cost_price), 0), 2) AS valor_custo
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
 GROUP BY c.id, c.name
 ORDER BY valor_custo DESC;

SELECT c.name      AS categoria,
       COUNT(p.id) AS produtos
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
HAVING COUNT(p.id) > 2
 ORDER BY produtos DESC;

SELECT p.name AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria,
       COUNT(m.id)      AS movimentacoes,
       SUM(m.quantity)  AS unidades_movimentadas
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
 GROUP BY p.id, p.name, c.name
 ORDER BY unidades_movimentadas DESC
 LIMIT 5;

SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) AS saidas,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE -m.quantity END) AS saldo_calculado,
       p.quantity AS saldo_gravado
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name, p.quantity
 ORDER BY produto;

SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) AS saidas
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name
HAVING saidas > entradas
 ORDER BY saidas DESC;

SELECT COALESCE(u.name, 'Nao informado') AS responsavel,
       COUNT(*)                          AS movimentacoes,
       COUNT(DISTINCT m.product_id)      AS produtos_diferentes,
       MIN(m.created_at)                 AS primeira,
       MAX(m.created_at)                 AS ultima
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
 ORDER BY movimentacoes DESC;

SELECT c.name AS categoria,
       COUNT(DISTINCT p.id) AS produtos,
       SUM(m.quantity)      AS unidades_movimentadas
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
 INNER JOIN categories c ON c.id = p.category_id
 WHERE m.type = 'OUT'
 GROUP BY c.id, c.name
HAVING SUM(m.quantity) > 10
 ORDER BY unidades_movimentadas DESC
 LIMIT 5;

SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE -m.quantity END) AS saldo_calculado,
       p.quantity AS saldo_gravado
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name, p.quantity
HAVING saldo_calculado <> saldo_gravado;

-- Etapa 40
SELECT CASE
         WHEN quantity = 0              THEN 'OUT'
         WHEN quantity <= minimum_stock THEN 'LOW'
         ELSE 'OK'
       END     AS situacao,
       COUNT(*) AS produtos
  FROM products
 WHERE active = TRUE
 GROUP BY situacao
 ORDER BY produtos DESC;

SELECT p.name,
       p.sku,
       p.quantity,
       p.minimum_stock,
       (p.minimum_stock - p.quantity) AS falta
  FROM products p
 WHERE p.active = TRUE
   AND p.quantity > 0
   AND p.quantity <= p.minimum_stock
 ORDER BY falta DESC;

SELECT name, sku, minimum_stock FROM products WHERE active = TRUE AND quantity = 0;

SELECT p.name,
       p.quantity,
       ROUND(p.quantity * p.cost_price, 2) AS valor
  FROM products p
 WHERE p.active = TRUE
 ORDER BY valor DESC
 LIMIT 5;

-- Etapa 41
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       COUNT(*) AS movs,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;

SELECT COUNT(*) AS encontradas
  FROM stock_movements
 WHERE created_at >= '2026-09-15'
   AND created_at <= '2026-09-15';

SELECT COUNT(*) AS movs,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas
  FROM stock_movements
 WHERE created_at >= '2026-05-01 00:00:00'
   AND created_at <  DATE_ADD('2026-06-30', INTERVAL 1 DAY);




-- Etapa 45
-- 1. no SELECT: devolve UM valor por linha
SELECT name, (SELECT COUNT(*) FROM products) AS total_geral FROM products;

-- 2. no FROM: vira uma tabela temporaria (chamada "derivada")
SELECT * FROM (SELECT name, quantity * cost_price AS valor FROM products) AS base;

-- 3. no WHERE: compara com o resultado de outra consulta
SELECT name FROM products WHERE category_id IN (SELECT id FROM categories WHERE name = 'Bebidas');

SELECT p.name,
       (p.quantity * p.cost_price) AS valor,
       (SELECT SUM(p2.quantity * p2.cost_price) FROM products p2 WHERE p2.active = TRUE) AS total_geral
  FROM products p
 WHERE p.active = TRUE
 ORDER BY valor DESC
 LIMIT 5;

SELECT name, (SELECT id FROM categories) FROM products;

-- CORRELACIONADA: repare no p.category_id vindo de fora
SELECT p.name,
       (SELECT COUNT(*) FROM products p2 WHERE p2.category_id = p.category_id) AS irmaos
  FROM products p;

SELECT name,
       (quantity * cost_price) AS valor,
       ROUND(100 * valor / 3409, 2) AS percentual   --  nao funciona
  FROM products;

SELECT base.name,
       base.valor,
       ROUND(100 * base.valor / base.total, 2) AS percentual
  FROM (
         SELECT p.name,
                (p.quantity * p.cost_price) AS valor,
                (SELECT SUM(p2.quantity * p2.cost_price) FROM products p2 WHERE p2.active = TRUE) AS total
           FROM products p
          WHERE p.active = TRUE
       ) AS base
 ORDER BY base.valor DESC
 LIMIT 5;
