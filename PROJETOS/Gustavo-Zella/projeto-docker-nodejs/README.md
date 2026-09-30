# Estoque Facil

Sistema de gestao de estoque construido com **Node.js + Express + MySQL + Docker**,
com front-end em HTML/Tailwind puro (sem build, sem framework).

Projeto desenvolvido seguindo a apostila passo a passo (etapas 00 a 22).

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
