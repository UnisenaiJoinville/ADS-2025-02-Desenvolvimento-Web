-- ============================================================
-- Migracao 003 - quem registrou cada movimentacao (Aula 38)
-- ------------------------------------------------------------
-- POR QUE ESTA MIGRACAO EXISTE
-- Desde a Aula 27 o sistema sabe QUEM esta usando a API
-- (request.user). Mas essa informacao se perdia: a tabela
-- stock_movements nao tinha onde guarda-la.
--
-- Sem esta coluna, o relatorio "movimentacoes por usuario"
-- simplesmente nao pode existir - nao da para relatar um dado
-- que nunca foi gravado.
--
-- O QUE ELA FAZ
--   1. acrescenta stock_movements.user_id
--   2. liga essa coluna a tabela users (chave estrangeira)
--   3. cria o indice que o JOIN vai usar
--   4. atribui as movimentacoes recentes a um usuario
--
-- As movimentacoes antigas ficam com user_id NULL de proposito:
-- elas foram registradas ANTES de existir login, e nao da para
-- inventar um responsavel. Esse NULL e o que torna a Aula 38
-- interessante - veja o que acontece com INNER JOIN e LEFT JOIN.
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/003-movimentacoes-por-usuario.sql
--
-- PARA DESFAZER: database/migrations/003-rollback.sql
-- ============================================================


-- ------------------------------------------------------------
-- 1. A coluna
-- ------------------------------------------------------------
-- NULL e permitido: o historico anterior nao tem dono.
-- Se fosse NOT NULL, o ALTER TABLE falharia nas linhas antigas.
ALTER TABLE stock_movements
  ADD COLUMN user_id INT NULL AFTER product_id;


-- ------------------------------------------------------------
-- 2. A chave estrangeira
-- ------------------------------------------------------------
-- ON DELETE SET NULL: se um usuario for excluido, a movimentacao
-- CONTINUA existindo - ela e um fato do estoque. Perde-se apenas
-- o responsavel.
--
-- Compare com a FK de product_id, que usa ON DELETE CASCADE:
-- movimentacao de um produto que nao existe mais nao faz sentido.
ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_user
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 3. O indice
-- ------------------------------------------------------------
-- Toda coluna usada em JOIN ou em WHERE merece um indice.
-- Sem ele, filtrar por usuario varre a tabela inteira.
CREATE INDEX idx_movements_user ON stock_movements (user_id);


-- ------------------------------------------------------------
-- 4. Atribuindo responsavel as movimentacoes recentes
-- ------------------------------------------------------------
-- Dividimos entre os dois usuarios para o relatorio ter o que
-- comparar. O criterio (dia par / dia impar) e arbitrario: serve
-- so para gerar dados de teste variados.
UPDATE stock_movements m
 INNER JOIN products p ON p.id = m.product_id
   SET m.user_id = (SELECT id FROM users WHERE email = 'professor@estoquefacil.com')
 WHERE p.sku IN ('DIV-001', 'LIM-002', 'BEB-003', 'PAP-003')
   AND DAY(m.created_at) % 2 = 0;

UPDATE stock_movements m
 INNER JOIN products p ON p.id = m.product_id
   SET m.user_id = (SELECT id FROM users WHERE email = 'ana@estoquefacil.com')
 WHERE p.sku IN ('DIV-001', 'LIM-002', 'BEB-003', 'PAP-003')
   AND DAY(m.created_at) % 2 = 1;


-- ------------------------------------------------------------
-- 5. Conferencia
-- ------------------------------------------------------------
SELECT COALESCE(u.name, '(sem responsavel)') AS responsavel,
       COUNT(*)                              AS movimentacoes
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
 ORDER BY movimentacoes DESC;
