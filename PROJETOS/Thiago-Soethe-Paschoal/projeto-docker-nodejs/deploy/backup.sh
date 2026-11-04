#!/usr/bin/env bash
# Backup do banco (Aula 57): gera um .sql.gz com data no nome e apaga os antigos.
# Uso:  bash deploy/backup.sh
set -euo pipefail

# Vai para a raiz do projeto, onde esta o docker-compose.prod.yml
cd "$(dirname "$0")/.."

DEST="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F_%H%M)"
FILE="$DEST/estoque_${STAMP}.sql.gz"

mkdir -p "$DEST"
chmod 700 "$DEST"

# O mysqldump roda DENTRO do container e le a senha do ambiente dele:
# a senha nunca aparece na linha de comando do servidor.
# Gravamos num arquivo temporario e so renomeamos se tudo deu certo.
docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines "$MYSQL_DATABASE"' \
  | gzip > "$FILE.tmp"

gzip -t "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

# Rotacao: remove backups mais velhos que KEEP_DAYS dias
find "$DEST" -name 'estoque_*.sql.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup criado: $FILE ($(du -h "$FILE" | cut -f1))"
