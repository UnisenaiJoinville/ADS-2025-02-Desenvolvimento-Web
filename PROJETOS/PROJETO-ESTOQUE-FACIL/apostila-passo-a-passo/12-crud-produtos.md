# Aula 12 — CRUD de Produtos

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática (código JavaScript)

---

## Objetivo

Construir o módulo de produtos: **o mesmo padrão** da aula anterior, agora com mais campos, mais validações e **filtros de busca**.

---

## Antes de começar

- [ ] Aula 11 concluída (CRUD de categorias funcionando)

---

## O que muda em relação às categorias

| Categorias | Produtos |
|---|---|
| 1 campo (`name`) | 8 campos |
| Validação simples | Validação de texto, dinheiro e inteiros |
| Sem relacionamento | Pertence a uma categoria |
| Sem filtros | Busca, categoria e estoque baixo |

A **estrutura** é idêntica: validator → repository → service → controller → routes.

---

## Passo 1 — O validador

Crie `src/modules/products/product-validator.js`:

```javascript
import { AppError } from "../../shared/errors/app-error.js";

function parseText(value, { field, maxLength, required = true }) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");

  if (required && !text) {
    throw new AppError(`O campo ${field} e obrigatorio`);
  }

  if (text.length > maxLength) {
    throw new AppError(`O campo ${field} deve ter no maximo ${maxLength} caracteres`);
  }

  return text;
}

function parseMoney(value, field) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(`O campo ${field} deve ser um numero maior ou igual a zero`);
  }

  // Duas casas decimais, como no banco (DECIMAL(10,2))
  return Math.round(amount * 100) / 100;
}

function parseInteger(value, field) {
  const amount = Number(value);

  if (!Number.isInteger(amount) || amount < 0) {
    throw new AppError(`O campo ${field} deve ser um numero inteiro maior ou igual a zero`);
  }

  return amount;
}

export function validateProductInput(input) {
  const name = parseText(input?.name, { field: "nome", maxLength: 120 });
  const sku = parseText(input?.sku, { field: "SKU", maxLength: 40 }).toUpperCase();

  const costPrice = parseMoney(input?.costPrice ?? 0, "preco de custo");
  const salePrice = parseMoney(input?.salePrice ?? 0, "preco de venda");
  const quantity = parseInteger(input?.quantity ?? 0, "quantidade");
  const minimumStock = parseInteger(input?.minimumStock ?? 0, "estoque minimo");

  if (salePrice < costPrice) {
    throw new AppError("O preco de venda nao pode ser menor que o preco de custo");
  }

  let categoryId = null;

  if (input?.categoryId !== undefined && input?.categoryId !== null && input?.categoryId !== "") {
    categoryId = Number(input.categoryId);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw new AppError("Categoria invalida");
    }
  }

  const active = input?.active === undefined ? true : Boolean(input.active);

  return {
    name,
    sku,
    categoryId,
    costPrice,
    salePrice,
    quantity,
    minimumStock,
    active,
  };
}
```

Salve.

---

## Entendendo o validador

### 🧩 Funções auxiliares em vez de `if` repetido

Compare com o código problemático do Módulo 1:

```javascript
// ❌ Módulo 1: if dentro de if dentro de if
if (a == undefined || a == "") {
  console.log("erro");
} else {
  if (b == undefined || b == "") {
    console.log("erro");
  } else {
    if (c < 0) { ... }
  }
}
```

Aqui, cada **tipo de dado** ganhou sua própria função:

| Função | Cuida de | Usada em |
|---|---|---|
| `parseText` | Textos | nome, SKU |
| `parseMoney` | Valores monetários | preços |
| `parseInteger` | Números inteiros | quantidade, estoque mínimo |

E o validador principal fica legível de cima a baixo, como uma lista de exigências.

### `Number.isFinite` x `Number.isInteger`

Esta escolha é proposital:

| Função | Aceita | Rejeita | Usada para |
|---|---|---|---|
| `Number.isFinite` | `10`, `10.5`, `0.99` | `NaN`, `Infinity` | **Preços** (têm centavos) |
| `Number.isInteger` | `10`, `0` | `10.5`, `NaN` | **Quantidades** |

> 💭 **Por que quantidade não pode ser fracionada?** Porque não existe "meia caneta" no estoque. Se o seu negócio vendesse a granel (2,5 kg de café), aí a modelagem seria outra.

Ambas rejeitam `NaN`, que é o que acontece quando alguém manda `"abc"`:

