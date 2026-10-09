-- Migration 003: record who created each stock movement.
-- Existing records remain NULL because their owner is not known.
ALTER TABLE stock_movements
  ADD COLUMN user_id INT NULL AFTER product_id;

ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_user
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE SET NULL;

CREATE INDEX idx_movements_user ON stock_movements (user_id);

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

SELECT COALESCE(u.name, '(sem responsavel)') AS responsavel,
       COUNT(*) AS movimentacoes
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
 ORDER BY movimentacoes DESC;
