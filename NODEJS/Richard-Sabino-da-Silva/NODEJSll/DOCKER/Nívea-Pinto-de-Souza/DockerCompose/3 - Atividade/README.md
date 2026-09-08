# 3 - Atividade — Cenário 1 — persistência do MySQL


## Objetivo
Demonstrar que `docker compose down` remove containers e rede, mas não remove o volume nomeado do MySQL.

## Procedimento
1. Suba o projeto com `docker compose up -d --build`.
2. Consulte os dados: `docker compose exec mysql mysql -uappuser -pappsecret appdb -e "SELECT * FROM messages;"`.
3. Execute `docker compose down`.
4. Confira o volume com `docker volume ls`.
5. Suba novamente com `docker compose up -d`.
6. Execute novamente o `SELECT`. O registro deve continuar existente.

## Conclusão
A persistência ocorre porque o diretório `/var/lib/mysql` está ligado ao volume nomeado `mysql_data`. `docker compose down` não remove volumes; para removê-los seria necessário `docker compose down -v`.
