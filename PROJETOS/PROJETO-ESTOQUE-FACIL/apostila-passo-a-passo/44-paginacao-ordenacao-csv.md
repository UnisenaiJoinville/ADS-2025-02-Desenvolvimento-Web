# Aula 44 — Paginação, ordenação e exportação

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** prática (HTML + Vue + Node)

---

## O que vamos construir

As três coisas que separam um relatório de uma listagem:

```text
   ┌──────────────────────────────────────────────────────┐
   │  SKU ▲   Produto    Categoria   Qtd.   Valor         │  ← ordenar clicando
   │  …                                                   │
   ├──────────────────────────────────────────────────────┤
   │  Mostrando 1-25 de 168   [Anterior] 1/7 [Proxima]   │  ← paginar
   └──────────────────────────────────────────────────────┘
                                        [Exportar CSV]      ← levar embora
```

E a aba **Resumos**, com os relatórios agregados das aulas 37, 39 e 41.

### Por que precisamos disso

| Recurso | Problema que resolve |
|---|---|
| Paginação | 50.000 linhas travam o navegador |
| Ordenação | "me mostra os de maior valor" |
| Exportação | o contador quer no Excel, não na tela |

### O conceito

O back-end já sabe fazer tudo isso desde a [Aula 34](34-select-filtros-ordenacao.md). O que falta é **a tela saber pedir** — e, no caso do CSV, um formato de resposta novo.

---

## Antes de começar

- [ ] [Aula 43](43-integracao-vue-api.md) concluída (filtros funcionando)

---

## Arquivos desta aula

```text
NOVOS ARQUIVOS
└── src/shared/http/to-csv.js

ARQUIVOS ALTERADOS
├── src/modules/reports/report-controller.js
├── public/js/api.js
├── public/relatorios.html
└── public/js/relatorios.js
```

---

# PARTE 1 — Paginação e ordenação na tela

## 1. O que o back-end já devolve

```json
{
  "pagination": { "page": 1, "pageSize": 25, "total": 12, "totalPages": 1 },
  "sort": { "key": "name", "direction": "asc" },
  "totals": { ... },
  "rows": [ ... ]
}
```

Tudo o que a interface precisa está aí. É o "envelope" que padronizamos na [Aula 34](34-select-filtros-ordenacao.md).

---

## Passo 1 — O rodapé de paginação

Em `public/relatorios.html`, dentro da seção de produtos, **depois** da div da tabela (e ainda dentro da div com borda), acrescente:

```html
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
```

Salve.

### 🔍 Os botões se desabilitam sozinhos

```html
:disabled="productFilters.page <= 1"
:disabled="productFilters.page >= productReport.pagination.totalPages"
```

Na primeira página, "Anterior" fica cinza. Na última, "Proxima".

> 💡 **Desabilitar é melhor que esconder.** O botão cinza diz "existe, mas não agora". Um botão que some confunde: o usuário procura onde ele foi parar.

### 🔍 O rodapé só aparece se houver dados

```html
v-if="!loading.products && productReport.pagination.total > 0"
```

Sem resultado, não há o que paginar. Mostrar "Mostrando 0-0 de 0" é ruído.

---

## Passo 2 — Cabeçalhos clicáveis

**Substitua** o `<thead>` da tabela de produtos por:

```html
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
```

Salve.

### 🔍 As colunas viram dados

Oito `<th>` escritos à mão viraram **um** `<th>` com `v-for` — o mesmo padrão das abas da [Aula 42](42-tela-relatorios-vue.md).

No `data()`, vamos declarar:

```javascript
productColumns: [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Produto" },
  { key: "category", label: "Categoria" },
  { key: "quantity", label: "Qtd.", align: "right" },
  ...
],
```

### ⚠️ As chaves precisam bater com a lista branca

```text
   public/js/relatorios.js          src/modules/reports/report-filters.js
   -----------------------          -------------------------------------
   { key: "category", ... }   ───►  category: "categoryName",
   { key: "stockValue", ... } ───►  stockValue: "stockCostValue",
```

