# Etapa 14 — Dashboard (API)

📋 **Tipo:** prática (SQL de agregação)

---

## Objetivo

Criar o endpoint que alimenta o dashboard, deixando o **banco de dados** fazer as contas — porque ele é muito mais rápido nisso do que o JavaScript.

Ao final, a API estará **completa**.

---

## Antes de começar

- [ ] Etapa 13 concluída (movimentações funcionando)

---

## A pergunta que abre a etapa

Queremos mostrar "valor total em estoque". Há dois caminhos:

### ❌ Caminho 1 — Trazer tudo e somar no JavaScript

```javascript
const products = await repository.findAll();          // traz 10.000 produtos
const total = products.reduce(
  (sum, p) => sum + p.quantity * p.costPrice, 0
);
```

**Problemas:**

- Trafega 10.000 registros pela rede
- Ocupa memória do servidor com dados que serão descartados
- O JavaScript soma um por um

### ✅ Caminho 2 — Pedir a conta pronta ao banco

```sql
SELECT SUM(quantity * cost_price) FROM products;
```

**Vantagens:**

- Trafega **um** número
- O banco é otimizado para isso há 30 anos
- Usa os índices que criamos

> 📌 **Regra:** se você só precisa do resultado da conta, faça a conta no banco.

---

## Passo 1 — O repositório

Crie `src/modules/dashboard/dashboard-repository.js`:

```javascript
import { pool } from "../../config/database.js";

export async function getSummary() {
  const [rows] = await pool.query(
    `SELECT COUNT(*)                                   AS totalProducts,
            COALESCE(SUM(quantity), 0)                 AS totalUnits,
            COALESCE(SUM(quantity * cost_price), 0)    AS stockCostValue,
            COALESCE(SUM(quantity * sale_price), 0)    AS stockSaleValue,
            SUM(CASE WHEN quantity <= minimum_stock THEN 1 ELSE 0 END) AS lowStockCount,
            SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END)              AS outOfStockCount
       FROM products
      WHERE active = TRUE`
  );

  return rows[0];
}

export async function getMonthTotals() {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS unitsOut
       FROM stock_movements
      WHERE YEAR(created_at)  = YEAR(CURRENT_DATE())
        AND MONTH(created_at) = MONTH(CURRENT_DATE())`
  );

  return rows[0];
}

export async function getStockByCategory() {
  const [rows] = await pool.query(
    `SELECT COALESCE(c.name, 'Sem categoria')            AS categoryName,
            COUNT(p.id)                                  AS productCount,
            COALESCE(SUM(p.quantity), 0)                 AS units,
            COALESCE(SUM(p.quantity * p.cost_price), 0)  AS costValue
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = TRUE
      GROUP BY c.id, c.name
      ORDER BY costValue DESC`
  );

  return rows;
}

export async function getLowStockProducts(limit = 5) {
  const [rows] = await pool.query(
    `SELECT id,
            name,
            sku,
            quantity,
            minimum_stock AS minimumStock
       FROM products
      WHERE active = TRUE
        AND quantity <= minimum_stock
      ORDER BY (quantity - minimum_stock) ASC, name
      LIMIT ?`,
    [limit]
  );

  return rows;
}

export async function getRecentMovements(limit = 8) {
  const [rows] = await pool.query(
    `SELECT m.id,
            m.type,
            m.quantity,
            m.created_at AS createdAt,
            p.name       AS productName,
            p.sku        AS productSku
       FROM stock_movements m
       INNER JOIN products p ON p.id = m.product_id
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ?`,
    [limit]
  );

  return rows;
}
```

Salve.

---

## Entendendo o SQL de agregação

### `SUM(quantity * cost_price)` — multiplicar e somar

```sql
SUM(quantity * cost_price) AS stockCostValue
```

O banco faz, linha por linha, e soma tudo:

| Produto | quantity | cost_price | Subtotal |
|---|---|---|---|
| Café | 40 | 28,00 | 1.120,00 |
| Água | 8 | 0,90 | 7,20 |
| Detergente | 60 | 1,80 | 108,00 |
| ... | | | |
| | | **TOTAL** | **2.744,70** |

Tudo isso em **uma passada** pela tabela.

### 🛡️ `COALESCE` — a proteção contra `NULL`

```sql
COALESCE(SUM(quantity), 0)
```

`COALESCE` devolve o **primeiro valor não nulo** da lista.

**Por que precisamos disso?** Porque `SUM` de uma tabela vazia devolve `NULL`, não zero:

```sql
-- Tabela sem nenhum produto ativo:
SELECT SUM(quantity) FROM products WHERE active = TRUE;
-- Resultado: NULL

