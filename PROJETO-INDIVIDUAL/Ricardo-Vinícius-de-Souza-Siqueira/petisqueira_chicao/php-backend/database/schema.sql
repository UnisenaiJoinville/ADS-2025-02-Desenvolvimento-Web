-- ========================================================
-- SCHEMA DO BANCO DE DADOS - PETISQUEIRA CHICÃO (versão 2)
-- ========================================================
-- Rode este arquivo inteiro (e depois o seed.sql) para criar o
-- banco do zero. Se o banco JÁ existe, NÃO rode este arquivo:
-- rode apenas o migration_v2.sql, que atualiza sem apagar dados.
--
-- Novidades da versão 2:
--  * itens_pedido  -> pedido com VÁRIOS itens (mestre-detalhe)
--  * reset_senha   -> recuperação de senha por e-mail
--  * limites_requisicao -> proteção contra spam/força bruta
--  * token de sessão guardado só como HASH (SHA-256)
--  * pedidos guardam comprador, forma de pagamento e código do cartão
--  * cartoes_emitidos + usos_cartao -> saldo, validade e status do cartão presente
-- ========================================================

CREATE DATABASE IF NOT EXISTS petisqueira_chicao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE petisqueira_chicao;

-- ---------------------------------
-- Usuários (clientes e administradores)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  senha_hash VARCHAR(255) NOT NULL,   -- bcrypt; nunca a senha em texto puro
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  token_hash CHAR(64) NULL,           -- SHA-256 do token de sessão (o token em si só existe no navegador)
  token_expira_em DATETIME NULL,
  tentativas_login INT NOT NULL DEFAULT 0,
  bloqueado_ate DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuarios_token (token_hash)
);

-- ---------------------------------
-- Recuperação de senha (token de uso único, só o hash fica no banco)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS reset_senha (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,        -- vale por 1 hora
  usado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reset_token (token_hash),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------------------------------
-- Reservas de mesa (nome/telefone/e-mail ficam na própria reserva
-- de propósito: visitantes sem conta também podem reservar)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  quantidade_pessoas INT NOT NULL,
  data_reserva DATETIME NULL,
  status ENUM('pendente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendente',
  confirmacao_enviada_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reservas_data_status (data_reserva, status),
  INDEX idx_reservas_usuario (usuario_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------------------------------
-- Mensagens do "Fale Conosco"
-- ---------------------------------
CREATE TABLE IF NOT EXISTS mensagens_contato (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------
-- Produtos (cartões presente)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  imagem VARCHAR(255),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------
-- Pedidos (MESTRE) — um pedido tem vários itens (tabela itens_pedido)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,                       -- NULL = compra sem login
  nome_comprador VARCHAR(150) NOT NULL,
  email_comprador VARCHAR(150) NOT NULL,     -- para onde vai o código do cartão
  forma_pagamento ENUM('pix', 'cartao') NULL, -- preenchida quando o pagamento é confirmado
  valor_total DECIMAL(10, 2) NOT NULL,
  status ENUM('pendente', 'pago', 'cancelado') NOT NULL DEFAULT 'pendente',
  codigo_acesso VARCHAR(64) NULL,            -- segredo para consultar/pagar o pedido sem login
  -- codigo_cartao repete cartoes_emitidos.codigo DE PROPÓSITO: é gerado e gravado no
  -- pedido na mesma transação do pagamento (a chave UNIQUE garante que não existem dois
  -- códigos iguais) e permite mostrar o código na lista de pedidos / "Minha conta" /
  -- e-mail sem um JOIN extra. A fonte oficial para saldo e uso é cartoes_emitidos.
  codigo_cartao VARCHAR(20) NULL,            -- código de resgate do cartão (gerado ao pagar)
  pago_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pedidos_codigo_cartao (codigo_cartao),
  INDEX idx_pedidos_usuario (usuario_id),
  INDEX idx_pedidos_status_data (status, criado_em),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------------------------------
-- Itens do pedido (DETALHE). valor_unitario é o preço NO MOMENTO da
-- compra: se o preço do produto mudar depois, o histórico não muda.
-- subtotal (= quantidade × valor_unitario) também é gravado DE PROPÓSITO, para
-- preservar o histórico do pedido e permitir somar/relatar sem recalcular.
-- ---------------------------------
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

-- ---------------------------------
-- Cartões presente emitidos (versão 3). Cada pedido PAGO gera UM cartão (regra de
-- negócio: um cartão por pedido, com saldo = total do pedido; ver relatório, seção 4.4) com
-- código, saldo, validade (6 meses) e status. O saldo pode ser usado aos poucos.
-- ---------------------------------
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

-- ---------------------------------
-- Usos do cartão (histórico): cada vez que o restaurante desconta um valor.
-- ---------------------------------
CREATE TABLE IF NOT EXISTS usos_cartao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cartao_id INT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  saldo_apos DECIMAL(10, 2) NOT NULL,
  observacao VARCHAR(255) NULL,
  registrado_por INT NULL,
  usado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usos_cartao (cartao_id),
  FOREIGN KEY (cartao_id) REFERENCES cartoes_emitidos(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------------------------------
-- Controle de tentativas (limite de requisições por IP/ação)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS limites_requisicao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chave VARCHAR(190) NOT NULL,
  criado_em DATETIME NOT NULL,
  INDEX idx_limites (chave, criado_em)
);
