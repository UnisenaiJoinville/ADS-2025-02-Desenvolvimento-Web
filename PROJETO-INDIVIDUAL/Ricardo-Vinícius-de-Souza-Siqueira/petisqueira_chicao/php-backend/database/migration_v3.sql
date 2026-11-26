-- ========================================================
-- MIGRAÇÃO v3 — cartão presente com SALDO, VALIDADE e STATUS
-- ========================================================
-- Rode este arquivo INTEIRO no MySQL Workbench (raio ⚡ sem nada
-- selecionado). Pode rodar mais de uma vez: só adiciona o que falta.
-- Banco novo (schema.sql já inclui estas tabelas): não precisa rodar.
--
-- Regra de negócio:
--  * cada pedido PAGO gera 1 cartão presente com o código que já existia
--    (pedidos.codigo_cartao) e saldo = valor total do pedido;
--  * validade de 6 meses a partir do pagamento (até 23:59:59 do último dia);
--  * o saldo pode ser usado em mais de uma visita; cada uso é registrado
--    em usos_cartao;
--  * status: ativo | utilizado (saldo zerado) | expirado (passou da validade).
-- ========================================================

USE petisqueira_chicao;

SET SQL_SAFE_UPDATES = 0;

CREATE TABLE IF NOT EXISTS cartoes_emitidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  codigo VARCHAR(20) NOT NULL,                 -- o mesmo código de pedidos.codigo_cartao
  valor_inicial DECIMAL(10, 2) NOT NULL,
  saldo DECIMAL(10, 2) NOT NULL,
  validade DATETIME NOT NULL,
  status ENUM('ativo', 'utilizado', 'expirado') NOT NULL DEFAULT 'ativo',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cartao_codigo (codigo),
  UNIQUE KEY uq_cartao_pedido (pedido_id),
  INDEX idx_cartao_status_validade (status, validade),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS usos_cartao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cartao_id INT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,               -- quanto foi descontado nesta visita
  saldo_apos DECIMAL(10, 2) NOT NULL,          -- saldo que sobrou depois do uso
  observacao VARCHAR(255) NULL,
  registrado_por INT NULL,                     -- administrador que registrou
  usado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usos_cartao (cartao_id),
  FOREIGN KEY (cartao_id) REFERENCES cartoes_emitidos(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Cria o cartão dos pedidos que já estavam pagos antes desta versão
INSERT INTO cartoes_emitidos (pedido_id, codigo, valor_inicial, saldo, validade, status, criado_em)
SELECT p.id, p.codigo_cartao, p.valor_total, p.valor_total,
       TIMESTAMP(DATE_ADD(DATE(COALESCE(p.pago_em, p.criado_em)), INTERVAL 6 MONTH), '23:59:59'),
       'ativo', COALESCE(p.pago_em, p.criado_em)
FROM pedidos p
WHERE p.status = 'pago' AND p.codigo_cartao IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM cartoes_emitidos c WHERE c.pedido_id = p.id);

-- Marca como expirado o que já passou da validade
UPDATE cartoes_emitidos SET status = 'expirado' WHERE status = 'ativo' AND validade < NOW();
