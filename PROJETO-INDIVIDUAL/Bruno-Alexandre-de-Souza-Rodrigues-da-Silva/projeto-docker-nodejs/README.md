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
| Login | http://localhost:3000/login.html |
| Cadastro | http://localhost:3000/cadastro.html |
| Dashboard | http://localhost:3000 |
| Produtos | http://localhost:3000/produtos.html |
| Movimentacoes | http://localhost:3000/movimentacoes.html |
| Categorias | http://localhost:3000/categorias.html |

Conta de demonstracao: `professor@estoquefacil.com` / `123456`.

## Endpoints

| Metodo | Rota | Descricao | Autenticacao |
|---|---|---|---|
| GET | `/api/health` | Status da API | publica |
| POST | `/api/auth/register` | Cria conta | publica |
| POST | `/api/auth/login` | Login, devolve `{ user, token }` | publica |
| GET | `/api/auth/me` | Dados do usuario logado | token |
| GET/POST | `/api/categories` | Lista e cria categorias | token |
| GET/PUT/DELETE | `/api/categories/:id` | Busca, atualiza e exclui | token |
| GET/POST | `/api/products` | Lista (filtros: `search`, `categoryId`, `lowStock`) e cria | token |
| GET/PUT/DELETE | `/api/products/:id` | Busca, atualiza e exclui | token |
| GET/POST | `/api/movements` | Historico e registro de entrada/saida | token |
| GET | `/api/dashboard` | Totais e agregacoes | token |

As rotas marcadas com "token" exigem o cabecalho `Authorization: Bearer <token>`, obtido no login.

## Estrutura

```
src/
├── config/     # .env validado e pool do MySQL
├── routes/     # indice das rotas (publicas, depois trava com ensureAuthenticated)
├── shared/     # erros, helpers HTTP e autenticacao (token JWT, middleware)
└── modules/    # auth, categories, products, movements, dashboard
                # cada um: validator, repository, service, controller, routes
public/         # front-end (HTML + Tailwind via CDN, login/cadastro em Vue)
database/       # init.sql (roda na criacao do volume) e migrations/
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
- Autenticacao com senha em hash (`bcryptjs`) e token assinado (`jsonwebtoken`): a API inteira (exceto `/health` e `/auth/*`) fica atras do middleware `ensureAuthenticated`.
- Telas de login e cadastro em Vue 3 (via CDN); as demais telas continuam em JS puro e passam a exigir sessao (`requireAuth()`).

## Autenticacao: se o banco ja existia antes da Etapa 24

O `database/init.sql` so roda na primeira criacao do volume do MySQL. Se voce ja tinha subido o projeto antes, rode a migracao manualmente:

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
  < database/migrations/001-create-users.sql
```
