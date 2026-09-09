# Etapa 16 — Tela do Dashboard

📋 **Tipo:** prática (HTML + JavaScript)

---

## Objetivo

Construir a primeira tela do sistema: o dashboard com **cards que somam e subtraem valores**, barras por categoria, alertas e tabela de movimentações recentes.

> 🎉 Esta é a etapa em que o projeto finalmente "aparece".

---

## Antes de começar

- [ ] Etapa 15 concluída (`api.js` e `layout.js` criados)

---

## O que vamos construir

```text
 +--------------------------------------------------------------+
 |  EF  Estoque Facil        [Dashboard] Produtos Movim. Categ. |
 +--------------------------------------------------------------+
 |  Dashboard                                     [Atualizar]   |
 |                                                              |
 |  +----------+ +----------+ +----------+ +----------+         |
 |  |Produtos  | |Valor de  | |Valor de  | |Estoque   |         |
 |  |   7      | |custo     | |venda     | |baixo  3  |         |
 |  +----------+ +----------+ +----------+ +----------+         |
 |                                                              |
 |  +---------------+ +---------------+ +---------------+       |
 |  |Entradas +213  | |Saidas   -67   | |Saldo   +146   |       |
 |  +---------------+ +---------------+ +---------------+       |
 |                                                              |
 |  +------------------------+ +------------------------+       |
 |  | Estoque por categoria  | | Estoque baixo          |       |
 |  | Informatica  ████████  | | Caneta        5 un.    |       |
 |  | Bebidas      ███████   | | Agua          8 un.    |       |
 |  +------------------------+ +------------------------+       |
 |                                                              |
 |  +----------------------------------------------------+      |
 |  | Ultimas movimentacoes                              |      |
 |  | Teclado    Saida    -2    09/09/2026               |      |
 |  +----------------------------------------------------+      |
 +--------------------------------------------------------------+
```

---

## Passo 1 — Criar o `public/index.html`

Na pasta `public`, crie `index.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <div data-nav></div>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p class="text-sm text-slate-500">Visao geral do estoque em tempo real</p>
        </div>
        <button
          data-reload
          class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Atualizar
        </button>
      </div>

      <!-- Cards principais -->
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-cards></section>

      <!-- Entradas x Saidas do mes -->
      <section class="mt-4 grid gap-4 sm:grid-cols-3" data-month></section>

      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-lg font-semibold text-slate-900">Estoque por categoria</h2>
          <p class="mb-4 text-sm text-slate-500">Valor de custo imobilizado</p>
          <div data-by-category class="space-y-4"></div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 class="text-lg font-semibold text-slate-900">Estoque baixo</h2>
          <p class="mb-4 text-sm text-slate-500">Produtos no limite ou abaixo do minimo</p>
          <div data-low-stock class="space-y-2"></div>
        </section>
      </div>

      <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="text-lg font-semibold text-slate-900">Ultimas movimentacoes</h2>
        <p class="mb-4 text-sm text-slate-500">Entradas e saidas mais recentes</p>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="pb-2 pr-4">Produto</th>
                <th class="pb-2 pr-4">Tipo</th>
                <th class="pb-2 pr-4 text-right">Quantidade</th>
                <th class="pb-2 text-right">Data</th>
              </tr>
            </thead>
            <tbody data-recent class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </section>
    </main>

    <div data-toast-stack class="fixed bottom-6 right-6 z-50 flex flex-col gap-2"></div>

    <script type="module" src="/js/dashboard.js"></script>
  </body>
</html>
```

Salve.

### 👀 Repare: o HTML está VAZIO de dados

```html
<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-cards></section>
```

Não há nenhum número escrito no HTML. Existem apenas os **espaços reservados**, marcados com `data-*`. Quem preenche é o JavaScript, com os dados da API.

> 📌 Isso se chama **renderização no cliente**. A vantagem: a mesma página serve para qualquer conteúdo, e atualizar não exige recarregar.

### As classes-chave desta página

| Trecho | O que faz |
|---|---|
| `min-h-screen bg-slate-100` | Fundo cinza claro ocupando a tela toda |
| `mx-auto max-w-7xl px-6` | Conteúdo centralizado, largura máxima, respiro nas laterais |
| `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` | 1 coluna no celular, 2 no tablet, 4 no monitor |
| `overflow-x-auto` | A tabela ganha rolagem lateral em telas pequenas |
| `fixed bottom-6 right-6 z-50` | Os toasts flutuam no canto inferior direito |

### ⚠️ O `type="module"` é obrigatório

```html
<script type="module" src="/js/dashboard.js"></script>
```