Se você escrever `key: "categoria"` no front, o back-end responde `400`. **E isso é bom**: o erro aparece na hora, não vira uma ordenação silenciosamente ignorada.

> 📌 A lista branca da [Aula 34](34-select-filtros-ordenacao.md) virou, na prática, o **contrato** entre as duas pontas.

### 🔍 A seta só aparece na coluna ativa

```html
<span v-if="productFilters.sort === column.key">
  {{ productFilters.direction === "asc" ? "▲" : "▼" }}
</span>
```

Sem isso, o usuário não sabe por qual coluna a tabela está ordenada — e ordenação invisível é pior que nenhuma.

---

## Passo 3 — Os métodos

Em `public/js/relatorios.js`, acrescente ao `data()`:

```javascript
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
```

Aos `computed`:

```javascript
      productRangeLabel() {
        const { page, pageSize, total } = this.productReport.pagination;
        const first = (page - 1) * pageSize + 1;
        const last = Math.min(page * pageSize, total);

        return `${first}-${last}`;
      },
```

E aos `methods`:

```javascript
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
```

Salve.

### 🔍 `Math.min` no fim do intervalo

```javascript
const last = Math.min(page * pageSize, total);
```

Na última página, `page * pageSize` passa do total.

```text
   12 registros, 5 por página, página 3:
      3 × 5 = 15        ->  "Mostrando 11-15 de 12"   ❌
      min(15, 12) = 12  ->  "Mostrando 11-12 de 12"   ✅
```

> 🔍 Confira com a API: a página 3 de 12 registros devolve **4 linhas**, não 5. O rótulo precisa concordar com o que está na tela.

### 🔍 Ordenar **não** usa `resetAndLoad`... ou usa?

```javascript
sortProducts(key) {
  ...
  this.resetAndLoadProducts();   // volta para a página 1
}
```

Mudar a ordenação com 7 páginas: se você ficasse na página 3, veria registros do meio de uma ordem nova. Confuso.

> 📌 **Reordenar é uma pergunta nova.** Volta para o começo, como qualquer mudança de filtro.

### 🔍 `changeProductPage` valida antes

```javascript
if (page < 1 || page > this.productReport.pagination.totalPages) return;
```

Os botões já estão desabilitados nos extremos. Este `if` é o cinto de segurança: alguém pode chamar o método pelo console, ou um clique duplo pode escapar.

> 💡 **Validar nas duas pontas não é redundância, é camada.** Mesmo princípio da validação no cliente e no servidor da [Aula 29](29-tela-cadastro-vue.md).

---

# PARTE 2 — Exportar para CSV

## 2. Por que CSV e não Excel

```text
   .xlsx   formato binário, precisa de biblioteca, 500 KB de dependência
   .csv    texto puro, qualquer planilha abre, zero dependência
```

Para "quero levar isso para a planilha", CSV resolve 95% dos casos.

### O que parece simples e não é

"CSV é só separar por vírgula." Três problemas destroem essa ideia:

```text
   1. E se o valor TEM uma vírgula?
      Mouse sem fio, preto  ->  vira duas colunas

   2. E se o valor TEM aspas?
      Cabo 2" HDMI          ->  quebra o escape

   3. E se o valor TEM quebra de linha?
      uma observação
      em duas linhas        ->  vira duas linhas na planilha
```

---

## Passo 4 — O conversor

Crie `src/shared/http/to-csv.js`:

