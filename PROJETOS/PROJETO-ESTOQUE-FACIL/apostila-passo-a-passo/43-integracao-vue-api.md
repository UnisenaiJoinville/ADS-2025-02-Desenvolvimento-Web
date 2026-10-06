# Aula 43 — Integrando os filtros com a API

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** prática (HTML + Vue)

---

## O que vamos construir

Os filtros da tela, ligados de verdade ao back-end:

```text
   ┌─────────────────────────────────────────────────────────┐
   │ [Buscar...] [Categoria ▾] [Situacao ▾] [☐ Sem categoria]│
   │                              [Limpar filtros]           │
   └─────────────────────────────────────────────────────────┘
```

E a aba **Movimentações**, com filtro de período.

### Por que precisamos disso

A [Aula 42](42-tela-relatorios-vue.md) entregou uma tela que mostra **tudo**. O back-end sabe filtrar desde a [Aula 40](40-relatorios-de-estoque.md), mas ninguém está pedindo.

### O conceito

Esta aula é sobre **o caminho completo do dado**. Vale desenhar antes de codar:

```text
   USUÁRIO digita "cafe"
        │
        ▼
   v-model atualiza  productFilters.search = "cafe"
        │
        ▼
   watch percebe a mudança
        │
        ▼ (espera 400ms — debounce)
   loadProducts()
        │
        ▼
   computed productQuery monta o objeto de filtros
        │
        ▼
   api.reportProducts(...)  →  buildQuery  →  "?search=cafe"
        │
        ▼
   GET /api/reports/products?search=cafe
        │
        ▼
   report-controller  →  report-filters  →  report-service
        │
        ▼
   product-report-repository  →  WHERE (p.name LIKE ? OR p.sku LIKE ?)
        │
        ▼
   MySQL
        │
        ▼ (volta o JSON)
   this.productReport = { pagination, totals, rows }
        │
        ▼
   o v-for redesenha a tabela sozinho
```

Nove paradas. Nenhuma delas toca no DOM.

---

## Antes de começar

- [ ] [Aula 42](42-tela-relatorios-vue.md) concluída (a tela abre e lista os produtos)
- [ ] O back-end aceita os filtros (teste com `curl`)

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
├── public/js/api.js          (métodos novos)
├── public/relatorios.html    (barra de filtros + aba Movimentacoes)
└── public/js/relatorios.js   (estado dos filtros, watch, debounce)
```

---

## Passo 1 — Os métodos que faltam na API

Abra `public/js/api.js` e deixe o grupo de relatórios assim:

```javascript
  // --- Relatorios ---
  reportProducts: (filters) => request(`/reports/products${buildQuery(filters)}`),
  reportStockSummary: () => request("/reports/stock-summary"),
  reportStockByCategory: () => request("/reports/stock-by-category"),
  reportProductsWithoutMovement: () => request("/reports/products-without-movement"),
  reportAbcCurve: () => request("/reports/abc-curve"),
  reportMovements: (filters) => request(`/reports/movements${buildQuery(filters)}`),
  reportMovementsByUser: (filters) => request(`/reports/movements-by-user${buildQuery(filters)}`),
  reportMovementsByMonth: (filters) => request(`/reports/movements-by-month${buildQuery(filters)}`),
  reportTopProducts: (filters) => request(`/reports/top-products${buildQuery(filters)}`),
```

Salve.

### 🔍 Nove linhas, nenhuma lógica

Repare: cada método é **uma expressão**. Nenhum `try/catch`, nenhum tratamento de token, nenhum `JSON.parse`.

Tudo isso está no `request`, escrito uma vez na [Aula 15](15-front-base.md) e melhorado na [Aula 29](29-tela-cadastro-vue.md).

> 📌 **Esse é o retorno de ter centralizado o `fetch`.** O nono endpoint custou uma linha.

---

## Passo 2 — A barra de filtros

Abra `public/relatorios.html` e, dentro da `<section v-if="activeTab === 'products'">`, **acima** da div da tabela, acrescente:

```html
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
            <button
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              @click="clearProductFilters"
            >
              Limpar filtros
            </button>
          </div>
        </div>
