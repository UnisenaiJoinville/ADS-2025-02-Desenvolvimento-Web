# 9 - Atividade — consolidação com Docker Compose

## Solução escolhida
Foi criado um pequeno sistema de chamados com:

- Vue/Vite no frontend;
- Node/Express no backend;
- MySQL com volume nomeado;
- Redis para cache;
- RabbitMQ para mensageria;
- worker separado para consumir mensagens;
- Nginx como entrada da aplicação.

A API oferece `/health`, `/api/tickets` e `/api/cache-status`. O cadastro de um chamado grava no MySQL e publica uma mensagem no RabbitMQ, que pode ser consumida pelo worker.

## Execução
```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Acesse `http://localhost:8090` e teste `http://localhost:8090/api/health`.

## Decisões de arquitetura
Somente o Nginx e o painel do RabbitMQ possuem portas publicadas. Banco, Redis, API, frontend e worker ficam na rede interna. Os dados do MySQL usam volume nomeado. O `.env.example` contém apenas valores didáticos.

## O que mudaria em produção
Seriam aplicados multi-stage builds, usuário não-root, TLS, armazenamento seguro de segredos, backups, monitoramento, limites de recursos, imagens imutáveis e uma estratégia de implantação/orquestração adequada ao ambiente.
