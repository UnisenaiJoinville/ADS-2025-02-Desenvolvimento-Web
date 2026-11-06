# Aula 64 — Paginação e busca ao vivo na tela de Produtos

⏱️ **Tempo estimado:** 60 minutos
📋 **Tipo:** prática (back-end + front-end)

---

## Objetivo

Hoje, `GET /api/products` devolve **todos** os produtos de uma vez, e a tela de Produtos só filtra quando você clica em "Filtrar". Nesta aula:

- a API passa a devolver os produtos **por página**, com o total;
- a tela ganha um **rodapé de paginação** e um seletor "por página";
- a busca vira **ao vivo**: digitou, a tabela filtra sozinha.

```text
 +--------------------------------------------------------------------+
 | [🔍 Buscar por nome ou SKU     ] [Categoria v] [ ] Estoque baixo [Limpar] |
 +--------------------------------------------------------------------+
 | PRODUTO        CATEGORIA   CUSTO   VENDA   ESTOQUE   STATUS  ACOES |
 | ...10 linhas...                                                    |
 +--------------------------------------------------------------------+
 | Mostrando 11-20 de 37 produto(s)     Por pagina [10 v]  [<] 2/4 [>] |
 +--------------------------------------------------------------------+
```

---

## Antes de começar

- [ ] [Aula 63](63-autocomplete-produtos.md) concluída: **Movimentações não usa mais `api.listProducts`**

> ⚠️ **A ordem das aulas importa aqui.** Esta aula **muda o formato** da resposta de `GET /api/products`. Se Movimentações ainda usasse essa rota para o `<select>`, ela quebraria. É por isso que o autocomplete veio antes.

---

## Arquivos desta aula

```text
NOVO ARQUIVO
└── src/shared/http/pagination.js

ARQUIVOS ALTERADOS
├── src/modules/products/product-repository.js   (findAll paginado + countAll)
├── src/modules/products/product-service.js      (listProducts devolve envelope)
├── src/modules/products/product-controller.js   (index le page/pageSize)
├── public/produtos.html                          (filtros + rodape)
└── public/js/produtos.js                         (paginacao + busca ao vivo)
```

---

# PARTE 1 — O back-end

## 1. O contrato novo da API

```text
GET /api/products?search=cafe&page=2&pageSize=10
```

```json
{
  "pagination": { "page": 2, "pageSize": 10, "total": 37, "totalPages": 4 },
  "rows": [ { "id": 11, "name": "...", ... }, ... ]
}
```

É **o mesmo envelope** dos relatórios ([Aula 34](34-select-filtros-ordenacao.md)). Quem aprendeu a ler um, sabe ler o outro.

> 📌 **Mudar o formato de uma resposta é quebrar um contrato.** Antes, a rota devolvia um array; agora devolve um objeto. Todo código que usava a rota precisa ser atualizado **junto**. Em APIs públicas, usadas por outras empresas, isso exigiria uma rota nova (`/api/v2/products`) para não quebrar ninguém. Aqui controlamos o único consumidor (a tela de Produtos), então atualizamos os dois lados na mesma aula.

---

## Passo 1 — Um ajudante de paginação compartilhado

A leitura de `page` e `pageSize` já existe no `report-filters.js` (Aula 34), mas é uma função **privada** dele. Em vez de copiar, vamos criar um ajudante que **qualquer módulo** pode usar.

Crie `src/shared/http/pagination.js`:

```javascript
import { AppError } from "../errors/app-error.js";

// Le ?page= e ?pageSize= da URL com seguranca (Aula 64).
// Cada listagem escolhe o proprio tamanho padrao e o proprio teto.
export function parsePagination(query, { defaultPageSize = 10, maxPageSize = 100 } = {}) {
  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? defaultPageSize);

  if (!Number.isInteger(page) || page <= 0) {
    throw new AppError("O parametro page deve ser um inteiro maior que zero");
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > maxPageSize) {
    throw new AppError(`O parametro pageSize deve ser um inteiro entre 1 e ${maxPageSize}`);
  }

  // OFFSET: quantas linhas pular antes de comecar a devolver.
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// O bloco "pagination" do envelope, sempre no mesmo formato.
export function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total,
    // Math.ceil: 26 registros de 10 em 10 sao 3 paginas, nao 2,6.
    // Math.max(1, ...): sem nenhum registro, ainda existe a "pagina 1".
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
```

