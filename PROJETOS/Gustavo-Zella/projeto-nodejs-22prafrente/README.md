# Estoque Facil

Sistema de gestao de estoque construido com **Node.js + Express + MySQL + Docker**,
com front-end em HTML/Tailwind puro (sem build, sem framework).

---

## Como executar

Pre-requisitos: **Docker** e **Docker Compose** instalados.

```bash
# 1. Copie o arquivo de variaveis de ambiente
cp .env.example .env

# 2. Suba os containers (API + MySQL)
docker compose up --build
```

Pronto. Acesse:

| O que | Onde |
|---|---|
| Front-end | http://localhost:3000 |
| API | http://localhost:3000/api |
| Health check | http://localhost:3000/api/health |
| MySQL (host) | `localhost:3308` |

> Na primeira execucao o MySQL demora ~30s para ficar pronto. A API espera
> automaticamente (healthcheck + retry de conexao), entao e so aguardar.

### Comandos uteis

```bash
docker compose up -d          # sobe em segundo plano
docker compose logs -f api    # acompanha os logs da API
docker compose down           # para os containers
docker compose down -v        # para E APAGA o banco (recria do zero)
```

Se a porta 3308 estiver ocupada, mude `DB_HOST_PORT` no `.env`.

---

## Estrutura do projeto

```
projeto-docker-nodejs/
├── database/
│   └── init.sql                 # schema + dados de exemplo (roda sozinho)
├── public/                      # front-end estatico
│   ├── index.html               # dashboard
│   ├── produtos.html
│   ├── movimentacoes.html
│   ├── categorias.html
│   └── js/
│       ├── api.js               # unica camada de fetch
│       ├── layout.js            # nav, toast, formatacao
│       ├── dashboard.js
│       ├── produtos.js
│       ├── movimentacoes.js
│       └── categorias.js
├── src/
│   ├── config/
│   │   ├── env.js               # le e VALIDA as variaveis de ambiente
│   │   └── database.js          # pool de conexoes + retry
│   ├── modules/                 # um modulo por dominio
│   │   ├── categories/
│   │   ├── products/
│   │   ├── movements/
│   │   └── dashboard/
│   ├── routes/index.js
│   ├── shared/
│   │   ├── errors/app-error.js
│   │   └── http/                # asyncHandler, errorHandler, parseId
│   ├── app.js
│   └── server.js
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

Cada modulo segue sempre a mesma divisao de responsabilidades:

```
routes  ->  controller  ->  service  ->  repository  ->  banco
                              ^
                          validator (regras de entrada)
```

- **routes**: liga a URL ao controller
- **controller**: le a requisicao e devolve a resposta (nao tem regra de negocio)
- **service**: regras de negocio
- **repository**: SQL
- **validator**: valida e normaliza os dados de entrada

---

## API

### Health

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/health` | status da API |

### Categorias

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/categories` | lista categorias (com contagem de produtos) |
| GET | `/api/categories/:id` | busca uma categoria |
| POST | `/api/categories` | cria categoria |
| PUT | `/api/categories/:id` | atualiza categoria |
| DELETE | `/api/categories/:id` | remove categoria |

```json
{ "name": "Bebidas" }
```

### Produtos

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/products` | lista produtos |
| GET | `/api/products/:id` | busca um produto |
| POST | `/api/products` | cria produto |
| PUT | `/api/products/:id` | atualiza produto |
| DELETE | `/api/products/:id` | remove produto |

Filtros da listagem (query string):

- `?search=cafe` - busca por nome ou SKU
- `?categoryId=1` - filtra por categoria
- `?lowStock=true` - apenas produtos no limite ou abaixo do minimo

```json
{
  "name": "Cafe em graos 1kg",
  "sku": "BEB-001",
  "categoryId": 1,
  "costPrice": 28.00,
  "salePrice": 45.90,
  "quantity": 40,
  "minimumStock": 10,
  "active": true
}
```

### Movimentacoes

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/movements` | historico (filtros: `productId`, `type`, `limit`) |
| POST | `/api/movements` | registra entrada ou saida |

```json
{ "productId": 1, "type": "IN", "quantity": 10, "note": "Compra" }
```

`type` aceita `IN` (entrada, **soma** no estoque) ou `OUT` (saida, **subtrai**).

### Dashboard

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/dashboard` | totais, saldo do mes, estoque por categoria, estoque baixo e ultimas movimentacoes |