Sem ele, o navegador recusa o `import` com o erro:

```text
Cannot use import statement outside a module
```

---

## Passo 2 — Criar o `public/js/dashboard.js`

Este arquivo é maior. Vamos digitá-lo por partes, entendendo cada uma.

### Parte A — Imports e seletores

```javascript
import { api } from "./api.js";
import { currency, escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/index.html");

const cardsContainer = document.querySelector("[data-cards]");
const monthContainer = document.querySelector("[data-month]");
const byCategoryContainer = document.querySelector("[data-by-category]");
const lowStockContainer = document.querySelector("[data-low-stock]");
const recentContainer = document.querySelector("[data-recent]");
```

Guardamos as referências dos containers **uma vez**, no topo. Buscar o mesmo elemento repetidamente dentro de funções seria desperdício.

### Parte B — A função que gera um card

```javascript
function card({ label, value, hint, accent }) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm font-medium text-slate-500">${label}</p>
        <span class="h-2.5 w-2.5 rounded-full ${accent}"></span>
      </div>
      <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">${value}</p>
      <p class="mt-1 text-xs text-slate-500">${hint}</p>
    </article>
  `;
}
```

Um **componente**: uma função que recebe dados e devolve HTML. Os 4 cards usam o mesmo molde, mudando só o conteúdo.

> 💡 Repare no parâmetro desestruturado `{ label, value, hint, accent }`. Chamar com um objeto nomeado é mais legível que `card("Produtos", 7, "146 unidades", "bg-slate-900")` — você não precisa lembrar a ordem.

### Parte C — Os quatro cards principais

```javascript
function renderCards(totals) {
  cardsContainer.innerHTML = [
    card({
      label: "Produtos ativos",
      value: totals.totalProducts,
      hint: `${totals.totalUnits} unidades em estoque`,
      accent: "bg-slate-900",
    }),
    card({
      label: "Valor de custo",
      value: currency.format(totals.stockCostValue),
      hint: "Capital investido no estoque",
      accent: "bg-sky-500",
    }),
    card({
      label: "Valor de venda",
      value: currency.format(totals.stockSaleValue),
      hint: `Lucro potencial de ${currency.format(totals.potentialProfit)}`,
      accent: "bg-emerald-500",
    }),
    card({
      label: "Estoque baixo",
      value: totals.lowStockCount,
      hint: `${totals.outOfStockCount} produto(s) zerado(s)`,
      accent: totals.lowStockCount > 0 ? "bg-rose-500" : "bg-emerald-500",
    }),
  ].join("");
}
```

**A bolinha que muda de cor:**

```javascript
accent: totals.lowStockCount > 0 ? "bg-rose-500" : "bg-emerald-500",
```

Se há produtos em falta, a bolinha fica **vermelha**; se está tudo certo, **verde**. Um detalhe pequeno que comunica muito.

### Parte D — As entradas e saídas do mês

```javascript
function renderMonth(month) {
  const balanceIsPositive = month.balance >= 0;

  monthContainer.innerHTML = `
    <article class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p class="text-sm font-medium text-emerald-700">Entradas do mes</p>
      <p class="mt-2 text-3xl font-bold text-emerald-700">+ ${month.unitsIn}</p>
      <p class="mt-1 text-xs text-emerald-600">unidades que entraram</p>
    </article>
    <article class="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <p class="text-sm font-medium text-rose-700">Saidas do mes</p>
      <p class="mt-2 text-3xl font-bold text-rose-700">- ${month.unitsOut}</p>
      <p class="mt-1 text-xs text-rose-600">unidades que sairam</p>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <p class="text-sm font-medium text-slate-500">Saldo do mes</p>
      <p class="mt-2 text-3xl font-bold ${balanceIsPositive ? "text-emerald-600" : "text-rose-600"}">
        ${balanceIsPositive ? "+" : ""}${month.balance}
      </p>
      <p class="mt-1 text-xs text-slate-500">entradas menos saidas</p>
    </article>
  `;
}
```

**Estes são os cards que "somam e subtraem"** do enunciado do projeto:

| Card | Cor | Sinal |
|---|---|---|
| Entradas | Verde | Sempre `+` |
| Saídas | Vermelho | Sempre `-` |
| Saldo | Verde ou vermelho | Depende do resultado |

O saldo muda de cor **e** de sinal conforme o mês foi de crescimento ou de consumo do estoque.

### Parte E — As barras por categoria

```javascript
function renderByCategory(rows) {
  if (rows.length === 0) {
    byCategoryContainer.innerHTML = emptyState("Nenhum produto cadastrado");
    return;
  }

  const maxValue = Math.max(...rows.map((row) => row.costValue), 1);

  byCategoryContainer.innerHTML = rows
    .map((row) => {
      const percentage = Math.round((row.costValue / maxValue) * 100);

      return `
        <div>
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="font-medium text-slate-700">${escapeHtml(row.categoryName)}</span>
            <span class="text-slate-500">${currency.format(row.costValue)}</span>
          </div>
          <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-slate-900" style="width: ${percentage}%"></div>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            ${row.productCount} produto(s) - ${row.units} unidades
          </p>
        </div>
      `;
    })
    .join("");
}
```

#### 📊 Como o gráfico de barras funciona

Sem biblioteca nenhuma! Só duas `div` aninhadas:

```html
<div class="h-2 w-full bg-slate-100">      <!-- a trilha cinza -->
  <div class="h-full bg-slate-900"          <!-- a barra preta -->
       style="width: 62%"></div>
