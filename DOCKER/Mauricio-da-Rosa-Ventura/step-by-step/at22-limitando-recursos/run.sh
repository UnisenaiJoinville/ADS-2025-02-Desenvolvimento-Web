#!/bin/bash
# Script de evidencia da atividade 22 - Limitando recursos do container
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 22: Limitando recursos do container"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker run -d --name at22-limitado -m 512m --cpus="1.0" ubuntu sleep 60'
  docker run -d --name at22-limitado -m 512m --cpus="1.0" ubuntu sleep 60
  echo
  printf '%s\n' '$ docker inspect at22-limitado --format '\''Memory (bytes): {{.HostConfig.Memory}}'\'''
  docker inspect at22-limitado --format 'Memory (bytes): {{.HostConfig.Memory}}'
  echo
  printf '%s\n' '$ docker inspect at22-limitado --format '\''NanoCPUs: {{.HostConfig.NanoCpus}}'\'''
  docker inspect at22-limitado --format 'NanoCPUs: {{.HostConfig.NanoCpus}}'
  echo
  printf '%s\n' '$ docker stats --no-stream at22-limitado'
  docker stats --no-stream at22-limitado
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
