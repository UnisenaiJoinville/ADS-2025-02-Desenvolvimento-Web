#!/usr/bin/env bash
set -e
docker volume create meu-volume >/dev/null
docker run --rm -v meu-volume:/data -v "$(pwd):/backup" ubuntu tar cvf /backup/backup.tar /data
echo "Backup criado em: $(pwd)/backup.tar"