</div>
```

A conta que define a largura:

```javascript
const maxValue = Math.max(...rows.map((row) => row.costValue), 1);
const percentage = Math.round((row.costValue / maxValue) * 100);
```

A **maior** categoria vira 100%, e as outras ficam proporcionais:

| Categoria | Valor | Cálculo | Barra |
|---|---|---|---|
| Informática | 1242 | 1242/1242 | 100% |
| Bebidas | 1127 | 1127/1242 | 91% |
| Papelaria | 267 | 267/1242 | 22% |

#### ⚠️ O detalhe que evita um bug clássico

```javascript
Math.max(...rows.map((row) => row.costValue), 1)
//                                            ^^^
```

Esse `, 1` no final garante que `maxValue` **nunca** seja zero. Sem ele, se todos os valores fossem zero:

```javascript
0 / 0 = NaN
style="width: NaN%"    // barra quebrada
```

> 🎯 **É exatamente a mesma armadilha da média sem itens!**
>
> ```javascript
> return soma / quantidade;   // 0 / 0 = NaN
> ```
>
> Sempre que houver divisão, pergunte: *"e se o denominador for zero?"*

### Parte F — Alertas de estoque baixo

```javascript
function renderLowStock(rows) {
  if (rows.length === 0) {
    lowStockContainer.innerHTML = emptyState("Nenhum produto abaixo do minimo");
    return;
  }

  lowStockContainer.innerHTML = rows
    .map(
      (row) => `
        <div class="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-slate-800">${escapeHtml(row.name)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(row.sku)}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-rose-600">${row.quantity} un.</p>
            <p class="text-xs text-slate-500">minimo ${row.minimumStock}</p>
          </div>
        </div>
      `
    )
    .join("");
}
```

### Parte G — Tabela de movimentações recentes

```javascript
function renderRecent(rows) {
  if (rows.length === 0) {
    recentContainer.innerHTML = `
      <tr><td colspan="4" class="py-6 text-center text-sm text-slate-500">
        Nenhuma movimentacao registrada
      </td></tr>`;
    return;
  }

  recentContainer.innerHTML = rows
    .map((row) => {
      const isIn = row.type === "IN";

      return `
        <tr>
          <td class="py-3 pr-4">
            <p class="font-medium text-slate-800">${escapeHtml(row.productName)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(row.productSku)}</p>
          </td>
          <td class="py-3 pr-4">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${
              isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }">${isIn ? "Entrada" : "Saida"}</span>
          </td>
          <td class="py-3 pr-4 text-right font-semibold ${
            isIn ? "text-emerald-600" : "text-rose-600"
          }">${isIn ? "+" : "-"}${row.quantity}</td>
          <td class="py-3 text-right text-slate-500">${formatDateTime(row.createdAt)}</td>
        </tr>
      `;
    })
    .join("");
}
```

A variável `isIn` é calculada **uma vez** e usada três vezes: para a cor da etiqueta, o texto e o sinal do número.

```javascript
const isIn = row.type === "IN";
```

> 💡 Sem ela, você repetiria `row.type === "IN"` três vezes. Nomear a condição também documenta o código.

### Parte H — Estado vazio, carregamento e o botão

```javascript
function emptyState(message) {
  return `<p class="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">${message}</p>`;
}

async function loadDashboard() {
  try {
    const data = await api.getDashboard();

    renderCards(data.totals);
    renderMonth(data.month);
    renderByCategory(data.byCategory);
    renderLowStock(data.lowStock);
    renderRecent(data.recentMovements);
  } catch (error) {
    toast(error.message, "error");
  }
}

