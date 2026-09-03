# Cenário 2 — React + PostgreSQL + Nginx + Redis + RabbitMQ

**Aluno:** Bruno Silva

Diferença para o Cenário 1: um proxy reverso Nginx na frente e o PgAdmin
controlado por profile.

## Serviços

| Serviço | Papel | Publicado |
|---|---|---|
| proxy | entrada única, roteia / e /api/ | 8090 |
| frontend | Vite | não |
| api | Node/Express | não |
| postgres | banco relacional | não |
| redis | cache | não |
| rabbitmq | fila | painel em 15673 |
| pgadmin | inspeção do banco | 5050, só com profile |

**Obs.:** usei a porta 8090 porque a 8080 do material já estava ocupada.

## Como executar

```bash
cp .env.example .env
docker compose up -d --build
```

Aplicação: http://localhost:8090

Para subir o PgAdmin:

```bash
docker compose --profile tools up -d
```

## Endpoints

```bash
curl http://localhost:8090/api/health
curl http://localhost:8090/api/produtos
```

As respostas das atividades estão em `docs/cenario-2-atividades.md`.
