# Atividade 20: Baixando uma imagem do Docker Hub

## Objetivo
Baixar (`pull`) a imagem oficial do Nginx.

## Comandos executados
```bash
docker pull nginx
docker images
```

## O que foi observado / evidenciado
`docker pull` baixa a imagem (por padrão a tag `latest`) do registro configurado para o cache local, sem criar nenhum container.