---

## Regras de negocio implementadas

- Nome de categoria e obrigatorio e **unico** (comparacao sem diferenciar maiusculas)
- SKU do produto e obrigatorio, **unico** e sempre gravado em maiusculas
- Preco de venda **nao pode** ser menor que o preco de custo
- Quantidade e estoque minimo precisam ser inteiros >= 0
- Categoria informada no produto precisa existir
- Movimentacao exige quantidade inteira > 0 e tipo `IN` ou `OUT`
- **O estoque nunca fica negativo**: uma saida maior que o disponivel e recusada
- Ao excluir uma categoria, os produtos dela ficam sem categoria (`ON DELETE SET NULL`)
- Ao excluir um produto, suas movimentacoes sao removidas (`ON DELETE CASCADE`)

### O ponto mais importante: a transacao

Registrar uma movimentacao faz **duas** coisas no banco: insere a movimentacao
e atualiza a quantidade do produto. As duas precisam acontecer juntas — ou
nenhuma acontece. Por isso `movement-repository.js` usa uma transacao:

```
beginTransaction()
  SELECT ... FOR UPDATE   -> trava a linha do produto
  valida se o saldo ficaria negativo
  INSERT na stock_movements
  UPDATE na products
commit()   (ou rollback() se algo der errado)
```

O `FOR UPDATE` evita que duas requisicoes simultaneas leiam o mesmo saldo e
gravem um valor errado. A conexao e sempre devolvida ao pool no `finally`.

---

## Codigos de resposta

| Codigo | Quando |
|---|---|
| 200 | sucesso |
| 201 | registro criado |
| 204 | registro excluido (sem corpo) |
| 400 | dados invalidos / estoque insuficiente |
| 404 | registro ou rota nao encontrada |
| 409 | conflito (nome ou SKU ja existente) |
| 500 | erro inesperado |

Todo erro volta no mesmo formato:

```json
{ "error": "mensagem explicando o problema" }
```

---

## Detalhes tecnicos

- **ES Modules** (`"type": "module"`) em todo o projeto
- **Pool de conexoes** com retry: o container do MySQL demora para aceitar
  conexoes, entao a API tenta ate 10 vezes antes de desistir
- **Queries parametrizadas** (`?`) em 100% do SQL — protege contra SQL injection
- **`asyncHandler`**: o Express 4 nao captura erros de funcoes `async`, entao
  todo handler e embrulhado para encaminhar a falha ao middleware de erro
- **Hot reload** via `node --watch` + bind mount: editar um arquivo em `src/`
  ou `public/` reinicia o servidor sozinho, sem rebuild
- **Encerramento gracioso**: em `SIGTERM`/`SIGINT` o servidor fecha e o pool
  e encerrado antes de sair
- **`escapeHtml`** no front-end ao montar tabelas com dados do banco

---

## Exercicios da Etapa 22 (implementados)

Este projeto vai alem do escopo basico da apostila: **todos os exercicios da
Etapa 22 (Nivel 1, 2 e 3) foram implementados e testados**.

### Nivel 1 — Fixacao

- **1.1 Campo fornecedor**: coluna `supplier` (opcional) em `products`,
  presente no formulario e na listagem.
- **1.2 Ordenacao configuravel**: `GET /api/products?orderBy=quantity&orderDir=desc`.
  O nome da coluna passa por uma **lista branca** (`ALLOWED_ORDER_COLUMNS`) antes
  de entrar no SQL — nomes de coluna nao podem ser parametrizados com `?`, entao
  concatenar direto seria uma porta aberta para SQL Injection.
- **1.3 Preco medio de venda**: card novo no dashboard (`averageSalePrice`),
  usando `COALESCE(AVG(sale_price), 0)` para nao quebrar com o catalogo vazio.
- **1.4 Modal de confirmacao**: `window.confirm()` foi substituido por um
  modal no padrao visual do sistema (`confirmDialog()` em `layout.js`),
  usado tanto em Produtos quanto em Categorias.

### Nivel 2 — Aplicacao

