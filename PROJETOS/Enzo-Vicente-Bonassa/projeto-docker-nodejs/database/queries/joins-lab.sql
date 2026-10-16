-- ============================================================
-- Estoque Facil - caderno de JOINs e relatorios avancados
-- Consultas das aulas 36 a 41 e 45 da apostila recebida.
-- As aulas 42 a 44 trabalham a tela e o CSV, sem novo laboratorio SQL.
--
-- Rode depois de preparar o banco e aplicar a migracao 003 (Aula 38).
-- Execute as consultas individualmente para comparar seus resultados.
-- Os exemplos que provocam erro de proposito estao comentados.
-- ============================================================


-- ============================================================
-- Aula 36
-- ============================================================

-- [36.1] O que temos
SELECT name, sku, category_id FROM products ORDER BY name LIMIT 5;

-- [36.2] O que falta
SELECT id, name FROM categories ORDER BY id;

-- [36.3] A forma longa
SELECT products.name   AS produto,
       categories.name AS categoria
  FROM products
 INNER JOIN categories ON categories.id = products.category_id
 ORDER BY produto;

-- [36.4] A forma que vamos usar: com apelidos
SELECT p.name AS produto,
       p.sku,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 ORDER BY produto;

-- [36.5] Conte as linhas
SELECT COUNT(*) AS linhas_no_inner_join
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id;

-- [36.5] Conte as linhas
SELECT COUNT(*) FROM products;

-- [36.6] O desaparecido
SELECT name, sku, category_id FROM products WHERE category_id IS NULL;

-- [36.7] Filtrando pela outra tabela
SELECT p.name AS produto,
       p.quantity,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 WHERE c.name = 'Bebidas'
 ORDER BY p.name;

-- [36.8] Condições das duas tabelas juntas
SELECT p.name AS produto,
       p.quantity,
       p.minimum_stock AS minimo,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 WHERE p.quantity <= p.minimum_stock
   AND c.name IN ('Bebidas', 'Papelaria')
 ORDER BY c.name, p.name;

-- [36.9]
SELECT m.created_at AS data,
       p.name       AS produto,
       m.type       AS tipo,
       m.quantity   AS qtd
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 ORDER BY m.created_at DESC
 LIMIT 5;

-- [36.10] JOIN sem ON
SELECT COUNT(*) AS linhas_sem_o_on FROM products p, categories c;

-- [36.11] Com o ON
SELECT COUNT(*) AS linhas_com_o_on
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id;

-- ============================================================
-- Aula 37
-- ============================================================

-- [37.1] e [37.2]
SELECT p.name AS produto,
       p.sku,
       c.name AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY p.name;

-- [37.1] e [37.2]
SELECT COUNT(*) AS linhas_no_left_join
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id;

-- [37.3] O que entra quando não há par
SELECT p.name AS produto, c.name AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.id IS NULL;

-- [37.4] COALESCE: um nome apresentável para o nada
SELECT p.name AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY categoria, produto;

-- [37.5] Partindo das categorias
SELECT c.name  AS categoria,
       p.name  AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 ORDER BY c.name, p.name;

-- [37.6] A pergunta "quem não tem par?"
SELECT c.name AS categoria, p.name AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 WHERE p.id IS NULL;

-- [37.7] O relatório de produtos parados
SELECT p.name AS produto,
       p.sku,
       p.quantity AS saldo
  FROM products p
  LEFT JOIN stock_movements m ON m.product_id = p.id
 WHERE m.id IS NULL
 ORDER BY p.name;

-- [37.8] O mesmo, com NOT EXISTS
SELECT p.name AS produto, p.sku
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id)
 ORDER BY p.name;

-- [37.9] A condição no WHERE
SELECT COUNT(*) AS com_a_condicao_no_where
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.name <> 'Bebidas';

-- [37.10] A condição no ON
SELECT COUNT(*) AS com_a_condicao_no_on
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id AND c.name <> 'Bebidas';

-- [37.11] A terceira forma
SELECT COUNT(*) AS aceitando_o_null
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.name <> 'Bebidas' OR c.name IS NULL;

-- [37.12] e [37.13] RIGHT JOIN existe
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

-- [37.14] FULL OUTER JOIN **não existe** no MySQL
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

-- ============================================================
-- Aula 38
-- ============================================================

-- [38.1]
SELECT m.created_at AS data,
       p.name       AS produto,
       c.name       AS categoria,
       m.type       AS tipo,
       m.quantity   AS qtd
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
 INNER JOIN categories c ON c.id = p.category_id
 ORDER BY m.created_at DESC
 LIMIT 10;

-- [38.2] e [38.3]
SELECT COUNT(*) AS com_dois_inner
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
 INNER JOIN categories c ON c.id = p.category_id;

-- [38.2] e [38.3]
SELECT COUNT(*) AS total_de_movimentacoes FROM stock_movements;

-- [38.4] A versão correta
SELECT m.created_at AS data,
       p.name       AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria,
       m.type       AS tipo,
       m.quantity   AS qtd
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY m.created_at DESC
 LIMIT 10;

-- [38.5]
SELECT m.created_at AS data,
       p.name       AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria,
       m.type       AS tipo,
       m.quantity   AS qtd,
       COALESCE(u.name, 'Nao informado') AS responsavel
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN users      u ON u.id = m.user_id
 ORDER BY m.created_at DESC
 LIMIT 15;

-- [38.6] e [38.7]
SELECT COUNT(*) AS sem_responsavel
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 WHERE u.id IS NULL;

-- [38.6] e [38.7]
SELECT COUNT(*) AS com_inner_em_users
  FROM stock_movements m
 INNER JOIN users u ON u.id = m.user_id;

