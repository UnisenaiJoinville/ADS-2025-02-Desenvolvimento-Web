# Aula 42 — A tela de relatórios em Vue

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática (HTML + Vue)

---

## O que vamos construir

A tela de relatórios, com os indicadores do estoque no topo e a primeira aba funcionando:

```text
   ┌────────────────────────────────────────────────────────┐
   │  Produtos ativos   Valor de custo   Valor de venda  …  │  ← cards
   ├────────────────────────────────────────────────────────┤
   │ [Produtos] [Movimentacoes] [Resumos] [Analises]        │  ← abas
   ├────────────────────────────────────────────────────────┤
   │  SKU     Produto          Categoria    Qtd.   Valor    │
   │  BEB-002 Agua mineral     Bebidas        8    R$ 7,20  │  ← tabela
   │  …                                                     │
   └────────────────────────────────────────────────────────┘
```

### Por que precisamos disso

O back-end está pronto desde a [Aula 41](41-relatorios-por-periodo.md), mas ninguém no mundo real vai usar `curl`.

### O conceito

Esta é a terceira tela Vue do projeto (depois do login e do cadastro, nas aulas 29 e 30), e a primeira com uma estrutura que as outras não tinham:

| Novidade | O que resolve |
|---|---|
| **Abas** | quatro relatórios numa tela só, sem poluir |
| **Carregamento sob demanda** | a aba que ninguém abriu não consulta a API |
| **Três estados por área** | carregando / erro / vazio — além do estado normal |

Também é a primeira vez que o Vue convive com o `layout.js` das telas antigas. Vamos ver como isso funciona.

---

## Antes de começar

- [ ] [Aula 41](41-relatorios-por-periodo.md) concluída
- [ ] Todos os endpoints respondendo (teste com `curl`)
- [ ] Você lembra do básico da [Aula 28](28-vue-primeiros-passos.md): `data`, `computed`, `methods`, `v-if`, `v-for`

---

## Arquivos desta aula

```text
NOVOS ARQUIVOS
├── public/relatorios.html
└── public/js/relatorios.js

ARQUIVOS ALTERADOS
└── public/js/layout.js   (1 linha)
```

---

## 1. Como o Vue e o layout antigo convivem

A tela de login não tinha menu. Esta tem — e o menu é montado pelo `layout.js` da [Aula 15](15-front-base.md), que usa `innerHTML`.

```text
   ┌─ public/relatorios.html ──────────────────────┐
   │                                               │
   │  <div data-nav></div>      ◄── layout.js      │
   │                                (innerHTML)    │
   │  <main id="app">                              │
   │     …                      ◄── Vue            │
   │  </main>                      (reatividade)   │
   └───────────────────────────────────────────────┘
```

**Os dois não se atrapalham**, porque o Vue só controla o que está **dentro** de `#app`. O resto da página continua sendo HTML comum.

> 💡 **Isso é importante na vida real:** você quase nunca reescreve um sistema inteiro de uma vez. Vue (ou React, ou qualquer outro) entra num pedaço da tela e convive com o que já existia.

---

## Passo 1 — O item no menu

Abra `public/js/layout.js` e acrescente uma linha ao `NAV_ITEMS`:

```javascript
const NAV_ITEMS = [
  { href: "/index.html", label: "Dashboard", icon: "grid" },
  { href: "/produtos.html", label: "Produtos", icon: "box" },
  { href: "/movimentacoes.html", label: "Movimentacoes", icon: "swap" },
  { href: "/categorias.html", label: "Categorias", icon: "tag" },
  { href: "/relatorios.html", label: "Relatorios", icon: "chart" },
];
```

Salve.

> 🔍 Repare que `mountLayout("/relatorios.html")` vai marcar este item como ativo automaticamente — a função já fazia isso desde a Aula 15.

---

## Passo 2 — O HTML

Crie `public/relatorios.html` com a estrutura abaixo.

