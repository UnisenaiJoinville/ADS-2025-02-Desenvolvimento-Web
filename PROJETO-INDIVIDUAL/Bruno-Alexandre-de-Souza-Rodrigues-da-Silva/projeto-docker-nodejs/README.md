# Estoque Facil

Sistema de gestao de estoque com Node.js, Express, MySQL e Docker.

Autor: Bruno Alexandre de Souza Rodrigues da Silva

## Como rodar

1. Tenha o **Docker Desktop aberto**.
2. Crie o `.env` a partir do modelo:

```bash
cp .env.example .env
```

3. Suba os containers:

```bash
docker compose up -d --build
```

4. Acesse http://localhost:3000

> Se a porta 3308 estiver ocupada, mude `DB_HOST_PORT` no `.env`.

## Telas

| Tela | Endereco |
|---|---|
| Dashboard | http://localhost:3000 |
| Produtos | http://localhost:3000/produtos.html |
| Movimentacoes | http://localhost:3000/movimentacoes.html |
| Categorias | http://localhost:3000/categorias.html |

## Endpoints

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/health` | Status da API |
| GET/POST | `/api/categories` | Lista e cria categorias |
| GET/PUT/DELETE | `/api/categories/:id` | Busca, atualiza e exclui |
| GET/POST | `/api/products` | Lista (filtros: `search`, `categoryId`, `lowStock`) e cria |
| GET/PUT/DELETE | `/api/products/:id` | Busca, atualiza e exclui |
| GET/POST | `/api/movements` | Historico e registro de entrada/saida |
| GET | `/api/dashboard` | Totais e agregacoes |

## Estrutura

```
src/
├── config/     # .env validado e pool do MySQL
├── routes/     # indice das rotas
├── shared/     # erros e helpers HTTP
└── modules/    # categories, products, movements, dashboard
                # cada um: validator, repository, service, controller, routes
public/         # front-end (HTML + Tailwind via CDN)
database/       # init.sql (roda na criacao do volume)
```

## Comandos uteis

```bash
docker compose ps             # status
docker compose logs -f api    # logs da API
docker compose down           # para, MANTEM os dados
docker compose down -v        # para e APAGA o banco
```

## Destaques

- Movimentacao usa **transacao** com `SELECT ... FOR UPDATE`: a movimentacao e o saldo do produto sao gravados juntos, ou nenhum dos dois.
- Saida maior que o estoque e recusada com `ROLLBACK`, sem deixar registro.
- Consultas parametrizadas com `?` contra SQL Injection e `escapeHtml` no front contra XSS.
- Dashboard calcula os totais no proprio SQL e roda as consultas com `Promise.all`.