SELECT COALESCE(SUM(quantity), 0) FROM products WHERE active = TRUE;
-- Resultado: 0  ✅
```

Sem o `COALESCE`, o dashboard mostraria "R$ null" no primeiro dia de uso do sistema.

> 📌 **Lembra do `NaN` em uma média sem itens?**
>
> ```javascript
> return soma / quantidade;   // 0 / 0 = NaN
> ```
>
> É **exatamente** o mesmo tipo de problema: sempre pense no caso do **conjunto vazio**.

### 🎯 `SUM(CASE WHEN ...)` — contagem condicional

```sql
SUM(CASE WHEN quantity <= minimum_stock THEN 1 ELSE 0 END) AS lowStockCount
```

Leia assim: *"para cada linha, se a condição for verdadeira some 1, senão some 0"*.

| Produto | quantity | minimum_stock | Condição | Soma |
|---|---|---|---|---|
| Café | 40 | 10 | falsa | 0 |
| Água | 8 | 20 | **verdadeira** | 1 |
| Caneta | 5 | 25 | **verdadeira** | 1 |
| Teclado | 3 | 4 | **verdadeira** | 1 |
| | | | **TOTAL** | **3** |

**Por que não fazer consultas separadas?** Porque assim o banco percorre a tabela **uma vez** e produz seis números diferentes. Com consultas separadas, seriam seis varreduras.

### O truque das entradas e saídas

```sql
SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS unitsIn,
SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS unitsOut
```

Aqui somamos a **quantidade** (não 1), separando por tipo. Em uma única consulta, obtemos os dois totais do mês.

### `GROUP BY` — agrupando por categoria

```sql
SELECT c.name, COUNT(p.id), SUM(p.quantity)
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 GROUP BY c.id, c.name
```

O `GROUP BY` junta as linhas por categoria e aplica as funções de agregação a **cada grupo**:

```text
   Produtos                         Agrupado por categoria
   --------                         ----------------------
   Café       (Bebidas)     ─┐
   Água       (Bebidas)     ─┴───>  Bebidas:    2 produtos, 48 un.
   Detergente (Limpeza)     ────>   Limpeza:    1 produto,  60 un.
   Papel      (Papelaria)   ─┐
   Caneta     (Papelaria)   ─┴───>  Papelaria:  2 produtos, 17 un.
```

### A ordenação inteligente do estoque baixo

```sql
ORDER BY (quantity - minimum_stock) ASC, name
```

Ordena pela **gravidade** do problema, não pela quantidade:

| Produto | quantity | mínimo | Diferença | Posição |
|---|---|---|---|---|
| Caneta | 5 | 25 | **-20** | 1º (mais grave) |
| Água | 8 | 20 | **-12** | 2º |
| Teclado | 3 | 4 | **-1** | 3º |

> 💡 Repare: o teclado tem *menos* unidades (3), mas está *menos* crítico, porque o mínimo dele é baixo. A diferença é a medida certa.

### `LIMIT ?` também é parâmetro

```javascript
`... LIMIT ?`, [limit]
```

Mesmo sendo um número interno nosso, passa por `?`. Bom hábito: **todo** valor vai por parâmetro.

---

## Passo 2 — O service

Crie `src/modules/dashboard/dashboard-service.js`:

```javascript
import * as repository from "./dashboard-repository.js";