```javascript
// Converte uma lista de objetos em texto CSV.
//
// CSV parece trivial ("e so separar por virgula") e nao e: basta um
// valor conter o separador, uma aspa ou uma quebra de linha para o
// arquivo inteiro sair torto. As tres regras abaixo resolvem isso.

// Excel em portugues espera PONTO E VIRGULA como separador, porque a
// virgula ja e o separador decimal. Com virgula, tudo cai numa coluna so.
const SEPARATOR = ";";

// BOM (Byte Order Mark): tres bytes invisiveis no inicio do arquivo
// que avisam ao Excel "isto e UTF-8". Sem ele, acentos viram simbolos.
const BOM = "﻿";

function escapeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  // Regra 1: campo com separador, aspas ou quebra de linha vai entre aspas.
  // Regra 2: aspa dentro do campo e escrita duas vezes.
  if (
    text.includes(SEPARATOR) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

/**
 * @param {object[]} rows    as linhas do relatorio
 * @param {{key: string, label: string, format?: Function}[]} columns
 *        quais colunas exportar, em qual ordem e com qual titulo
 */
export function toCsv(rows, columns) {
  const header = columns.map((column) => escapeValue(column.label)).join(SEPARATOR);

  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = column.format ? column.format(row[column.key], row) : row[column.key];

        return escapeValue(value);
      })
      .join(SEPARATOR)
  );

  // \r\n e o fim de linha previsto na especificacao do CSV (RFC 4180).
  return BOM + [header, ...body].join("\r\n");
}

// Numero no formato brasileiro: 1234.5 -> "1234,50"
export function csvNumber(value, decimals = 2) {
  if (value === null || value === undefined) {
    return "";
  }

  return Number(value).toFixed(decimals).replace(".", ",");
}
```

Salve.

### 🔍 As duas regras do escape

```javascript
if (text.includes(SEPARATOR) || text.includes('"') || text.includes("\n")) {
  return `"${text.replaceAll('"', '""')}"`;
}
```

| Regra | Exemplo |
|---|---|
| Campo problemático vai **entre aspas** | `Mouse, preto` → `"Mouse, preto"` |
| Aspa interna é **duplicada** | `Cabo 2" HDMI` → `"Cabo 2"" HDMI"` |

Essas são as regras da RFC 4180, a especificação do CSV. Parecem arbitrárias; são o que toda planilha espera.

### 🔍 Ponto e vírgula, não vírgula

```javascript
const SEPARATOR = ";";
```

O Excel em português usa a **vírgula como separador decimal**. Com vírgula separando colunas, `1,50` viraria duas células.

```text
   separador ","  ->  SKU | Produto | 1 | 50     ❌
   separador ";"  ->  SKU | Produto | 1,50       ✅
```

> ⚠️ **Isso é dependente de região.** Um Excel em inglês espera vírgula. Sistemas que exportam para o mundo inteiro oferecem a escolha — ou mandam `.xlsx` mesmo.

### 🔍 O BOM: três bytes invisíveis

```javascript
const BOM = "﻿";
```

Sem ele, o Excel abre o arquivo como ANSI e "Alcool em gel" vira "Ã¡lcool em gel".

O BOM é uma marca no início do arquivo que diz "isto é UTF-8". É invisível em qualquer editor decente — e é o que faz os acentos aparecerem.

> 🔍 **Teste em sala:** gere o CSV, abra no Excel. Depois remova o BOM, gere de novo e abra. A diferença é visível e inesquecível.

### 🔍 `\r\n` no fim da linha

```javascript
return BOM + [header, ...body].join("\r\n");
```

A especificação do CSV pede `\r\n` (o fim de linha do Windows). A maioria dos programas aceita só `\n`, mas alguns importadores antigos não.

### 🔍 `csvNumber`: vírgula decimal

```javascript
return Number(value).toFixed(decimals).replace(".", ",");
```

```text
   1234.5  ->  "1234,50"
```

Sem isso, o Excel em português leria `1234.50` como **texto**, não como número — e não somaria a coluna.

---

## Passo 5 — O controller devolve CSV

**Substitua** o conteúdo de `src/modules/reports/report-controller.js` por:

