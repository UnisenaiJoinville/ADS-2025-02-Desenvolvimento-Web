CREATE TABLE IF NOT EXISTS horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descricao VARCHAR(100) NOT NULL,
  disponivel BOOLEAN DEFAULT TRUE
);

INSERT INTO horarios (descricao, disponivel) VALUES
  ('08:00 - 09:00', TRUE),
  ('09:00 - 10:00', TRUE),
  ('10:00 - 11:00', FALSE);
