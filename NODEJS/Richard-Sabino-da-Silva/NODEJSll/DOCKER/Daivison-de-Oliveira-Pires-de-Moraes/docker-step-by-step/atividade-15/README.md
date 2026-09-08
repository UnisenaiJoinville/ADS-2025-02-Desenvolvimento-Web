# Atividade 15: Usando Docker Compose

## Objetivo
Subir um serviço Nginx descrito em um arquivo docker-compose.yml.

## Comandos executados
```bash
docker compose up
# depois, no navegador:
# http://localhost:8080
```

## O que foi observado / evidenciado
O Compose descreve, em um único YAML, um ou mais serviços e como se relacionam (portas, volumes, redes), evitando comandos `docker run` longos e repetitivos.

## Arquivos desta pasta
- `docker-compose.yml`: serviço `web` com Nginx exposto na porta 8080.
