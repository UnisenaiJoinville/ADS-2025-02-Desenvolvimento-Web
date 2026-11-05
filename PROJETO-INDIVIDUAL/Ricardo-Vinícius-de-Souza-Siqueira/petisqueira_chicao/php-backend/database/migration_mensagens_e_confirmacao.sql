-- ========================================================
-- MIGRAÇÃO — mensagens de contato + confirmação de reserva por e-mail
-- ========================================================
-- Rode este arquivo se o seu banco "petisqueira_chicao" já existe
-- (não precisa rodar de novo o schema.sql inteiro).
-- ========================================================

USE petisqueira_chicao;

-- Tabela nova: guarda as mensagens enviadas pelo formulário "Fale Conosco"
CREATE TABLE IF NOT EXISTS mensagens_contato (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coluna nova: guarda quando o e-mail de confirmação da reserva foi
-- enviado (fica NULL até ser enviado pela primeira vez). Isso evita
-- reenviar o e-mail toda vez que o admin salvar a reserva de novo.
-- Se a coluna já existir, o comando abaixo dá erro "Duplicate column
-- name" — pode ignorar esse erro específico e seguir em frente.
ALTER TABLE reservas
  ADD COLUMN confirmacao_enviada_em TIMESTAMP NULL;
