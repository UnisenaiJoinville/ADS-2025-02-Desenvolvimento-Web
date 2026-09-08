CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, description VARCHAR(180) NOT NULL, done BOOLEAN DEFAULT FALSE);
INSERT INTO tasks(description) VALUES ('Validar docker compose config'), ('Conferir healthchecks');
