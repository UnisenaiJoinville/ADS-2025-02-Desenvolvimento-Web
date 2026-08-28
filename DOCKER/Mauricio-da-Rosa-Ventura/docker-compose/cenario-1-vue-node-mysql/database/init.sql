-- Script de inicializacao do banco do Cenario 1.
-- Executado automaticamente pela imagem oficial do MySQL na primeira vez
-- que o volume mysql_data e criado (docker-entrypoint-initdb.d).

CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(100) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO eventos (tipo) VALUES ('ambiente-inicializado');
