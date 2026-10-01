# Etapa 11 — CRUD de Categorias

📋 **Tipo:** prática (código JavaScript)

---

## Objetivo

Construir o **primeiro módulo completo** do sistema, com as 4 camadas + validador.

Este módulo é o mais simples de todos, e por isso é o modelo: os outros três seguem exatamente o mesmo padrão.

---

## Antes de começar

- [ ] Etapa 10 concluída (API respondendo em `http://localhost:3000/api/health`)
- [ ] Containers rodando (`docker compose ps` mostra os dois `Up`)

---

## O que é um CRUD?

São as quatro operações básicas de qualquer cadastro:

| Letra | Operação | Método HTTP | Rota |
|---|---|---|---|
| **C** | *Create* (criar) | `POST` | `/api/categories` |
| **R** | *Read* (ler) | `GET` | `/api/categories` e `/api/categories/:id` |
| **U** | *Update* (atualizar) | `PUT` | `/api/categories/:id` |
| **D** | *Delete* (excluir) | `DELETE` | `/api/categories/:id` |

---

## A ordem em que vamos criar os arquivos

Vamos construir **de baixo para cima**, seguindo o fluxo de dados:

```text
   5. category-routes.js       <- por último: define as URLs
            ^
   4. category-controller.js   <- lê requisição / escreve resposta
            ^
   3. category-service.js      <- regras de negócio
            ^
   2. category-repository.js   <- fala com o banco
            ^
   1. category-validator.js    <- primeiro: valida os dados
```

> 💡 **Por que essa ordem?** Porque cada arquivo usa o anterior. Se fizéssemos ao contrário, o VS Code ficaria reclamando de imports quebrados o tempo todo.

Todos os arquivos ficam em `src/modules/categories/`.

---

## Passo 1 — O validador

Crie `src/modules/categories/category-validator.js`:

```javascript
import { AppError } from "../../shared/errors/app-error.js";

export function validateCategoryInput(input) {
  const name = String(input?.name ?? "").trim().replace(/\s+/g, " ");

  if (!name) {
    throw new AppError("O nome da categoria e obrigatorio");
  }

  if (name.length > 80) {
    throw new AppError("O nome da categoria deve ter no maximo 80 caracteres");
  }

  return { name };
}
```

Salve.

### 🔍 Dissecando a linha mais importante

```javascript
const name = String(input?.name ?? "").trim().replace(/\s+/g, " ");
```

Parece uma linha só, mas são **cinco proteções** encadeadas. Vamos da direita para a esquerda:

| Trecho | O que faz | Exemplo |
|---|---|---|
| `input?.name` | *Optional chaining*: não quebra se `input` for `undefined` | `undefined?.name` → `undefined` (sem erro!) |
| `?? ""` | Se for `null`/`undefined`, usa string vazia | `undefined ?? ""` → `""` |
| `String(...)` | Conversão explícita (o cliente pode mandar número) | `String(123)` → `"123"` |
| `.trim()` | Remove espaços das pontas | `"  Bebidas  "` → `"Bebidas"` |
| `.replace(/\s+/g, " ")` | Colapsa espaços internos | `"Bebidas    Geladas"` → `"Bebidas Geladas"` |

**Sem o optional chaining**, se alguém mandasse uma requisição com corpo vazio:

```javascript
input.name              // 💥 TypeError: Cannot read properties of undefined
input?.name             // ✅ undefined, sem quebrar
```

### 🧹 O validador sempre devolve dado limpo

```javascript
return { name };
```

Repare: ele não devolve `true`/`false`. Ele devolve o **dado já normalizado**.

> 📌 **Princípio importante:** depois do validador, as camadas seguintes podem confiar 100% no dado. Ninguém precisa fazer `trim()` de novo, nem checar se é string.

Isso se chama **validar nas fronteiras**: sujeira é limpa na porta de entrada, não espalhada pelo sistema.

---

## Passo 2 — O repositório

Crie `src/modules/categories/category-repository.js`:

