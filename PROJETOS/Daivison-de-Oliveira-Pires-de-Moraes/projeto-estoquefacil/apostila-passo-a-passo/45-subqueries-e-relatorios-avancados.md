# Aula 45 — Subqueries e relatórios avançados

⏱️ **Tempo estimado:** 60 minutos + exercícios
📋 **Tipo:** laboratório SQL + código + fechamento do bloco

---

## O que vamos construir

O último relatório e a tela completa:

```text
   GET /api/reports/abc-curve      ->  a curva ABC do estoque
```

```text
   [Produtos] [Movimentacoes] [Resumos] [Analises]
                                            ↑
                               ranking · produtos parados · curva ABC
```

E depois: o teste final do bloco, o dicionário de erros e os exercícios.

### Por que precisamos disso

A **curva ABC** responde a pergunta mais útil de gestão de estoque:

> "Quais poucos produtos concentram a maior parte do meu dinheiro?"

A regra empírica diz que ~20% dos itens costumam representar ~80% do valor. Esses são os itens **A** — os que merecem controle rigoroso.

### O conceito

Para calcular o percentual de cada produto, precisamos de **dois números na mesma linha**:

```text
   participação = valor DESTE produto  ÷  valor de TODOS os produtos
                  ───────────────────      ────────────────────────
                  uma linha                a tabela inteira
```

E aí aparece o problema: uma função de agregação **colapsa** as linhas (Aula 35). Se eu uso `SUM()`, perco as linhas individuais. Se não uso, não tenho o total.

A saída é uma **subquery**: uma consulta dentro da outra.

---

## Antes de começar

- [ ] [Aula 44](44-paginacao-ordenacao-csv.md) concluída
- [ ] Terminal do MySQL aberto

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
├── src/modules/reports/product-report-repository.js
├── src/modules/reports/report-service.js
├── src/modules/reports/report-controller.js
├── src/modules/reports/report-routes.js
├── public/relatorios.html     (versão final)
└── public/js/relatorios.js    (versão final)
```

---

# PARTE 1 — Subqueries

## 1. Os três lugares onde cabe uma subquery

```sql
-- 1. no SELECT: devolve UM valor por linha
SELECT name, (SELECT COUNT(*) FROM products) AS total_geral FROM products;

-- 2. no FROM: vira uma tabela temporária (chamada "derivada")
SELECT * FROM (SELECT name, quantity * cost_price AS valor FROM products) AS base;

-- 3. no WHERE: compara com o resultado de outra consulta
SELECT name FROM products WHERE category_id IN (SELECT id FROM categories WHERE name = 'Bebidas');
```

Vamos usar os três.

---

## 2. Subquery no `SELECT`

Rode no terminal:

```sql
SELECT p.name,
       (p.quantity * p.cost_price) AS valor,
       (SELECT SUM(p2.quantity * p2.cost_price) FROM products p2 WHERE p2.active = TRUE) AS total_geral
  FROM products p
 WHERE p.active = TRUE
 ORDER BY valor DESC
 LIMIT 5;
```

```text
+---------------------+---------+-------------+
| name                | valor   | total_geral |
+---------------------+---------+-------------+
| Cafe em graos 1kg   | 1120.00 |     3409.00 |
| Mouse sem fio       |  702.00 |     3409.00 |
| Teclado mecanico    |  540.00 |     3409.00 |
| Cha verde 50 saches |  400.50 |     3409.00 |
| Papel A4 500 folhas |  264.00 |     3409.00 |
+---------------------+---------+-------------+
```

🎉 **O total aparece em todas as linhas** — exatamente o que precisávamos para dividir.

### 🔍 A regra da subquery no `SELECT`

> Ela precisa devolver **exatamente uma linha e uma coluna**.

Faz sentido: o resultado vai caber numa célula. Se devolvesse duas linhas, qual delas?

```sql
SELECT name, (SELECT id FROM categories) FROM products;
```

```text
ERROR 1242 (21000): Subquery returns more than 1 row
```

### 🔍 `p2`, e não `p`

```sql
(SELECT SUM(p2.quantity * p2.cost_price) FROM products p2 WHERE p2.active = TRUE)
```

A subquery usa a **mesma tabela** da consulta de fora. Sem um apelido diferente, o banco não saberia de qual `products` você está falando.

> 📌 **Apelidos distintos são obrigatórios** sempre que a mesma tabela aparece duas vezes.

### 🔍 Subquery correlacionada × independente

| Tipo | Característica | Custo |
|---|---|---|
| **Independente** | não menciona a consulta de fora | roda **uma vez** |
| **Correlacionada** | usa uma coluna de fora | roda **para cada linha** |

A nossa é independente: `WHERE p2.active = TRUE` não cita `p`. O MySQL calcula o total uma vez e reaproveita.

Se fosse correlacionada — por exemplo, "o total da categoria **desta** linha" — ela rodaria 12 vezes. Com 50.000 produtos, 50.000 vezes.

```sql
-- CORRELACIONADA: repare no p.category_id vindo de fora
SELECT p.name,
       (SELECT COUNT(*) FROM products p2 WHERE p2.category_id = p.category_id) AS irmaos
  FROM products p;
```

> ⚠️ **Subquery correlacionada é a causa número 1 de relatório lento.** Quando vir uma, pergunte: dá para resolver com `JOIN` + `GROUP BY`?

---

## 3. Subquery no `FROM`: a tabela derivada

O problema agora é outro: queremos **usar** o resultado de um cálculo em outro cálculo.

```sql
SELECT name,
       (quantity * cost_price) AS valor,
       ROUND(100 * valor / 3409, 2) AS percentual   -- ❌ não funciona
  FROM products;
```

```text
ERROR 1054 (42S22): Unknown column 'valor' in 'field list'
```

### 🔍 Por que o apelido não serve ali

É a ordem de execução de novo ([Aula 34](34-select-filtros-ordenacao.md)): todas as colunas do `SELECT` são calculadas **na mesma etapa**. Uma não enxerga a outra.

```text
   ORDER BY   enxerga o apelido  ✅  (roda depois do SELECT)
   HAVING     enxerga (no MySQL) ✅
   SELECT     NÃO enxerga        ❌  (está sendo calculado agora)
   WHERE      NÃO enxerga        ❌  (roda antes)
```

### A solução: dois níveis

```sql
SELECT base.name,
       base.valor,
       ROUND(100 * base.valor / base.total, 2) AS percentual
  FROM (
         SELECT p.name,
                (p.quantity * p.cost_price) AS valor,
                (SELECT SUM(p2.quantity * p2.cost_price) FROM products p2 WHERE p2.active = TRUE) AS total
           FROM products p
          WHERE p.active = TRUE
       ) AS base
 ORDER BY base.valor DESC
 LIMIT 5;
```

```text
+---------------------+---------+------------+
| name                | valor   | percentual |
+---------------------+---------+------------+
| Cafe em graos 1kg   | 1120.00 |      32.85 |
| Mouse sem fio       |  702.00 |      20.59 |
| Teclado mecanico    |  540.00 |      15.84 |
| Cha verde 50 saches |  400.50 |      11.75 |
| Papel A4 500 folhas |  264.00 |       7.74 |
+---------------------+---------+------------+
```

### 🔍 Como pensar numa tabela derivada

```text
   ┌─ consulta de FORA ────────────────────────────┐
   │  SELECT base.name, ROUND(100 * base.valor…)   │
   │    FROM  ┌─ consulta de DENTRO ───────────┐   │
   │          │  SELECT name, (q * c) AS valor │   │
   │          │    FROM products               │   │
   │          └────────────────────────────────┘   │
   │          AS base                              │
   └───────────────────────────────────────────────┘