Salve.

### 🔍 Por que em `src/shared/http/`?

Pelo mesmo motivo do `parse-id.js` da [Aula 08](08-tratamento-de-erros.md): não é regra de produto nem de relatório, é **tratamento de parâmetro HTTP**. Mora junto com os outros ajudantes de HTTP.

> 💡 **Exercício para depois:** o `report-filters.js` e o `report-service.js` têm cópias destas duas funções. Troque-as por um `import` deste arquivo. Uma regra, um lugar.

### 🔍 A conta do `offset`

| `page` | `pageSize` | `offset` | O banco devolve |
|---|---|---|---|
| 1 | 10 | 0 | linhas 1 a 10 |
| 2 | 10 | 10 | linhas 11 a 20 |
| 4 | 10 | 30 | linhas 31 a 37 (a última página pode vir incompleta) |

---

## Passo 2 — O repositório

Abra `src/modules/products/product-repository.js`.

### 2.1 Um ajudante para os curingas do `LIKE`

Na [Aula 62](62-api-busca-produtos.md), o `search` passou a escapar `%` e `_`. A listagem também usa `LIKE` e tem o **mesmo** problema. Logo abaixo do `SELECT_PRODUCT`, acrescente:

```javascript
// % e _ sao CURINGAS do LIKE. Escapamos para que "50%" digitado
// signifique o texto "50%" (Aula 62). Usado pela busca e pela listagem.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, "\\$&");
}
```

E, dentro da função `search`, troque a linha:

```javascript
  const escaped = term.replace(/[\\%_]/g, "\\$&");
```

por:

```javascript
  const escaped = escapeLike(term);
```

> 🔍 Isso é uma **refatoração**: o comportamento não muda, só o código fica num lugar. A regra "como escapar o `LIKE`" agora existe uma vez só.

### 2.2 O `findAll` paginado e o `countAll`

Localize a função `findAll` inteira (da Aula 12) e **substitua** por estas três funções:

```javascript
// Monta o WHERE da listagem. Usado pelo findAll E pelo countAll:
// as duas consultas PRECISAM filtrar exatamente igual (Aula 64).
function buildListFilters({ search = "", categoryId = null, onlyLowStock = false }) {
  const conditions = [];
  const params = [];

  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
    params.push(pattern, pattern);
  }

  if (categoryId) {
    conditions.push("p.category_id = ?");
    params.push(categoryId);
  }

  if (onlyLowStock) {
    conditions.push("p.quantity <= p.minimum_stock");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return { where, params };
}

export async function findAll(filters = {}) {
  const { where, params } = buildListFilters(filters);

  const [rows] = await pool.query(
    // p.id no fim do ORDER BY: desempate estavel entre nomes iguais.
    `${SELECT_PRODUCT} ${where} ORDER BY p.name, p.id LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map(toProduct);
}

