# 6 - Atividade — Cenário 2 — acesso via Nginx


## Objetivo
Subir o cenário 2 e acessar a aplicação pelo endereço `http://localhost:8080`.

## Comandos
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```
No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

Abra `http://localhost:8080`. O Nginx recebe a requisição, encaminha a interface para o frontend e `/api/*` para o backend.