```

A de dentro roda primeiro e produz uma tabela **temporária**. A de fora trata essa tabela como se fosse real — inclusive usando os apelidos dela.

> ⚠️ **O `AS base` é obrigatório.** Toda tabela derivada precisa de nome no MySQL. Sem ele:
>
> ```text
> ERROR 1248 (42000): Every derived table must have its own alias
> ```

### 🔍 `NULLIF`: evitando a divisão por zero

```sql
ROUND(100 * base.stockCostValue / NULLIF(base.totalValue, 0), 2)
```

`NULLIF(a, b)` devolve `NULL` quando `a = b`.

```text
   totalValue = 0  ->  NULLIF(0, 0) = NULL  ->  divisão por NULL = NULL
```

E dividir por `NULL` devolve `NULL`, não um erro. Num banco vazio, o percentual vem `null` em vez de derrubar a consulta.

> 💡 É o par do `COALESCE`: um troca o nulo por valor, o outro troca o valor por nulo. Os dois servem para domar casos de borda.

---

## Passo 1 — A curva ABC no repositório

Acrescente ao `src/modules/reports/product-report-repository.js`:

```javascript
// Curva ABC: classifica os produtos pela participacao no valor do
// estoque. A subquery existe porque precisamos do valor de CADA
// produto e do TOTAL geral na mesma linha - e um nao cabe dentro
// do outro sem um nivel a mais de consulta.
export async function getAbcCurve() {
  const [rows] = await pool.query(
    `SELECT base.id,
            base.name,
            base.sku,
            base.categoryName,
            base.stockCostValue,
            ROUND(100 * base.stockCostValue / NULLIF(base.totalValue, 0), 2) AS sharePercent,
            CASE
              WHEN 100 * base.stockCostValue / NULLIF(base.totalValue, 0) >= 20 THEN 'A'
              WHEN 100 * base.stockCostValue / NULLIF(base.totalValue, 0) >=  5 THEN 'B'
              ELSE 'C'
            END AS abcClass
       FROM (
             SELECT p.id,
                    p.name,
                    p.sku,
                    COALESCE(c.name, 'Sem categoria') AS categoryName,
                    (p.quantity * p.cost_price)       AS stockCostValue,
                    (SELECT COALESCE(SUM(p2.quantity * p2.cost_price), 0)
                       FROM products p2
                      WHERE p2.active = TRUE)         AS totalValue
               FROM products p
               LEFT JOIN categories c ON c.id = p.category_id
              WHERE p.active = TRUE
            ) AS base
      ORDER BY base.stockCostValue DESC, base.name`
  );

  return rows;
}
```

Salve.

### 🔍 As faixas A, B e C

```sql
CASE
  WHEN ... >= 20 THEN 'A'
  WHEN ... >=  5 THEN 'B'
  ELSE 'C'
END AS abcClass
```

| Classe | Participação | O que significa na gestão |
|---|---|---|
| **A** | ≥ 20% | poucos itens, muito dinheiro: contagem frequente |
| **B** | 5% a 20% | atenção moderada |
| **C** | < 5% | muitos itens, pouco dinheiro: controle simples |

> 🔍 **Os cortes são uma escolha, não uma lei.** A curva ABC clássica usa percentual **acumulado** (80/15/5), que exige funções de janela (`SUM(...) OVER (ORDER BY ...)`). Usamos a participação individual porque é mais simples de ler e já ensina a subquery. A versão acumulada fica como exercício.

### ⚠️ A expressão repetida três vezes

```sql
100 * base.stockCostValue / NULLIF(base.totalValue, 0)
```

Ela aparece no `ROUND` e nas duas condições do `CASE`. Incômodo — e inevitável, pelo mesmo motivo de antes: o `SELECT` não enxerga os próprios apelidos.

> 💡 **Daria para resolver com um terceiro nível** de tabela derivada, calculando `sharePercent` num nível e classificando no outro. Fica mais limpo e mais longo. É uma troca legítima; aqui escolhemos repetir.

---

## Passo 2 — Service, controller e rotas

Em `report-service.js`:

```javascript
export async function getAbcCurve() {
  const rows = await productRepository.getAbcCurve();

  return rows.map((row) => ({
    ...row,
    stockCostValue: Number(row.stockCostValue),
    sharePercent: Number(row.sharePercent ?? 0),
  }));
}
```

Em `report-controller.js`:

```javascript
export async function abcCurve(request, response) {
  const rows = await service.getAbcCurve();

  response.json(rows);
}
```

E o `report-routes.js` fica, finalmente, completo:

```javascript
import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./report-controller.js";

export const reportRoutes = Router();

// Todas estas rotas ja estao protegidas: o ensureAuthenticated do
// routes/index.js roda antes de qualquer uma delas (Aula 27).

// --- Relatorios de produtos e estoque ---
reportRoutes.get("/products", asyncHandler(controller.products));
reportRoutes.get("/stock-summary", asyncHandler(controller.stockSummary));
reportRoutes.get("/stock-by-category", asyncHandler(controller.stockByCategory));
reportRoutes.get("/products-without-movement", asyncHandler(controller.productsWithoutMovement));
reportRoutes.get("/abc-curve", asyncHandler(controller.abcCurve));

