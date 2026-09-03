# Atividade 19: Publicando uma imagem no Docker Hub

## Objetivo
Fazer login e publicar (`push`) uma imagem no Docker Hub.

## Comandos executados
```bash
docker login
docker tag minha-imagem seu_usuario/minha-imagem:v1
docker push seu_usuario/minha-imagem:v1
```

## O que foi observado / evidenciado
Para publicar, a tag precisa incluir o usuário no formato `usuario/nome-da-imagem:tag`. Sem isso o Docker tenta publicar em um repositório oficial sem permissão e o push falha com erro de acesso negado.
