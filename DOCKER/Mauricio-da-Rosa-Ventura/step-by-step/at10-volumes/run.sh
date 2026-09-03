#!/bin/bash
# Script de evidencia da atividade 10 - Usando volumes
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 10: Usando volumes"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker volume create meu-volume'
  docker volume create meu-volume
  echo
  printf '%s\n' '$ docker run -d --name at10-nginx -v meu-volume:/data nginx'
  docker run -d --name at10-nginx -v meu-volume:/data nginx
  echo
  printf '%s\n' '$ docker volume ls --filter name=meu-volume'
  docker volume ls --filter name=meu-volume
  echo
  printf '%s\n' '$ docker volume inspect meu-volume'
  docker volume inspect meu-volume
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
