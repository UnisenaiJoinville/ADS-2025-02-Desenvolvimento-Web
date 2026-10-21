-- ========================================================
-- MIGRAÇÃO — para quem já tinha o banco criado antes
-- ========================================================
-- Se seu banco "petisqueira_chicao" já existe (de uma tentativa
-- anterior, com Node.js ou com uma versão antiga do schema), rode
-- este arquivo pra atualizar a tabela "usuarios" sem perder nada.
--
-- Se está criando o banco do ZERO agora, não precisa rodar isso —
-- use direto o schema.sql, que já vem completo.
-- ========================================================

USE petisqueira_chicao;

-- Adiciona a coluna is_admin, se ainda não existir
-- (ignora o erro se ela já tiver sido criada antes)
ALTER TABLE usuarios
  ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Adiciona a coluna token, usada para login nesta versão em PHP
ALTER TABLE usuarios
  ADD COLUMN token VARCHAR(64) NULL;

-- ========================================================
-- Depois de rodar o ALTER TABLE acima, transforme a SUA conta
-- em administrador. Troque o e-mail abaixo pelo e-mail que você
-- usou no cadastro do site:
-- ========================================================

UPDATE usuarios
SET is_admin = TRUE
WHERE email = 'coloque_aqui_o_seu_email@exemplo.com';
