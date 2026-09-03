#!/usr/bin/env bash
set -e
read -r -p "Digite seu usuário do Docker Hub: " DOCKERHUB_USERNAME
if [ -z "$DOCKERHUB_USERNAME" ]; then
  echo "Usuário não informado."
  exit 1
fi
docker login
docker tag minha-imagem:v1 "$DOCKERHUB_USERNAME/minha-imagem:v1"
docker push "$DOCKERHUB_USERNAME/minha-imagem:v1"
echo "Imagem publicada: $DOCKERHUB_USERNAME/minha-imagem:v1"
