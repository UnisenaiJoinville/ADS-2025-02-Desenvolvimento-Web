# Cenário 2 — ReactJS + PostgreSQL + Node/Express + Redis + RabbitMQ + Nginx

Implementação do Cenário 2 do material de Docker e Docker Compose (seção 7): um frontend React atrás de um proxy reverso Nginx, uma API Node/Express, banco PostgreSQL, Redis e RabbitMQ, com o pgAdmin disponível como ferramenta opcional via *Compose profiles*. Como no Cenário 1, o foco é a estrutura de containers — frontend e API não implementam regra de negócio real, só o mínimo para provar que a topologia funciona de ponta a ponta.

## Decisões técnicas

O material descreve o backend deste cenário como "Node/Express/Inertia". O Inertia.js resolve um problema específico — permitir que um backend monolítico (tipo Rails/Laravel) sirva componentes de uma SPA React sem precisar de uma API REST separada — mas isso só faz sentido quando existem **telas de negócio reais** por trás. Como este cenário deliberadamente não implementa nenhuma tela de negócio (apenas prova de estrutura, conforme item 1 da seção "Visão geral" do material), o adaptador Inertia foi **omitido** aqui: a API é Express puro, e o React fala com ela por uma chamada `fetch` simples a `/api/status`, o suficiente para provar a comunicação entre os containers através do proxy. Essa simplificação está documentada aqui e em `backend/src/index.js` para deixar claro que foi uma escolha consciente, não um esquecimento.

O `proxy` (Nginx) é o único serviço com porta publicada para o host (`8080:80`); `frontend` e `api` usam `expose` em vez de `ports` (ver `ATIVIDADES-PARCIAIS.md` para a justificativa completa) — o proxy roteia `/` para o frontend e `/api/` para a API, removendo o prefixo `/api/` antes de repassar (`proxy_pass http://api:3000/;`), exatamente como no exemplo de referência do material (seção 7.3). O PostgreSQL também não publica porta para o host, pelo mesmo motivo: só a API o acessa, e ela já está na mesma rede. O `pgadmin` fica atrás de `profiles: ["tools"]`, para não subir por padrão.

## Estrutura

```
cenario-2-react-express-postgres/
├── docker-compose.yml
├── .env.example
├── nginx/default.conf
├── frontend/          # React + Vite mínimo
│   ├── Dockerfile
│   ├── package.json
│   ├── index.html
│   └── src/{main.jsx,App.jsx}
├── backend/           # API Express mínima (sem Inertia, ver acima)
│   ├── Dockerfile
│   ├── package.json
│   └── src/index.js
├── database/init.sql
├── coletar-evidencias.sh
├── EVIDENCIAS.md
└── ATIVIDADES-PARCIAIS.md
```

## Como executar

```bash
cp .env.example .env
docker compose up -d --build
# ferramentas opcionais (pgAdmin):
docker compose --profile tools up -d
```

Ou, para subir tudo (inclusive o pgAdmin) e já coletar as evidências das atividades parciais:

```bash
./coletar-evidencias.sh
```

## Portas

| Serviço | URL/porta local |
|---|---|
| aplicação (via proxy Nginx) | http://localhost:8080 |
| API (via proxy) | http://localhost:8080/api/health e /api/status |
| rabbitmq (painel) | http://localhost:15673 (porta 15672 do host já é usada pelo Cenário 1) |
| pgadmin (com `--profile tools`) | http://localhost:5050 |

`frontend`, `api` e `postgres` **não** publicam porta para o host de propósito — ver `ATIVIDADES-PARCIAIS.md`.

## Diagnóstico

```bash
docker compose logs -f api
docker compose logs -f proxy
docker compose exec api sh
docker compose down                 # mantém volumes
docker compose --profile tools down # também derruba o pgadmin
```

## Observações (Windows 11 sem WSL / Linux / macOS)

Windows 11 sem WSL: Docker Desktop com backend Hyper-V (Módulo 0, seção 10.1). Linux: garanta que seu usuário está no grupo `docker`. macOS (Apple Silicon ou Intel): todas as imagens usadas (`node:22-alpine`, `nginx:1.27-alpine`, `postgres:17-alpine`, `redis:7.4-alpine`, `rabbitmq:4-management`, `dpage/pgadmin4:8`) têm build multi-arch oficial.

Não versione o arquivo `.env` real — apenas `.env.example` deve ir para o Git.