```

Salve.

### 🔍 O `<select>` de categorias vem do banco

```html
<option value="">Todas as categorias</option>
<option v-for="category in categories" :key="category.id" :value="category.id">
  {{ category.name }}
</option>
```

A primeira opção é fixa (o "sem filtro"); as outras vêm de uma chamada à API.

> ⚠️ **O `value=""` da primeira opção importa.** String vazia é o que o `buildQuery` descarta — então escolher "Todas as categorias" simplesmente não manda o parâmetro.

### 🔍 `:value="category.id"` liga valor, não texto

Sem os dois pontos, `value="category.id"` mandaria o **texto literal** `"category.id"` para a API. Com `:value`, manda o número.

### 🔍 `v-model` em caixa de seleção

```html
<input v-model="productFilters.withoutCategory" type="checkbox" />
```

Em `type="checkbox"`, o `v-model` liga ao **booleano** `checked`, não ao `value`. Marcar a caixa põe `true` na variável.

> 🔍 E, do outro lado, o `buildQuery` descarta `false` — então desmarcar equivale a não mandar nada. As duas pontas combinam.

---

## Passo 3 — A aba de movimentações

Ainda no `relatorios.html`, **depois** da seção de produtos, acrescente:

```html
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
            <div class="flex items-end">
              <button
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                @click="clearMovementFilters"
              >
                Limpar
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

          <p
            v-else-if="errors.movements"
            class="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
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
        </div>
      </section>
```

Salve.

### 🔍 `<input type="date">` já fala o nosso idioma

```html
<input v-model="movementFilters.startDate" type="date" />
```

O navegador mostra o calendário no formato local (31/05/2026 no Brasil), mas o `value` que chega ao `v-model` é sempre **`AAAA-MM-DD`**.

É exatamente o formato que o `parseOptionalDate` da [Aula 41](41-relatorios-por-periodo.md) exige. Nenhuma conversão necessária.

> 💡 **Formato de exibição e formato de dado são coisas diferentes** — e aqui o navegador já faz a separação por nós.

### 🔍 A linha fica cinza e itálica quando não há responsável

```html
:class="row.userId ? 'text-slate-700' : 'text-slate-400 italic'"
```

As 12 movimentações anteriores ao login aparecem como "Nao informado", visualmente diferentes. O usuário entende que é uma ausência de dado, não um nome de pessoa.

> 📌 Repare que isso só é possível porque o back-end manda `userId: null` **junto** com `userName: "Nao informado"`. Se mandasse só o texto, a tela não teria como distinguir.

### 🔍 Os totais ficam acima da tabela

```html
Entradas: {{ movementReport.totals.unitsIn }} un.
Saidas: {{ movementReport.totals.unitsOut }} un.
Saldo: {{ movementReport.totals.balance }} un.
```

Vêm do `totals` que a [Aula 41](41-relatorios-por-periodo.md) construiu: são do **período inteiro**, não das linhas visíveis.

---

## Passo 4 — O estado dos filtros

Abra `public/js/relatorios.js`.

Acrescente, **antes** do `if (requireAuth())`:

```javascript
// Quanto tempo esperar depois da ultima tecla antes de consultar
// a API. Sem isso, "caneta" dispararia 6 requisicoes.
const SEARCH_DEBOUNCE_MS = 400;

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
```

E, dentro do `data()`, acrescente as chaves novas:

```javascript
        categories: [],

        productFilters: defaultProductFilters(),

        movementFilters: defaultMovementFilters(),
        movementReport: EMPTY_MOVEMENT_REPORT,

        loading: { products: false, movements: false },
        errors: { products: "", movements: "" },

        // Guarda o timer do debounce entre uma tecla e outra.
        searchTimer: null,