export async function countAll(filters = {}) {
  const { where, params } = buildListFilters(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${where}`,
    params
  );

  return Number(rows[0].total);
}
```

Salve.

---

## 2. Dissecando o repositório

### 2.1 Por que duas consultas?

Para desenhar "Mostrando 11-20 de **37**" e "página 2 de **4**", a tela precisa de duas informações diferentes:

| Pergunta | Consulta | Responde |
|---|---|---|
| "Quais produtos vão nesta página?" | `SELECT ... LIMIT 10 OFFSET 10` | 10 linhas |
| "Quantos produtos existem **ao todo** com este filtro?" | `SELECT COUNT(*) ...` | 37 |

A primeira não responde a segunda: ela só enxerga as 10 linhas da página.

### 2.2 O WHERE em um lugar só

```javascript
function buildListFilters({ search, categoryId, onlyLowStock }) { ... }
```

O perigo de ter duas consultas é elas **discordarem**. Imagine que alguém acrescente um filtro novo só no `findAll`:

```text
   findAll:   WHERE ativo AND categoria = 3   -> 4 produtos na tela
   countAll:  WHERE categoria = 3             -> "Mostrando 1-4 de 9"  (mentira!)
```

Com as duas usando a **mesma função** para montar o `WHERE`, isso não tem como acontecer.

> 📌 **Quando duas coisas precisam ser iguais, faça uma usar a outra.** Duas cópias "iguais" sempre acabam ficando diferentes.

### 2.3 O `COUNT(*)` não precisa do `JOIN`

```sql
SELECT COUNT(*) AS total FROM products p WHERE ...
```

O `SELECT_PRODUCT` faz `LEFT JOIN categories` para trazer o nome da categoria. Para **contar**, o nome não importa, e o `LEFT JOIN` nunca muda a quantidade de produtos (lembra da [Aula 37](37-left-join.md)?). Contar direto em `products` é mais leve.

> ⚠️ Repare que os filtros usam o apelido `p.` (`p.name`, `p.category_id`). Por isso a contagem também precisa de `FROM products p`. Sem o `p`, o MySQL responde `Unknown column 'p.name'`.

### 2.4 O desempate no `ORDER BY`

```sql
ORDER BY p.name, p.id
```

Imagine dois produtos chamados "Caneta" (cores diferentes), e cada um caindo bem na divisa entre a página 1 e a 2. Ordenando **só** por nome, o MySQL pode devolver os dois empatados em ordens diferentes a cada consulta:

```text
   consulta da pagina 1:  ... Caneta (id 7)  <- ultima linha
   consulta da pagina 2:  Caneta (id 7) ...  <- primeira linha DE NOVO!
                          (e a Caneta id 12 nunca aparece)
```

Com o `p.id` como segundo critério, não existe empate: a ordem é sempre a mesma.

> 📌 **Toda paginação precisa de uma ordem total**: termine o `ORDER BY` com uma coluna única (normalmente o `id`).

### 2.5 `LIMIT ? OFFSET ?`

```javascript
[...params, filters.pageSize, filters.offset]
```

Os dois `?` novos ficam **no fim** do SQL, então os valores deles ficam **no fim** do array, depois dos parâmetros do `WHERE`. O `...params` espalha os filtros primeiro.

---

## Passo 3 — O service

Abra `src/modules/products/product-service.js`.

Acrescente o import do ajudante no topo:

```javascript
import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import { buildPagination } from "../../shared/http/pagination.js";
import * as categoryRepository from "../categories/category-repository.js";
```

E troque a função `listProducts`:

```javascript
export async function listProducts(filters) {
  return repository.findAll(filters);
}
```

por:

```javascript
export async function listProducts(filters) {
  // As duas consultas sao independentes: rodam ao mesmo tempo.
  const [rows, total] = await Promise.all([
    repository.findAll(filters),
    repository.countAll(filters),
  ]);

  return {
    pagination: buildPagination(filters, total),
    rows,
  };
}
```

Salve.

> 🔍 O `Promise.all` é o mesmo do dashboard ([Aula 14](14-dashboard-api.md)): as duas consultas não dependem uma da outra, então não há por que esperar uma terminar para começar a outra.

---

## Passo 4 — O controller

Abra `src/modules/products/product-controller.js`.

Acrescente o import:

```javascript
import { AppError } from "../../shared/errors/app-error.js";
import { parsePagination } from "../../shared/http/pagination.js";
import { parseId } from "../../shared/http/parse-id.js";
```

E troque a função `index`:

```javascript
export async function index(request, response) {
  const { search, categoryId, lowStock } = request.query;

  // Padrao de 10 por pagina; no maximo 100 (toda listagem tem um teto).
  const { page, pageSize, offset } = parsePagination(request.query, {
    defaultPageSize: 10,
    maxPageSize: 100,
  });

  const result = await service.listProducts({
    search: typeof search === "string" ? search.trim() : "",
    categoryId: categoryId ? parseId(categoryId, "categoryId") : null,
    onlyLowStock: lowStock === "true",
    page,
    pageSize,
    offset,
  });

  response.json(result);
}
```

Salve.

---

## Passo 5 — Testar a API

Pegue o token (Git Bash), como na Aula 62:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')
```

| # | Comando (acrescente `-H "Authorization: Bearer $TOKEN"`) | Esperado |
|---|---|---|
| 1 | `curl -s "http://localhost:3000/api/products"` | `{ "pagination": {...}, "rows": [...] }` com até 10 linhas |
| 2 | `curl -s "http://localhost:3000/api/products?pageSize=3"` | 3 linhas; `totalPages` = total ÷ 3, arredondado para cima |
| 3 | `curl -s "http://localhost:3000/api/products?pageSize=3&page=2"` | as 3 linhas **seguintes**, sem repetir nenhuma |
| 4 | `curl -s "http://localhost:3000/api/products?page=999"` | `rows: []`, mas `total` correto |
| 5 | `curl -s "http://localhost:3000/api/products?search=caf&pageSize=1"` | `total` conta só os que têm "caf" |
| 6 | `curl -s "http://localhost:3000/api/products?pageSize=500"` | `400` — "entre 1 e 100" |
| 7 | `curl -s "http://localhost:3000/api/products?page=0"` | `400` — "maior que zero" |
| 8 | `curl -s "http://localhost:3000/api/products?search=%25"` | `total: 0` (o `%` é texto, não curinga) |

> 🔍 **Confira o teste 3 com cuidado.** Anote os `id` da página 1 e da página 2. Nenhum pode se repetir. Se repetir, faltou o `p.id` no `ORDER BY`.

Neste momento, a **tela** de Produtos está quebrada (ela espera um array e recebe um objeto). É esperado: vamos consertar agora.

---

# PARTE 2 — A tela

## Passo 6 — O HTML dos filtros

Abra `public/produtos.html`. Localize a seção `<!-- Filtros -->` inteira e substitua por:

```html
      <!-- Filtros: aplicam sozinhos, sem botao "Filtrar" (Aula 64) -->
      <section class="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <form data-filters class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="relative lg:col-span-2">
            <label for="filter-search" class="sr-only">Buscar produto</label>
            <i
              data-lucide="search"
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            ></i>
            <input
              id="filter-search"
              name="search"
              type="search"
              autocomplete="off"
              placeholder="Buscar por nome ou SKU"
              class="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label for="filter-category" class="sr-only">Categoria</label>
            <select
              id="filter-category"
              name="categoryId"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="">Todas as categorias</option>
            </select>
          </div>

          <div class="flex items-center justify-between gap-2">
            <label class="flex items-center gap-2 px-1 text-sm text-slate-600">
              <input name="lowStock" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
              Apenas estoque baixo
            </label>
            <button
              type="reset"
              class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Limpar
            </button>
          </div>
        </form>
      </section>
```

### O que mudou

| Antes | Depois | Por quê |
|---|---|---|
| botão **Filtrar** | sumiu | os filtros se aplicam sozinhos |
| campo de busca com 1 coluna | `lg:col-span-2` (2 colunas) | é o filtro mais usado: merece espaço |
| sem rótulo | `<label class="sr-only">` + `id` | o leitor de tela anuncia "Buscar produto" |
| — | lupa dentro do campo | mesmo visual do autocomplete da Aula 63 |

> 🔍 **`sr-only`** (*screen reader only*) esconde o rótulo da tela, mas mantém para o leitor de tela. O `placeholder` **não** substitui um rótulo: ele some quando a pessoa começa a digitar e nem todo leitor de tela o anuncia.

## Passo 7 — O HTML do rodapé de paginação

Ainda no `produtos.html`, localize a seção da tabela:

```html
      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            ...
          </table>
        </div>
      </section>
```

E acrescente o rodapé **depois** do `</div>` da tabela, ainda **dentro** da `<section>`:

```html
        </div>

        <!-- Rodape de paginacao (Aula 64) -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
          <p data-page-info class="text-slate-500" aria-live="polite"></p>

          <div class="flex items-center gap-2">
            <label for="page-size" class="text-slate-500">Por pagina</label>
            <select
              id="page-size"
              data-page-size
              class="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
            >
              <option value="10" selected>10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>

            <button
              type="button"
              data-page-prev
              aria-label="Pagina anterior"
              title="Pagina anterior"
              class="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i data-lucide="chevron-left" class="h-4 w-4"></i>
            </button>
            <span data-page-label class="min-w-[4rem] text-center font-medium text-slate-700"></span>
            <button
              type="button"
              data-page-next
              aria-label="Proxima pagina"
              title="Proxima pagina"
              class="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i data-lucide="chevron-right" class="h-4 w-4"></i>
            </button>
          </div>
        </div>
      </section>
```

Salve.

> 🔍 Os ícones das setas são desenhados pelo `renderIcons()` que já roda dentro do `mountLayout` (Aula 60): ele percorre a página **inteira**, não só o menu. Como esses `<i>` estão no HTML desde o início, nada mais é preciso.

---

## Passo 8 — O JavaScript

Abra `public/js/produtos.js`. As Partes B (modal), C (tabela) e F (salvar) **não mudam**. Vamos trocar as Partes A, D e E, e o final do arquivo.

### Parte A — Imports, referências e estado (substitua)

```javascript
import { api, isCanceled } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/produtos.html");

const rowsContainer = document.querySelector("[data-rows]");
const filtersForm = document.querySelector("[data-filters]");
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const form = document.querySelector("[data-form]");

// Rodape de paginacao (Aula 64)
const pageInfo = document.querySelector("[data-page-info]");
const pageLabel = document.querySelector("[data-page-label]");
const prevButton = document.querySelector("[data-page-prev]");
const nextButton = document.querySelector("[data-page-next]");
const pageSizeSelect = document.querySelector("[data-page-size]");

// Uma tabela inteira pesa mais que um autocomplete: espera um pouco mais.
const SEARCH_DELAY = 400;

let categories = [];
let currentPage = 1;
let searchTimer = null;      // relogio do debounce da busca
let listController = null;   // permite cancelar a listagem em andamento
```

### Parte D — Filtros, paginação e carregamento (substitua)

Substitua as funções `currentFilters` e `loadProducts` por estas. A `loadCategories` **continua igual**, logo abaixo delas.

```javascript
// ------------------------------------------------------------
// Filtros e paginacao
// ------------------------------------------------------------

function currentFilters() {
  const data = new FormData(filtersForm);

  return {
    search: (data.get("search") ?? "").trim(),
    categoryId: data.get("categoryId") ?? "",
    lowStock: data.get("lowStock") === "on",
    page: currentPage,
    pageSize: Number(pageSizeSelect.value),
  };
}

function renderPagination({ page, pageSize, total, totalPages }) {
  if (total === 0) {
    pageInfo.textContent = "Nenhum produto";
  } else {
    const first = (page - 1) * pageSize + 1;
    // Na ultima pagina, page * pageSize passa do total.
    const last = Math.min(page * pageSize, total);

    pageInfo.textContent = `Mostrando ${first}-${last} de ${total} produto(s)`;
  }

  pageLabel.textContent = `${page} / ${totalPages}`;
  prevButton.disabled = page <= 1;
  nextButton.disabled = page >= totalPages;
}

async function loadProducts() {
  // Filtro novo antes de a resposta anterior chegar? Cancela a anterior.
  listController?.abort();
  listController = new AbortController();

  try {
    const { pagination, rows } = await api.listProducts(currentFilters(), {
      signal: listController.signal,
    });

    // Excluiu o ultimo produto da ultima pagina: ela deixou de existir.
    // Volta para a ultima pagina que existe e carrega de novo.
    if (rows.length === 0 && currentPage > pagination.totalPages) {
      currentPage = pagination.totalPages;
      return loadProducts();
    }

    renderRows(rows);
    renderPagination(pagination);
  } catch (error) {
    if (isCanceled(error)) return;

    toast(error.message, "error");
  }
}

// Qualquer filtro mudou: o resultado e outro, entao volta a pagina 1.
function applyFilters() {
  clearTimeout(searchTimer);
  currentPage = 1;
  loadProducts();
}
```

### Parte E — As ações (substitua só o começo)

Na Parte E, substitua os dois listeners do `filtersForm` (o de `submit` e o de `reset`) por este bloco. O listener do `rowsContainer` (Editar/Excluir) **continua igual**, logo abaixo.

```javascript
// ------------------------------------------------------------
// Acoes
// ------------------------------------------------------------

// Enter no campo de busca: filtra na hora, sem esperar o debounce.
filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});

