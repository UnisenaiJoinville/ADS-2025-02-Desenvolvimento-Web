# 3 - Atividade — comprovar a persistência do MySQL

## Teste proposto
O banco do projeto possui uma tabela `books`. Depois de subir o ambiente, consulte-a:

```bash
docker compose exec mysql mysql -ualuno -paluno123 biblioteca -e "SELECT * FROM books;"
```

Em seguida:

```bash
docker compose down
docker volume ls
docker compose up -d
docker compose exec mysql mysql -ualuno -paluno123 biblioteca -e "SELECT * FROM books;"
```

## Resultado esperado
Os registros continuam presentes porque o diretório de dados do MySQL está ligado ao volume nomeado `catalog_mysql_data`. O comando `docker compose down` elimina containers e a rede do projeto, mas preserva volumes. Já `docker compose down -v` removeria também os volumes.