```

Salve.

### 🔍 Por que os padrões são uma **função**

```javascript
function defaultProductFilters() {
  return { search: "", ... };
}
```

Se fosse um objeto constante:

```javascript
const DEFAULT_FILTERS = { search: "", ... };   // ❌
this.productFilters = DEFAULT_FILTERS;         // aponta para o MESMO objeto
```

Digitar no campo mudaria o próprio `DEFAULT_FILTERS`, e "Limpar filtros" passaria a restaurar... o que o usuário tinha digitado.

> 📌 É a mesma razão de o `data()` do Vue ser uma função, como vimos na [Aula 28](28-vue-primeiros-passos.md): **cada uso precisa do seu próprio objeto**.

---

## Passo 5 — Os `computed` e os `watch`

Ainda no `relatorios.js`, acrescente aos `computed`:

```javascript
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
```

E acrescente o bloco `watch`, **irmão** de `computed` e `methods`:

```javascript
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
```

Salve.

---

## 1. `watch`: o quarto bloco do Vue

Você já conhece três. Este é o quarto:

| Bloco | Para quê |
|---|---|
| `data()` | o estado |
| `computed` | valores **derivados** do estado |
| `methods` | ações |
| **`watch`** | **efeitos colaterais** quando algo muda |

### A diferença entre `computed` e `watch`

```text
   computed  ->  "quando X mudar, RECALCULE Y"
                 (puro: só devolve um valor)

   watch     ->  "quando X mudar, FAÇA alguma coisa"
                 (chamar a API, gravar no localStorage, navegar...)
```

> ⚠️ **Nunca chame a API de dentro de um `computed`.** Ele pode ser avaliado várias vezes, em momentos imprevisíveis, e deve ser livre de efeito colateral. Buscar dados é trabalho de `watch` (ou de `mounted`, ou de um `method` chamado por um clique).

### Observando um caminho com string

```javascript
"productFilters.search"() { ... }
```

A chave é uma **string com ponto** porque estamos observando uma propriedade **dentro** de um objeto. Observar `productFilters` inteiro também funcionaria, mas dispararia para qualquer mudança — inclusive a da página, causando um laço.

---

## 2. O *debounce*

```javascript
debouncedProductSearch() {
  clearTimeout(this.searchTimer);

  this.searchTimer = setTimeout(() => {
    this.resetAndLoadProducts();
  }, SEARCH_DEBOUNCE_MS);
}
```

### O problema

Sem ele, digitar "caneta" dispara **seis** requisições:

```text
   c       ->  GET ?search=c
   ca      ->  GET ?search=ca
   can     ->  GET ?search=can
   cane    ->  GET ?search=cane
   canet   ->  GET ?search=canet
   caneta  ->  GET ?search=caneta
```

E tem um problema pior que o desperdício: as respostas podem **chegar fora de ordem**. Se a de `?search=can` demorar mais que a de `?search=caneta`, a tela acaba mostrando o resultado errado.

### Como o debounce resolve

```text
   tecla  c  a  n  e  t  a                    (400ms de silêncio)
          │  │  │  │  │  │                            │
          ✗  ✗  ✗  ✗  ✗  └── timer armado ────────────┴──► 1 requisição
          └──┴──┴──┴──┴── cada tecla CANCELA o timer anterior
```

`clearTimeout` cancela o agendamento anterior. Só o último sobrevive os 400 ms inteiros.

> 💡 **Por que 400 ms?** É o intervalo que soa instantâneo para quem digita e já é maior que a pausa entre teclas de um digitador rápido. Abaixo de 200 ms, muitas requisições passam; acima de 800 ms, a tela parece travada.

### Por que só a busca tem debounce

```javascript
"productFilters.search"()      -> debounce
"productFilters.categoryId"()  -> imediato
```

Escolher no `<select>` é **um** evento. Digitar são vários. O debounce só faz sentido onde a mudança é contínua.

---

## 3. Voltar para a página 1

```javascript
resetAndLoadProducts() {
  this.productFilters.page = 1;
  this.loadProducts();
}
```

Imagine o usuário na página 7 de 10. Ele filtra por "cafe", que tem 1 resultado.

```text
   sem o reset:  página 7 de 1 resultado  ->  OFFSET 150  ->  tela vazia
   com o reset:  página 1                 ->  o café aparece