```javascript
import { pool } from "../../config/database.js";

export async function findAll() {
  const [rows] = await pool.query(
    `SELECT c.id,
            c.name,
            c.created_at AS createdAt,
            COUNT(p.id) AS productCount
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.created_at
      ORDER BY c.name`
  );

  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, created_at AS createdAt FROM categories WHERE id = ?",
    [id]
  );

  return rows[0];
}

export async function findByName(name) {
  const [rows] = await pool.query(
    "SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)",
    [name]
  );

  return rows[0];
}

export async function create({ name }) {
  const [result] = await pool.query(
    "INSERT INTO categories (name) VALUES (?)",
    [name]
  );

  return findById(result.insertId);
}

export async function update(id, { name }) {
  await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);

  return findById(id);
}

export async function remove(id) {
  const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);

  return result.affectedRows > 0;
}
```

Salve.

---

## 🚨 O ponto mais importante desta etapa: SQL Injection

Repare que **todos** os valores entram por `?`:

```javascript
pool.query("SELECT ... WHERE id = ?", [id]);
```

### Por que nunca concatenar?

Veja o jeito **errado**:

```javascript
// ❌ NUNCA FAÇA ISSO
pool.query(`SELECT * FROM categories WHERE name = '${name}'`);
```

Agora imagine que alguém envie este nome:

```text
x'; DROP TABLE categories; --
```

O SQL montado ficaria:

```sql
SELECT * FROM categories WHERE name = 'x'; DROP TABLE categories; --'
```

O banco executaria **dois comandos**: a busca e a **destruição da tabela**.

### Como o `?` protege

```javascript
// ✅ CORRETO
pool.query("SELECT * FROM categories WHERE name = ?", [name]);
```

Com o `?`, o driver envia o **comando** e os **valores** separadamente. O banco monta a consulta sabendo que aquele valor é **dado**, jamais comando. O texto malicioso vira apenas... um nome esquisito de categoria.

> ⚠️ **Regra absoluta:** valor de variável em SQL entra **sempre** por `?`. Sem exceção. Nunca use crase, `+` ou template string para inserir valores.

---

## Entendendo o resto do repositório

### `const [rows] = await pool.query(...)`

Por que os colchetes? Porque o `mysql2` devolve um **array com dois elementos**:

```javascript
const resultado = await pool.query("SELECT ...");
// resultado = [ linhas, metadados ]

const [rows] = await pool.query("SELECT ...");
// rows = só as linhas   ← é o que queremos
```

Isso se chama **desestruturação de array**.

### Em `INSERT`, o primeiro elemento muda

```javascript
const [result] = await pool.query("INSERT INTO categories (name) VALUES (?)", [name]);
result.insertId       // o id gerado pelo AUTO_INCREMENT
result.affectedRows   // quantas linhas foram afetadas
```

É por isso que, depois de inserir, conseguimos devolver o registro completo:

```javascript
return findById(result.insertId);
```

### `AS createdAt` — traduzindo nomes

```sql
c.created_at AS createdAt
```

| Mundo | Padrão | Exemplo |
|---|---|---|
| SQL | `snake_case` | `created_at` |
| JavaScript | `camelCase` | `createdAt` |

O `AS` faz a tradução **já na consulta**, para o JavaScript receber o nome no padrão dele.

### O `LEFT JOIN` com `COUNT`

```sql
SELECT c.id, c.name, COUNT(p.id) AS productCount
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name, c.created_at
```

Isso conta **quantos produtos** cada categoria tem.

**Por que `LEFT JOIN` e não `INNER JOIN`?**

| Tipo | Comportamento com categoria vazia |
|---|---|
| `INNER JOIN` | A categoria **sumiria** da lista |
| `LEFT JOIN` | A categoria aparece com `productCount = 0` ✅ |

Como queremos listar **todas** as categorias, usamos `LEFT JOIN`.

### `LOWER()` — busca sem diferenciar maiúsculas

```sql
WHERE LOWER(name) = LOWER(?)
```

Assim, `"Bebidas"`, `"bebidas"` e `"BEBIDAS"` são tratadas como a mesma coisa. É o que permite detectar duplicatas de verdade.

---

## Passo 3 — O service (regras de negócio)

Crie `src/modules/categories/category-service.js`:

