#!/bin/bash
# Script de evidencia da atividade 13 - Criando uma rede Docker
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 13: Criando uma rede Docker"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker network create minha-rede'
  docker network create minha-rede
  echo
  printf '%s\n' '$ docker network ls --filter name=minha-rede'
  docker network ls --filter name=minha-rede
  echo
  printf '%s\n' '$ docker network inspect minha-rede --format '\''{{.Driver}}'\'''
  docker network inspect minha-rede --format '{{.Driver}}'
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
