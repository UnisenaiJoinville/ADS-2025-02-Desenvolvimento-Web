-- ========================================================
-- MIGRAÇÃO v2 — atualiza um banco JÁ EXISTENTE (sem apagar dados)
-- ========================================================
-- Rode este arquivo INTEIRO no MySQL Workbench (raio ⚡ sem nada
-- selecionado). Pode rodar mais de uma vez: só adiciona o que falta.
--
-- O que muda:
--  * usuarios.token (texto puro) -> token_hash (SHA-256). Todo mundo
--    precisa fazer login de novo (isso é esperado).
--  * novas tabelas: reset_senha, itens_pedido, limites_requisicao
--  * pedidos: comprador, forma de pagamento, código do cartão, pago_em
--  * pedidos antigos (1 produto só) são copiados para itens_pedido
-- ========================================================

USE petisqueira_chicao;

-- O Workbench bloqueia UPDATE sem chave (erro 1175); desligamos só nesta sessão.
SET SQL_SAFE_UPDATES = 0;

DROP PROCEDURE IF EXISTS pc_add_coluna;
DROP PROCEDURE IF EXISTS pc_add_indice;
DROP PROCEDURE IF EXISTS pc_migrar;

DELIMITER $$

CREATE PROCEDURE pc_add_coluna(IN tabela VARCHAR(64), IN coluna VARCHAR(64), IN definicao VARCHAR(255))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tabela AND COLUMN_NAME = coluna) THEN
    SET @sql = CONCAT('ALTER TABLE `', tabela, '` ADD COLUMN `', coluna, '` ', definicao);
    PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
  END IF;
END$$

CREATE PROCEDURE pc_add_indice(IN tabela VARCHAR(64), IN indice VARCHAR(64), IN colunas VARCHAR(255), IN unico INT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tabela AND INDEX_NAME = indice) THEN
    SET @sql = CONCAT('ALTER TABLE `', tabela, '` ADD ', IF(unico = 1, 'UNIQUE ', ''), 'INDEX `', indice, '` (', colunas, ')');
    PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
  END IF;
END$$

CREATE PROCEDURE pc_migrar()
BEGIN
  -- ---------- usuarios ----------
  CALL pc_add_coluna('usuarios', 'token_hash', 'CHAR(64) NULL');
  CALL pc_add_coluna('usuarios', 'token_expira_em', 'DATETIME NULL');
  CALL pc_add_coluna('usuarios', 'tentativas_login', 'INT NOT NULL DEFAULT 0');
  CALL pc_add_coluna('usuarios', 'bloqueado_ate', 'DATETIME NULL');
  CALL pc_add_indice('usuarios', 'idx_usuarios_token', '`token_hash`', 0);

  -- apaga os tokens antigos em texto puro (sessões antigas deixam de valer)
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'token') THEN
    ALTER TABLE usuarios DROP COLUMN `token`;
  END IF;

  -- ---------- reservas ----------
  CALL pc_add_coluna('reservas', 'confirmacao_enviada_em', 'DATETIME NULL');
  CALL pc_add_indice('reservas', 'idx_reservas_data_status', '`data_reserva`, `status`', 0);
  CALL pc_add_indice('reservas', 'idx_reservas_usuario', '`usuario_id`', 0);

  -- ---------- pedidos ----------
  CALL pc_add_coluna('pedidos', 'nome_comprador', 'VARCHAR(150) NOT NULL DEFAULT ''''');
  CALL pc_add_coluna('pedidos', 'email_comprador', 'VARCHAR(150) NOT NULL DEFAULT ''''');
  CALL pc_add_coluna('pedidos', 'forma_pagamento', 'ENUM(''pix'',''cartao'') NULL');
  CALL pc_add_coluna('pedidos', 'codigo_acesso', 'VARCHAR(64) NULL');
  CALL pc_add_coluna('pedidos', 'codigo_cartao', 'VARCHAR(20) NULL');
  CALL pc_add_coluna('pedidos', 'pago_em', 'DATETIME NULL');
  CALL pc_add_indice('pedidos', 'uq_pedidos_codigo_cartao', '`codigo_cartao`', 1);
  CALL pc_add_indice('pedidos', 'idx_pedidos_usuario', '`usuario_id`', 0);
  CALL pc_add_indice('pedidos', 'idx_pedidos_status_data', '`status`, `criado_em`', 0);
END$$

DELIMITER ;

-- ---------- novas tabelas ----------
CREATE TABLE IF NOT EXISTS reset_senha (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,
  usado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reset_token (token_hash),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  INDEX idx_itens_pedido (pedido_id),
  INDEX idx_itens_produto (produto_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE IF NOT EXISTS limites_requisicao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chave VARCHAR(190) NOT NULL,
  criado_em DATETIME NOT NULL,
  INDEX idx_limites (chave, criado_em)
);

CALL pc_migrar();

-- ---------- migra os pedidos antigos (1 produto por pedido) ----------
-- Só roda se a coluna antiga produto_id ainda existir em pedidos.
DROP PROCEDURE IF EXISTS pc_migrar_pedidos;
DELIMITER $$
CREATE PROCEDURE pc_migrar_pedidos()
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'produto_id') THEN

    INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, valor_unitario, subtotal)
    SELECT p.id, p.produto_id, p.quantidade, ROUND(p.valor_total / p.quantidade, 2), p.valor_total
    FROM pedidos p
    WHERE p.produto_id IS NOT NULL AND p.quantidade > 0
      AND NOT EXISTS (SELECT 1 FROM itens_pedido i WHERE i.pedido_id = p.id);

    -- as colunas antigas ficam opcionais (não são mais usadas)
    ALTER TABLE pedidos MODIFY produto_id INT NULL;
    ALTER TABLE pedidos MODIFY quantidade INT NULL DEFAULT NULL;
  END IF;

  -- completa os dados do comprador dos pedidos antigos
  UPDATE pedidos p JOIN usuarios u ON u.id = p.usuario_id
     SET p.nome_comprador = u.nome, p.email_comprador = u.email
   WHERE p.nome_comprador = '';
END$$
DELIMITER ;

CALL pc_migrar_pedidos();

DROP PROCEDURE IF EXISTS pc_migrar_pedidos;
DROP PROCEDURE IF EXISTS pc_migrar;
DROP PROCEDURE IF EXISTS pc_add_indice;
DROP PROCEDURE IF EXISTS pc_add_coluna;
