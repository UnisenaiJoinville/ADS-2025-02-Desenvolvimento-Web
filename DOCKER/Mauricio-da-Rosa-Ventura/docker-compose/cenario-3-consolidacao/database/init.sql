-- Script de inicializacao do banco do Cenario 3.
-- Executado automaticamente pela imagem oficial do Postgres na primeira vez
-- que o volume postgres_data e criado (docker-entrypoint-initdb.d).

CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(100) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO eventos (tipo) VALUES ('ambiente-inicializado');
