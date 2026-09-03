#!/bin/bash
# Script de evidencia da atividade 12 - Conectando-se a um container em execução
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 12: Conectando-se a um container em execução"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ echo "(equivalente interativo: docker exec -it at08-nginx bash)"'
  echo "(equivalente interativo: docker exec -it at08-nginx bash)"
  echo
  printf '%s\n' '$ docker exec at08-nginx bash -c "apt-get update -qq && apt-get install -y -qq procps >/dev/null && ps aux"'
  docker exec at08-nginx bash -c "apt-get update -qq && apt-get install -y -qq procps >/dev/null && ps aux"
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
