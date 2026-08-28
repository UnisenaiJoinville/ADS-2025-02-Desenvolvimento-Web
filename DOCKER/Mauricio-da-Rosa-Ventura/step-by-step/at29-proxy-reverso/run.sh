#!/bin/bash
# Script de evidencia da atividade 29 - Configurando um proxy reverso
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 29: Configurando um proxy reverso"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker network create rede-proxy'
  docker network create rede-proxy
  echo
  printf '%s\n' '$ docker run -d --network rede-proxy --name backend -v $(pwd)/app-content:/usr/share/nginx/html:ro nginx'
  docker run -d --network rede-proxy --name backend -v $(pwd)/app-content:/usr/share/nginx/html:ro nginx
  echo
  printf '%s\n' '$ docker run -d --network rede-proxy --name proxy -p 8081:80 -v $(pwd)/proxy.conf:/etc/nginx/conf.d/default.conf:ro nginx'
  docker run -d --network rede-proxy --name proxy -p 8081:80 -v $(pwd)/proxy.conf:/etc/nginx/conf.d/default.conf:ro nginx
  echo
  printf '%s\n' '$ sleep 1'
  sleep 1
  echo
  printf '%s\n' '$ curl -sS http://localhost:8081'
  curl -sS http://localhost:8081
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