// --- Relatorios de movimentacoes ---
reportRoutes.get("/movements", asyncHandler(controller.movements));
reportRoutes.get("/movements-by-user", asyncHandler(controller.movementsByUser));
reportRoutes.get("/movements-by-month", asyncHandler(controller.movementsByMonth));
reportRoutes.get("/top-products", asyncHandler(controller.topProducts));
```

Salve.

### 🔍 Nove rotas, uma linha de proteção

Todas as nove estão protegidas pela **única** linha `routes.use(ensureAuthenticated)` do `src/routes/index.js`, escrita na [Aula 27](27-auth-rotas-e-middleware.md).

> 📌 Vale apontar isso para a turma: o módulo de relatórios inteiro nasceu seguro sem escrever uma linha de segurança.

---

## Passo 3 — A tela final

Agora que todos os relatórios existem, substitua os dois arquivos do front pela versão completa.

**`public/relatorios.html`:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Relatorios | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
      [v-cloak] {
        display: none;
      }
    </style>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <!-- O menu continua sendo montado pelo layout.js, fora do Vue.
         O Vue so controla o que esta dentro de #app. -->
    <div data-nav></div>

    <main id="app" v-cloak class="mx-auto max-w-7xl px-6 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Relatorios</h1>
        <p class="text-sm text-slate-500">Consultas do estoque, das movimentacoes e das analises</p>
      </div>

      <!-- ============================================================
           INDICADORES GERAIS
           ============================================================ -->
      <section class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
            <span class="h-2.5 w-2.5 rounded-full" :class="card.accent"></span>
          </div>
          <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">{{ card.value }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ card.hint }}</p>
        </article>
      </section>

      <!-- ============================================================
           ABAS
           ============================================================ -->
      <nav class="mb-4 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="rounded-xl px-4 py-2 text-sm font-medium transition"
          :class="activeTab === tab.id
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
          @click="changeTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- ============================================================
           ABA 1 - PRODUTOS
           ============================================================ -->
      <section v-if="activeTab === 'products'">
        <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              v-model.trim="productFilters.search"
              type="search"
              placeholder="Buscar por nome ou SKU"
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <select
              v-model="productFilters.categoryId"
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="">Todas as categorias</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <select
              v-model="productFilters.stockStatus"
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="ALL">Toda situacao de estoque</option>
              <option value="OK">Estoque saudavel</option>
              <option value="LOW">Abaixo do minimo</option>
              <option value="OUT">Zerado</option>
            </select>
            <label class="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <input v-model="productFilters.withoutCategory" type="checkbox" class="rounded" />
              Somente sem categoria
            </label>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-slate-500">{{ productFilterSummary }}</p>
            <div class="flex gap-2">
              <button
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                @click="clearProductFilters"
              >
                Limpar filtros
              </button>
              <button
                :disabled="productReport.rows.length === 0"
                class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                @click="exportProducts"
              >
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white">
          <div v-if="loading.products" class="p-10 text-center text-sm text-slate-500">
            Carregando relatorio...
          </div>

          <p v-else-if="errors.products" class="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {{ errors.products }}
          </p>

          <div v-else-if="productReport.rows.length === 0" class="p-10 text-center">
            <p class="text-sm font-medium text-slate-600">Nenhum produto encontrado</p>
            <p class="mt-1 text-xs text-slate-400">Tente afrouxar os filtros acima.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th
                    v-for="column in productColumns"
                    :key="column.key"
                    class="cursor-pointer select-none px-4 py-3 transition hover:text-slate-900"
                    :class="column.align === 'right' ? 'text-right' : ''"
                    @click="sortProducts(column.key)"
                  >
                    {{ column.label }}
                    <span v-if="productFilters.sort === column.key" class="text-slate-900">
                      {{ productFilters.direction === "asc" ? "▲" : "▼" }}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in productReport.rows" :key="row.id" class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ row.sku }}</td>
                  <td class="px-4 py-3 font-medium">{{ row.name }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ row.categoryName }}</td>
                  <td class="px-4 py-3 text-right">
                    <span
                      class="rounded-lg px-2 py-0.5 text-xs font-semibold"
                      :class="statusClass(row.stockStatus)"
                    >
                      {{ row.quantity }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-slate-500">{{ row.minimumStock }}</td>
                  <td class="px-4 py-3 text-right">{{ money(row.costPrice) }}</td>
                  <td class="px-4 py-3 text-right">{{ money(row.salePrice) }}</td>
                  <td class="px-4 py-3 text-right font-semibold">{{ money(row.stockCostValue) }}</td>
                </tr>
              </tbody>
              <tfoot class="border-t border-slate-200 bg-slate-50 text-sm">
                <tr>
                  <td colspan="3" class="px-4 py-3 font-semibold">Total da selecao</td>
                  <td class="px-4 py-3 text-right font-semibold">{{ productReport.totals.totalUnits }}</td>
                  <td colspan="3"></td>
                  <td class="px-4 py-3 text-right font-semibold">
                    {{ money(productReport.totals.totalCostValue) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Paginacao -->
          <div
            v-if="!loading.products && productReport.pagination.total > 0"
            class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3"
          >
            <p class="text-xs text-slate-500">
              Mostrando {{ productRangeLabel }} de {{ productReport.pagination.total }} registro(s)
            </p>
            <div class="flex items-center gap-2">
              <button
                :disabled="productFilters.page <= 1"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                @click="changeProductPage(productFilters.page - 1)"
              >
                Anterior
              </button>
              <span class="text-sm text-slate-600">
                {{ productReport.pagination.page }} / {{ productReport.pagination.totalPages }}
              </span>
              <button
                :disabled="productFilters.page >= productReport.pagination.totalPages"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                @click="changeProductPage(productFilters.page + 1)"
              >
                Proxima
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================
           ABA 2 - MOVIMENTACOES
           ============================================================ -->
      <section v-if="activeTab === 'movements'">
        <div class="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select
              v-model="movementFilters.categoryId"
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="">Todas as categorias</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <select
              v-model="movementFilters.type"
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="">Entradas e saidas</option>
              <option value="IN">Somente entradas</option>
              <option value="OUT">Somente saidas</option>
            </select>
            <label class="flex flex-col text-xs text-slate-500">
              De
              <input
                v-model="movementFilters.startDate"
                type="date"
                class="rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </label>
            <label class="flex flex-col text-xs text-slate-500">
              Ate
              <input
                v-model="movementFilters.endDate"
                type="date"
                class="rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </label>
            <div class="flex items-end gap-2">
              <button
                class="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                @click="clearMovementFilters"
              >
                Limpar
              </button>
              <button
                :disabled="movementReport.rows.length === 0"
                class="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                @click="exportMovements"
              >
                CSV
              </button>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-4 text-xs">
            <span class="text-emerald-700">
              Entradas: <strong>{{ movementReport.totals.unitsIn }}</strong> un.
            </span>
            <span class="text-rose-700">
              Saidas: <strong>{{ movementReport.totals.unitsOut }}</strong> un.
            </span>
            <span class="text-slate-700">
              Saldo: <strong>{{ movementReport.totals.balance }}</strong> un.
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white">
          <div v-if="loading.movements" class="p-10 text-center text-sm text-slate-500">
            Carregando relatorio...
          </div>

          <p v-else-if="errors.movements" class="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {{ errors.movements }}
          </p>

          <div v-else-if="movementReport.rows.length === 0" class="p-10 text-center">
            <p class="text-sm font-medium text-slate-600">Nenhuma movimentacao no periodo</p>
            <p class="mt-1 text-xs text-slate-400">Experimente ampliar o intervalo de datas.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Data</th>
                  <th class="px-4 py-3">Produto</th>
                  <th class="px-4 py-3">Categoria</th>
                  <th class="px-4 py-3">Tipo</th>
                  <th class="px-4 py-3 text-right">Qtd.</th>
                  <th class="px-4 py-3">Responsavel</th>
                  <th class="px-4 py-3">Observacao</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in movementReport.rows" :key="row.id" class="hover:bg-slate-50">
                  <td class="px-4 py-3 text-slate-500">{{ dateTime(row.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium">{{ row.productName }}</p>
                    <p class="font-mono text-xs text-slate-400">{{ row.productSku }}</p>
                  </td>
                  <td class="px-4 py-3 text-slate-500">{{ row.categoryName }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-lg px-2 py-0.5 text-xs font-semibold"
                      :class="row.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
                    >
                      {{ row.type === "IN" ? "Entrada" : "Saida" }}
                    </span>
                  </td>
                  <td
                    class="px-4 py-3 text-right font-semibold"
                    :class="row.type === 'IN' ? 'text-emerald-700' : 'text-rose-700'"
                  >
                    {{ row.signedQuantity > 0 ? "+" : "" }}{{ row.signedQuantity }}
                  </td>
                  <td class="px-4 py-3" :class="row.userId ? 'text-slate-700' : 'text-slate-400 italic'">
                    {{ row.userName }}
                  </td>
                  <td class="px-4 py-3 text-slate-500">{{ row.note || "-" }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="!loading.movements && movementReport.pagination.total > 0"
            class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3"
          >
            <p class="text-xs text-slate-500">
              {{ movementReport.pagination.total }} movimentacao(oes) no filtro
            </p>
            <div class="flex items-center gap-2">
              <button
                :disabled="movementFilters.page <= 1"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                @click="changeMovementPage(movementFilters.page - 1)"
              >
                Anterior
              </button>
              <span class="text-sm text-slate-600">
                {{ movementReport.pagination.page }} / {{ movementReport.pagination.totalPages }}
              </span>
              <button
                :disabled="movementFilters.page >= movementReport.pagination.totalPages"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                @click="changeMovementPage(movementFilters.page + 1)"
              >
                Proxima
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================
           ABA 3 - RESUMOS
           ============================================================ -->
      <section v-if="activeTab === 'summaries'" class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-lg font-semibold">Estoque por categoria</h2>
          <p class="mb-4 text-sm text-slate-500">Inclui categorias vazias e produtos sem categoria</p>

          <p v-if="loading.summaries" class="py-8 text-center text-sm text-slate-500">Carregando...</p>
          <p v-else-if="stockByCategory.length === 0" class="py-8 text-center text-sm text-slate-400">
            Nenhuma categoria cadastrada.
          </p>
          <div v-else class="space-y-4">
            <div v-for="row in stockByCategory" :key="row.categoryName">
              <div class="flex items-baseline justify-between text-sm">
                <span class="font-medium" :class="row.productCount === 0 ? 'text-slate-400' : ''">
                  {{ row.categoryName }}
                </span>
                <span class="font-semibold">{{ money(row.totalCostValue) }}</span>
              </div>
              <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-slate-900" :style="{ width: row.sharePercent + '%' }"></div>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{ row.productCount }} produto(s) · {{ row.totalUnits }} unidade(s) ·
                {{ row.sharePercent }}% do valor
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-lg font-semibold">Movimentacoes por responsavel</h2>
          <p class="mb-4 text-sm text-slate-500">Quem registrou o que, desde o inicio</p>

          <p v-if="loading.summaries" class="py-8 text-center text-sm text-slate-500">Carregando...</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="pb-2 pr-4">Responsavel</th>
                  <th class="pb-2 pr-4 text-right">Movs.</th>
                  <th class="pb-2 pr-4 text-right">Entradas</th>
                  <th class="pb-2 text-right">Saidas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in movementsByUser" :key="row.userId ?? 'null'">
                  <td class="py-2.5 pr-4" :class="row.userId ? '' : 'italic text-slate-400'">
                    {{ row.userName }}
                  </td>
                  <td class="py-2.5 pr-4 text-right font-semibold">{{ row.movementCount }}</td>
                  <td class="py-2.5 pr-4 text-right text-emerald-700">+{{ row.unitsIn }}</td>
                  <td class="py-2.5 text-right text-rose-700">-{{ row.unitsOut }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold">Entradas e saidas por mes</h2>
          <p class="mb-4 text-sm text-slate-500">Evolucao do estoque ao longo do tempo</p>

          <p v-if="loading.summaries" class="py-8 text-center text-sm text-slate-500">Carregando...</p>
          <p v-else-if="movementsByMonth.length === 0" class="py-8 text-center text-sm text-slate-400">
            Ainda nao ha movimentacoes.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="pb-2 pr-4">Mes</th>
                  <th class="pb-2 pr-4 text-right">Movimentacoes</th>
                  <th class="pb-2 pr-4 text-right">Entradas</th>
                  <th class="pb-2 pr-4 text-right">Saidas</th>
                  <th class="pb-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in movementsByMonth" :key="row.period">
                  <td class="py-2.5 pr-4 font-medium">{{ monthLabel(row.period) }}</td>
                  <td class="py-2.5 pr-4 text-right">{{ row.movementCount }}</td>
                  <td class="py-2.5 pr-4 text-right text-emerald-700">+{{ row.unitsIn }}</td>
                  <td class="py-2.5 pr-4 text-right text-rose-700">-{{ row.unitsOut }}</td>
                  <td
                    class="py-2.5 text-right font-semibold"
                    :class="row.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'"
                  >
                    {{ row.balance > 0 ? "+" : "" }}{{ row.balance }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ============================================================
           ABA 4 - ANALISES
           ============================================================ -->
      <section v-if="activeTab === 'analysis'" class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-lg font-semibold">Produtos mais movimentados</h2>
          <p class="mb-4 text-sm text-slate-500">Soma de entradas e saidas</p>

          <p v-if="loading.analysis" class="py-8 text-center text-sm text-slate-500">Carregando...</p>
          <ol v-else-if="topProducts.length > 0" class="space-y-2">
            <li
              v-for="(row, index) in topProducts"
              :key="row.productId"
              class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5"
            >
              <span class="flex items-center gap-3">
                <span class="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  {{ index + 1 }}
                </span>
                <span>
                  <span class="block text-sm font-medium">{{ row.productName }}</span>
                  <span class="block text-xs text-slate-400">{{ row.categoryName }}</span>
                </span>
              </span>
              <span class="text-right text-sm">
                <strong>{{ row.unitsMoved }}</strong> un.
                <span class="block text-xs text-slate-400">{{ row.movementCount }} movs.</span>
              </span>
            </li>
          </ol>
          <p v-else class="py-8 text-center text-sm text-slate-400">Sem movimentacoes.</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-lg font-semibold">Produtos parados</h2>
          <p class="mb-4 text-sm text-slate-500">Nunca tiveram nenhuma movimentacao</p>

          <p v-if="loading.analysis" class="py-8 text-center text-sm text-slate-500">Carregando...</p>
          <div v-else-if="productsWithoutMovement.length > 0" class="space-y-2">
            <div
              v-for="row in productsWithoutMovement"
              :key="row.id"
              class="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-2.5"
            >
              <span>
                <span class="block text-sm font-medium">{{ row.name }}</span>
                <span class="block font-mono text-xs text-slate-400">{{ row.sku }} · {{ row.categoryName }}</span>
              </span>
              <span class="text-sm font-semibold text-amber-700">{{ row.quantity }} un.</span>
            </div>
          </div>
          <p v-else class="py-8 text-center text-sm text-slate-400">
            Todo produto ja foi movimentado pelo menos uma vez.
          </p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold">Curva ABC</h2>
          <p class="mb-4 text-sm text-slate-500">
            Participacao de cada produto no valor total do estoque
          </p>

          <p v-if="loading.analysis" class="py-8 text-center text-sm text-slate-500">Carregando...</p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="pb-2 pr-4">Classe</th>
                  <th class="pb-2 pr-4">Produto</th>
                  <th class="pb-2 pr-4">Categoria</th>
                  <th class="pb-2 pr-4 text-right">Valor em estoque</th>
                  <th class="pb-2 text-right">Participacao</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in abcCurve" :key="row.id">
                  <td class="py-2.5 pr-4">
                    <span class="rounded-lg px-2 py-0.5 text-xs font-bold" :class="abcClass(row.abcClass)">
                      {{ row.abcClass }}
                    </span>
                  </td>
                  <td class="py-2.5 pr-4 font-medium">{{ row.name }}</td>
                  <td class="py-2.5 pr-4 text-slate-500">{{ row.categoryName }}</td>
                  <td class="py-2.5 pr-4 text-right">{{ money(row.stockCostValue) }}</td>
                  <td class="py-2.5 text-right font-semibold">{{ row.sharePercent }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>

    <script type="module" src="/js/relatorios.js"></script>
  </body>
</html>
```