```javascript
Number("abc")              // NaN
Number.isInteger(NaN)      // false ✅ rejeitado
```

### 💰 O arredondamento do dinheiro

```javascript
return Math.round(amount * 100) / 100;
```

Passo a passo com o valor `19.999`:

| Etapa | Resultado |
|---|---|
| `19.999 * 100` | `1999.9` |
| `Math.round(1999.9)` | `2000` |
| `2000 / 100` | `20` |

**Por que fazer isso?** Nossa coluna é `DECIMAL(10,2)`, ou seja, 2 casas. Se mandássemos `19.999`, o banco arredondaria por conta própria — e a API teria respondido um valor **diferente** do que ficou salvo. Arredondando antes, o que a API responde é exatamente o que está no banco.

### 🔤 O SKU em maiúsculas

```javascript
const sku = parseText(input?.sku, { field: "SKU", maxLength: 40 }).toUpperCase();
```

Isso normaliza a entrada. Assim `inf-003` e `INF-003` são o **mesmo** SKU, e a regra de unicidade funciona de verdade.

> 📌 Sem isso, o usuário conseguiria cadastrar `bеb-001` e `BEB-001` como produtos diferentes, e o `UNIQUE` do banco não impediria (para o MySQL são strings distintas, dependendo da collation).

### ⚖️ A validação que compara dois campos

```javascript
if (salePrice < costPrice) {
  throw new AppError("O preco de venda nao pode ser menor que o preco de custo");
}
```

Repare que ela vem **depois** das conversões individuais. Faz sentido: só dá para comparar dois valores depois de garantir que ambos são números válidos.

Essa é uma **regra de negócio** ("não vendemos com prejuízo") vivendo no validador porque depende só dos dados de entrada.

### O campo opcional `categoryId`

```javascript
if (input?.categoryId !== undefined && input?.categoryId !== null && input?.categoryId !== "") {
```

Três verificações porque o campo pode chegar de três jeitos "vazios" diferentes:

| Origem | Valor que chega |
|---|---|
| Campo ausente no JSON | `undefined` |
| JSON com `null` explícito | `null` |
| Formulário HTML com opção "Sem categoria" | `""` (string vazia) |

Nos três casos, o resultado é `categoryId = null` — produto sem categoria, o que é permitido.

### O booleano `active`

```javascript
const active = input?.active === undefined ? true : Boolean(input.active);
```

Se o campo não veio, assumimos `true` (produto novo nasce ativo). Se veio, convertemos explicitamente para booleano.

---

## Passo 2 — O repositório

Crie `src/modules/products/product-repository.js`:

```javascript
import { pool } from "../../config/database.js";

const SELECT_PRODUCT = `
  SELECT p.id,
         p.name,
         p.sku,
         p.category_id   AS categoryId,
         c.name          AS categoryName,
         p.cost_price    AS costPrice,
         p.sale_price    AS salePrice,
         p.quantity,
         p.minimum_stock AS minimumStock,
         p.active,
         p.created_at    AS createdAt,
         p.updated_at    AS updatedAt
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