```javascript
import { csvNumber, toCsv } from "../../shared/http/to-csv.js";

import {
  parseMovementReportFilters,
  parseProductReportFilters,
  parseTopProductsOptions,
} from "./report-filters.js";
import * as service from "./report-service.js";

// ------------------------------------------------------------------
// O controller dos relatorios faz o de sempre - le a requisicao,
// chama o service, escreve a resposta - e mais uma coisa: decide o
// FORMATO da saida (JSON para a tela, CSV para download).
// ------------------------------------------------------------------

// Colunas do CSV de produtos: ordem e titulos que o usuario vai ver.
const PRODUCT_CSV_COLUMNS = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Produto" },
  { key: "categoryName", label: "Categoria" },
  { key: "quantity", label: "Quantidade" },
  { key: "minimumStock", label: "Estoque minimo" },
  { key: "stockStatus", label: "Situacao" },
  { key: "costPrice", label: "Preco de custo", format: (value) => csvNumber(value) },
  { key: "salePrice", label: "Preco de venda", format: (value) => csvNumber(value) },
  { key: "stockCostValue", label: "Valor em estoque", format: (value) => csvNumber(value) },
];

const MOVEMENT_CSV_COLUMNS = [
  { key: "createdAt", label: "Data" },
  { key: "productSku", label: "SKU" },
  { key: "productName", label: "Produto" },
  { key: "categoryName", label: "Categoria" },
  { key: "type", label: "Tipo", format: (value) => (value === "IN" ? "Entrada" : "Saida") },
  { key: "quantity", label: "Quantidade" },
  { key: "userName", label: "Responsavel" },
  { key: "note", label: "Observacao" },
];

// Quando o cliente pede ?format=csv, exportamos a selecao INTEIRA,
// e nao so a pagina que esta na tela - ninguem quer baixar 25 linhas
// de um relatorio de 400.
const CSV_PAGE_SIZE = 200;

function wantsCsv(request) {
  return String(request.query.format ?? "").toLowerCase() === "csv";
}

function sendCsv(response, { fileName, rows, columns }) {
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  // Content-Disposition: attachment faz o navegador BAIXAR o arquivo
  // em vez de tentar exibi-lo.
  response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  response.send(toCsv(rows, columns));
}

export async function products(request, response) {
  const filters = parseProductReportFilters(request.query);

  if (wantsCsv(request)) {
    const report = await service.getProductReport({
      ...filters,
      page: 1,
      offset: 0,
      pageSize: CSV_PAGE_SIZE,
    });

    return sendCsv(response, {
      fileName: "relatorio-produtos.csv",
      rows: report.rows,
      columns: PRODUCT_CSV_COLUMNS,
    });
  }

  const report = await service.getProductReport(filters);

  return response.json(report);
}

export async function stockSummary(request, response) {
  const summary = await service.getStockSummary();

  response.json(summary);
}

export async function stockByCategory(request, response) {
  const rows = await service.getStockByCategory();

  response.json(rows);
}

export async function productsWithoutMovement(request, response) {
  const rows = await service.getProductsWithoutMovement();

  response.json(rows);
}

export async function abcCurve(request, response) {
  const rows = await service.getAbcCurve();

  response.json(rows);
}

export async function movements(request, response) {
  const filters = parseMovementReportFilters(request.query);

  if (wantsCsv(request)) {
    const report = await service.getMovementReport({
      ...filters,
      page: 1,
      offset: 0,
      pageSize: CSV_PAGE_SIZE,
    });

    return sendCsv(response, {
      fileName: "relatorio-movimentacoes.csv",
      rows: report.rows,
      columns: MOVEMENT_CSV_COLUMNS,
    });
  }

  const report = await service.getMovementReport(filters);

  return response.json(report);
}

export async function movementsByUser(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const rows = await service.getMovementsByUser(filters);

  response.json(rows);
}

export async function movementsByMonth(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const rows = await service.getMovementsByMonth(filters);

  response.json(rows);
}

export async function topProducts(request, response) {
  const filters = parseMovementReportFilters(request.query);

  const rows = await service.getTopProducts(filters, parseTopProductsOptions(request.query));

  response.json(rows);
}
```

Salve.

### 🔍 O mesmo endpoint, dois formatos

```javascript
function wantsCsv(request) {
  return String(request.query.format ?? "").toLowerCase() === "csv";
}
```

