-- ============================================================
-- Rollback da migracao 002 (Aula 33)
-- ------------------------------------------------------------
-- Desfaz exatamente o que o 002-dados-relatorios.sql criou,
-- sem tocar em nenhum dado das aulas anteriores.
--
-- COMO RODAR:
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/002-rollback.sql
--
-- A ORDEM IMPORTA: apagamos primeiro quem APONTA para alguem.
--   movimentacoes -> produtos -> categorias
-- Tentar apagar um produto que ainda tem movimentacoes daria erro
-- de chave estrangeira... na verdade nao, porque a FK de
-- stock_movements foi criada com ON DELETE CASCADE: o MySQL
-- apagaria as movimentacoes junto. Fazemos na mao mesmo assim,
-- para a intencao ficar explicita.
-- ============================================================

DELETE m
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 WHERE p.sku IN ('DIV-001', 'INF-003', 'LIM-002', 'BEB-003', 'PAP-003');

DELETE FROM products
 WHERE sku IN ('DIV-001', 'INF-003', 'LIM-002', 'BEB-003', 'PAP-003');

-- So apaga a categoria se ela realmente estiver vazia.
DELETE FROM categories
 WHERE name = 'Ferramentas'
   AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = categories.id);

DELETE FROM users WHERE email = 'ana@estoquefacil.com';

SELECT 'produtos'      AS tabela, COUNT(*) AS total FROM products
UNION ALL
SELECT 'movimentacoes',           COUNT(*) FROM stock_movements
UNION ALL
SELECT 'categorias',              COUNT(*) FROM categories
UNION ALL
SELECT 'usuarios',                COUNT(*) FROM users;
