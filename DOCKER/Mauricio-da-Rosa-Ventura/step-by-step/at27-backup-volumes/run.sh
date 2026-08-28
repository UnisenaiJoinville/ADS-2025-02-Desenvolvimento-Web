#!/bin/bash
# Script de evidencia da atividade 27 - Backup de volumes
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 27: Backup de volumes"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker volume create meu-volume-dados'
  docker volume create meu-volume-dados
  echo
  printf '%s\n' '$ docker run --rm -v meu-volume-dados:/data alpine sh -c "echo conteudo-de-teste > /data/arquivo.txt"'
  docker run --rm -v meu-volume-dados:/data alpine sh -c "echo conteudo-de-teste > /data/arquivo.txt"
  echo
  printf '%s\n' '$ docker run --rm -v meu-volume-dados:/data -v $(pwd):/backup ubuntu tar cvf /backup/backup.tar /data'
  docker run --rm -v meu-volume-dados:/data -v $(pwd):/backup ubuntu tar cvf /backup/backup.tar /data
  echo
  printf '%s\n' '$ ls -la backup.tar'
  ls -la backup.tar
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