```text
   GET /api/reports/products            ->  JSON
   GET /api/reports/products?format=csv ->  arquivo CSV
```

Mesma rota, mesmos filtros, mesma consulta. Só a **apresentação** muda.

> 📌 **Por que não uma rota `/products.csv`?** Porque seria uma rota a mais para manter em sincronia. O formato é uma característica da **resposta**, não do recurso — e o HTTP já tem lugar para isso (o cabeçalho `Accept`). Usamos um parâmetro porque é mais fácil de testar no navegador.

### 🔍 A exportação ignora a paginação

```javascript
// Quando o cliente pede ?format=csv, exportamos a selecao INTEIRA,
// e nao so a pagina que esta na tela - ninguem quer baixar 25 linhas
// de um relatorio de 400.
const CSV_PAGE_SIZE = 200;
```

```javascript
const report = await service.getProductReport({
  ...filters,
  page: 1,
  offset: 0,
  pageSize: CSV_PAGE_SIZE,
});
```

Os **filtros** são respeitados; a **paginação** é descartada.

> ⚠️ **E por que não ilimitado?** Porque um `SELECT` sem `LIMIT` numa tabela de milhões de linhas derruba o servidor. 200 é um teto didático; um sistema real faria exportação em segundo plano, gerando o arquivo e avisando quando ficasse pronto.

### 🔍 Os dois cabeçalhos HTTP

```javascript
response.setHeader("Content-Type", "text/csv; charset=utf-8");
response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
```

| Cabeçalho | O que faz |
|---|---|
| `Content-Type` | diz **o que** é o conteúdo |
| `Content-Disposition: attachment` | manda **baixar** em vez de exibir |

Sem o segundo, o navegador mostraria o CSV como texto na tela.

### 🔍 As colunas do CSV são declaradas, não automáticas

```javascript
const PRODUCT_CSV_COLUMNS = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Produto" },
  ...
];
```

Poderíamos exportar todas as chaves do objeto. Declarar tem três vantagens:

| | |
|---|---|
| **Ordem** | o SKU vem primeiro, como numa planilha de verdade |
| **Títulos em português** | "Preco de custo", não `costPrice` |
| **Controle** | campos internos (`id`, `active`) não vazam |

> 📌 É a mesma ideia da **lista branca**: escolher o que sai é mais seguro que lembrar de remover.

---

## Passo 6 — O download no navegador

Em `public/js/api.js`, acrescente — **fora** do objeto `api`, junto do `buildQuery`:

```javascript
// Baixar um arquivo e diferente de buscar JSON: a resposta nao e
// convertida, vira um Blob e o navegador salva em disco.
// Mesmo assim o token precisa ir junto - por isso isto mora aqui.
export async function downloadReport(path, filters, fileName) {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}${buildQuery({ ...filters, format: "csv" })}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel gerar o arquivo");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Truque padrao: cria um link invisivel, clica nele e descarta.
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();

  // Libera a memoria que o Blob ocupava.
  URL.revokeObjectURL(url);
}
```

Salve.

### 🔍 Por que não um `<a href>` simples

A resposta óbvia seria:

```html
<a href="/api/reports/products?format=csv" download>Exportar</a>
```

Não funciona. O navegador faria a requisição **sem o cabeçalho `Authorization`**, e a API responderia `401`.

> 📌 **Qualquer download de API protegida precisa passar por `fetch`.** É uma consequência direta da escolha de usar token no cabeçalho em vez de cookie (veja a [Aula 29](29-tela-cadastro-vue.md)).

### 🔍 Blob e o link invisível

```javascript
const blob = await response.blob();
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = fileName;
document.body.append(link);
link.click();
link.remove();

URL.revokeObjectURL(url);
```

Passo a passo:

```text
   1. response.blob()          o conteúdo vira um objeto binário na memória
   2. createObjectURL          cria uma URL temporária tipo blob:http://...
   3. <a download>             um link que o usuário nunca vê
   4. link.click()             dispara o download por código
   5. link.remove()            limpa o DOM
   6. revokeObjectURL          libera a memória do Blob
```