**`public/js/relatorios.js`:**

```javascript
import { api, downloadReport } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, formatDateTime, mountLayout } from "./layout.js";

const { createApp } = Vue;

// Menu e porteiro continuam iguais aos das outras telas: o Vue
// cuida so do conteudo, nao do layout em volta.
mountLayout("/relatorios.html");

// Quanto tempo esperar depois da ultima tecla antes de consultar
// a API. Sem isso, "caneta" dispararia 6 requisicoes.
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_PRODUCT_REPORT = {
  pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
  totals: { totalUnits: 0, totalCostValue: 0, totalSaleValue: 0, potentialProfit: 0 },
  rows: [],
};

const EMPTY_MOVEMENT_REPORT = {
  pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
  totals: { unitsIn: 0, unitsOut: 0, balance: 0 },
  rows: [],
};

function defaultProductFilters() {
  return {
    search: "",
    categoryId: "",
    stockStatus: "ALL",
    withoutCategory: false,
    sort: "name",
    direction: "asc",
    page: 1,
    pageSize: 25,
  };
}

function defaultMovementFilters() {
  return {
    categoryId: "",
    type: "",
    startDate: "",
    endDate: "",
    sort: "date",
    direction: "desc",
    page: 1,
    pageSize: 25,
  };
}

if (requireAuth()) {
  createApp({
    data() {
      return {
        activeTab: "products",
        tabs: [
          { id: "products", label: "Produtos" },
          { id: "movements", label: "Movimentacoes" },
          { id: "summaries", label: "Resumos" },
          { id: "analysis", label: "Analises" },
        ],

        categories: [],
        summary: null,

        productFilters: defaultProductFilters(),
        productReport: EMPTY_PRODUCT_REPORT,
        productColumns: [
          { key: "sku", label: "SKU" },
          { key: "name", label: "Produto" },
          { key: "category", label: "Categoria" },
          { key: "quantity", label: "Qtd.", align: "right" },
          { key: "minimumStock", label: "Minimo", align: "right" },
          { key: "costPrice", label: "Custo", align: "right" },
          { key: "salePrice", label: "Venda", align: "right" },
          { key: "stockValue", label: "Valor", align: "right" },
        ],

        movementFilters: defaultMovementFilters(),
        movementReport: EMPTY_MOVEMENT_REPORT,

        stockByCategory: [],
        movementsByUser: [],
        movementsByMonth: [],

        topProducts: [],
        productsWithoutMovement: [],
        abcCurve: [],

        loading: { products: false, movements: false, summaries: false, analysis: false },
        errors: { products: "", movements: "", summaries: "", analysis: "" },

        // Guarda o timer do debounce entre uma tecla e outra.
        searchTimer: null,
      };
    },

    computed: {
      summaryCards() {
        if (!this.summary) return [];

        return [
          {
            label: "Produtos ativos",
            value: this.summary.productCount,
            hint: `${this.summary.totalUnits} unidades em estoque`,
            accent: "bg-slate-900",
          },
          {
            label: "Valor de custo",
            value: currency.format(this.summary.totalCostValue),
            hint: `Preco medio de custo ${currency.format(this.summary.averageCostPrice)}`,
            accent: "bg-sky-500",
          },
          {
            label: "Valor de venda",
            value: currency.format(this.summary.totalSaleValue),
            hint: `Lucro potencial de ${currency.format(this.summary.potentialProfit)}`,
            accent: "bg-emerald-500",
          },
          {
            label: "Precisam de atencao",
            value: this.summary.lowStockCount + this.summary.outOfStockCount,
            hint: `${this.summary.outOfStockCount} zerado(s), ${this.summary.lowStockCount} abaixo do minimo`,
            accent: "bg-rose-500",
          },
        ];
      },

      // Converte o estado da tela no objeto que a API espera.
      // Os campos vazios somem no buildQuery do api.js.
      productQuery() {
        return {
          search: this.productFilters.search,
          categoryId: this.productFilters.categoryId,
          stockStatus: this.productFilters.stockStatus,
          withoutCategory: this.productFilters.withoutCategory,
          sort: this.productFilters.sort,
          direction: this.productFilters.direction,
          page: this.productFilters.page,
          pageSize: this.productFilters.pageSize,
        };
      },

      movementQuery() {
        return {
          categoryId: this.movementFilters.categoryId,
          type: this.movementFilters.type,
          startDate: this.movementFilters.startDate,
          endDate: this.movementFilters.endDate,
          sort: this.movementFilters.sort,
          direction: this.movementFilters.direction,
          page: this.movementFilters.page,
          pageSize: this.movementFilters.pageSize,
        };
      },

      productFilterSummary() {
        const parts = [];

        if (this.productFilters.search) parts.push(`texto "${this.productFilters.search}"`);
        if (this.productFilters.categoryId) {
          const category = this.categories.find(
            (item) => String(item.id) === String(this.productFilters.categoryId)
          );

          if (category) parts.push(`categoria ${category.name}`);
        }
        if (this.productFilters.stockStatus !== "ALL") {
          const labels = { OK: "estoque saudavel", LOW: "abaixo do minimo", OUT: "zerado" };
          parts.push(labels[this.productFilters.stockStatus]);
        }
        if (this.productFilters.withoutCategory) parts.push("sem categoria");

        return parts.length ? `Filtrando por: ${parts.join(" · ")}` : "Sem filtros aplicados";
      },

      productRangeLabel() {
        const { page, pageSize, total } = this.productReport.pagination;
        const first = (page - 1) * pageSize + 1;
        const last = Math.min(page * pageSize, total);

        return `${first}-${last}`;
      },
    },

    watch: {
      // Cada filtro que muda volta para a pagina 1: continuar na
      // pagina 7 depois de trocar o filtro quase sempre da lista vazia.
      "productFilters.search"() {
        this.debouncedProductSearch();
      },
      "productFilters.categoryId"() {
        this.resetAndLoadProducts();
      },
      "productFilters.stockStatus"() {
        this.resetAndLoadProducts();
      },
      "productFilters.withoutCategory"() {
        this.resetAndLoadProducts();
      },
      "movementFilters.categoryId"() {
        this.resetAndLoadMovements();
      },
      "movementFilters.type"() {
        this.resetAndLoadMovements();
      },
      "movementFilters.startDate"() {
        this.resetAndLoadMovements();
      },
      "movementFilters.endDate"() {
        this.resetAndLoadMovements();
      },
    },

    async mounted() {
      await Promise.all([this.loadCategories(), this.loadSummary()]);
      await this.loadProducts();
    },

    methods: {
      // ---------- formatacao ----------
      money(value) {
        return currency.format(Number(value ?? 0));
      },

      dateTime(value) {
        return formatDateTime(value);
      },

      monthLabel(period) {
        const [year, month] = period.split("-");
        const names = [
          "jan", "fev", "mar", "abr", "mai", "jun",
          "jul", "ago", "set", "out", "nov", "dez",
        ];

        return `${names[Number(month) - 1]}/${year}`;
      },

      statusClass(status) {
        const classes = {
          OUT: "bg-rose-100 text-rose-700",
          LOW: "bg-amber-100 text-amber-700",
          OK: "bg-emerald-100 text-emerald-700",
        };

        return classes[status] ?? "bg-slate-100 text-slate-700";
      },

      abcClass(value) {
        const classes = {
          A: "bg-emerald-100 text-emerald-700",
          B: "bg-amber-100 text-amber-700",
          C: "bg-slate-100 text-slate-600",
        };

        return classes[value] ?? "bg-slate-100 text-slate-600";
      },

      // ---------- navegacao ----------
      changeTab(tabId) {
        this.activeTab = tabId;

        // Carrega sob demanda: a aba que ninguem abriu nao consulta a API.
        if (tabId === "movements" && this.movementReport.rows.length === 0) {
          this.loadMovements();
        }

        if (tabId === "summaries" && this.stockByCategory.length === 0) {
          this.loadSummaries();
        }

        if (tabId === "analysis" && this.abcCurve.length === 0) {
          this.loadAnalysis();
        }
      },

      // ---------- carregamento ----------
      async loadCategories() {
        try {
          this.categories = await api.listCategories();
        } catch (error) {
          this.errors.products = error.message;
        }
      },

      async loadSummary() {
        try {
          this.summary = await api.reportStockSummary();
        } catch (error) {
          this.errors.products = error.message;
        }
      },

      async loadProducts() {
        this.loading.products = true;
        this.errors.products = "";

        try {
          this.productReport = await api.reportProducts(this.productQuery);
        } catch (error) {
          this.errors.products = error.message;
          this.productReport = EMPTY_PRODUCT_REPORT;
        } finally {
          this.loading.products = false;
        }
      },

      async loadMovements() {
        this.loading.movements = true;
        this.errors.movements = "";

        try {
          this.movementReport = await api.reportMovements(this.movementQuery);
        } catch (error) {
          this.errors.movements = error.message;
          this.movementReport = EMPTY_MOVEMENT_REPORT;
        } finally {
          this.loading.movements = false;
        }
      },

      async loadSummaries() {
        this.loading.summaries = true;
        this.errors.summaries = "";

        try {
          const [byCategory, byUser, byMonth] = await Promise.all([
            api.reportStockByCategory(),
            api.reportMovementsByUser({}),
            api.reportMovementsByMonth({}),
          ]);

          this.stockByCategory = byCategory;
          this.movementsByUser = byUser;
          this.movementsByMonth = byMonth;
        } catch (error) {
          this.errors.summaries = error.message;
        } finally {
          this.loading.summaries = false;
        }
      },

      async loadAnalysis() {
        this.loading.analysis = true;
        this.errors.analysis = "";

        try {
          const [top, parked, abc] = await Promise.all([
            api.reportTopProducts({ limit: 10 }),
            api.reportProductsWithoutMovement(),
            api.reportAbcCurve(),
          ]);

          this.topProducts = top;
          this.productsWithoutMovement = parked;
          this.abcCurve = abc;
        } catch (error) {
          this.errors.analysis = error.message;
        } finally {
          this.loading.analysis = false;
        }
      },

      // ---------- filtros ----------
      debouncedProductSearch() {
        clearTimeout(this.searchTimer);

        this.searchTimer = setTimeout(() => {
          this.resetAndLoadProducts();
        }, SEARCH_DEBOUNCE_MS);
      },

      resetAndLoadProducts() {
        this.productFilters.page = 1;
        this.loadProducts();
      },

      resetAndLoadMovements() {
        this.movementFilters.page = 1;
        this.loadMovements();
      },

      clearProductFilters() {
        this.productFilters = defaultProductFilters();
        this.loadProducts();
      },

      clearMovementFilters() {
        this.movementFilters = defaultMovementFilters();
        this.loadMovements();
      },

      sortProducts(key) {
        // Clicar na coluna que ja ordena inverte a direcao.
        if (this.productFilters.sort === key) {
          this.productFilters.direction =
            this.productFilters.direction === "asc" ? "desc" : "asc";
        } else {
          this.productFilters.sort = key;
          this.productFilters.direction = "asc";
        }

        this.resetAndLoadProducts();
      },

      changeProductPage(page) {
        if (page < 1 || page > this.productReport.pagination.totalPages) return;

        this.productFilters.page = page;
        this.loadProducts();
      },

      changeMovementPage(page) {
        if (page < 1 || page > this.movementReport.pagination.totalPages) return;

        this.movementFilters.page = page;
        this.loadMovements();
      },

      // ---------- exportacao ----------
      async exportProducts() {
        try {
          await downloadReport("/reports/products", this.productQuery, "relatorio-produtos.csv");
        } catch (error) {
          this.errors.products = error.message;
        }
      },

      async exportMovements() {
        try {
          await downloadReport(
            "/reports/movements",
            this.movementQuery,
            "relatorio-movimentacoes.csv"
          );
        } catch (error) {
          this.errors.movements = error.message;
        }
      },
    },
  }).mount("#app");
}
```

