# 2 - Atividade — Cenário 1 — subir pilha e coletar logs

## Objetivo
Subir a pilha, listar containers e acompanhar logs da API e do RabbitMQ.

## Execução
1. Copie `.env.example` para `.env`.
2. Rode `docker compose up -d --build`.
3. Rode `docker compose ps`.
4. Rode `docker compose logs -f api`.
5. Em outro terminal, rode `docker compose logs -f rabbitmq`.

