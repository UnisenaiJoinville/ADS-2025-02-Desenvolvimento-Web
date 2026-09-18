# Estoque Facil — Victor Cesar Silva

Sistema de gestao de estoque construido com Node.js, Express, MySQL e Docker,
seguindo a apostila em [`../../PROJETO-ESTOQUE-FACIL/apostila-passo-a-passo`](../../PROJETO-ESTOQUE-FACIL/apostila-passo-a-passo).

## Como rodar

Com o Docker Desktop aberto:

```bash
cp .env.example .env
docker compose up -d --build
```

Acesse `http://localhost:3000`.

| Tela | Endereco |
|---|---|
| Dashboard | http://localhost:3000 |
| Produtos | http://localhost:3000/produtos.html |
| Movimentacoes | http://localhost:3000/movimentacoes.html |
| Categorias | http://localhost:3000/categorias.html |

## Endpoints

| Metodo | Rota | O que faz |
|---|---|---|
| GET | `/api/health` | Confirma que a API esta no ar |
| GET/POST | `/api/categories` | Lista e cria categorias |
| GET/PUT/DELETE | `/api/categories/:id` | Busca, atualiza e exclui |
| GET/POST | `/api/products` | Lista (filtros `search`, `categoryId`, `lowStock`) e cria |
| GET/PUT/DELETE | `/api/products/:id` | Busca, atualiza e exclui |
| GET/POST | `/api/movements` | Lista o historico e registra entrada/saida |
| GET | `/api/dashboard` | Totais, saldo do mes, estoque baixo e recentes |

## Estrutura

```text
projeto-docker-nodejs/
├── docker-compose.yml     # orquestra API + MySQL
├── Dockerfile             # imagem da API
├── database/init.sql      # 3 tabelas + dados de exemplo
├── public/                # front-end (HTML + Tailwind via CDN)
└── src/
    ├── config/            # .env validado e pool de conexoes
    ├── routes/            # indice das rotas da API
    ├── shared/            # erros e helpers HTTP
    └── modules/           # categories, products, movements, dashboard
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
- **Volume nomeado** `estoque-db-data`: os dados sobrevivem ao
  `docker compose down` (mas nao ao `down -v`).

## Comandos uteis

```bash
docker compose ps             # status dos containers
docker compose logs -f api    # acompanha os logs da API
docker compose down           # para os containers (MANTEM os dados)
docker compose down -v        # para e APAGA o banco
```