// Busca ao vivo: cada tecla reinicia o relogio; filtra na pausa.
filtersForm.elements.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, SEARCH_DELAY);
});

// Select e checkbox: a mudanca e um evento so, filtra na hora.
filtersForm.elements.categoryId.addEventListener("change", applyFilters);
filtersForm.elements.lowStock.addEventListener("change", applyFilters);

// O reset dispara ANTES de os campos serem limpos (Aula 17).
filtersForm.addEventListener("reset", () => {
  setTimeout(applyFilters, 0);
});

pageSizeSelect.addEventListener("change", applyFilters);

prevButton.addEventListener("click", () => {
  currentPage -= 1;
  loadProducts();
});

nextButton.addEventListener("click", () => {
  currentPage += 1;
  loadProducts();
});
```

### O final do arquivo

Confira que o final continua assim (desde a [Aula 31](31-protegendo-o-front.md)):

```javascript
async function init() {
  try {
    await loadCategories();
    await loadProducts();
  } catch (error) {
    toast(error.message, "error");
  }
}

// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  init();
}
```

Salve.

---

## 3. Dissecando o front

### 3.1 Quem dispara a busca, e quando

| O que a pessoa fez | Evento | Quando busca |
|---|---|---|
| Digitou no campo de busca | `input` | depois de 400 ms de pausa (debounce) |
| Apertou Enter na busca | `submit` | **na hora** (cancela o relógio) |
| Clicou no "x" do campo `type="search"` | `input` | depois da pausa |
| Trocou a categoria | `change` | na hora |
| Marcou "estoque baixo" | `change` | na hora |
| Clicou em Limpar | `reset` | na hora (depois de limpar os campos) |
| Trocou "por página" | `change` | na hora, voltando à página 1 |
| Clicou em ‹ ou › | `click` | na hora, **mantendo** os filtros |

> 🔍 **Por que o debounce só na busca?** Escolher uma categoria é **um** evento. Digitar "caneta" são **seis**. Como você viu na [Aula 43](43-integracao-vue-api.md), o debounce só faz sentido onde a mudança é contínua.

### 3.2 Por que filtro novo volta para a página 1

Imagine: você está na página 4 da lista completa e busca "caneta", que tem só 2 resultados (1 página). Se a página continuasse 4:

```text
   GET /api/products?search=caneta&page=4   ->  rows: []   "Mostrando 31-30 de 2"  (???)
