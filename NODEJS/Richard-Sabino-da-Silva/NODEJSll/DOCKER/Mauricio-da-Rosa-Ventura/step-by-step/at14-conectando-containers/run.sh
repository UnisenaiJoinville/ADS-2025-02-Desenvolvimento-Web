#!/bin/bash
# Script de evidencia da atividade 14 - Conectando containers à rede
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 14: Conectando containers à rede"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker run -d --network minha-rede --name container1 nginx'
  docker run -d --network minha-rede --name container1 nginx
  echo
  printf '%s\n' '$ docker run -d --network minha-rede --name container2 nginx'
  docker run -d --network minha-rede --name container2 nginx
  echo
  printf '%s\n' '$ sleep 1'
  sleep 1
  echo
  printf '%s\n' '$ docker exec container1 curl -sS -o /dev/null -w '\''container1 -> container2: HTTP %{http_code}\n'\'' http://container2'
  docker exec container1 curl -sS -o /dev/null -w 'container1 -> container2: HTTP %{http_code}\n' http://container2
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
