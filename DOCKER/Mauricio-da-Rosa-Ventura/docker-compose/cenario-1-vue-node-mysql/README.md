# Cenário 1 — VueJS + NodeJS + MySQL + Redis + RabbitMQ

Implementação do Cenário 1 do material de Docker e Docker Compose (seção 6): uma aplicação web clássica com frontend Vue, API Node.js, banco relacional MySQL, cache/sessões em Redis e mensageria assíncrona em RabbitMQ, orquestrados por um único `docker-compose.yml`. Como o próprio material define no início da seção 6 ("O foco é a estrutura de containers, não a implementação das funcionalidades"), o frontend e a API aqui **não implementam nenhuma regra de negócio real** — cada um só tem o mínimo de código necessário para provar, de forma verificável, que a arquitetura de containers sobe e se comunica corretamente.

## Decisões técnicas

O backend (`backend/src/index.js`) não usa nenhum framework (nem Express): é um servidor `http` puro do próprio Node.js com duas rotas — `GET /health`, um healthcheck simples, e `GET /api/status`, que tenta uma operação real em cada dependência (uma contagem no MySQL, um `SET`/`GET` no Redis, publicar uma mensagem no RabbitMQ) e devolve o resultado em JSON. Essa segunda rota existe especificamente para responder, de forma demonstrável, a pergunta-guia do material (seção 8.2): "como a equipe provará que o backend conversa com banco, Redis e mensageria?". O worker (`worker/src/worker.js`) é um processo Node.js separado, com seu próprio `Dockerfile` e container, cuja única função é consumir a fila `cenario1.eventos` publicada pela API — provando que a mensageria conecta dois containers diferentes de forma assíncrona, sem que um dependa de o outro estar respondendo naquele instante. O frontend (`frontend/`) é um projeto Vue 3 + Vite mínimo (um único componente, `App.vue`), que só busca `GET http://localhost:3000/api/status` e exibe o resultado — o suficiente para provar, pelo navegador, que o frontend containerizado enxerga a API containerizada.

Todas as credenciais (usuário/senha do MySQL e do RabbitMQ) ficam em variáveis de ambiente lidas de um arquivo `.env` (nunca commitado — só o `.env.example`, com valores de exemplo), conforme a boa prática da seção 5 do material. O MySQL e o RabbitMQ têm `healthcheck` configurado, e a API só inicia depois que os dois estiverem `healthy` (`depends_on: condition: service_healthy`) — evita a classe de erro mais comum em Compose, a API tentando conectar antes de o banco estar de fato pronto para aceitar conexões.

## Estrutura

```
cenario-1-vue-node-mysql/
├── docker-compose.yml
├── .env.example
├── frontend/           # Vue 3 + Vite mínimo
│   ├── Dockerfile
│   ├── package.json
│   ├── index.html
│   └── src/{main.js,App.vue}
├── backend/            # API Node.js sem framework (http nativo)
│   ├── Dockerfile
│   ├── package.json
│   └── src/index.js
├── worker/             # consumidor da fila RabbitMQ
│   ├── Dockerfile
│   ├── package.json
│   └── src/worker.js
├── database/init.sql
├── coletar-evidencias.sh   # sobe tudo e gera EVIDENCIAS.md automaticamente
├── EVIDENCIAS.md            # gerado pelo script acima
└── ATIVIDADES-PARCIAIS.md   # respostas da seção 6.3 do material
```

## Como executar

Requisitos: Docker Desktop (Windows 11 sem WSL, com Hyper-V, ou macOS) ou Docker Engine + Compose v2 (Linux) — ver Módulo 0, seção 10.

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Ou, para subir e já coletar todas as evidências pedidas nas atividades parciais em um só comando:

```bash
./coletar-evidencias.sh
```

## Portas

| Serviço | URL/porta local |
|---|---|
| frontend (Vue/Vite) | http://localhost:5173 |
| api (Node.js) | http://localhost:3000/health e /api/status |
| mysql | localhost:3306 |
| redis | localhost:6379 |
| rabbitmq (AMQP / painel) | localhost:5672 / http://localhost:15672 |

## Diagnóstico

```bash
docker compose logs -f api
docker compose logs -f worker
docker compose exec api sh
docker inspect $(docker compose ps -q mysql)
docker compose down          # para e remove containers/rede (mantém volumes)
docker compose down -v       # também apaga os volumes (perde os dados)
```

## Observações (Windows 11 sem WSL / Linux / macOS)

Em Windows 11 sem WSL, use Docker Desktop com backend Hyper-V (Módulo 0, seção 10.1) — os comandos acima são idênticos no PowerShell/Windows Terminal. Em Linux, garanta que seu usuário está no grupo `docker` (senão use `sudo`). Em macOS com Apple Silicon, todas as imagens usadas aqui (`node:22-alpine`, `mysql:8.4`, `redis:7.4-alpine`, `rabbitmq:4-management`) têm build multi-arch oficial, então não é necessário `platform: linux/amd64`.

Não versione o arquivo `.env` real — apenas `.env.example` deve ir para o Git.