Salve os dois.

### 🔍 O que entrou de novo

| Bloco | O que é |
|---|---|
| Aba **Resumos** | estoque por categoria, por responsável e por mês |
| Aba **Análises** | ranking, produtos parados e curva ABC |
| `loadSummaries` / `loadAnalysis` | carregam três relatórios cada, com `Promise.all` |
| `monthLabel` | traduz `2026-09` para `set/2026` |
| `abcClass` | pinta a letra A, B ou C |

### 🔍 `Promise.all` para três relatórios de uma vez

```javascript
const [byCategory, byUser, byMonth] = await Promise.all([
  api.reportStockByCategory(),
  api.reportMovementsByUser({}),
  api.reportMovementsByMonth({}),
]);
```

Três requisições independentes, disparadas juntas. Em série seriam três esperas somadas.

### 🔍 A barra de participação, sem biblioteca de gráfico

```html
<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
  <div class="h-full rounded-full bg-slate-900" :style="{ width: row.sharePercent + '%' }"></div>
</div>
```

Duas `<div>` e um `:style`. Para uma barra de proporção, não é preciso mais que isso.

> 💡 **Nem todo gráfico precisa de biblioteca.** Barras, proporções e indicadores simples saem com CSS. Gráficos de linha e dispersão, aí sim.

