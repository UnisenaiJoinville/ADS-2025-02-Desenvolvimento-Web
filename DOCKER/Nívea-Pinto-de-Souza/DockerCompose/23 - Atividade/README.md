# 23 - Atividade — P6 — ativar profile tools no cenário 2


## Procedimento
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
docker compose --profile tools up -d
docker compose ps
```
O PgAdmin deve aparecer somente após o comando com `--profile tools` e ficar acessível em `http://localhost:5050`.
