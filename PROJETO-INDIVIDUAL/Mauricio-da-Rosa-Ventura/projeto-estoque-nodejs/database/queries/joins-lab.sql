-- ============================================================
-- Estoque Facil - laboratorio de SQL dos JOINs
-- Aulas 36 a 39
-- ------------------------------------------------------------
-- Continuacao do relatorios-lab.sql. Este arquivo NAO roda
-- sozinho: e um caderno - copie uma consulta por vez e cole no
-- terminal do MySQL.
--
-- Para abrir o terminal:
--   docker compose exec db mysql -uestoque -pestoque123 estoque_db
--
-- As consultas da Aula 38 em diante dependem da coluna
-- stock_movements.user_id (migracao 003).
-- ============================================================

-- ############################################################
-- AULA 36 - INNER JOIN
-- ############################################################

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

-- [36.8] Condicoes das duas tabelas juntas
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

-- ############################################################
-- AULA 37 - LEFT JOIN
-- ############################################################

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

-- [37.3] O que entra quando nao ha par
SELECT p.name AS produto, c.name AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.id IS NULL;

-- [37.4] COALESCE: um nome apresentavel para o nada
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

-- [37.6] A pergunta "quem nao tem par?"
SELECT c.name AS categoria, p.name AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 WHERE p.id IS NULL;

-- [37.7] O relatorio de produtos parados
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

-- [37.9] A condicao no WHERE
SELECT COUNT(*) AS com_a_condicao_no_where
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.name <> 'Bebidas';

-- [37.10] A condicao no ON
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

-- [37.14] FULL OUTER JOIN nao existe no MySQL
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

-- ############################################################
-- AULA 38 - VARIOS JOINS
-- ############################################################

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

-- [38.4] A versao correta
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

-- ############################################################
-- AULA 39 - JOIN COM GROUP BY E HAVING
-- ############################################################

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

-- [39.6] Entradas e saidas por produto
SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) AS saidas,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE -m.quantity END) AS saldo_calculado,
       p.quantity AS saldo_gravado
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name, p.quantity
 ORDER BY produto;

-- [39.7] HAVING comparando duas agregacoes
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