document.querySelector("[data-reload]").addEventListener("click", () => {
  loadDashboard();
  toast("Dashboard atualizado", "info");
});

loadDashboard();
```

**A última linha é a mais importante:** `loadDashboard()` é chamada assim que o script carrega. É ela que faz a tela nascer preenchida.

---

## Passo 3 — Juntar tudo

Agora crie o arquivo `public/js/dashboard.js` com **todas as partes na ordem** (A, B, C, D, E, F, G, H).

Se preferir conferir o arquivo inteiro de uma vez, ele está na [apostila completa](../apostila.md), seção 14.2.

---

## 🧠 O padrão que se repete em todas as telas

Guarde este ciclo — as próximas três etapas usam exatamente ele:

```text
   1. BUSCAR      const data = await api.getDashboard();
        |
        v
   2. TRANSFORMAR  rows.map(row => `<tr>...</tr>`).join("")
        |
        v
   3. INJETAR      container.innerHTML = html;
```

### Por que `.map().join("")`?

```javascript
const html = rows.map((row) => `<tr>${row.name}</tr>`).join("");
```

| Etapa | Resultado |
|---|---|
| `.map(...)` | `["<tr>Café</tr>", "<tr>Água</tr>"]` (array) |
| `.join("")` | `"<tr>Café</tr><tr>Água</tr>"` (string única) |

> ⚠️ **Se esquecer o `.join("")`**, o JavaScript converte o array em string usando **vírgulas**, e você verá vírgulas soltas na tela: `<tr>Café</tr>,<tr>Água</tr>`.

### Sempre trate a lista vazia

```javascript
if (rows.length === 0) {
  container.innerHTML = emptyState("Nenhum produto cadastrado");
  return;
}
```

Uma área em branco parece **bug**. Uma mensagem explícita informa o usuário de que está tudo certo, só não há dados ainda.

---

## Passo 4 — 🎉 Ver funcionando

Abra o navegador:

```text
http://localhost:3000
```

Você deve ver o dashboard completo, com dados reais do banco!

### Se a tela estiver em branco

1. Aperte `F12` para abrir as ferramentas do desenvolvedor
2. Vá na aba **Console**
3. Leia a mensagem de erro em vermelho

> 📌 **O Console é seu melhor amigo no front-end.** Diferente do backend, aqui os erros não aparecem no terminal — aparecem no navegador.

### 🧪 Teste que o dashboard é vivo

1. Deixe o dashboard aberto
2. Em outro terminal, registre uma entrada:

```bash
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"type":"IN","quantity":100,"note":"Teste visual"}'
```

3. Volte ao navegador e clique em **Atualizar**
4. Veja: **Entradas do mês** aumentou 100, o **saldo** mudou, o **valor de custo** subiu e a movimentação apareceu na tabela

---

## ✅ Confira se deu certo

- [ ] `public/index.html` existe
- [ ] `public/js/dashboard.js` existe
- [ ] `http://localhost:3000` mostra o dashboard
- [ ] O menu aparece no topo, com "Dashboard" destacado
- [ ] Os 4 cards mostram números reais
- [ ] Os valores aparecem como `R$ 2.744,70` (formato brasileiro)
- [ ] As barras por categoria têm larguras diferentes
- [ ] 3 produtos aparecem em "Estoque baixo"
- [ ] A tabela mostra as movimentações com `+` verde e `-` vermelho
- [ ] O botão **Atualizar** mostra um toast

---

## 🔧 Se deu erro

| Sintoma | Causa | Solução |
|---|---|---|
| Página totalmente em branco | Erro de JS | `F12` → Console |
| `Cannot use import statement` | Faltou `type="module"` | `<script type="module" src="/js/dashboard.js">` |
| `404 /js/dashboard.js` | Arquivo em lugar errado | Deve estar em `public/js/` |
| Cards vazios, sem erro | O container não foi encontrado | Confira se o HTML tem `data-cards` |
| `Cannot read properties of null` | `querySelector` não achou o elemento | Confira a grafia do `data-*` no HTML e no JS |
| Valores como `R$ NaN` | Vieram strings do backend | Confira os `Number()` do dashboard-service (Etapa 14) |
| Vírgulas soltas na tela | Faltou `.join("")` | Acrescente ao final do `.map()` |
| Layout sem estilo nenhum | Tailwind não carregou | Confira a tag `<script src="https://cdn.tailwindcss.com">` e sua internet |

---

## ➡️ Próximo passo

A tela mais bonita está pronta. Agora a mais completa: o CRUD visual de produtos.

**[Etapa 17 — Tela de Produtos](17-front-produtos.md)**
