#!/bin/bash
# Script de evidencia da atividade 09 - Expondo portas
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 09: Expondo portas"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker run -d --name at09-nginx -p 8080:80 nginx'
  docker run -d --name at09-nginx -p 8080:80 nginx
  echo
  printf '%s\n' '$ sleep 1'
  sleep 1
  echo
  printf '%s\n' '$ curl -sS -o /dev/null -w '\''HTTP %{http_code}\n'\'' http://localhost:8080'
  curl -sS -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:8080
  echo
  printf '%s\n' '$ curl -sS http://localhost:8080 | head -5'
  curl -sS http://localhost:8080 | head -5
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