> ⚠️ **O passo 6 é esquecido com frequência.** Sem ele, cada exportação deixa o arquivo inteiro na memória até a página ser recarregada. Com relatórios grandes e muitos cliques, a aba trava.

### 🔍 `format: "csv"` entra no `buildQuery`

```javascript
buildQuery({ ...filters, format: "csv" })
```

Os filtros atuais da tela vão junto — então o CSV sai **exatamente** com o que o usuário está vendo.

---

## Passo 7 — Os botões de exportar

Em `relatorios.html`, na barra de filtros de produtos, ao lado de "Limpar filtros":

```html
              <button
                :disabled="productReport.rows.length === 0"
                class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                @click="exportProducts"
              >
                Exportar CSV
              </button>
```

E em `relatorios.js`, nos `methods`:

```javascript
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
```

E acrescente ao import do topo:

```javascript
import { api, downloadReport } from "./api.js";
```

Salve.

> 💡 Faça o mesmo botão na barra da aba Movimentações, chamando `exportMovements`.

---

## Passo 8 — Testar

```bash
docker compose restart api
```

Abra a tela com **Ctrl + Shift + R**.

### Roteiro — paginação

| # | Faça | Esperado |
|---|---|---|
| 1 | Olhe o rodapé | "Mostrando 1-12 de 12", botões cinza |
| 2 | No console, mude o tamanho da página | veja abaixo |
| 3 | Clique em "Proxima" | A tabela muda, "2 / 3" |
| 4 | Vá até a última página | "Proxima" fica cinza; a última página tem menos linhas |
| 5 | Olhe o rótulo na última | "Mostrando 11-12 de 12", não "11-15" |

Para o teste 2, no console do navegador:

```javascript
const app = document.querySelector("#app").__vue_app__._instance.proxy;
app.productFilters.pageSize = 5;
app.loadProducts();
```

### Roteiro — ordenação

| # | Faça | Esperado |
|---|---|---|
| 6 | Clique em "Qtd." | Ordena crescente, seta ▲ |
| 7 | Clique de novo | Inverte, seta ▼ |
| 8 | Clique em "Valor" | A seta muda de coluna |
| 9 | Clique em "Categoria" | Ordena pelo **nome** da categoria |
| 10 | Estando na página 3, ordene | Volta para a página 1 |

> 🔍 **O teste 9 é o mais interessante:** `categoryName` é um apelido criado por um `LEFT JOIN` (Aula 37). A tela pede `sort=category`, a lista branca traduz para `categoryName`, e o `ORDER BY` consegue usá-lo porque roda **depois** do `SELECT`.

### Roteiro — exportação

| # | Faça | Esperado |
|---|---|---|
| 11 | Clique em "Exportar CSV" | Baixa `relatorio-produtos.csv` |
| 12 | Abra no Excel ou LibreOffice | Colunas separadas, acentos certos |
| 13 | Olhe a coluna "Valor em estoque" | Números, não texto (alinhados à direita) |
| 14 | Filtre "Abaixo do minimo" e exporte | O CSV traz **só** os filtrados |
| 15 | Filtre algo com 1 resultado | O botão continua ativo |
| 16 | Filtre algo com 0 resultados | O botão fica cinza |

### Teste 17 — O CSV por fora

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')

curl -s "http://localhost:3000/api/reports/products?format=csv&stockStatus=LOW" \
  -H "Authorization: Bearer $TOKEN" | head -4 | cat -v
