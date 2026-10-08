#!/usr/bin/env bash
set -e
if ! docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q active; then
  docker swarm init
fi
if ! docker secret ls --format '{{.Name}}' | grep -qx 'minha-senha'; then
  echo "minha-senha" | docker secret create minha-senha -
fi
docker stack deploy -c stack.yml atividade26
docker stack services atividade26
echo "Veja os logs com: docker service logs atividade26_leitor-secret"
