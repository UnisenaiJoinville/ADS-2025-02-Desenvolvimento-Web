#!/usr/bin/env bash
set -e
if [ ! -f backup.tar ]; then
  echo "ERRO: backup.tar não encontrado. Copie: cp ../atividade-27/backup.tar ."
  exit 1
fi
docker volume create meu-volume >/dev/null
docker run --rm -v meu-volume:/data -v "$(pwd):/backup" ubuntu bash -c "tar xvf /backup/backup.tar -C /data --strip-components=1"
echo "Restauração concluída."