- **2.1 Soft delete**: "excluir" um produto agora apenas desativa
  (`active = FALSE`) em vez de apagar a linha. Isso preserva o historico de
  movimentacoes, que seria perdido com o `ON DELETE CASCADE` de um DELETE de
  verdade. Ha uma rota `PATCH /api/products/:id/reactivate` para reverter, e
  a listagem tem um filtro `includeInactive=true` para ve-los.
- **2.2 Paginacao**: `GET /api/products?page=2&perPage=10` devolve
  `{ data, total, page, perPage, totalPages }`. O total e calculado com uma
  segunda query (`COUNT(*)`) executada em paralelo com a busca da pagina.
- **2.3 Tipo de movimentacao ADJUST**: alem de `IN`/`OUT`, existe `ADJUST`
  para bater o estoque do sistema com uma contagem fisica. **Decisao de design**:
  o valor enviado pelo usuario em `ADJUST` e a **contagem nova** (o total real
  encontrado), nao um delta — e assim que se usa esse recurso na pratica
  ("contei e tem 37"). Internamente calculamos a diferenca
  (`novaContagem - saldoAtual`) e gravamos ela no historico, para que o
  extrato mostre o que de fato mudou (podendo ser negativa). Uma contagem
  igual ao saldo atual e rejeitada (nada a ajustar).
- **2.4 Filtro por periodo**: `GET /api/movements?from=2026-01-01&to=2026-01-31`.
  Datas sao validadas no formato `AAAA-MM-DD` e o filtro `to` e tratado como
  inclusivo (compara com o inicio do dia seguinte).

### Nivel 3 — Desafio

- **3.1 Autenticacao com JWT**: tabela `users` com senha em hash (`bcrypt`).
  `POST /api/auth/register`, `POST /api/auth/login` e `GET /api/auth/me`.
  Todas as rotas de **leitura** (GET) continuam publicas; toda **escrita**
  (POST/PUT/DELETE/PATCH) em categorias, produtos e movimentacoes exige um
  header `Authorization: Bearer <token>`. O front-end guarda o token no
  `localStorage`, esconde os botoes de criar/editar/excluir quando nao ha
  sessao, e redireciona para `/login.html` se o token expirar (401).
  **Usuario de exemplo**: `admin@estoquefacil.com` / `admin123`.
- **3.2 Exportar CSV**: `GET /api/products/export` baixa todos os produtos
  (incluindo inativos) em CSV, com escape correto de virgulas, aspas e
  quebras de linha nos campos de texto.
- **3.3 Testes automatizados**: `npm test` roda 25 testes com o runner nativo
  do Node (`node:test`), cobrindo as regras de negocio dos validators de
  produto e de movimentacao (precos, quantidades, SKU, ADJUST, periodo).
- **3.4 Grafico de 7 dias**: o dashboard devolve `last7Days`, uma serie com
  exatamente 7 posicoes (hoje e os 6 dias anteriores) com entradas e saidas
  por dia. Dias sem nenhuma movimentacao nao aparecem na consulta SQL — o
  preenchimento dos "buracos" com zero acontece no `dashboard-service.js`.
  O front-end desenha as barras com `<div>` + Tailwind, sem biblioteca de
  grafico.

### Rodando os testes automatizados

```bash
npm install
npm test
```

### Variaveis de ambiente novas (JWT)

```bash
JWT_SECRET=troque-este-segredo-em-producao-nao-use-isto-de-verdade
JWT_EXPIRES_IN=8h
```

Ja estao no `.env.example`. **Em producao, gere um `JWT_SECRET` aleatorio**
(por exemplo `openssl rand -hex 32`) — o valor de exemplo e so para rodar o
projeto localmente.

### Rotas novas / alteradas (resumo)

| Metodo | Rota | Autenticacao | Descricao |
|---|---|---|---|
| POST | `/api/auth/register` | nao | cria um usuario |
| POST | `/api/auth/login` | nao | devolve `{ user, token }` |
| GET | `/api/auth/me` | sim | dados do usuario logado |
| GET | `/api/products/export` | nao | exporta CSV |
| PATCH | `/api/products/:id/reactivate` | sim | reativa produto desativado |

Query params novos em `GET /api/products`: `orderBy`, `orderDir`, `page`,
`perPage`, `includeInactive`.

Query params novos em `GET /api/movements`: `from`, `to`.