export async function findAll({ search = "", categoryId = null, onlyLowStock = false } = {}) {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (categoryId) {
    conditions.push("p.category_id = ?");
    params.push(categoryId);
  }

  if (onlyLowStock) {
    conditions.push("p.quantity <= p.minimum_stock");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${SELECT_PRODUCT} ${where} ORDER BY p.name`,
    params
  );

  return rows.map(toProduct);
}

export async function findById(id) {
  const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [id]);

  return rows[0] ? toProduct(rows[0]) : undefined;
}

export async function findBySku(sku) {
  const [rows] = await pool.query(
    "SELECT id, sku FROM products WHERE sku = ?",
    [sku]
  );

  return rows[0];
}

export async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO products
       (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.sku,
      data.categoryId,
      data.costPrice,
      data.salePrice,
      data.quantity,
      data.minimumStock,
      data.active,
    ]
  );

  return findById(result.insertId);
}

export async function update(id, data) {
  await pool.query(
    `UPDATE products
        SET name = ?,
            sku = ?,
            category_id = ?,
            cost_price = ?,
            sale_price = ?,
            quantity = ?,
            minimum_stock = ?,
            active = ?
      WHERE id = ?`,
    [
      data.name,
      data.sku,
      data.categoryId,
      data.costPrice,
      data.salePrice,
      data.quantity,
      data.minimumStock,
      data.active,
      id,
    ]
  );

  return findById(id);
}

export async function remove(id) {
  const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);

  return result.affectedRows > 0;
}

// O MySQL devolve BOOLEAN como 0/1. Normalizamos para true/false.
function toProduct(row) {
  return {
    ...row,
    active: Boolean(row.active),
    lowStock: row.quantity <= row.minimumStock,
  };
}
```

Salve.

---

## Entendendo o repositório

### A constante `SELECT_PRODUCT`

```javascript
const SELECT_PRODUCT = `SELECT ... FROM products p LEFT JOIN categories c ...`;
```

O mesmo `SELECT` é usado em `findAll` e `findById`. Extraímos para uma constante e evitamos duplicação.

Depois, é só concatenar o que muda:

```javascript
`${SELECT_PRODUCT} WHERE p.id = ?`
`${SELECT_PRODUCT} ${where} ORDER BY p.name`
```

> ⚠️ **Atenção:** aqui estamos concatenando **estrutura de SQL** (cláusulas que nós escrevemos), nunca **valores do usuário**. Isso é seguro. Valores continuam indo por `?`.

### 🔍 Filtros dinâmicos, com segurança

Esta é a parte mais interessante do arquivo:

```javascript
const conditions = [];
const params = [];

if (search) {
  conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
  params.push(`%${search}%`, `%${search}%`);
}

if (categoryId) {
  conditions.push("p.category_id = ?");
  params.push(categoryId);
}

const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
```

**Como funciona:** montamos duas listas em paralelo — os **pedaços de SQL** e os **valores**.

Exemplo com busca por "caneta" na categoria 3:

```javascript
conditions = ["(p.name LIKE ? OR p.sku LIKE ?)", "p.category_id = ?"]
params     = ["%caneta%", "%caneta%", 3]
```

Que vira:

```sql
WHERE (p.name LIKE ? OR p.sku LIKE ?) AND p.category_id = ?
```

E sem nenhum filtro, `where` fica string vazia — a consulta traz tudo.

### O `%` do LIKE vai no valor, não no SQL

```javascript
params.push(`%${search}%`, `%${search}%`);
```

Repare: os `%` (curingas) fazem parte do **valor**, que continua indo por `?`. A proteção contra SQL Injection permanece intacta.

| Busca | Valor enviado | Encontra |
|---|---|---|
| `caneta` | `%caneta%` | "Caneta esferografica", "Porta-caneta" |

### 🎯 A função `toProduct`

```javascript
function toProduct(row) {
  return {
    ...row,
    active: Boolean(row.active),
    lowStock: row.quantity <= row.minimumStock,
  };
}
```

Esta função pequena faz duas coisas valiosas:

**1. Corrige o booleano**

O MySQL não tem `BOOLEAN` de verdade — ele guarda `0` e `1`. Sem essa conversão, o front-end receberia:

```json
{ "active": 1 }
```

E `if (product.active)` funcionaria por acaso, mas `product.active === true` seria `false`. Convertemos para evitar surpresas.

**2. Cria um campo calculado**

```javascript
lowStock: row.quantity <= row.minimumStock
```

`lowStock` **não existe no banco** — é calculado na hora. O front-end usa esse campo para pintar o alerta vermelho, sem precisar repetir a comparação em cada tela.

> 📌 **Vantagem:** se um dia a regra mudar (por exemplo, alertar com 10% de folga), você muda **aqui**, em um lugar só.

### O `...row` (spread)

```javascript
return { ...row, active: ..., lowStock: ... };
```

Copia todos os campos de `row` e depois **sobrescreve** `active` e acrescenta `lowStock`. É a forma moderna de criar um objeto modificado sem alterar o original.

---

## Passo 3 — O service

Crie `src/modules/products/product-service.js`:

```javascript
import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import * as categoryRepository from "../categories/category-repository.js";

import * as repository from "./product-repository.js";
import { validateProductInput } from "./product-validator.js";

async function ensureCategoryExists(categoryId) {
  if (categoryId === null) {
    return;
  }

  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new AppError("Categoria informada nao existe");
  }
}

export async function listProducts(filters) {
  return repository.findAll(filters);
}

export async function getProduct(id) {
  const product = await repository.findById(id);

  if (!product) {
    throw new NotFoundError("Produto nao encontrado");
  }

  return product;
}

export async function createProduct(input) {
  const data = validateProductInput(input);

  const existing = await repository.findBySku(data.sku);

  if (existing) {
    throw new ConflictError(`Ja existe um produto com o SKU ${data.sku}`);
  }

  await ensureCategoryExists(data.categoryId);

  return repository.create(data);
}

export async function updateProduct(id, input) {
  await getProduct(id);

  const data = validateProductInput(input);

  const existing = await repository.findBySku(data.sku);

  if (existing && existing.id !== Number(id)) {
    throw new ConflictError(`Ja existe um produto com o SKU ${data.sku}`);
  }

  await ensureCategoryExists(data.categoryId);

  return repository.update(id, data);
}

export async function deleteProduct(id) {
  await getProduct(id);

  await repository.remove(id);
}
```

Salve.

### 🔗 Um service pode usar o repository de outro módulo

```javascript
import * as categoryRepository from "../categories/category-repository.js";
```

Isso é **legítimo**. A regra "não aceitar categoria inexistente" pertence ao domínio de produtos, então é o service de produtos que a aplica.

**O que seria errado:** um repository chamar um service. Isso inverteria a direção das camadas e criaria dependência circular.

```text
   ✅ PERMITIDO                    ❌ PROIBIDO

   product-service                 product-repository
         |                                |
         v                                v
   category-repository              category-service
```

### 💭 "Mas a chave estrangeira já não garante isso?"

Excelente pergunta. Sim, o banco recusaria um `category_id` inexistente. Mas veja a diferença na mensagem:

| Sem a validação | Com a validação |
|---|---|
| `ER_NO_REFERENCED_ROW_2: Cannot add or update a child row: a foreign key constraint fails` | `Categoria informada nao existe` |

A primeira é críptica e vaza detalhes internos. A segunda o usuário entende.

> 📌 **Padrão:** valide na aplicação para dar boa mensagem; mantenha a restrição no banco como rede de segurança.

### A ordem das verificações

```javascript
await getProduct(id);                      // 1. o produto existe?
const data = validateProductInput(input);  // 2. os dados são válidos?
const existing = await repository.findBySku(data.sku);  // 3. o SKU é de outro?
await ensureCategoryExists(data.categoryId);            // 4. a categoria existe?
```

Cada passo só roda se o anterior passou — **fail fast** de novo.

---

## Passo 4 — O controller

Crie `src/modules/products/product-controller.js`:

```javascript
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";

export async function index(request, response) {
  const { search, categoryId, lowStock } = request.query;

  const products = await service.listProducts({
    search: typeof search === "string" ? search.trim() : "",
    categoryId: categoryId ? parseId(categoryId, "categoryId") : null,
    onlyLowStock: lowStock === "true",
  });

  response.json(products);
}

export async function show(request, response) {
  const id = parseId(request.params.id);
  const product = await service.getProduct(id);

  response.json(product);
}

export async function store(request, response) {
  const product = await service.createProduct(request.body);

  response.status(201).json(product);
}

export async function update(request, response) {
  const id = parseId(request.params.id);
  const product = await service.updateProduct(id, request.body);

  response.json(product);
}

export async function destroy(request, response) {
  const id = parseId(request.params.id);

  await service.deleteProduct(id);

  response.status(204).send();
}
```

Salve.

### 📥 `request.query` — os parâmetros da URL

Quando alguém acessa:

```text
/api/products?search=caneta&categoryId=3&lowStock=true
```

O Express entrega:

```javascript
request.query = {
  search: "caneta",
  categoryId: "3",       // ← STRING!
  lowStock: "true"       // ← STRING!
}
```

### ⚠️ A armadilha do booleano na query string

```javascript
onlyLowStock: lowStock === "true",
```

**Por que comparar com a string `"true"`?**

Porque na URL **tudo é texto**. E, em JavaScript, qualquer string não vazia é "verdadeira":

```javascript
Boolean("true")    // true
Boolean("false")   // true  😱 !!!
```

Se escrevêssemos `Boolean(lowStock)`, o filtro ficaria ligado mesmo com `?lowStock=false`.

> 📌 Este é exatamente o tipo de bug de coerção que estudamos no Módulo 1. A solução é sempre a mesma: **comparação estrita e conversão explícita**.

---

## Passo 5 — As rotas

Crie `src/modules/products/product-routes.js`:

```javascript
import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./product-controller.js";

export const productRoutes = Router();

productRoutes.get("/", asyncHandler(controller.index));
productRoutes.get("/:id", asyncHandler(controller.show));
productRoutes.post("/", asyncHandler(controller.store));
productRoutes.put("/:id", asyncHandler(controller.update));
productRoutes.delete("/:id", asyncHandler(controller.destroy));
```

Salve.

> 👀 Idêntico ao de categorias, trocando apenas os nomes. É o padrão se repetindo.

---

## Passo 6 — Registrar o módulo

Abra `src/routes/index.js` e acrescente as duas linhas marcadas:

```javascript
import { Router } from "express";

import { categoryRoutes } from "../modules/categories/category-routes.js";
import { productRoutes } from "../modules/products/product-routes.js";

export const routes = Router();

routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

routes.use("/categories", categoryRoutes);
routes.use("/products", productRoutes);
```

Salve.

---

## Passo 7 — Testar

### Criar um produto

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Notebook Dell","sku":"inf-003","categoryId":4,"costPrice":2500,"salePrice":3400,"quantity":10,"minimumStock":2}'
```

```json
{"id":8,"name":"Notebook Dell","sku":"INF-003","categoryId":4,
 "categoryName":"Informatica","costPrice":2500,"salePrice":3400,
 "quantity":10,"minimumStock":2,"active":true,"lowStock":false, ...}
```

> 🎯 **Três coisas para observar:**
> 1. Mandamos `"inf-003"` e voltou `"INF-003"` → o `.toUpperCase()` funcionou
> 2. Veio `categoryName: "Informatica"` → o `LEFT JOIN` funcionou
> 3. Veio `lowStock: false` → o campo calculado funcionou

### SKU duplicado

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Outro","sku":"INF-003","costPrice":1,"salePrice":2}'
```

```json
{"error":"Ja existe um produto com o SKU INF-003"}
```

### Preço de venda menor que o custo

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","sku":"TST-001","costPrice":50,"salePrice":10}'
```

```json
{"error":"O preco de venda nao pode ser menor que o preco de custo"}
```

### Categoria inexistente

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","sku":"TST-003","categoryId":999,"costPrice":1,"salePrice":2}'
```

```json
{"error":"Categoria informada nao existe"}
```

### Os filtros

```bash
# Buscar por parte do nome
curl "http://localhost:3000/api/products?search=note"

# Só os que estão acabando
curl "http://localhost:3000/api/products?lowStock=true"

# Por categoria
curl "http://localhost:3000/api/products?categoryId=3"

# Combinando filtros
curl "http://localhost:3000/api/products?search=caneta&categoryId=3"
```

> ⚠️ **Use aspas na URL com `&`** no terminal. Sem elas, o shell interpreta o `&` como "rodar em segundo plano".

### Atualizar e excluir

```bash
curl -X PUT http://localhost:3000/api/products/8 \
  -H "Content-Type: application/json" \
  -d '{"name":"Notebook Dell i7","sku":"INF-003","categoryId":4,"costPrice":2600,"salePrice":3600,"quantity":20,"minimumStock":3,"active":true}'

curl -i -X DELETE http://localhost:3000/api/products/8
```

---

## ✅ Confira se deu certo

- [ ] Os 5 arquivos existem em `src/modules/products`
- [ ] `src/routes/index.js` registra `/products`
- [ ] Criar produto devolve `201` com `categoryName` e `lowStock`
- [ ] SKU em minúsculas é salvo em MAIÚSCULAS
- [ ] SKU duplicado devolve conflito
- [ ] Venda menor que custo é rejeitada
- [ ] Categoria inexistente é rejeitada
- [ ] Os três filtros funcionam
- [ ] `?lowStock=true` traz 3 produtos

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| `Column count doesn't match` | Faltou um `?` no INSERT | Conte: 8 colunas, 8 `?`, 8 valores no array |
| Filtro não funciona | Nome do parâmetro errado | É `?lowStock=true`, com L maiúsculo |
| `categoryName` vem `null` | Produto sem categoria | Normal! O `LEFT JOIN` permite isso |
| `lowStock` sempre `false` | Esqueceu o `toProduct` | Confira se `findAll` tem `.map(toProduct)` |
| O terminal travou ao usar `&` | Falta de aspas | `curl "http://...?a=1&b=2"` |

---

## ➡️ Próximo passo

Agora vem a aula mais importante do curso: fazer o estoque somar e subtrair **com segurança**.

**[Aula 13 — Movimentações e Transações](13-movimentacoes-transacoes.md)** ⭐
