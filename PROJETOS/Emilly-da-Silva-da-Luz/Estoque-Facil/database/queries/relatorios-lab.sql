-- ============================================================
-- Estoque Facil - laboratorio de SQL dos relatorios
-- Aulas 33 a 35
-- ------------------------------------------------------------
-- Este arquivo NAO roda sozinho. E um caderno: voce copia uma
-- consulta por vez e cola no terminal do MySQL.
--
-- Para abrir o terminal:
--   docker compose exec db mysql -uestoque -pestoque123 estoque_db
--
-- Dica: termine com \G em vez de ; para ver o resultado em
-- formato de lista, uma coluna por linha. Ajuda quando a
-- consulta tem muitas colunas.
-- ============================================================


-- ############################################################
-- AULA 33 - CONHECENDO O BANCO
-- ############################################################

-- [33.1] Quais tabelas existem
SHOW TABLES;

-- [33.2] Como e a tabela products
DESCRIBE products;

-- [33.3] O SQL que criou a tabela, com chaves e indices
SHOW CREATE TABLE products\G

-- [33.4] Quem aponta para quem (o mapa das chaves estrangeiras)
SELECT TABLE_NAME        AS tabela,
       COLUMN_NAME       AS coluna,
       REFERENCED_TABLE_NAME  AS aponta_para,
       REFERENCED_COLUMN_NAME AS coluna_destino
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = 'estoque_db'
   AND REFERENCED_TABLE_NAME IS NOT NULL
 ORDER BY tabela, coluna;

-- [33.5] Quantas linhas tem cada tabela
SELECT 'categories' AS tabela, COUNT(*) AS linhas FROM categories
UNION ALL SELECT 'products',       COUNT(*) FROM products
UNION ALL SELECT 'stock_movements',COUNT(*) FROM stock_movements
UNION ALL SELECT 'users',          COUNT(*) FROM users;

-- [33.6] As excecoes que os dados de teste criaram
SELECT 'produtos sem categoria'    AS situacao, COUNT(*) AS total
  FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'categorias sem produto', COUNT(*)
  FROM categories c
 WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
UNION ALL
SELECT 'produtos sem movimentacao', COUNT(*)
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);


-- ############################################################
-- AULA 34 - SELECT, WHERE E ORDER BY
-- ############################################################

-- [34.1] Tudo de todo mundo (nunca use isto num sistema real)
SELECT * FROM products;

-- [34.2] So as colunas que interessam
SELECT name, sku, quantity FROM products;

-- [34.3] Apelidos (AS) dao nome de saida as colunas
SELECT name     AS produto,
       sku      AS codigo,
       quantity AS saldo
  FROM products;

-- [34.4] Expressao calculada: a coluna que nao existe na tabela
SELECT name,
       quantity,
       cost_price,
       quantity * cost_price AS valor_em_estoque
  FROM products;

-- [34.5] WHERE: so os produtos ativos
SELECT name, quantity FROM products WHERE active = TRUE;

-- [34.6] Varias condicoes com AND
SELECT name, quantity, minimum_stock
  FROM products
 WHERE active = TRUE
   AND quantity <= minimum_stock;

-- [34.7] LIKE: busca por pedaco de texto ( % = qualquer coisa )
SELECT name, sku FROM products WHERE name LIKE '%cafe%';

-- [34.8] LIKE em duas colunas, com OR entre elas
SELECT name, sku
  FROM products
 WHERE name LIKE '%pap%' OR sku LIKE '%PAP%';

-- [34.9] IN: pertence a esta lista?
SELECT name, sku FROM products WHERE sku IN ('BEB-001', 'BEB-003', 'INF-003');

-- [34.10] BETWEEN: dentro deste intervalo (inclusive nas duas pontas)
SELECT name, sale_price
  FROM products
 WHERE sale_price BETWEEN 5.00 AND 50.00
 ORDER BY sale_price;

-- [34.11] IS NULL: o produto sem categoria
SELECT name, sku, category_id FROM products WHERE category_id IS NULL;

-- [34.12] IS NOT NULL: o contrario
SELECT COUNT(*) AS com_categoria FROM products WHERE category_id IS NOT NULL;

-- [34.13] A armadilha: isto NUNCA devolve nada
SELECT name FROM products WHERE category_id = NULL;

-- [34.14] ORDER BY: do maior saldo para o menor
SELECT name, quantity FROM products ORDER BY quantity DESC;

-- [34.15] ORDER BY com desempate
SELECT name, quantity FROM products ORDER BY quantity DESC, name ASC;

-- [34.16] ORDER BY usando o apelido de uma expressao
SELECT name,
       quantity * cost_price AS valor_em_estoque
  FROM products
 WHERE active = TRUE
 ORDER BY valor_em_estoque DESC;