```javascript
import { ConflictError, NotFoundError } from "../../shared/errors/app-error.js";

import * as repository from "./category-repository.js";
import { validateCategoryInput } from "./category-validator.js";

export async function listCategories() {
  return repository.findAll();
}

export async function getCategory(id) {
  const category = await repository.findById(id);

  if (!category) {
    throw new NotFoundError("Categoria nao encontrada");
  }

  return category;
}

export async function createCategory(input) {
  const data = validateCategoryInput(input);

  const existing = await repository.findByName(data.name);

  if (existing) {
    throw new ConflictError("Ja existe uma categoria com esse nome");
  }

  return repository.create(data);
}

export async function updateCategory(id, input) {
  await getCategory(id);

  const data = validateCategoryInput(input);

  const existing = await repository.findByName(data.name);

  if (existing && existing.id !== Number(id)) {
    throw new ConflictError("Ja existe uma categoria com esse nome");
  }

  return repository.update(id, data);
}

export async function deleteCategory(id) {
  await getCategory(id);

  await repository.remove(id);
}
```

Salve.

### 🧠 Aqui moram as regras de negócio

Compare as duas camadas:

| Repository | Service |
|---|---|
| "Busque a categoria com id 5" | "Se não achou, é erro 404" |
| "Busque categoria com nome X" | "Se já existe, não pode criar" |
| Sabe **como** buscar | Sabe **o que fazer** com o resultado |

### O service não conhece HTTP

Repare: nenhuma menção a `request`, `response`, `status`. Ele apenas **lança erros**.

Quem traduz `NotFoundError` em status 404 é o `errorHandler` da Etapa 08.

> 📌 **Vantagem:** esse mesmo service poderia ser usado por um script de linha de comando, por um job agendado ou por testes automatizados — sem nenhuma adaptação.

### 🔍 O `import * as repository`

```javascript
import * as repository from "./category-repository.js";
```

Isso importa **tudo** do arquivo em um único objeto:

```javascript
repository.findAll()
repository.findById(5)
repository.create({ name: "Bebidas" })
```

**Por que fazer assim?** Fica claro na leitura que aquela chamada vai ao banco. Compare:

```javascript
const category = await findById(id);              // de onde vem isso?
const category = await repository.findById(id);   // ah, do banco ✅
```

### ⚠️ A linha mais sutil do arquivo

```javascript
if (existing && existing.id !== Number(id)) {
```

Isto está no `updateCategory` e merece atenção total.

**O problema:** você abre a categoria "Bebidas" para editar, muda só uma letra e salva. O sistema busca se existe categoria com aquele nome... **e encontra ela mesma!** Sem cuidado, você receberia "já existe uma categoria com esse nome" ao tentar salvar a própria categoria.

**A solução:** só é conflito se o nome pertencer a **outra** categoria:

```javascript
existing && existing.id !== Number(id)
//   ↑                    ↑
//   existe?              é uma OUTRA?
```

**E por que `Number(id)`?** Porque o `id` chega da URL como **string**, e usamos comparação **estrita**:

```javascript
"5" !== 5           // true  (tipos diferentes!) → bug
Number("5") !== 5   // false (correto) ✅
```

> 📌 Este é exatamente o problema clássico de coerção de tipos, aparecendo em um caso real.

### A ordem em `updateCategory`

```javascript
await getCategory(id);                     // 1. existe?
const data = validateCategoryInput(input); // 2. dados válidos?
const existing = await repository.findByName(data.name);  // 3. duplicado?
```

**Fail fast:** cada passo só acontece se o anterior passou. O usuário recebe o primeiro erro real, não uma mensagem confusa.

---

## Passo 4 — O controller

Crie `src/modules/categories/category-controller.js`:

```javascript
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./category-service.js";

export async function index(request, response) {
  const categories = await service.listCategories();

  response.json(categories);
}

export async function show(request, response) {
  const id = parseId(request.params.id);
  const category = await service.getCategory(id);

  response.json(category);
}

export async function store(request, response) {
  const category = await service.createCategory(request.body);

  response.status(201).json(category);
}

export async function update(request, response) {
  const id = parseId(request.params.id);
  const category = await service.updateCategory(id, request.body);

  response.json(category);
}

export async function destroy(request, response) {
  const id = parseId(request.params.id);

  await service.deleteCategory(id);

  response.status(204).send();
}
```

