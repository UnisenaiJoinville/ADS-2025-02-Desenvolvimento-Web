CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notes(text) VALUES ('PostgreSQL acessado internamente pela API');