```

```text
M-oM-;M-?SKU;Produto;Categoria;Quantidade;Estoque minimo;Situacao;Preco de custo;...^M
BEB-002;Agua mineral 500ml;Bebidas;8;20;LOW;0,90;2,50;7,20^M
PAP-003;Bloco de notas adesivas;Papelaria;7;20;LOW;3,40;8,50;23,80^M
```

### 🔍 Lendo a saída do `cat -v`

| Marca | O que é |
|---|---|
| `M-oM-;M-?` | o **BOM** (os três bytes `EF BB BF`) |
| `^M` | o `\r` do fim de linha |
| `0,90` | a vírgula decimal do `csvNumber` |

> 🎉 Está tudo lá: BOM, separador `;`, `\r\n` e vírgula decimal.

### Teste 18 — O escape funcionando

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
  -e "UPDATE products SET name = 'Cabo 2\" HDMI; com ponto e virgula' WHERE sku='INF-003';"

curl -s "http://localhost:3000/api/reports/products?format=csv&search=cabo" \
  -H "Authorization: Bearer $TOKEN" | tail -1
```

```text
INF-003;"Cabo 2"" HDMI; com ponto e virgula";Informatica;15;5;OK;12,00;29,90;180,00
```

🎉 **O campo foi para dentro de aspas e a aspa interna virou duas.** Abra no Excel: fica numa célula só.

Agora desfaça:

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
  -e "UPDATE products SET name = 'Cabo HDMI 2m' WHERE sku='INF-003';"
```

---

## ✅ Confira se deu certo

- [ ] O rodapé mostra "Mostrando X-Y de Z"
- [ ] "Anterior" fica cinza na página 1; "Proxima" na última
- [ ] A última página mostra o intervalo certo, não passando do total
- [ ] Clicar no cabeçalho ordena; clicar de novo inverte
- [ ] A seta ▲▼ aparece só na coluna ativa
- [ ] Ordenar volta para a página 1
- [ ] "Exportar CSV" baixa o arquivo
- [ ] O CSV abre no Excel com colunas e acentos corretos
- [ ] O CSV respeita os filtros da tela
- [ ] Um nome com `"` e `;` sai escapado corretamente

---

## 🔧 Erros comuns

### O CSV abre tudo numa coluna só

O Excel está esperando outro separador. Confira o `SEPARATOR = ";"`.

### Os acentos viraram símbolos

Faltou o BOM, ou ele foi acrescentado no lugar errado — tem que ser o **primeiro** caractere do arquivo.

### O navegador mostra o CSV na tela em vez de baixar

Faltou o `Content-Disposition: attachment`.

### O download dá `401`

Você usou `<a href>` em vez do `fetch` do `downloadReport`. O token não vai num link comum.

### O CSV vem com só 25 linhas

O controller não está sobrescrevendo `pageSize` no caminho do CSV.

### A ordenação devolve `400`

A `key` do `productColumns` não existe na lista branca do `report-filters.js`. A mensagem de erro lista as chaves válidas.

### A seta aparece em todas as colunas

O `v-if` do `<span>` está faltando, ou compara com a coisa errada.

### "Mostrando 11-15 de 12"

Faltou o `Math.min` no `productRangeLabel`.

### A memória do navegador cresce a cada exportação

Faltou o `URL.revokeObjectURL(url)`.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| Desabilitar é melhor que esconder | Passo 1 |
| Colunas como **dados**, não como HTML repetido | Passo 2 |
| A lista branca virou **contrato** entre front e back | Passo 2 |
| `Math.min` no fim do intervalo | Passo 3 |
| Reordenar volta para a página 1 | Passo 3 |
| As regras de escape do CSV (RFC 4180) | Passo 4 |
| Separador `;` e vírgula decimal no Excel pt-BR | Passo 4 |
| O **BOM** e os acentos | Passo 4 |
| Mesmo endpoint, dois formatos | Passo 5 |
| `Content-Disposition: attachment` | Passo 5 |
| Exportação respeita filtro, ignora paginação | Passo 5 |
| Download de API protegida exige `fetch` + Blob | Passo 6 |
| `revokeObjectURL` para não vazar memória | Passo 6 |

---

## ➡️ Próximo passo

Falta o último degrau de SQL — e o fechamento do bloco.

**[Aula 45 — Subqueries e relatórios avançados](45-subqueries-e-relatorios-avancados.md)**