### 🔍 `monthLabel`: a tradução de máquina para gente

```javascript
monthLabel(period) {
  const [year, month] = period.split("-");
  const names = ["jan", "fev", "mar", ...];

  return `${names[Number(month) - 1]}/${year}`;
}
```

A API manda `2026-09` (formato que ordena). A tela mostra `set/2026` (formato que se lê). É a separação que a [Aula 41](41-relatorios-por-periodo.md) defendeu, agora implementada.

> 🔍 **`Number(month) - 1`** porque arrays começam em 0 e meses em 1. Um erro de um a mais clássico — vale conferir que setembro (09) dá `names[8]`, que é "set".

---

# PARTE 2 — Teste final do bloco

## Passo 4 — Zerar e testar do zero

```bash
docker compose down -v
docker compose up -d --build
```

> ⚠️ O `-v` **apaga o banco**. É o teste de que um aluno novo, clonando o projeto, consegue chegar onde você chegou.

```bash
docker compose logs -f api
```

### O roteiro de 25 testes

#### Banco (terminal do MySQL)

| # | Teste | Esperado |
|---|---|---|
| 1 | `SHOW TABLES;` | 4 tabelas |
| 2 | `SELECT COUNT(*) FROM products;` | 12 |
| 3 | `SELECT COUNT(*) FROM stock_movements;` | 24 |
| 4 | `DESCRIBE stock_movements;` | tem `user_id` |
| 5 | Produtos sem categoria / categorias sem produto / produtos sem movimentação | 1, 1 e 1 |

#### JOINs (terminal)

| # | Teste | Esperado |
|---|---|---|
| 6 | `INNER JOIN` products×categories | **11** |
| 7 | `LEFT JOIN` idem | **12** |
| 8 | `FROM products p, categories c` | **60** |
| 9 | Condição no `WHERE` / no `ON` / aceitando `NULL` | **8 / 12 / 9** |
| 10 | Dois `INNER` em movimentações × total | **22 / 24** |
| 11 | `INNER JOIN users` × total | **12 / 24** |
| 12 | `COUNT(*)` × `COUNT(p.id)` em Ferramentas | **1 / 0** |
| 13 | Auditoria saldo calculado × gravado | **vazio** |

#### API (`curl`)