```

Por isso o `applyFilters` zera o `currentPage`. Já os botões ‹ › mudam **só** a página, sem mexer nos filtros.

### 3.3 A página que deixou de existir

```javascript
if (rows.length === 0 && currentPage > pagination.totalPages) {
  currentPage = pagination.totalPages;
  return loadProducts();
}
```

O caso: 21 produtos, 10 por página, você está na página 3 (que tem **um** produto) e o exclui. Agora são 20 produtos, 2 páginas, e a página 3 voltou vazia.

```text
   antes:   [pag 1: 10] [pag 2: 10] [pag 3: 1]   <- voce esta aqui e exclui
   depois:  [pag 1: 10] [pag 2: 10]              <- a pagina 3 sumiu
            -> currentPage = 2, carrega de novo
```

Sem essas linhas, a pessoa veria uma tabela "Nenhum produto encontrado" com o rodapé dizendo "3 / 2".

> 🔍 **E se a lista estiver vazia de verdade?** Com 0 produtos, `totalPages` é 1 (o `Math.max(1, ...)` do Passo 1) e `currentPage` também é 1. A condição `1 > 1` é falsa: sem laço infinito.

### 3.4 Cancelar também aqui

```javascript
listController?.abort();
listController = new AbortController();
```

É a técnica da Aula 61/63 de novo. Clique três vezes rápido em ›, com a rede lenta: sem o cancelamento, as respostas das páginas 2, 3 e 4 poderiam chegar fora de ordem e a tabela terminaria mostrando a página 2 com o rodapé dizendo "4".

---

## Passo 9 — Testar a tela

Para a paginação aparecer de verdade, você precisa de mais de 10 produtos. Se tiver poucos, mude o "Por página" para **10** e cadastre alguns, ou use temporariamente `pageSize` menor no `<option>` (por exemplo, `<option value="3">3</option>`).

Recarregue com **Ctrl + Shift + R** e abra `/produtos.html`.

| # | Faça | Esperado |
|---|---|---|
| 1 | Abra a tela | 10 produtos e "Mostrando 1-10 de N produto(s)" |
| 2 | Clique em › | Os próximos 10; o rodapé mostra "2 / X" |
| 3 | Na última página | O botão › fica apagado (desabilitado) |
| 4 | Na primeira página | O botão ‹ fica apagado |
| 5 | Mude "Por página" para 25 | Volta à página 1, com até 25 linhas |
| 6 | Digite `caf` **devagar** | A tabela filtra sozinha depois da pausa |
| 7 | Apague e digite `beb` e tecle Enter rápido | Filtra na hora |
| 8 | Vá para a página 2 e digite algo na busca | Volta para a página 1 |
| 9 | Escolha uma categoria | Filtra na hora, página 1 |
| 10 | Marque "Apenas estoque baixo" | Filtra na hora |
| 11 | Clique em Limpar | Tudo volta, página 1 |
| 12 | Edite um produto que está na página 2 | Depois de salvar, você **continua** na página 2 |
| 13 | Vá à última página, exclua o único produto dela | A tela volta para a página anterior, sem "3 / 2" |
| 14 | Busque `50%` | Só produtos com "50%" no nome (ou nenhum) |

### O teste das requisições

F12 → **Network** → filtre por `products`. Digite `caneta` normalmente.

✅ **Esperado:** **uma** requisição (`products?search=caneta&page=1&pageSize=10`), e não seis.

---

## ✅ Confira se deu certo

- [ ] `src/shared/http/pagination.js` existe com `parsePagination` e `buildPagination`
- [ ] `GET /api/products` devolve `{ pagination, rows }`
- [ ] `findAll` e `countAll` usam o mesmo `buildListFilters`
- [ ] O `ORDER BY` termina em `p.id`
- [ ] `pageSize=500` dá `400`
- [ ] O botão "Filtrar" sumiu; a busca é ao vivo com debounce
- [ ] O rodapé mostra "Mostrando X-Y de Z" e "página / total"
- [ ] ‹ e › ficam desabilitados nas pontas
- [ ] Filtro novo volta para a página 1
- [ ] Excluir o último item da última página não deixa a tela "presa"
- [ ] Movimentações (Aula 63) continua funcionando

---

## 🔧 Se deu erro

### A tabela mostra "Nenhum produto encontrado" e o console diz `products.length` ... ou `rows is undefined`

A tela ainda espera um array. Confira se o `loadProducts` faz `const { pagination, rows } = await api.listProducts(...)` e passa `rows` para o `renderRows`.

### `400 — O parametro pageSize deve ser...` ao abrir a tela

O `<select data-page-size>` não foi encontrado, e `Number(undefined)` virou `NaN`. Confira o atributo `data-page-size` no HTML.

### `500` e no log: `Unknown column 'p.name' in 'where clause'`

O `countAll` está com `FROM products` **sem** o apelido `p`.

### O total diz 37 mas a busca mostra menos páginas que deveria (ou o contrário)

O `findAll` e o `countAll` estão filtrando diferente. Os dois precisam chamar `buildListFilters(filters)`.

### Produtos se repetem entre a página 1 e a 2

Faltou o `, p.id` no fim do `ORDER BY`.

### `Cannot find module '.../shared/http/pagination.js'`

O arquivo ficou em outra pasta, ou o import tem um `../` a mais ou a menos. Do `product-controller.js`, o caminho é `../../shared/http/pagination.js`.

### A busca dispara a cada tecla

O `setTimeout` está sem o `clearTimeout` antes dele.

### Movimentações parou de funcionar

Ela ainda está usando `api.listProducts`. Volte e conclua a [Aula 63](63-autocomplete-produtos.md).

---

## ➡️ Próximo passo

A tela lista bem. Agora vamos cuidar do que acontece quando alguém clica em **Excluir**, porque hoje isso apaga o histórico do produto.

**[Aula 65 — Exclusão segura e modal de confirmação](65-exclusao-segura-confirmacao.md)**
