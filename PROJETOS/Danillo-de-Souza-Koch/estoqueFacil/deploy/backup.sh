#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

DEST="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F_%H%M)"
FILE="$DEST/estoque_${STAMP}.sql.gz"
TEMP_FILE="$FILE.tmp"

mkdir -p "$DEST"
chmod 700 "$DEST"
trap 'rm -f -- "$TEMP_FILE"' EXIT

docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines "$MYSQL_DATABASE"' \
  | gzip > "$TEMP_FILE"

gzip -t "$TEMP_FILE"
mv "$TEMP_FILE" "$FILE"
chmod 600 "$FILE"
find "$DEST" -type f -name 'estoque_*.sql.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup criado: $FILE ($(du -h "$FILE" | cut -f1))"