| # | Teste | Esperado |
|---|---|---|
| 14 | Os 9 endpoints com token | `200` |
| 15 | Qualquer um sem token | `401` |
| 16 | `?stockStatus=` ALL/OK/LOW/OUT | a soma dos três = ALL |
| 17 | `?withoutCategory=true` | 1 produto |
| 18 | `?startDate=2026-09-15&endDate=2026-09-15` | **1** movimentação |
| 19 | `?sort=inexistente` | `400` |
| 20 | `?startDate=2026-02-31` | `400` |
| 21 | `?format=csv` | CSV com BOM e `;` |

#### Tela

| # | Teste | Esperado |
|---|---|---|
| 22 | As 4 abas carregam | sem erro no console |
| 23 | Filtros, ordenação e paginação | funcionam |
| 24 | "Ferramentas" em Resumos | `0 produto(s)` |
| 25 | "Nao informado" em Resumos | 12 movimentações |

---

## Parte 3 — Dicionário de erros do bloco

Complementa a [Aula 21](21-solucao-de-problemas.md) e a [Aula 32](32-teste-final-autenticacao.md).

### SQL

| Mensagem | Causa | Solução |
|---|---|---|
| `Column 'x' in field list is ambiguous` | duas tabelas com a mesma coluna | qualifique: `p.name` |
| `Unknown column 'x' in 'where clause'` | usou apelido do `SELECT` no `WHERE` | repita a expressão |
| `Unknown column 'x' in 'on clause'` | apelido de tabela errado, ou `JOIN` faltando | confira o `FROM` |
| `Invalid use of group function` | agregação no `WHERE` | use `HAVING` |
| `Expression #N ... not in GROUP BY` | coluna solta no `SELECT` | ponha no `GROUP BY` ou agregue |
| `Subquery returns more than 1 row` | subquery de `SELECT` com várias linhas | acrescente `LIMIT 1` ou use `IN` |
| `Every derived table must have its own alias` | faltou o `AS nome` | nomeie a tabela derivada |
| `Incorrect DATETIME value` | data mal formatada | valide antes |

### Resultados errados (sem mensagem de erro!)

| Sintoma | Causa provável |
|---|---|
| **Faltam linhas** | `INNER JOIN` onde devia ser `LEFT` |
| **Linhas demais, repetidas** | `JOIN` sem `ON` (cartesiano) |
| Consulta volta vazia | `= NULL` em vez de `IS NULL` |
| Categoria vazia conta 1 | `COUNT(*)` em vez de `COUNT(coluna)` |
| O último dia do período some | `<= data` em vez de `< dia seguinte` |
| Produto conta várias vezes | falta `DISTINCT` no `COUNT` |
| Totais não batem com o filtro | o `sum...` não usa o mesmo `buildWhere` |
| Consulta lenta | função na coluna do `WHERE`, ou subquery correlacionada |

> 📌 **Esta segunda tabela é a mais importante das duas.** Erro com mensagem você corrige em minutos. Erro silencioso vai para produção.

### Node e front

| Mensagem | Solução |
|---|---|
| `Incorrect arguments to mysqld_stmt_execute` | conte os `?` e os valores |
| `Ordenacao invalida: x` | a `key` do front não está na lista branca |
| Números como `"150"` | falta `Number()` no service |
| `Cannot destructure property` | falta `= {}` no parâmetro |
| CSV numa coluna só | separador errado |
| Acentos quebrados no Excel | falta o BOM |
| Download dá `401` | use `fetch`, não `<a href>` |

---

## Parte 4 — Exercícios

### Nível 1 — Consultas

**1.1** Liste os produtos de cada categoria em ordem alfabética, mostrando o nome da categoria. Inclua os sem categoria.

**1.2** Quantos produtos distintos cada responsável movimentou? (Dica: `COUNT(DISTINCT ...)`.)

**1.3** Qual categoria tem o maior preço médio de venda? Use `AVG` e `ORDER BY`.

**1.4** Liste as movimentações de setembro de 2026 com produto, categoria e responsável.

**1.5** Encontre os produtos que **nunca** tiveram uma **saída** (podem ter tido entradas). Compare `LEFT JOIN ... IS NULL` com `NOT EXISTS`.

---

### Nível 2 — Relatórios novos

**2.1 — Produtos sem movimentação há mais de 90 dias**

Diferente do "nunca movimentado": estes já giraram, mas pararam.

```sql
-- dica
HAVING MAX(m.created_at) < DATE_SUB(NOW(), INTERVAL 90 DAY)
```

Crie o endpoint `GET /api/reports/stagnant-products`.

> Pergunta: produtos que **nunca** se moveram devem aparecer? Justifique a sua escolha no código.

**2.2 — Giro por categoria no período**

`GET /api/reports/turnover-by-category?startDate=&endDate=`

Para cada categoria: unidades que entraram, que saíram e o saldo. Inclua as categorias sem movimentação no período.

> Cuidado: o filtro de data vai no `ON` ou no `WHERE`? Teste os dois e explique a diferença.

**2.3 — Exportar o relatório de movimentações por usuário**

Acrescente `?format=csv` ao `movements-by-user`. As peças já existem.

**2.4 — Filtro de faixa de preço**

`?minPrice=10&maxPrice=50` no relatório de produtos. Valide: `minPrice` não pode ser maior que `maxPrice`.

**2.5 — Uniformizar a conversão de tipos**

A [Aula 41](41-relatorios-por-periodo.md) apontou que `getMovementsByMonth` converte os números no **repositório**, enquanto os outros convertem no **service**. Mova para o service e deixe o padrão consistente.

---

### Nível 3 — Desafios

**3.1 — Curva ABC acumulada (a de verdade)**

A clássica usa percentual **acumulado**: ordena por valor decrescente, soma acumulando, e corta em 80% / 95%.

```sql
-- dica: funções de janela (MySQL 8+)
SUM(valor) OVER (ORDER BY valor DESC) AS acumulado
```

> Por que isso **não** dá para fazer só com `GROUP BY`?

**3.2 — Comparar dois períodos**

`GET /api/reports/compare?periodA=2026-05&periodB=2026-06`

Mostre lado a lado as entradas, saídas e a variação percentual.

> Dica: duas subqueries, ou um `GROUP BY` com `CASE` separando os períodos.

**3.3 — Previsão de ruptura**

Para cada produto: média de saída por dia nos últimos 60 dias, e em quantos dias o estoque acaba nesse ritmo.

> Pergunta difícil: o que fazer com produtos que não tiveram saída nenhuma? Divisão por zero.

**3.4 — `EXPLAIN` e índices**

Rode `EXPLAIN` nas consultas do módulo. Encontre uma que não usa índice e proponha o índice que resolveria.

```sql
EXPLAIN SELECT ... FROM stock_movements m WHERE DATE(m.created_at) = '2026-09-15';
```

> Compare com a versão `>= / <` da Aula 41. A coluna `key` do `EXPLAIN` conta a história.

**3.5 — Cache do resumo**

O `stock-summary` roda a cada carregamento da tela. Guarde o resultado por 60 segundos em memória.

> Quando esse cache fica **errado**? O que acontece se alguém registrar uma movimentação nesses 60 segundos? Vale a pena?

---

### Parte 5 — Atividade de diagnóstico

> 📋 **Formato:** individual ou em duplas · 45 minutos
>
> O repositório abaixo é um `product-report-repository.js` alternativo. Ele **roda sem erro** e devolve números. Contém **10 problemas**, entre resultados errados, falhas de segurança e desempenho.
>
> Encontre todos, indique a linha, classifique (`resultado errado`, `segurança` ou `desempenho`) e escreva a correção.

