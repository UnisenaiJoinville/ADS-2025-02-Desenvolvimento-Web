#!/bin/bash
# Script de evidencia da atividade 28 - Restaurando volumes
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 28: Restaurando volumes"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker volume create meu-volume-restaurado'
  docker volume create meu-volume-restaurado
  echo
  printf '%s\n' '$ docker run --rm -v meu-volume-restaurado:/data -v $(pwd)/../at27-backup-volumes:/backup ubuntu bash -c "tar xvf /backup/backup.tar -C /data --strip-components=1"'
  docker run --rm -v meu-volume-restaurado:/data -v $(pwd)/../at27-backup-volumes:/backup ubuntu bash -c "tar xvf /backup/backup.tar -C /data --strip-components=1"
  echo
  printf '%s\n' '$ docker run --rm -v meu-volume-restaurado:/data alpine sh -c '\''echo conteudo restaurado:; cat /data/arquivo.txt'\'''
  docker run --rm -v meu-volume-restaurado:/data alpine sh -c 'echo conteudo restaurado:; cat /data/arquivo.txt'
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