export async function getDashboard() {
  // As consultas sao independentes: podemos executar em paralelo.
  const [summary, month, byCategory, lowStock, recentMovements] = await Promise.all([
    repository.getSummary(),
    repository.getMonthTotals(),
    repository.getStockByCategory(),
    repository.getLowStockProducts(5),
    repository.getRecentMovements(8),
  ]);

  const unitsIn = Number(month.unitsIn);
  const unitsOut = Number(month.unitsOut);

  return {
    totals: {
      totalProducts: Number(summary.totalProducts),
      totalUnits: Number(summary.totalUnits),
      stockCostValue: Number(summary.stockCostValue),
      stockSaleValue: Number(summary.stockSaleValue),
      // Lucro potencial se todo o estoque for vendido
      potentialProfit:
        Number(summary.stockSaleValue) - Number(summary.stockCostValue),
      lowStockCount: Number(summary.lowStockCount ?? 0),
      outOfStockCount: Number(summary.outOfStockCount ?? 0),
    },
    month: {
      unitsIn,
      unitsOut,
      balance: unitsIn - unitsOut,
    },
    byCategory: byCategory.map((row) => ({
      categoryName: row.categoryName,
      productCount: Number(row.productCount),
      units: Number(row.units),
      costValue: Number(row.costValue),
    })),
    lowStock,
    recentMovements,
  };
}
```

Salve.

---

## ⚡ `Promise.all` — o ganho de desempenho da etapa

Este é o conceito principal do service.

```javascript
const [summary, month, byCategory, lowStock, recentMovements] = await Promise.all([
  repository.getSummary(),
  repository.getMonthTotals(),
  ...
]);
```

As cinco consultas **não dependem umas das outras**. Compare:

### ❌ Sequencial

```javascript
const summary = await repository.getSummary();        // espera 20ms
const month = await repository.getMonthTotals();      // espera 20ms
const byCategory = await repository.getStockByCategory(); // espera 20ms
const lowStock = await repository.getLowStockProducts();  // espera 20ms
const recent = await repository.getRecentMovements();     // espera 20ms
// TOTAL: 100ms
```

```text
   |--20ms--|--20ms--|--20ms--|--20ms--|--20ms--|
   0                                          100ms
```

### ✅ Paralelo

```javascript
const [...] = await Promise.all([...]);
// TOTAL: ~20ms
```

```text
   |--20ms--|
   |--20ms--|
   |--20ms--|   todas ao mesmo tempo
   |--20ms--|
   |--20ms--|
   0      20ms
```

**Cinco vezes mais rápido**, só reorganizando o código.

> 📌 **Regra prática:** se uma operação `await` **não usa** o resultado da anterior, ela deveria estar em um `Promise.all`.

### ⚠️ O cuidado com `Promise.all`

Se **uma** das promises falhar, o `Promise.all` inteiro rejeita.

Aqui isso é o comportamento **correto**: um dashboard com um card faltando seria pior que uma mensagem de erro honesta.

> 💡 Se você quisesse "o que der certo, mostre", existe o `Promise.allSettled`. Mas não é o caso aqui.

### Por que tantos `Number(...)`?

```javascript
totalProducts: Number(summary.totalProducts),
```

Funções de agregação do MySQL às vezes voltam como **string**, dependendo do tipo da coluna.

Se não convertêssemos:

```javascript
"213" - "67"    // 146   (o "-" converte sozinho, por sorte)
"213" + "67"    // "21367"  😱 concatenou!
```

Convertendo no service, garantimos que o front-end **sempre** recebe número e que `unitsIn - unitsOut` faz subtração de verdade.

### O campo calculado `balance`

```javascript
month: {
  unitsIn,
  unitsOut,
  balance: unitsIn - unitsOut,
}
```

O saldo não vem do banco — é calculado aqui. É a informação que responde: *"neste mês, o estoque cresceu ou encolheu?"*

---

## Passo 3 — Controller e rotas

Crie `src/modules/dashboard/dashboard-controller.js`:

```javascript
import * as service from "./dashboard-service.js";

export async function index(request, response) {
  const dashboard = await service.getDashboard();

  response.json(dashboard);
}
```

Crie `src/modules/dashboard/dashboard-routes.js`:

```javascript
import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./dashboard-controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", asyncHandler(controller.index));
```

Salve os dois.

> 👀 Repare que o dashboard **não tem validator** — ele só lê dados, não recebe nada do usuário. Cada módulo tem o que precisa, nem mais nem menos.

---

## Passo 4 — O `routes/index.js` final

Abra `src/routes/index.js` e deixe assim (versão **final** do arquivo):

```javascript
import { Router } from "express";

