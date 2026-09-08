# 22 - Atividade — P5: remover o container e preservar os dados

Primeiro, insira um registro específico no banco:

```bash
docker compose exec mysql mysql -ualuno -paluno123 biblioteca -e "INSERT INTO books(title) VALUES ('Livro persistente P5');"
```

Depois recrie apenas o container do MySQL:

```bash
docker compose stop mysql
docker compose rm -f mysql
docker compose up -d mysql
```

Quando o healthcheck indicar que o MySQL está pronto:

```bash
docker compose exec mysql mysql -ualuno -paluno123 biblioteca -e "SELECT * FROM books WHERE title='Livro persistente P5';"
```

O registro deve continuar existindo porque os arquivos do banco permanecem no volume `catalog_mysql_data`.
