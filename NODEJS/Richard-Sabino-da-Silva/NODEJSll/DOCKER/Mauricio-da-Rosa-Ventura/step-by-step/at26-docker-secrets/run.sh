#!/bin/bash
# Script de evidencia da atividade 26 - Usando Docker Secrets
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 26: Usando Docker Secrets"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ docker swarm init --advertise-addr 127.0.0.1 2>&1 | head -5'
  docker swarm init --advertise-addr 127.0.0.1 2>&1 | head -5
  echo
  printf '%s\n' '$ printf "minha-senha-super-secreta" | docker secret create minha-senha -'
  printf "minha-senha-super-secreta" | docker secret create minha-senha -
  echo
  printf '%s\n' '$ docker secret ls'
  docker secret ls
  echo
  printf '%s\n' '$ docker service create --name servico-com-secret --secret minha-senha alpine sleep 3600'
  docker service create --name servico-com-secret --secret minha-senha alpine sleep 3600
  echo
  printf '%s\n' '$ sleep 3'
  sleep 3
  echo
  printf '%s\n' '$ TASK_CONTAINER=$(docker ps --filter "label=com.docker.swarm.service.name=servico-com-secret" -q | head -1)'
  TASK_CONTAINER=$(docker ps --filter "label=com.docker.swarm.service.name=servico-com-secret" -q | head -1)
  echo
  printf '%s\n' '$ echo "Container da task: $TASK_CONTAINER"'
  echo "Container da task: $TASK_CONTAINER"
  echo
  printf '%s\n' '$ docker exec "$TASK_CONTAINER" cat /run/secrets/minha-senha'
  docker exec "$TASK_CONTAINER" cat /run/secrets/minha-senha
  echo
  printf '%s\n' '$ echo'
  echo
  echo
  printf '%s\n' '$ docker service rm servico-com-secret'
  docker service rm servico-com-secret
  echo
  printf '%s\n' '$ docker secret rm minha-senha'
  docker secret rm minha-senha
  echo
  printf '%s\n' '$ docker swarm leave --force'
  docker swarm leave --force
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
