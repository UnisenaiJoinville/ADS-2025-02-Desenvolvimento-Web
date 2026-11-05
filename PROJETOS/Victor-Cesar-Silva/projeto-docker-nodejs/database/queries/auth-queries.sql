-- ============================================================
-- Consultas prontas para a autenticacao (Etapas 27, 29 e 32)
-- Uso: docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < arquivo.sql
-- ou copie uma consulta e rode com -e "...".
-- ============================================================

-- Quem esta cadastrado (nunca selecione password_hash por inteiro)
SELECT id, name, email, active, created_at FROM users;

-- O hash esta no formato bcrypt? Esperado: prefixo $2b$ e tamanho 60
SELECT email, LEFT(password_hash, 4) AS prefixo, CHAR_LENGTH(password_hash) AS tam FROM users;

-- Desativar e reativar uma conta (teste do login com conta desativada)
UPDATE users SET active = FALSE WHERE email = 'ana@teste.com';
UPDATE users SET active = TRUE  WHERE email = 'ana@teste.com';

-- Limpar os usuarios de teste, mantendo o de demonstracao
DELETE FROM users WHERE email <> 'professor@estoquefacil.com';
SELECT id, name, email FROM users;
