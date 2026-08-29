CREATE TABLE IF NOT EXISTS livros (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  autor VARCHAR(80) NOT NULL,
  disponivel BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS emprestimos (
  id SERIAL PRIMARY KEY,
  livro_id INT REFERENCES livros(id),
  aluno VARCHAR(80) NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO livros (titulo, autor) VALUES
  ('Docker Up and Running', 'Sean Kane'),
  ('Building Microservices', 'Sam Newman'),
  ('Release It', 'Michael Nygard');
