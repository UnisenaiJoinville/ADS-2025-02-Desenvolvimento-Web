-- ========================================================
-- SCHEMA DO BANCO DE DADOS - PETISQUEIRA CHICÃO (versão PHP)
-- ========================================================
-- Rode este arquivo inteiro no MySQL Workbench (ou linha de
-- comando) pra criar o banco e todas as tabelas do zero.
--
-- Se você já tinha criado o banco antes (pela versão em Node.js),
-- não rode este arquivo — use o migration_existente.sql e o migration_seguranca.sql, que só
-- adiciona o que falta, sem apagar nada.
-- ========================================================

CREATE DATABASE IF NOT EXISTS petisqueira_chicao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE petisqueira_chicao;

-- ---------------------------------
-- Tabela de usuários (login/cadastro)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  senha_hash VARCHAR(255) NOT NULL, -- nunca guardamos a senha em texto puro, só o "hash"
  is_admin BOOLEAN DEFAULT FALSE,   -- TRUE = tem acesso ao painel de administração
  token VARCHAR(64) NULL,           -- token da sessão atual (gerado a cada login)
  token_expira_em DATETIME NULL,    -- quando o token deixa de valer (7 dias após o login)
  tentativas_login INT NOT NULL DEFAULT 0, -- falhas seguidas de login (proteção contra força bruta)
  bloqueado_ate DATETIME NULL,      -- login bloqueado temporariamente até esta data/hora
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------
-- Tabela de reservas de mesa
-- ---------------------------------
CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  quantidade_pessoas INT NOT NULL,
  data_reserva DATETIME NULL,
  status ENUM('pendente', 'confirmada', 'cancelada') DEFAULT 'pendente',
  confirmacao_enviada_em TIMESTAMP NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------------------------------
-- Tabela de mensagens de contato (formulário "Fale Conosco")
-- ---------------------------------
CREATE TABLE IF NOT EXISTS mensagens_contato (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------
-- Tabela de produtos (cartões presente da loja)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  imagem VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE
);

-- ---------------------------------
-- Tabela de pedidos (compras feitas na loja)
-- ---------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_total DECIMAL(10, 2) NOT NULL,
  status ENUM('pendente', 'pago', 'cancelado') DEFAULT 'pendente',
  codigo_acesso VARCHAR(64) NULL,   -- código secreto do pedido (permite pagar/consultar compra sem login)
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);
