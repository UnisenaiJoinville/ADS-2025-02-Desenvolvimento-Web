# Estoque Facil — Victor Cesar Silva

Sistema de gestao de estoque construido com Node.js, Express, MySQL e Docker,
seguindo as etapas 00 a 32 da apostila em [`../../PROJETO-ESTOQUE-FACIL/apostila-passo-a-passo`](../../PROJETO-ESTOQUE-FACIL/apostila-passo-a-passo):
API REST, front-end, transacoes de estoque e **autenticacao com JWT e Vue.js**.

## Como rodar

Com o Docker Desktop aberto:

```bash
cp .env.example .env
docker compose up -d --build
```

Acesse `http://localhost:3000`. O sistema pede login: use a conta de demonstracao
`professor@estoquefacil.com` / `123456` ou crie uma conta em `/cadastro.html`.

Quem ja tinha o banco criado antes da autenticacao precisa so da tabela `users`,
sem perder dados (o `init.sql` so roda na primeira criacao do volume):

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < database/migrations/001-create-users.sql
```

| Tela | Endereco |
|---|---|
| Login | http://localhost:3000/login.html |
| Cadastro | http://localhost:3000/cadastro.html |
| Dashboard | http://localhost:3000 |
| Produtos | http://localhost:3000/produtos.html |
| Movimentacoes | http://localhost:3000/movimentacoes.html |
| Categorias | http://localhost:3000/categorias.html |

## Endpoints

| Metodo | Rota | O que faz |
|---|---|---|
| GET | `/api/health` | Confirma que a API esta no ar (publica) |
| POST | `/api/auth/register` | Cria conta e devolve `{ user, token }` (publica) |
| POST | `/api/auth/login` | Confere e-mail e senha e devolve `{ user, token }` (publica) |
| GET | `/api/auth/me` | Dados de quem esta logado |
| GET/POST | `/api/categories` | Lista e cria categorias |
| GET/PUT/DELETE | `/api/categories/:id` | Busca, atualiza e exclui |
| GET/POST | `/api/products` | Lista (filtros `search`, `categoryId`, `lowStock`) e cria |
| GET/PUT/DELETE | `/api/products/:id` | Busca, atualiza e exclui |
| GET/POST | `/api/movements` | Lista o historico e registra entrada/saida |
| GET | `/api/dashboard` | Totais, saldo do mes, estoque baixo e recentes |

Apenas `/api/health`, `/api/auth/register` e `/api/auth/login` sao publicas. Todas as
outras rotas exigem o cabecalho `Authorization: Bearer <token>`; sem ele a API responde `401`.

## Estrutura

```text
projeto-docker-nodejs/
├── docker-compose.yml     # orquestra API + MySQL
├── Dockerfile             # imagem da API
├── database/              # init.sql (4 tabelas + dados), migrations/ e queries/
├── public/                # front-end (HTML + Tailwind; login e cadastro em Vue)
└── src/
    ├── config/            # .env validado e pool de conexoes
    ├── routes/            # indice das rotas da API
    ├── shared/            # erros, helpers HTTP e auth (token + middleware)
    └── modules/           # auth, categories, products, movements, dashboard
```

Cada modulo segue as mesmas camadas: `validator` -> `repository` -> `service`
-> `controller` -> `routes`.

## Pontos principais

- **Transacao com `FOR UPDATE`** em `movement-repository.js`: a movimentacao e a
  atualizacao do saldo acontecem juntas, ou nenhuma acontece. Saida maior que o
  estoque faz `ROLLBACK` e nao deixa rastro.
- **Consultas parametrizadas** (`?`) em todo SQL, contra SQL Injection.
- **`escapeHtml`** no front-end, contra XSS.
- **`DECIMAL(10,2)`** para dinheiro, nunca `FLOAT`.
- **Senha nunca guardada**: `bcryptjs` gera o hash (com salt) no cadastro e
  `bcrypt.compare` confere no login. Nao existe `WHERE password = ?` no codigo.
- **JWT** assinado com `JWT_SECRET` (validado no `env.js`, minimo de 32 caracteres) e
  com validade; um unico `ensureAuthenticated` em `routes/index.js` tranca toda a API.
- **Login sem pistas**: e-mail inexistente e senha errada devolvem a mesma mensagem,
  para nao permitir descobrir quais e-mails existem.
- **Validacao nos dois lados**: o formulario Vue e conforto; quem vale e o servidor.
- **`requireAuth()` no front e conveniencia, nao seguranca**: a tranca de verdade
  esta no servidor.
- **Volume nomeado** `estoque-db-data`: os dados sobrevivem ao
  `docker compose down` (mas nao ao `down -v`).

## Comandos uteis

```bash
docker compose ps             # status dos containers
docker compose logs -f api    # acompanha os logs da API
docker compose down           # para os containers (MANTEM os dados)
docker compose down -v        # para e APAGA o banco
```
