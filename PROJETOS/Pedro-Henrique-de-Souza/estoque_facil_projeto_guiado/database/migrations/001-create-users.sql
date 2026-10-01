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