> 📌 **Versão desta aula.** A tela vai ganhar filtros na [Aula 43](43-integracao-vue-api.md) e paginação, ordenação e mais abas na [Aula 44](44-paginacao-ordenacao-csv.md), onde você verá o arquivo completo e final.

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
        <div class="rounded-2xl border border-slate-200 bg-white">
          <div v-if="loading.products" class="p-10 text-center text-sm text-slate-500">
            Carregando relatorio...
          </div>

          <p
            v-else-if="errors.products"
            class="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {{ errors.products }}
          </p>

          <div v-else-if="productReport.rows.length === 0" class="p-10 text-center">
            <p class="text-sm font-medium text-slate-600">Nenhum produto encontrado</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">SKU</th>
                  <th class="px-4 py-3">Produto</th>
                  <th class="px-4 py-3">Categoria</th>
                  <th class="px-4 py-3 text-right">Qtd.</th>
                  <th class="px-4 py-3 text-right">Minimo</th>
                  <th class="px-4 py-3 text-right">Custo</th>
                  <th class="px-4 py-3 text-right">Venda</th>
                  <th class="px-4 py-3 text-right">Valor</th>
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
                  <td class="px-4 py-3 text-right font-semibold">
                    {{ productReport.totals.totalUnits }}
                  </td>
                  <td colspan="3"></td>
                  <td class="px-4 py-3 text-right font-semibold">
                    {{ money(productReport.totals.totalCostValue) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    </main>

    <script type="module" src="/js/relatorios.js"></script>
  </body>
</html>
```

Salve.

---

## 2. Lendo o HTML

### 2.1 As abas vêm de um array

```html
<button v-for="tab in tabs" :key="tab.id" @click="changeTab(tab.id)">
  {{ tab.label }}
</button>
```

```javascript
tabs: [
  { id: "products", label: "Produtos" },
  { id: "movements", label: "Movimentacoes" },
]
```

Quatro botões, **um** `<button>` escrito. Acrescentar uma aba é acrescentar um objeto no array.

> 💡 Compare com o que seria na mão: quatro blocos de HTML quase iguais, quatro `addEventListener`, e a classe "ativo" trocada em JavaScript. O `v-for` com `:class` resolve tudo.

### 2.2 A aba ativa é só uma variável

```html
:class="activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600'"
```

```html
<section v-if="activeTab === 'products'">
```

**Uma** variável (`activeTab`) controla duas coisas: qual botão fica preto e qual seção aparece. Mudou a variável, mudou a tela — sem tocar no DOM.

### 2.3 Os quatro estados de uma área de dados

Esta é a parte que diferencia uma tela amadora de uma profissional:

```html
<div v-if="loading.products">        Carregando...          </div>
<p   v-else-if="errors.products">    {{ errors.products }}  </p>
<div v-else-if="rows.length === 0">  Nenhum produto         </div>
<div v-else>                         a tabela               </div>
```

```text
   1. carregando   ->  o usuário sabe que algo está acontecendo
   2. erro         ->  o usuário sabe o que deu errado
   3. vazio        ->  o usuário sabe que não há dados (≠ está quebrado)
   4. normal       ->  a tabela
```

> ⚠️ **O estado 3 é o mais esquecido.** Sem ele, "nenhum resultado" e "a tela quebrou" ficam idênticos: uma área em branco. O usuário não sabe se filtrou demais ou se o sistema morreu.

### 2.4 `v-else-if` encadeado

Os quatro são **mutuamente exclusivos** e precisam ser **irmãos diretos**, sem nada entre eles. Se você colocar um `<div>` no meio, o `v-else-if` perde a ligação e o Vue avisa no console.

### 2.5 `statusClass` e `money` são métodos

```html
:class="statusClass(row.stockStatus)"
{{ money(row.costPrice) }}
```

Lembra da [Aula 28](28-vue-primeiros-passos.md)? Em `methods` você **chama** com parênteses; em `computed`, não.

E aqui tem que ser `methods`, porque o valor depende de um **argumento** (a linha). `computed` não recebe argumentos.

### 2.6 `<tfoot>`: os totais da seleção

```html
<td colspan="3">Total da selecao</td>
<td class="text-right">{{ productReport.totals.totalUnits }}</td>
```

Vem do `totals` que o back-end calculou na [Aula 35](35-agregacao-group-by.md) — **não** da soma das linhas visíveis.

> 📌 Na [Aula 44](44-paginacao-ordenacao-csv.md) a tabela vai mostrar 25 de 168 linhas, e esse rodapé continuará mostrando o total dos 168. É por isso que o cálculo é do servidor.

---

## Passo 3 — O JavaScript

Crie `public/js/relatorios.js`:

> 📌 **Versão desta aula.** Vai crescer bastante nas próximas duas.

```javascript
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, mountLayout } from "./layout.js";

const { createApp } = Vue;

// Menu e porteiro continuam iguais aos das outras telas: o Vue
// cuida so do conteudo, nao do layout em volta.
mountLayout("/relatorios.html");

const EMPTY_PRODUCT_REPORT = {
  pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
  totals: { totalUnits: 0, totalCostValue: 0, totalSaleValue: 0, potentialProfit: 0 },
  rows: [],
};

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

        summary: null,
        productReport: EMPTY_PRODUCT_REPORT,

        loading: { products: false },
        errors: { products: "" },
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
    },

    async mounted() {
      await this.loadSummary();
      await this.loadProducts();
    },

    methods: {
      money(value) {
        return currency.format(Number(value ?? 0));
      },

      statusClass(status) {
        const classes = {
          OUT: "bg-rose-100 text-rose-700",
          LOW: "bg-amber-100 text-amber-700",
          OK: "bg-emerald-100 text-emerald-700",
        };

        return classes[status] ?? "bg-slate-100 text-slate-700";
      },

      changeTab(tabId) {
        this.activeTab = tabId;
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
          this.productReport = await api.reportProducts({});
        } catch (error) {
          this.errors.products = error.message;
          this.productReport = EMPTY_PRODUCT_REPORT;
        } finally {
          this.loading.products = false;
        }
      },
    },
  }).mount("#app");
}
```

Salve.

> ⚠️ **Ainda falta o `api.reportStockSummary`** — vamos criá-lo no próximo passo. Se você abrir a tela agora, vai ver um erro no console. É esperado.

---

## Passo 4 — Os dois métodos na API

Abra `public/js/api.js` e acrescente, no final do objeto `api`:

```javascript
  // --- Relatorios ---
  reportProducts: (filters) => request(`/reports/products${buildQuery(filters)}`),
  reportStockSummary: () => request("/reports/stock-summary"),
