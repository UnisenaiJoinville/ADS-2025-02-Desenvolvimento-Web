-- ========================================================
-- MIGRAÇÃO — "Minha conta" (para bancos criados ANTES)
-- ========================================================
-- Rode este arquivo INTEIRO no MySQL Workbench se o seu banco
-- "petisqueira_chicao" já existia e a página Minha conta mostra
-- erro. Ele confere o que falta e só adiciona isso — pode rodar
-- mais de uma vez, sem apagar nem duplicar nada.
--
-- Como rodar: abra o arquivo no Workbench, clique no raio (⚡)
-- "Execute the selected portion of the script" com nada selecionado
-- (executa tudo) e confira, na aba "Output", que não há erros.
-- ========================================================

USE petisqueira_chicao;

-- ---------- Tabelas que podem não existir ----------
CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  imagem VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_total DECIMAL(10, 2) NOT NULL,
  status ENUM('pendente', 'pago', 'cancelado') DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Colunas que podem faltar ----------
-- (cada bloco só executa o ALTER TABLE se a coluna ainda não existir)

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'is_admin') = 0,
  'ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN DEFAULT FALSE',
  'SELECT ''usuarios.is_admin já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'token') = 0,
  'ALTER TABLE usuarios ADD COLUMN token VARCHAR(64) NULL',
  'SELECT ''usuarios.token já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'usuario_id') = 0,
  'ALTER TABLE reservas ADD COLUMN usuario_id INT NULL',
  'SELECT ''reservas.usuario_id já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas' AND COLUMN_NAME = 'confirmacao_enviada_em') = 0,
  'ALTER TABLE reservas ADD COLUMN confirmacao_enviada_em TIMESTAMP NULL',
  'SELECT ''reservas.confirmacao_enviada_em já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'usuario_id') = 0,
  'ALTER TABLE pedidos ADD COLUMN usuario_id INT NULL',
  'SELECT ''pedidos.usuario_id já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

-- ---------- Chaves estrangeiras (por último) ----------
-- Ligam reservas/pedidos ao usuário. Se der erro aqui, as colunas acima
-- já foram criadas e a página Minha conta funciona do mesmo jeito.

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas'
      AND COLUMN_NAME = 'usuario_id' AND REFERENCED_TABLE_NAME = 'usuarios') = 0,
  'ALTER TABLE reservas ADD CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL',
  'SELECT ''FK de reservas já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos'
      AND COLUMN_NAME = 'usuario_id' AND REFERENCED_TABLE_NAME = 'usuarios') = 0,
  'ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL',
  'SELECT ''FK de pedidos (usuário) já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos'
      AND COLUMN_NAME = 'produto_id' AND REFERENCED_TABLE_NAME = 'produtos') = 0,
  'ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_produto FOREIGN KEY (produto_id) REFERENCES produtos(id)',
  'SELECT ''FK de pedidos (produto) já existe'' AS info');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SELECT 'Migração concluída.' AS resultado;
