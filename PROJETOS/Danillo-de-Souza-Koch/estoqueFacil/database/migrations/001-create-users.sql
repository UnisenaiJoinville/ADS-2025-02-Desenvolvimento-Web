-- ============================================================
-- Migracao 001 - tabela de usuarios (Etapa 24)
-- ------------------------------------------------------------
-- QUANDO USAR ESTE ARQUIVO
-- O arquivo database/init.sql so roda na PRIMEIRA vez que o
-- volume do MySQL e criado. Se voce ja subiu o projeto nas etapas
-- anteriores, o banco existe e o init.sql NAO vai rodar de novo.
-- Este arquivo cria a tabela sem apagar nada do que voce ja tem.
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/001-create-users.sql
--
-- Este script pode ser executado mais de uma vez sem causar erro.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- INSERT IGNORE: se o e-mail ja existir, o MySQL apenas pula a linha
-- em vez de parar com erro de chave duplicada.
INSERT IGNORE INTO users (name, email, password_hash) VALUES
  ('Professor Demo',
   'professor@estoquefacil.com',
   '$2b$10$xkAjZ..MHKdp.7cnXFMvVON.XZmd/foxiswJJS61thFcP/WLquT6m');

SELECT id, name, email, active, created_at FROM users;