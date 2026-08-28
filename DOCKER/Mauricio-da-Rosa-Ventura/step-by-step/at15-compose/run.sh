#!/bin/bash
# Script de evidencia da atividade 15 - Usando Docker Compose
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 15: Usando Docker Compose"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ cat docker-compose.yml'
  cat docker-compose.yml
  echo
  printf '%s\n' '$ docker compose up -d'
  docker compose up -d
  echo
  printf '%s\n' '$ sleep 1'
  sleep 1
  echo
  printf '%s\n' '$ curl -sS -o /dev/null -w '\''HTTP %{http_code}\n'\'' http://localhost:8080'
  curl -sS -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:8080
  echo
  printf '%s\n' '$ docker compose ps'
  docker compose ps
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
