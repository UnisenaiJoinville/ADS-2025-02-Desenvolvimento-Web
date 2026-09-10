#!/usr/bin/env bash
set -e
docker stack rm atividade26 || true
sleep 5
docker secret rm minha-senha 2>/dev/null || true
echo "Limpeza concluída."
