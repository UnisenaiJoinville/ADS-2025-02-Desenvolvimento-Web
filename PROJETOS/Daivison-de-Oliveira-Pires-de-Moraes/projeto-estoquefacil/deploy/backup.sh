#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
chmod 700 backups
file="backups/estoque-$(date +%Y%m%d-%H%M%S).sql.gz"
umask 077
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE"' | gzip > "$file.tmp"
gzip -t "$file.tmp"
mv "$file.tmp" "$file"
printf 'Backup criado: %s\n' "$file"
