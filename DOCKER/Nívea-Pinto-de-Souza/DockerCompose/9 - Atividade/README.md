# 9 - Atividade — Cenário 3 — projeto aplicado de consolidação


## Arquitetura escolhida
- Frontend React/Vite.
- Backend Node/Express com endpoint `/health`.
- PostgreSQL com volume nomeado e healthcheck.
- Redis na rede interna.
- RabbitMQ com healthcheck.
- Worker separado para consumir fila.
- Nginx como ponto de entrada.

## Como executar
1. Copie `.env.example` para `.env`.
2. Execute `docker compose up -d --build`.
3. Verifique `docker compose ps`.
4. Acesse `http://localhost:8080`.
5. Teste `http://localhost:8080/api/health`.

## Decisões
O host acessa apenas Nginx e o painel do RabbitMQ. Banco, Redis, API e frontend ficam na rede interna. Os dados do PostgreSQL usam volume nomeado e sobrevivem a `docker compose down`. O `.env.example` contém apenas nomes de variáveis e valores de laboratório; em produção, senhas e segredos devem vir de um gerenciador seguro.

## Produção
Em produção seriam usados builds multi-stage, imagens imutáveis, usuário não-root, TLS, secrets, logs centralizados, métricas, backups e orquestração apropriada. Bind mounts de código e credenciais de laboratório não seriam utilizados.
