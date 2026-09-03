#!/bin/bash
# Script de evidencia da atividade 19 - Publicando uma imagem
# Roda os comandos reais desta atividade no SEU Docker (Desktop/Engine) e grava
# a saida em EVIDENCIA.md. Rode a partir desta pasta: ./run.sh
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidencia de execucao - Atividade 19: Publicando uma imagem"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo
  echo "## Comandos e saída"
  echo
  echo '```'
  printf '%s\n' '$ echo "--- publicando em um registry local (nao exige conta) ---"'
  echo "--- publicando em um registry local (nao exige conta) ---"
  echo
  printf '%s\n' '$ docker run -d -p 5000:5000 --name registro-local registry:2'
  docker run -d -p 5000:5000 --name registro-local registry:2
  echo
  printf '%s\n' '$ sleep 1'
  sleep 1
  echo
  printf '%s\n' '$ docker tag minha-imagem localhost:5000/minha-imagem:v1'
  docker tag minha-imagem localhost:5000/minha-imagem:v1
  echo
  printf '%s\n' '$ docker push localhost:5000/minha-imagem:v1'
  docker push localhost:5000/minha-imagem:v1
  echo
  printf '%s\n' '$ echo'
  echo
  echo
  printf '%s\n' '$ echo "--- alternativa real no Docker Hub (opcional, exige conta): ---"'
  echo "--- alternativa real no Docker Hub (opcional, exige conta): ---"
  echo
  printf '%s\n' '$ echo "docker login"'
  echo "docker login"
  echo
  printf '%s\n' '$ echo "docker tag minha-imagem <seu-usuario>/minha-imagem:v1"'
  echo "docker tag minha-imagem <seu-usuario>/minha-imagem:v1"
  echo
  printf '%s\n' '$ echo "docker push <seu-usuario>/minha-imagem:v1"'
  echo "docker push <seu-usuario>/minha-imagem:v1"
  echo
  echo '```'
  echo
} > EVIDENCIA.md 2>&1

echo "Evidencia gravada em $(pwd)/EVIDENCIA.md"