```

E, logo **acima** de `export const api = {`, a função que monta a query string:

```javascript
// Monta a query string a partir de um objeto, ignorando o que esta
// vazio. Sem isso, "?search=&categoryId=" chegaria ao servidor cheio
// de filtros em branco.
function buildQuery(filters = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === false) {
      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}
```

Salve.

### 🔍 Por que o `buildQuery` ignora o vazio

```javascript
if (value === undefined || value === null || value === "" || value === false) {
  continue;
}
```

Sem isso, um formulário em branco mandaria:

```text
   /reports/products?search=&categoryId=&stockStatus=&withoutCategory=false
```

Com a limpeza:

```text
   /reports/products
```

| Vantagem | |
|---|---|
| URL legível | dá para ler e depurar |
| Menos trabalho no servidor | o validador não precisa tratar tanto vazio |
| Cache amigável | a mesma consulta gera sempre a mesma URL |

> 🔍 **Por que `value === false` também sai?** Porque `withoutCategory=false` e "não mandar nada" significam a mesma coisa. Mandar `false` só gastaria bytes — e cairia na armadilha do `Boolean("false")` da [Aula 40](40-relatorios-de-estoque.md) se o servidor não tratasse bem.

### 🔍 `URLSearchParams` escapa sozinho

```javascript
params.set(key, String(value));
```

Se o usuário buscar por `café & chá`, o `URLSearchParams` gera `caf%C3%A9+%26+ch%C3%A1`. Montar a string na mão com `+` e `&` quebraria.

---

## Passo 5 — Testar

```bash
docker compose restart api
```

Abra `http://localhost:3000/relatorios.html`.

> ⚠️ Use **Ctrl + Shift + R** na primeira vez. O navegador guarda o `api.js` antigo em cache.

### O que você deve ver

```text
   ┌────────────────────────────────────────────────────────────┐
   │ Produtos ativos │ Valor de custo │ Valor de venda │ Atencao│
   │       12        │  R$ 3.409,00   │  R$ 6.423,10   │    5   │
   ├────────────────────────────────────────────────────────────┤
   │ [Produtos] Movimentacoes  Resumos  Analises                │
   ├────────────────────────────────────────────────────────────┤
   │ SKU      Produto               Categoria      Qtd.   …     │
   │ BEB-002  Agua mineral 500ml    Bebidas          8          │
   │ LIM-002  Alcool em gel 500ml   Limpeza          0          │
   │ …                                                          │
   └────────────────────────────────────────────────────────────┘
```

### Roteiro

| # | Faça | Esperado |
|---|---|---|
| 1 | Abra a tela | Os 4 cards preenchidos |
| 2 | Olhe o menu | "Relatorios" marcado como ativo |
| 3 | Olhe a coluna Qtd. | Zerado em vermelho, baixo em âmbar, ok em verde |
| 4 | Procure a "Fita adesiva" | Categoria "Sem categoria" |
| 5 | Olhe o rodapé | "Total da selecao" com as somas |
| 6 | Clique nas outras abas | O botão fica preto, a tabela some |
| 7 | Abra o console (F12) | Sem erros em vermelho |
| 8 | Aba Network, recarregue | **Duas** requisições: `stock-summary` e `products` |

### Teste 9 — Os estados

**Carregando:** no F12 → Network, escolha "Slow 3G" e recarregue. Você vê "Carregando relatorio..." por alguns segundos.

**Erro:** pare a API e recarregue a página.

```bash
docker compose stop api
```

A faixa vermelha aparece com a mensagem. Depois:

```bash
docker compose start api
```

**Vazio:** no console do navegador, force um filtro impossível:

```javascript
document.querySelector("#app").__vue_app__._instance.proxy.loadProducts()
```

(Na próxima aula isso fica fácil pela interface.)

> 💡 **Provocar os três estados é parte do trabalho.** Tela que só foi testada no caminho feliz costuma ficar em branco no primeiro problema de rede.

---

## 3. Por que as outras abas estão vazias

Clicar em "Movimentacoes" mostra... nada. Está certo: o `v-if` daquela seção ainda não existe no HTML.

```javascript
changeTab(tabId) {
  this.activeTab = tabId;
}
```

Por enquanto o método só troca a variável. Na [Aula 43](43-integracao-vue-api.md) ele vai também **carregar os dados daquela aba**.

### O conceito: carregar sob demanda

```text
   TUDO DE UMA VEZ                    SOB DEMANDA
   ---------------                    -----------
   9 requisições ao abrir             2 ao abrir
   espera longa                       tela rápida
   8 relatórios que ninguém viu       só o que foi pedido
```

> 📌 É o mesmo princípio da paginação: **não busque o que ninguém pediu**.

---

## ✅ Confira se deu certo

- [ ] `http://localhost:3000/relatorios.html` abre
- [ ] "Relatorios" aparece no menu de **todas** as telas
- [ ] Os 4 cards mostram números
- [ ] A tabela lista os produtos com a categoria
- [ ] A quantidade está colorida conforme a situação
- [ ] A "Fita adesiva" aparece com "Sem categoria"
- [ ] O rodapé mostra os totais
- [ ] Clicar nas abas troca o botão ativo
- [ ] O console está limpo
- [ ] Sem estar logado, a tela redireciona para o login

---

## 🔧 Erros comuns

### A tela mostra `{{ summaryCards }}` literalmente

O Vue não montou. Veja o console: quase sempre é erro de digitação no `relatorios.js`.

### `api.reportStockSummary is not a function`

Faltou acrescentar os métodos no `api.js`, ou o navegador está com a versão em cache. **Ctrl + Shift + R**.

### `buildQuery is not defined`

A função precisa estar **antes** do `export const api = {` no `api.js`.

### Os cards aparecem vazios

`summary` continua `null` — a chamada falhou. Veja a aba Network: se deu `401`, o token não está indo.

### O menu não mostra "Relatorios"

Faltou a linha no `NAV_ITEMS` do `layout.js`, ou é cache.

### `Cannot read properties of null (reading 'productCount')`

O `summaryCards` está lendo `this.summary` antes de ele chegar. A guarda `if (!this.summary) return [];` resolve — confira se você a escreveu.

### A tabela aparece mas sem categoria

O back-end não está trazendo `categoryName`. Reveja o `FROM_PRODUCT` da [Aula 37](37-left-join.md).

### `v-else-if` não funciona

Os elementos precisam ser irmãos diretos, sem nada entre eles.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| Vue convive com código antigo: controla só o `#app` | seção 1 |
| Abas a partir de um array, com `v-for` | seção 2.1 |
| Uma variável controlando botão e conteúdo | seção 2.2 |
| **Os quatro estados**: carregando, erro, vazio, normal | seção 2.3 |
| `v-else-if` exige elementos irmãos | seção 2.4 |
| `methods` quando o valor depende de argumento | seção 2.5 |
| Totais do servidor, não da tela | seção 2.6 |
| `buildQuery` ignorando valores vazios | Passo 4 |
| `URLSearchParams` escapa sozinho | Passo 4 |
| Carregar **sob demanda** | seção 3 |

---

## ➡️ Próximo passo

A tela existe. Agora vamos ligar os filtros nela.

**[Aula 43 — Integrando os filtros com a API](43-integracao-vue-api.md)**
