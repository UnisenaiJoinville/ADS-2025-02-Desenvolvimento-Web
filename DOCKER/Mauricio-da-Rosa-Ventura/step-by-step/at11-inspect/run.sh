#!/bin/bash
# Script de evidencia da atividade 11 - Inspecionando um container
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 11: Inspecionando um container"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker inspect at10-nginx --format '\''Status: {{.State.Status}}'\'''
  docker inspect at10-nginx --format 'Status: {{.State.Status}}'
  echo
  printf '%s\n' '$ docker inspect at10-nginx --format '\''IP: {{.NetworkSettings.IPAddress}}'\'''
  docker inspect at10-nginx --format 'IP: {{.NetworkSettings.IPAddress}}'
  echo
  printf '%s\n' '$ docker inspect at10-nginx --format '\''Mounts: {{json .Mounts}}'\'''
  docker inspect at10-nginx --format 'Mounts: {{json .Mounts}}'
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