```

> 📌 **Regra:** mudou o filtro, volta para a primeira página. Sempre.

---

## Passo 6 — Os métodos

Acrescente aos `methods` do `relatorios.js`:

```javascript
      dateTime(value) {
        return formatDateTime(value);
      },

      async loadCategories() {
        try {
          this.categories = await api.listCategories();
        } catch (error) {
          this.errors.products = error.message;
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
```

**Altere** o `loadProducts` para usar os filtros:

```javascript
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
```

**Altere** o `changeTab` para carregar sob demanda:

```javascript
      changeTab(tabId) {
        this.activeTab = tabId;

        // Carrega sob demanda: a aba que ninguem abriu nao consulta a API.
        if (tabId === "movements" && this.movementReport.rows.length === 0) {
          this.loadMovements();
        }
      },
```

E **altere** o `mounted` para carregar as categorias junto:

```javascript
    async mounted() {
      await Promise.all([this.loadCategories(), this.loadSummary()]);
      await this.loadProducts();
    },
```

Por fim, acrescente `formatDateTime` ao import do topo:

```javascript
import { currency, formatDateTime, mountLayout } from "./layout.js";
```

Salve.

### 🔍 `Promise.all` no `mounted`

```javascript
await Promise.all([this.loadCategories(), this.loadSummary()]);
await this.loadProducts();
```

As duas primeiras são independentes: rodam juntas. A terceira vem depois porque... na verdade também poderia rodar junto.

> 💡 **Fica como exercício:** colocar as três no mesmo `Promise.all` e medir a diferença na aba Network. Em rede lenta, dá para ver.

### 🔍 `clearProductFilters` **substitui** o objeto

```javascript
this.productFilters = defaultProductFilters();
```

Trocar o objeto inteiro dispara todos os `watch` de uma vez — e cada um chamaria `loadProducts`. Seriam quatro requisições.

> 🔍 **Na prática, o Vue agrupa isso.** As mudanças de uma mesma "volta" do JavaScript viram uma única atualização, e os `watch` disparam uma vez só. Mesmo assim, chamamos `loadProducts()` explicitamente no final para garantir o recarregamento quando nada mudou (clicar em "Limpar" com os filtros já vazios).

---

## Passo 7 — Testar

```bash
docker compose restart api
```

Abra `http://localhost:3000/relatorios.html` com **Ctrl + Shift + R**.

### Roteiro — aba Produtos

| # | Faça | Esperado |
|---|---|---|
| 1 | Digite "cha" na busca | Só o Chá verde, após ~400 ms |
| 2 | Olhe o texto cinza | "Filtrando por: texto "cha"" |
| 3 | Escolha "Abaixo do minimo" | 4 produtos |
| 4 | Olhe o rodapé | Os totais mudaram junto |
| 5 | Escolha "Zerado" | Só o Álcool em gel |
| 6 | Marque "Somente sem categoria" | Só a Fita adesiva |
| 7 | Clique em "Limpar filtros" | Volta a 12, texto "Sem filtros aplicados" |

### Teste 8 — O debounce, visto na prática

F12 → Network → filtre por `products`. Agora digite "caneta" **devagar** e depois **rápido**.

```text
   devagar (pausas > 400ms):  várias requisições
   rápido:                    UMA requisição, com ?search=caneta
```

> 🔍 Para ver a diferença, mude `SEARCH_DEBOUNCE_MS` para `0`, recarregue e digite. Uma requisição por tecla. Depois volte para `400`.

### Roteiro — aba Movimentações

| # | Faça | Esperado |
|---|---|---|
| 9 | Clique em "Movimentacoes" | A tabela carrega (primeira vez) |
| 10 | Clique em "Produtos" e volte | **Não** recarrega (sob demanda) |
| 11 | Escolha "Somente saidas" | Entradas = 0 nos totais |
| 12 | Ponha De = 01/05/2026, Ate = 30/06/2026 | 5 movimentações, 154 entradas |
| 13 | Ponha De = 15/09/2026 e Ate = 15/09/2026 | **1** movimentação |
| 14 | Olhe a coluna Responsavel | "Nao informado" em cinza itálico |
| 15 | Clique em "Limpar" | Volta tudo |

> 🎉 **O teste 13 é a armadilha da [Aula 41](41-relatorios-por-periodo.md)**, agora pela interface. Se vier 0, o `< DATE_ADD` virou `<= ?` em algum lugar.

### Teste 16 — O erro de data invertida

Ponha De = 01/09/2026 e Ate = 01/05/2026.

```text
   A data inicial nao pode ser maior que a data final
```

A faixa vermelha aparece com a mensagem **do servidor**. Ela atravessou: `report-filters` → `AppError` → `error-handler` → HTTP 400 → `api.js` → `catch` → `errors.movements` → `{{ }}`.

> 💡 **Isso é o sistema inteiro funcionando em conjunto** — e é um bom momento para percorrer o caminho com a turma, arquivo por arquivo.

---

## ✅ Confira se deu certo

- [ ] A busca filtra depois de ~400 ms
- [ ] O `<select>` de categorias está preenchido
- [ ] "Abaixo do minimo" traz 4; "Zerado" traz 1
- [ ] "Somente sem categoria" traz a Fita adesiva
- [ ] O resumo em texto dos filtros acompanha
- [ ] Os totais do rodapé mudam com o filtro
- [ ] "Limpar filtros" volta ao estado inicial
- [ ] A aba Movimentações carrega só na primeira visita
- [ ] O filtro de um dia só (15/09) traz 1 movimentação
- [ ] Data invertida mostra a mensagem do servidor
- [ ] O console está limpo

---

## 🔧 Erros comuns

### A busca dispara a cada tecla

O `watch` de `search` está chamando `resetAndLoadProducts` direto, sem passar pelo `debouncedProductSearch`.

### A busca nunca dispara

`clearTimeout(this.searchTimer)` sem `this.searchTimer` existir no `data()`. Acrescente `searchTimer: null`.

### A categoria selecionada não filtra

Faltaram os dois pontos: precisa ser `:value="category.id"`, não `value="category.id"`.

### O `<select>` de categorias está vazio

`loadCategories` não rodou, ou `api.listCategories` falhou. Veja a aba Network.

### Filtrar deixa a tela vazia, mesmo com resultados

Faltou o `page = 1`. Você está na página 7 de um resultado que tem 1 página.

### `formatDateTime is not defined`

Faltou acrescentá-lo ao import do `layout.js`.

### "Limpar filtros" não limpa

`this.productFilters = defaultProductFilters()` precisa **substituir** o objeto. Atribuir propriedade por propriedade também funciona, mas é mais fácil esquecer uma.

### Todos os filtros somem ao trocar de aba

Isso é esperado? Não — os dois conjuntos de filtros são independentes (`productFilters` e `movementFilters`). Se um está limpando o outro, confira se os nomes não se confundiram.

### `Maximum recursive updates exceeded`

Um `watch` está mudando a própria coisa que observa. Confira se algum `watch` de `productFilters.*` altera `productFilters` inteiro.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| O caminho completo do dado, de ponta a ponta | seção de abertura |
| Nono endpoint custou **uma linha** | Passo 1 |
| `:value` liga valor; `value` manda texto | Passo 2 |
| `v-model` em `checkbox` liga ao booleano | Passo 2 |
| `<input type="date">` já devolve `AAAA-MM-DD` | Passo 3 |
| Padrões de filtro precisam ser **função** | Passo 4 |
| **`watch`**: efeitos colaterais, não cálculo | seção 1 |
| Nunca chamar a API de dentro de um `computed` | seção 1 |
| **Debounce** e as respostas fora de ordem | seção 2 |
| Mudou filtro, volta para a página 1 | seção 3 |
| Carregamento sob demanda por aba | Passo 6 |

---

## ➡️ Próximo passo

Falta o que transforma a tela numa ferramenta: paginar, ordenar e levar o resultado para fora.

**[Aula 44 — Paginação, ordenação e exportação](44-paginacao-ordenacao-csv.md)**
