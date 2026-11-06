#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
backup="${1:?Informe o caminho do .sql.gz}"
gzip -t "$backup"
# Restaura SOMENTE em banco separado. Nao modifica estoque_db.
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "CREATE DATABASE IF NOT EXISTS restore_test CHARACTER SET utf8mb4"'
gunzip -c "$backup" | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot restore_test'
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot restore_test -e "SHOW TABLES; SELECT COUNT(*) AS produtos FROM products;"'
printf 'Confira os dados em restore_test. Remova-o manualmente apos a conferencia.\n'
