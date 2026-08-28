# 7 - Atividade — Cenário 2 — profile tools e PgAdmin


## Objetivo
Executar o PgAdmin somente quando solicitado usando `profiles`.

## Comandos
```bash
cp .env.example .env
docker compose up -d --build
docker compose --profile tools up -d
```
Acesse `http://localhost:5050`.

Credenciais locais do laboratório:
- E-mail: `admin@local.test`
- Senha: `admin`

## Explicação
Como o serviço `pgadmin` possui `profiles: ["tools"]`, ele não sobe no `docker compose up -d` padrão. Isso evita gastar recursos com ferramentas administrativas quando elas não são necessárias.