Salve.

### 👀 Repare como o controller é "magro"

Cada função tem 2 ou 3 linhas. Ele faz **só três coisas**:

1. Lê da requisição (`request.params`, `request.body`)
2. Chama o service
3. Escreve a resposta com o status certo

**Nenhuma** regra de negócio. **Nenhum** SQL. Se um controller seu começar a crescer, é sinal de que uma regra vazou para o lugar errado.

### Os nomes das funções

Usamos um padrão consagrado (vem do Rails e do Laravel):

| Função | Operação |
|---|---|
| `index` | Listar todos |
| `show` | Mostrar um |
| `store` | Criar |
| `update` | Atualizar |
| `destroy` | Excluir |

> 💡 `destroy` em vez de `delete` porque `delete` é **palavra reservada** do JavaScript.

### Os status HTTP corretos

| Ação | Status | Por quê |
|---|---|---|
| Listar / buscar | `200` OK | Padrão do `response.json()` |
| Criar | `201` Created | "Criei um recurso novo" |
| Excluir | `204` No Content | "Deu certo, e não tenho nada para devolver" |

Repare no `destroy`:

```javascript
response.status(204).send();
```

Usamos `.send()` sem argumento, **não** `.json()`. O status 204 significa literalmente "sem conteúdo" — mandar um corpo aí seria contraditório.

> ⚠️ Esse detalhe vai importar no front-end (Etapa 15): tentar ler JSON de uma resposta 204 dá erro.

---

## Passo 5 — As rotas

Crie `src/modules/categories/category-routes.js`:

```javascript
import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./category-controller.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", asyncHandler(controller.index));
categoryRoutes.get("/:id", asyncHandler(controller.show));
categoryRoutes.post("/", asyncHandler(controller.store));
categoryRoutes.put("/:id", asyncHandler(controller.update));
categoryRoutes.delete("/:id", asyncHandler(controller.destroy));
```

Salve.

### Lendo as rotas

```javascript
categoryRoutes.get("/:id", asyncHandler(controller.show));
//                ^        ^
//                |        o wrapper da Etapa 08
//                o ":" indica parâmetro variável
```

O `/` aqui é **relativo**. Como vamos montar este router em `/api/categories` (próximo passo), as rotas finais ficam:

| Definição | URL final |
|---|---|
| `.get("/")` | `GET /api/categories` |
| `.get("/:id")` | `GET /api/categories/5` |
| `.post("/")` | `POST /api/categories` |

### Por que todo handler está dentro de `asyncHandler`?

Porque **todos** são `async`. Sem o wrapper, um erro lançado lá dentro sumiria silenciosamente e o navegador ficaria travado (relembre a Etapa 08).

> 📌 **Regra do projeto:** se o handler é `async`, ele vai dentro de `asyncHandler`. Sempre.

---

## Passo 6 — Registrar o módulo

Abra `src/routes/index.js` e **substitua** o conteúdo:

```javascript
import { Router } from "express";

import { categoryRoutes } from "../modules/categories/category-routes.js";

export const routes = Router();

routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

routes.use("/categories", categoryRoutes);
```

Salve.

A linha nova é:

```javascript
routes.use("/categories", categoryRoutes);
```

Ela diz: *"tudo que começar com `/categories` é responsabilidade do `categoryRoutes`"*.

Somando com o `app.use("/api", routes)` do `app.js`, o caminho completo fica:

```text
   /api        +    /categories    +    /:id     =  /api/categories/5
   (app.js)         (index.js)          (category-routes.js)
```

---

## Passo 7 — Testar tudo

O `node --watch` já reiniciou o servidor. Confira:

```bash
docker compose logs api --tail 5
```

Agora vamos testar cada operação.

### Listar (deve trazer as 4 categorias do `init.sql`)

```bash
curl http://localhost:3000/api/categories
```

```json
[{"id":1,"name":"Bebidas","createdAt":"...","productCount":2}, ...]
```

> 👀 Repare no `productCount` — é o `COUNT` com `LEFT JOIN` funcionando.