```javascript
 1  import { pool } from "../../config/database.js";
 2
 3  export async function relatorio(req) {
 4    const [rows] = await pool.query(`
 5      SELECT *
 6        FROM products p
 7       INNER JOIN categories c ON c.id = p.category_id
 8       WHERE p.name LIKE '%${req.query.search}%'
 9         AND p.category_id = ${req.query.categoryId}
10       ORDER BY ${req.query.sort}
11    `);
12
13    return rows;
14  }
15
16  export async function porCategoria() {
17    const [rows] = await pool.query(`
18      SELECT c.name,
19             COUNT(*) AS produtos,
20             SUM(p.quantity * p.cost_price) AS valor
21        FROM categories c
22        LEFT JOIN products p ON p.category_id = c.id
23       WHERE p.active = TRUE
24       GROUP BY c.name
25    `);
26
27    return rows;
28  }
29
30  export async function doPeriodo(inicio, fim) {
31    const [rows] = await pool.query(`
32      SELECT m.id, p.name, m.quantity
33        FROM stock_movements m
34       INNER JOIN products p ON p.id = m.product_id
35       WHERE DATE(m.created_at) BETWEEN '${inicio}' AND '${fim}'
36    `);
37
38    return rows;
39  }
```

<details>
<summary>🔑 Gabarito (só depois de tentar!)</summary>

| # | Linha | Tipo | Problema | Correção |
|---|---|---|---|---|
| 1 | 3 | arquitetura | O repositório recebe `req` — ele não pode conhecer HTTP | receba um objeto de filtros já validado |
| 2 | 8, 9, 35 | **segurança** | **SQL injection**: valores interpolados na consulta | use `?` e passe os valores como parâmetros |
| 3 | 10 | **segurança** | Injeção via `ORDER BY`, que o `?` não resolve | lista branca ([Aula 34](34-select-filtros-ordenacao.md)) |
| 4 | 5 | segurança | `SELECT *` traz colunas que ninguém pediu e vaza mudanças futuras | liste as colunas |
| 5 | 7 | **resultado errado** | `INNER JOIN` esconde o produto sem categoria | `LEFT JOIN` |
| 6 | 8, 9 | resultado errado | Os filtros são sempre aplicados; sem `search` vira `LIKE '%undefined%'` | monte o `WHERE` condicionalmente |
| 7 | 19 | **resultado errado** | `COUNT(*)` com `LEFT JOIN` conta a linha-fantasma: categoria vazia dá 1 | `COUNT(p.id)` |
| 8 | 23 | **resultado errado** | `WHERE p.active` anula o `LEFT JOIN`: a categoria vazia some | mover para o `ON` |
| 9 | 20 | resultado errado | `SUM` sem `COALESCE` devolve `NULL` para a categoria vazia | `COALESCE(SUM(...), 0)` |
| 10 | 35 | **desempenho** | `DATE(m.created_at)` inutiliza o índice; e o `BETWEEN` perde o último dia | `>= ? AND < DATE_ADD(?, INTERVAL 1 DAY)` |

**Extras (ponto bônus):**

| # | Linha | Problema |
|---|---|---|
| 11 | 24 | `GROUP BY c.name` em vez de `c.id, c.name`: duas categorias homônimas se fundiriam |
| 12 | geral | Nenhuma consulta tem `LIMIT`: um relatório pode trazer a tabela inteira |
| 13 | 13, 27, 38 | Devolve as linhas cruas, sem normalizar `0/1` para booleano nem converter números |
| 14 | 16 | `porCategoria` não aceita filtro nenhum, então nunca combina com o relatório detalhado |

</details>

---

## Parte 6 — Checklist de avaliação

### Banco

- [ ] Migrações 002 e 003 com rollback
- [ ] `init.sql` reproduz o mesmo estado do zero
- [ ] `stock_movements.user_id` com FK `ON DELETE SET NULL` e índice
- [ ] Dados de teste cobrem as exceções (sem categoria, sem produto, sem movimentação)

### SQL

- [ ] Nenhum `SELECT *` no código
- [ ] Todo valor entra por `?`
- [ ] Nome de coluna só entra por lista branca
- [ ] Tipo de cada `JOIN` escolhido conscientemente e **comentado**
- [ ] `COUNT(coluna)` onde há `LEFT JOIN`
- [ ] `COALESCE` em todo `SUM` que pode não ter linhas
- [ ] Período usa `>= / <`, nunca `<=` do dia
- [ ] Nenhuma função aplicada sobre coluna no `WHERE`

### Back-end

- [ ] Módulo `reports` no padrão do projeto
- [ ] Repositório não conhece HTTP; service não conhece SQL
- [ ] Um `buildWhere` por assunto, reusado por listagem, contagem e soma
- [ ] Envelope padronizado nos relatórios paginados
- [ ] Todos os filtros validados, inclusive os numéricos
- [ ] As 9 rotas protegidas pela linha única do `routes/index.js`

### Front

- [ ] Os quatro estados em cada área (carregando, erro, vazio, normal)
- [ ] Debounce na busca
- [ ] Filtro mudou → volta para a página 1
- [ ] Totais vêm do servidor, não da tela
- [ ] CSV com BOM, `;` e vírgula decimal
- [ ] Console limpo

### Perguntas orais

1. Qual a diferença entre `INNER JOIN` e `LEFT JOIN`? Dê um exemplo em que ela custa dinheiro.
2. Por que `COUNT(*)` e `COUNT(coluna)` podem divergir?
3. Por que `WHERE SUM(x) > 10` dá erro?
4. Em que ordem o banco executa `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `SELECT`, `ORDER BY`?
5. Por que o `ORDER BY` não pode usar `?`? O que fazemos no lugar?
6. Por que `created_at <= '2026-09-15'` perde o dia 15?
7. Qual a diferença entre pôr uma condição no `ON` e no `WHERE` de um `LEFT JOIN`?
8. Por que calcular o total no banco em vez de somar no JavaScript?
9. O que é uma subquery correlacionada e por que ela é perigosa?
10. Por que o CSV precisa de BOM?

---

## 🎓 O que você sabe fazer agora

Some aos objetivos das aulas [22](22-exercicios-e-checklist.md) e [32](32-teste-final-autenticacao.md):

- [x] Ler um banco desconhecido e descobrir seus relacionamentos
- [x] Escolher entre `INNER` e `LEFT JOIN` por critério, não por tentativa
- [x] Reconhecer quando um `JOIN` está escondendo linhas
- [x] Agrupar, agregar e filtrar grupos com `HAVING`
- [x] Montar `WHERE` dinâmico sem abrir brecha de injeção
- [x] Paginar, ordenar e contar de forma coerente
- [x] Tratar datas sem perder o último dia
- [x] Escrever subqueries e tabelas derivadas
- [x] Construir uma tela de relatórios com filtros, estados e exportação
- [x] Desconfiar de um resultado que "parece certo"

---

## 🚀 Para onde seguir

| Tema | Por quê |
|---|---|
| **Funções de janela** (`OVER`) | curva ABC acumulada, rankings, médias móveis |
| **CTEs** (`WITH`) | subqueries longas ficam legíveis |
| **`EXPLAIN` e índices** | o próximo gargalo é sempre de banco |
| **Views** | consultas complexas viradas tabelas virtuais |
| **Gráficos** | Chart.js ou ECharts sobre os mesmos endpoints |
| **Exportação assíncrona** | relatórios grandes gerados em segundo plano |

---

**[⬅️ Voltar ao índice](README.md)**
