# 24 - Atividade — P7 — adicionar healthcheck


## Implementação
Foi adicionado um healthcheck ao serviço `api`, usando o próprio Node para requisitar `http://localhost:3000/health` dentro do container.

## Verificação
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```
Depois do período de inicialização, o status da API deve aparecer como `healthy`.