### Criar

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Hortifruti"}'
```

```json
{"id":5,"name":"Hortifruti","createdAt":"2026-09-09 00:21:16"}
```

> ⚠️ O `-H "Content-Type: application/json"` é **obrigatório**. Sem ele, o `express.json()` não interpreta o corpo e `request.body` chega vazio.

### Testar a regra de duplicidade

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"  hortifruti  "}'
```

```json
{"error":"Ja existe uma categoria com esse nome"}
```

> 🎯 **Repare no que acabou de acontecer:** mandamos `"  hortifruti  "` com espaços e em minúsculas, e o sistema reconheceu como duplicata de `"Hortifruti"`. Isso é o `trim()` do validador **somado** ao `LOWER()` da consulta.

### Testar a validação

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"   "}'
```

```json
{"error":"O nome da categoria e obrigatorio"}
```

### Atualizar

```bash
curl -X PUT http://localhost:3000/api/categories/5 \
  -H "Content-Type: application/json" \
  -d '{"name":"Hortifruti e Frios"}'
```

### Buscar um id que não existe

```bash
curl http://localhost:3000/api/categories/999
```

```json
{"error":"Categoria nao encontrada"}
```

### Id inválido

```bash
curl http://localhost:3000/api/categories/abc
```

```json
{"error":"Parametro id invalido: abc"}
```

> ✅ Aqui você vê o `parseId` da Etapa 08 protegendo a aplicação.

### Excluir

```bash
curl -i -X DELETE http://localhost:3000/api/categories/5
```

O `-i` mostra os cabeçalhos. Você deve ver:

```text
HTTP/1.1 204 No Content
```

Sem corpo na resposta — exatamente como planejamos.

---

## 🎯 Recapitulando o caminho completo

Acompanhe o que aconteceu quando você criou a categoria:

```text
 curl POST /api/categories {"name":"Hortifruti"}
              |
   app.js     |  express.json() transforma em objeto
              v
   index.js   |  "/categories" -> categoryRoutes
              v
   routes.js  |  POST "/" -> asyncHandler(controller.store)
              v
   controller |  lê request.body e chama o service
              v
   service    |  valida, verifica duplicidade
              v
   repository |  INSERT INTO categories (name) VALUES (?)
              v
   MySQL      |  grava e devolve insertId = 5
              v
   repository |  findById(5) devolve o registro completo
              v
   controller |  response.status(201).json(category)
              v
   curl       |  {"id":5,"name":"Hortifruti",...}
```

**Este mesmo caminho vale para os outros três módulos.** Os próximos ficam mais rápidos.

---

## ✅ Confira se deu certo

```bash
ls src/modules/categories
```

```text
category-controller.js  category-repository.js  category-routes.js
category-service.js     category-validator.js
```

Marque:

- [ ] Os 5 arquivos existem
- [ ] `src/routes/index.js` tem `routes.use("/categories", categoryRoutes)`
- [ ] `GET /api/categories` lista as categorias com `productCount`
- [ ] Criar categoria devolve status `201`
- [ ] Nome duplicado devolve o erro de conflito
- [ ] Nome vazio devolve erro de validação
- [ ] `DELETE` devolve `204`
- [ ] Id inexistente devolve "Categoria nao encontrada"

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| `Cannot find module '../../shared/errors/app-error.js'` | Caminho errado | De `modules/categories`, são **dois** `../` para chegar em `src` |
| `request.body` é `undefined` | Faltou o header no curl | Use `-H "Content-Type: application/json"` |
| `Table 'categories' doesn't exist` | Banco sem tabelas | `docker compose down -v && docker compose up -d` |
| A rota devolve 404 | Não registrou no `index.js` | Confira o `routes.use("/categories", ...)` |
| `controller.index is not a function` | Erro no export | Confira se cada função tem `export` |
| Navegador travado, sem resposta | Handler async sem wrapper | Envolva com `asyncHandler(...)` |

---

## ➡️ Próximo passo

Primeiro CRUD pronto! Agora o mesmo padrão, com mais campos e filtros.

**[Etapa 12 — CRUD de Produtos](12-crud-produtos.md)**
