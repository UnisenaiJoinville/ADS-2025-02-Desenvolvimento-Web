#!/bin/bash
# Script de evidencia da atividade 25 - Criando um container com script de inicialização
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 25: Criando um container com script de inicialização"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ cat init.sh'
  cat init.sh
  echo
  printf '%s\n' '$ cat Dockerfile'
  cat Dockerfile
  echo
  printf '%s\n' '$ docker build -t hello-init .'
  docker build -t hello-init .
  echo
  printf '%s\n' '$ docker run --rm hello-init'
  docker run --rm hello-init
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