import { categoryRoutes } from "../modules/categories/category-routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard-routes.js";
import { movementRoutes } from "../modules/movements/movement-routes.js";
import { productRoutes } from "../modules/products/product-routes.js";

export const routes = Router();

routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

routes.use("/categories", categoryRoutes);
routes.use("/products", productRoutes);
routes.use("/movements", movementRoutes);
routes.use("/dashboard", dashboardRoutes);
```

Salve.

> 📌 Repare como este arquivo virou um **índice** legível: em 5 linhas você entende tudo que a API oferece.

---

## Passo 5 — Testar

```bash
curl http://localhost:3000/api/dashboard
```

A resposta é grande. Para ver formatado:

```bash
curl -s http://localhost:3000/api/dashboard | python -m json.tool
```

Ou simplesmente abra no navegador:

```text
http://localhost:3000/api/dashboard
```

Você deve ver algo assim:

```json
{
  "totals": {
    "totalProducts": 7,
    "totalUnits": 146,
    "stockCostValue": 2744.7,
    "stockSaleValue": 4854,
    "potentialProfit": 2109.3,
    "lowStockCount": 3,
    "outOfStockCount": 0
  },
  "month": {
    "unitsIn": 213,
    "unitsOut": 67,
    "balance": 146
  },
  "byCategory": [
    { "categoryName": "Informatica", "productCount": 2, "units": 21, "costValue": 1242 },
    ...
  ],
  "lowStock": [
    { "id": 5, "name": "Caneta esferografica", "sku": "PAP-002", "quantity": 5, "minimumStock": 25 },
    ...
  ],
  "recentMovements": [ ... ]
}
```

### 🧪 Teste que o dashboard reage

Registre uma entrada e veja os números mudarem:

```bash
# 1. Anote o valor atual
curl -s http://localhost:3000/api/dashboard | grep -o '"unitsIn":[0-9]*'

# 2. Registre uma entrada de 100
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"type":"IN","quantity":100,"note":"Teste dashboard"}'

# 3. Veja que aumentou 100
curl -s http://localhost:3000/api/dashboard | grep -o '"unitsIn":[0-9]*'
```

> ✅ O dashboard não guarda nada: ele **calcula na hora**, a cada requisição. Por isso sempre reflete a realidade.

---

## 🎉 A API está completa!

Faça a conta do que você construiu:

| Módulo | Arquivos | Endpoints |
|---|---|---|
| categories | 5 | 5 |
| products | 5 | 5 |
| movements | 5 | 2 |
| dashboard | 4 | 1 |
| shared + config + core | 9 | 1 (health) |
| **Total** | **28** | **14** |

Teste todos de uma vez:

```bash
curl -s http://localhost:3000/api/health      | head -c 60; echo
curl -s http://localhost:3000/api/categories  | head -c 60; echo
curl -s http://localhost:3000/api/products    | head -c 60; echo
curl -s http://localhost:3000/api/movements   | head -c 60; echo
curl -s http://localhost:3000/api/dashboard   | head -c 60; echo
```

---

## ✅ Confira se deu certo

- [ ] Os 4 arquivos existem em `src/modules/dashboard`
- [ ] `src/routes/index.js` registra os **4** módulos
- [ ] `GET /api/dashboard` devolve as 5 seções
- [ ] `totals.stockCostValue` mostra um valor em reais
- [ ] `month.balance` é igual a `unitsIn - unitsOut`
- [ ] `lowStock` traz 3 produtos
- [ ] Ao registrar uma movimentação, os números mudam

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| Valores vêm como texto (`"2744.70"`) | Faltou `decimalNumbers` ou `Number()` | Confira o `database.js` (Etapa 07) e os `Number()` do service |
| `month` vem tudo zero | Não há movimentações **deste mês** | Registre uma movimentação nova e teste de novo |
| `null` em algum total | Faltou `COALESCE` | Confira o SQL do `getSummary` |
| `In aggregated query without GROUP BY...` | Coluna fora do `GROUP BY` | Todas as colunas não agregadas precisam estar no `GROUP BY` |
| Dashboard demora muito | Consultas em sequência | Confira se está usando `Promise.all` |

---

## ➡️ Próximo passo

Backend 100% pronto. Agora vamos construir a interface que consome tudo isso.

**[Etapa 15 — Base do front-end](15-front-base.md)**