-- [34.17] LIMIT: so os 5 primeiros
SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5;

-- [34.18] LIMIT + OFFSET: a "pagina 2", pulando os 5 primeiros
SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5 OFFSET 5;

-- [34.19] DISTINCT: valores sem repeticao
SELECT DISTINCT type FROM stock_movements;

-- [34.20] DISTINCT em duas colunas = combinacoes unicas
SELECT DISTINCT category_id, active FROM products ORDER BY category_id;

-- [34.21] CASE: traduzir uma regra de negocio em coluna
SELECT name,
       quantity,
       minimum_stock,
       CASE
         WHEN quantity = 0                THEN 'ZERADO'
         WHEN quantity <= minimum_stock   THEN 'ABAIXO DO MINIMO'
         ELSE 'OK'
       END AS situacao
  FROM products
 WHERE active = TRUE
 ORDER BY quantity;


-- ############################################################
-- AULA 35 - AGREGACAO, GROUP BY E HAVING
-- ############################################################

-- [35.1] COUNT(*): quantas linhas
SELECT COUNT(*) AS total_de_produtos FROM products;

-- [35.2] COUNT(coluna) ignora NULL - compare os tres numeros
SELECT COUNT(*)           AS linhas,
       COUNT(category_id) AS com_categoria,
       COUNT(*) - COUNT(category_id) AS sem_categoria
  FROM products;

-- [35.3] COUNT(DISTINCT ...): quantos valores diferentes
SELECT COUNT(DISTINCT category_id) AS categorias_em_uso FROM products;

-- [35.4] SUM: somar
SELECT SUM(quantity) AS unidades_em_estoque FROM products WHERE active = TRUE;

-- [35.5] SUM de uma expressao: o dinheiro parado no estoque
SELECT SUM(quantity * cost_price) AS valor_de_custo,
       SUM(quantity * sale_price) AS valor_de_venda
  FROM products
 WHERE active = TRUE;

-- [35.6] AVG, MIN e MAX
SELECT AVG(sale_price) AS preco_medio,
       MIN(sale_price) AS mais_barato,
       MAX(sale_price) AS mais_caro
  FROM products
 WHERE active = TRUE;

-- [35.7] ROUND: AVG devolve casas decimais demais
SELECT ROUND(AVG(sale_price), 2) AS preco_medio FROM products WHERE active = TRUE;

-- [35.8] Tudo junto: o cartao de resumo do estoque
SELECT COUNT(*)                            AS produtos,
       SUM(quantity)                       AS unidades,
       ROUND(SUM(quantity * cost_price), 2) AS valor_custo,
       ROUND(AVG(cost_price), 2)           AS custo_medio,
       MIN(sale_price)                     AS menor_preco,
       MAX(sale_price)                     AS maior_preco
  FROM products
 WHERE active = TRUE;

-- [35.9] GROUP BY: de uma linha so para uma linha POR GRUPO
SELECT category_id,
       COUNT(*)      AS produtos,
       SUM(quantity) AS unidades
  FROM products
 WHERE active = TRUE
 GROUP BY category_id;

-- [35.10] GROUP BY com ORDER BY no resultado agregado
SELECT category_id,
       COUNT(*)                            AS produtos,
       ROUND(SUM(quantity * cost_price), 2) AS valor_custo
  FROM products
 WHERE active = TRUE
 GROUP BY category_id
 ORDER BY valor_custo DESC;

-- [35.11] GROUP BY no tipo da movimentacao
SELECT type,
       COUNT(*)      AS lancamentos,
       SUM(quantity) AS unidades
  FROM stock_movements
 GROUP BY type;

-- [35.12] HAVING: filtrar DEPOIS de agrupar
SELECT category_id,
       COUNT(*) AS produtos
  FROM products
 WHERE active = TRUE
 GROUP BY category_id
HAVING COUNT(*) >= 3;

-- [35.13] A diferenca entre WHERE e HAVING, lado a lado
--   WHERE  joga fora LINHAS antes de agrupar
--   HAVING joga fora GRUPOS depois de agrupar
SELECT category_id,
       COUNT(*)      AS produtos,
       SUM(quantity) AS unidades
  FROM products
 WHERE active = TRUE          -- linha por linha
 GROUP BY category_id
HAVING SUM(quantity) > 20     -- grupo por grupo
 ORDER BY unidades DESC;

-- [35.14] Isto da ERRO: funcao de agregacao nao cabe no WHERE
SELECT category_id FROM products WHERE SUM(quantity) > 20 GROUP BY category_id;

-- [35.15] GROUP BY por mes, usando DATE_FORMAT
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       COUNT(*)      AS movimentacoes,
       SUM(quantity) AS unidades
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;

-- [35.16] Entradas e saidas na MESMA linha, com SUM + CASE
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE -quantity END) AS saldo
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;
