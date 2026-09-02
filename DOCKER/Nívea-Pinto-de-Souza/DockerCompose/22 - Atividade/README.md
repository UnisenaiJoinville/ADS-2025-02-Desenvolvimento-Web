# 22 - Atividade — P5 — recriar container sem perder volume


## Procedimento
```bash
cp .env.example .env
docker compose up -d --build
docker compose exec mysql mysql -uappuser -pappsecret appdb -e "INSERT INTO messages(text) VALUES ('persistencia-p5'); SELECT * FROM messages;"
docker compose stop mysql
docker compose rm -f mysql
docker compose up -d mysql
docker compose exec mysql mysql -uappuser -pappsecret appdb -e "SELECT * FROM messages WHERE text='persistencia-p5';"
```

## Resultado esperado
O registro `persistencia-p5` continua no banco porque o volume `mysql_data` não é removido quando apenas o container é recriado.
