-- ========================================================
-- MIGRAÇÃO DE SEGURANÇA — rode se o banco já existia
-- ========================================================
-- Adiciona: expiração do token, bloqueio de login após várias
-- falhas e código de acesso dos pedidos. Se aparecer erro
-- "Duplicate column name", a coluna já existe: pode ignorar.
-- ========================================================

USE petisqueira_chicao;

ALTER TABLE usuarios ADD COLUMN token_expira_em DATETIME NULL;
ALTER TABLE usuarios ADD COLUMN tentativas_login INT NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN bloqueado_ate DATETIME NULL;

ALTER TABLE pedidos ADD COLUMN codigo_acesso VARCHAR(64) NULL;