-- ============================================================
-- Aula 39
-- ============================================================

-- [39.1] Produtos por categoria — agora com o nome
SELECT c.name      AS categoria,
       COUNT(p.id) AS produtos
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
 ORDER BY produtos DESC;

-- [39.2] O erro do COUNT(*), de novo
SELECT c.name      AS categoria,
       COUNT(*)    AS count_estrela,
       COUNT(p.id) AS count_da_coluna
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
 ORDER BY count_da_coluna;

-- [39.3] Somando valores por categoria
SELECT c.name AS categoria,
       COUNT(p.id)                              AS produtos,
       COALESCE(SUM(p.quantity), 0)             AS unidades,
       ROUND(COALESCE(SUM(p.quantity * p.cost_price), 0), 2) AS valor_custo
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
 GROUP BY c.id, c.name
 ORDER BY valor_custo DESC;

-- [39.4]
SELECT c.name      AS categoria,
       COUNT(p.id) AS produtos
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
HAVING COUNT(p.id) > 2
 ORDER BY produtos DESC;

-- [39.5] Produtos mais movimentados
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

-- [39.6] Entradas e saídas por produto
SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) AS saidas,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE -m.quantity END) AS saldo_calculado,
       p.quantity AS saldo_gravado
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name, p.quantity
 ORDER BY produto;

-- [39.7] HAVING comparando duas agregações
SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) AS saidas
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name
HAVING saidas > entradas
 ORDER BY saidas DESC;

-- [39.8]
SELECT COALESCE(u.name, 'Nao informado') AS responsavel,
       COUNT(*)                          AS movimentacoes,
       COUNT(DISTINCT m.product_id)      AS produtos_diferentes,
       MIN(m.created_at)                 AS primeira,
       MAX(m.created_at)                 AS ultima
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
 ORDER BY movimentacoes DESC;

-- [39.9] Tudo junto
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

-- ============================================================
-- Aula 40
-- ============================================================

-- Quantos há de cada
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

-- Abaixo do mínimo
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

-- Zerados
SELECT name, sku, minimum_stock FROM products WHERE active = TRUE AND quantity = 0;

-- Maiores valores em estoque
SELECT p.name,
       p.quantity,
       ROUND(p.quantity * p.cost_price, 2) AS valor
  FROM products p
 WHERE p.active = TRUE
 ORDER BY valor DESC
 LIMIT 5;

-- ============================================================
-- Aula 41
-- ============================================================

-- 1. O que temos para trabalhar
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       COUNT(*) AS movs,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;

-- A forma intuitiva
SELECT COUNT(*) AS encontradas
  FROM stock_movements
 WHERE created_at >= '2026-09-15'
   AND created_at <= '2026-09-15';

-- BETWEEN tem o mesmo problema
SELECT COUNT(*) AS encontradas
  FROM stock_movements
 WHERE created_at BETWEEN '2026-09-01' AND '2026-09-15';

-- Solução A — DATE() em volta da coluna
SELECT COUNT(*) AS encontradas
  FROM stock_movements
 WHERE DATE(created_at) BETWEEN '2026-09-01' AND '2026-09-15';

-- Solução B — acrescentar a hora na mão
SELECT COUNT(*) AS encontradas
  FROM stock_movements
 WHERE created_at >= '2026-09-01 00:00:00'
  AND created_at <= '2026-09-15 23:59:59';

-- Solução C — menor que o dia seguinte ✅
SELECT COUNT(*) AS encontradas
  FROM stock_movements
 WHERE created_at >= '2026-09-15'
  AND created_at < DATE_ADD('2026-09-15', INTERVAL 1 DAY);

-- Conferindo o intervalo
SELECT COUNT(*) AS movs,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas
  FROM stock_movements
 WHERE created_at >= '2026-05-01 00:00:00'
   AND created_at <  DATE_ADD('2026-06-30', INTERVAL 1 DAY);

-- ============================================================
-- Aula 45
-- ============================================================

-- 1. Os três lugares onde cabe uma subquery
-- 1. no SELECT: devolve UM valor por linha
SELECT name, (SELECT COUNT(*) FROM products) AS total_geral FROM products;

-- 2. no FROM: vira uma tabela temporária (chamada "derivada")
SELECT * FROM (SELECT name, quantity * cost_price AS valor FROM products) AS base;

-- 3. no WHERE: compara com o resultado de outra consulta
SELECT name FROM products WHERE category_id IN (SELECT id FROM categories WHERE name = 'Bebidas');

-- 2. Subquery no SELECT
SELECT p.name,
       (p.quantity * p.cost_price) AS valor,
       (SELECT SUM(p2.quantity * p2.cost_price) FROM products p2 WHERE p2.active = TRUE) AS total_geral
  FROM products p
 WHERE p.active = TRUE
 ORDER BY valor DESC
 LIMIT 5;

-- 🔍 A regra da subquery no SELECT
-- Exemplo de erro intencional da apostila: execute separadamente.
-- SELECT name, (SELECT id FROM categories) FROM products;

-- 🔍 Subquery correlacionada × independente
-- CORRELACIONADA: repare no p.category_id vindo de fora
SELECT p.name,
       (SELECT COUNT(*) FROM products p2 WHERE p2.category_id = p.category_id) AS irmaos
  FROM products p;

-- 3. Subquery no FROM: a tabela derivada
-- Exemplo de erro intencional da apostila: execute separadamente.
-- SELECT name,
--        (quantity * cost_price) AS valor,
--        ROUND(100 * valor / 3409, 2) AS percentual   -- ❌ não funciona
--   FROM products;

-- A solução: dois níveis
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
