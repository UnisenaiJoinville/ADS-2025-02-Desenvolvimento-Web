# Etapa 17 — Tela de Produtos

📋 **Tipo:** prática (HTML + JavaScript)

---

## Objetivo

Construir a tela mais completa do sistema: tabela, filtros, **modal** de cadastro/edição e exclusão com confirmação.

---

## Antes de começar

- [ ] Etapa 16 concluída (dashboard funcionando no navegador)

---

## O que vamos construir

```text
 +--------------------------------------------------------------+
 |  Produtos                                   [+ Novo produto] |
 |                                                              |
 |  [Buscar...] [Categoria v] [ ] Estoque baixo [Filtrar][Limpar]|
 |                                                              |
 |  PRODUTO      CATEGORIA  CUSTO   VENDA  ESTOQUE  STATUS  ... |
 |  Cafe         Bebidas    28,00   45,90   40/10    Ok    [E][X]|
 |  Agua mineral Bebidas     0,90    2,50    8/20   Baixo  [E][X]|
 +--------------------------------------------------------------+

     ao clicar em "+ Novo produto" ou "Editar":

     +----------------------------+
     |  Novo produto          [x] |
     |  Nome: [______________]    |
     |  SKU: [____] Categoria[v]  |
     |  Custo:[__] Venda:[__]     |
     |  Qtd: [__]  Minimo:[__]    |
     |  [x] Produto ativo         |
     |        [Cancelar] [Salvar] |
     +----------------------------+
```

---

## Passo 1 — Criar o `public/produtos.html`

Na pasta `public`, crie `produtos.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Produtos | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <div data-nav></div>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Produtos</h1>
          <p class="text-sm text-slate-500">Cadastro completo: criar, listar, editar e excluir</p>
        </div>
        <button
          data-new
          class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          + Novo produto
        </button>
      </div>

      <!-- Filtros -->
      <section class="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <form data-filters class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="search"
            type="search"
            placeholder="Buscar por nome ou SKU"
            class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <select
            name="categoryId"
            class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          >
            <option value="">Todas as categorias</option>
          </select>
          <label class="flex items-center gap-2 px-1 text-sm text-slate-600">
            <input name="lowStock" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            Apenas estoque baixo
          </label>
          <div class="flex gap-2">
            <button class="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Filtrar
            </button>
            <button
              type="reset"
              class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Limpar
            </button>
          </div>
        </form>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Produto</th>
                <th class="px-4 py-3">Categoria</th>
                <th class="px-4 py-3 text-right">Custo</th>
                <th class="px-4 py-3 text-right">Venda</th>
                <th class="px-4 py-3 text-right">Estoque</th>
                <th class="px-4 py-3 text-center">Status</th>
                <th class="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody data-rows class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Modal de cadastro / edicao -->
    <div data-modal class="fixed inset-0 z-40 hidden items-center justify-center bg-slate-900/50 p-4">
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div class="mb-4 flex items-start justify-between">
          <h2 data-modal-title class="text-lg font-semibold text-slate-900">Novo produto</h2>
          <button data-close class="text-2xl leading-none text-slate-400 hover:text-slate-700">&times;</button>
        </div>

        <form data-form class="space-y-4">
          <input type="hidden" name="id" />

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Nome</label>
            <input
              name="name"
              required
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">SKU</label>
              <input
                name="sku"
                required
                placeholder="BEB-001"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
              <select
                name="categoryId"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Sem categoria</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Preco de custo</label>
              <input
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                value="0"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Preco de venda</label>
              <input
                name="salePrice"
                type="number"
                step="0.01"
                min="0"
                value="0"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Quantidade inicial</label>
              <input
                name="quantity"
                type="number"
                min="0"
                value="0"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Estoque minimo</label>
              <input
                name="minimumStock"
                type="number"
                min="0"
                value="0"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input name="active" type="checkbox" checked class="h-4 w-4 rounded border-slate-300" />
            Produto ativo
          </label>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              data-close
              class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>

    <div data-toast-stack class="fixed bottom-6 right-6 z-50 flex flex-col gap-2"></div>

    <script type="module" src="/js/produtos.js"></script>
  </body>
</html>
```

Salve.

### 🪟 O modal sem nenhuma biblioteca

```html
<div data-modal class="fixed inset-0 z-40 hidden items-center justify-center bg-slate-900/50 p-4">
```

| Classe | Papel |
|---|---|
| `fixed inset-0` | Gruda na tela e cobre tudo (top/right/bottom/left = 0) |
| `z-40` | Fica acima do conteúdo da página |
| `hidden` | **Começa escondido** |
| `items-center justify-center` | Centraliza a caixa branca |
| `bg-slate-900/50` | Fundo escuro com 50% de transparência |

Para abrir, o JavaScript troca `hidden` por `flex`. Só isso.

> 📌 **Por que `items-center` já está no HTML se está escondido?** Porque `hidden` (que é `display: none`) tem prioridade. Quando trocamos para `flex`, as classes de centralização entram em ação.

### O `<input type="hidden" name="id">`

```html
<input type="hidden" name="id" />
```

Este campo invisível é o truque que permite **um formulário servir para criar e editar**:

| Situação | Valor do campo | O que acontece |
|---|---|---|
| Novo produto | vazio | `POST /api/products` |
| Editar produto | `8` | `PUT /api/products/8` |

### `type="number"` com `step="0.01"`

```html
<input name="costPrice" type="number" step="0.01" min="0" />
```

O navegador já ajuda: mostra setinhas, aceita só números e permite centavos.

> ⚠️ Isso é conveniência para o usuário, **não** validação de segurança. Qualquer pessoa pode enviar dados direto pela API sem passar pelo formulário — é por isso que o `product-validator.js` da Etapa 12 continua sendo essencial.

---

## Passo 2 — Criar o `public/js/produtos.js`

Vamos por partes.

### Parte A — Imports e referências

```javascript
import { api } from "./api.js";
import { currency, escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/produtos.html");

const rowsContainer = document.querySelector("[data-rows]");
const filtersForm = document.querySelector("[data-filters]");
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const form = document.querySelector("[data-form]");

let categories = [];
```

### Parte B — Abrir e fechar o modal

```javascript
// ------------------------------------------------------------
// Modal
// ------------------------------------------------------------

function openModal(product) {
  modalTitle.textContent = product ? "Editar produto" : "Novo produto";

  form.reset();
  form.elements.id.value = product?.id ?? "";

  if (product) {
    form.elements.name.value = product.name;
    form.elements.sku.value = product.sku;
    form.elements.categoryId.value = product.categoryId ?? "";
    form.elements.costPrice.value = product.costPrice;
    form.elements.salePrice.value = product.salePrice;
    form.elements.quantity.value = product.quantity;
    form.elements.minimumStock.value = product.minimumStock;
    form.elements.active.checked = product.active;
  } else {
    form.elements.active.checked = true;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  form.elements.name.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

document.querySelector("[data-new]").addEventListener("click", () => openModal(null));
```

#### Uma função para os dois modos

```javascript
function openModal(product) {
  modalTitle.textContent = product ? "Editar produto" : "Novo produto";
```

| Chamada | Modo |
|---|---|
| `openModal(null)` | Criar (formulário limpo) |
| `openModal(produto)` | Editar (formulário preenchido) |

#### `form.elements` — acesso rápido aos campos

```javascript
form.elements.name.value = product.name;
```

Todo formulário tem a coleção `elements`, indexada pelo atributo `name` dos campos. É mais direto que `document.querySelector('[name="name"]')`.

#### As três formas de fechar o modal

Boa usabilidade exige que o usuário nunca se sinta preso:

```javascript
// 1. Clicar no X ou em Cancelar
document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

// 2. Clicar no fundo escuro
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

// 3. Apertar Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
```

> 🔍 **Repare no detalhe do item 2:** `event.target === modal`. Sem essa checagem, clicar **dentro** da caixa branca também fecharia o modal — porque o clique "borbulha" para o elemento pai. A comparação garante que só o clique no fundo conta.

#### O foco automático

```javascript
form.elements.name.focus();
```

Ao abrir, o cursor já vai para o primeiro campo. Detalhe pequeno, ganho grande de usabilidade.

### Parte C — Renderizar a tabela

```javascript
// ------------------------------------------------------------
// Listagem
// ------------------------------------------------------------

function renderRows(products) {
  if (products.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="7" class="px-4 py-10 text-center text-sm text-slate-500">
        Nenhum produto encontrado
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = products
    .map(
      (product) => `
        <tr class="hover:bg-slate-50">
          <td class="px-4 py-3">
            <p class="font-medium text-slate-800">${escapeHtml(product.name)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(product.sku)}</p>
          </td>
          <td class="px-4 py-3 text-slate-600">
            ${escapeHtml(product.categoryName ?? "Sem categoria")}
          </td>
          <td class="px-4 py-3 text-right text-slate-600">${currency.format(product.costPrice)}</td>
          <td class="px-4 py-3 text-right text-slate-600">${currency.format(product.salePrice)}</td>
          <td class="px-4 py-3 text-right">
            <span class="font-semibold ${product.lowStock ? "text-rose-600" : "text-slate-800"}">
              ${product.quantity}
            </span>
            <span class="text-xs text-slate-400"> / min ${product.minimumStock}</span>
          </td>
          <td class="px-4 py-3 text-center">
            ${statusBadge(product)}
          </td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${product.id}"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >Editar</button>
            <button
              data-delete="${product.id}"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >Excluir</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function statusBadge(product) {
  if (!product.active) {
    return '<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Inativo</span>';
  }

  if (product.lowStock) {
    return '<span class="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Estoque baixo</span>';
  }

  return '<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ok</span>';
}
```

#### O campo `lowStock` sendo útil

```javascript
<span class="font-semibold ${product.lowStock ? "text-rose-600" : "text-slate-800"}">
```

Lembra do campo calculado que criamos no `toProduct` (Etapa 12)? É aqui que ele rende: o front-end só pergunta `product.lowStock` — não precisa saber a regra.

#### `statusBadge` com *early return*

```javascript
if (!product.active) return "...Inativo...";
if (product.lowStock) return "...Estoque baixo...";
return "...Ok...";
```

Três `return` diretos, sem `else`. A ordem define a prioridade: inativo é mais importante que estoque baixo.

### Parte D — Filtros e carregamento

```javascript
function currentFilters() {
  const data = new FormData(filtersForm);

  return {
    search: data.get("search") ?? "",
    categoryId: data.get("categoryId") ?? "",
    lowStock: data.get("lowStock") === "on",
  };
}

async function loadProducts() {
  try {
    const products = await api.listProducts(currentFilters());
    renderRows(products);
  } catch (error) {
    toast(error.message, "error");
  }
}

async function loadCategories() {
  categories = await api.listCategories();

  const options = categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");

  filtersForm.elements.categoryId.innerHTML =
    `<option value="">Todas as categorias</option>${options}`;

  form.elements.categoryId.innerHTML = `<option value="">Sem categoria</option>${options}`;
}
```

#### ⚠️ A armadilha do checkbox no `FormData`

```javascript
lowStock: data.get("lowStock") === "on",
```

Checkbox se comporta de forma **estranha** no `FormData`:

| Estado | `data.get("lowStock")` |
|---|---|
| Marcado | `"on"` (string!) |
| Desmarcado | `null` (a chave nem existe) |

Por isso a comparação estrita com `"on"`. Escrever `Boolean(data.get("lowStock"))` funcionaria por acaso, mas comparar com `"on"` deixa a intenção explícita.

#### As categorias alimentam dois selects

```javascript
filtersForm.elements.categoryId.innerHTML = `<option value="">Todas as categorias</option>${options}`;
form.elements.categoryId.innerHTML = `<option value="">Sem categoria</option>${options}`;
```

A mesma lista, com primeira opção diferente conforme o contexto: no filtro é "Todas", no formulário é "Sem categoria".

### Parte E — As ações

```javascript
// ------------------------------------------------------------
// Acoes
// ------------------------------------------------------------

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadProducts();
});

filtersForm.addEventListener("reset", () => {
  setTimeout(loadProducts, 0);
});

rowsContainer.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    try {
      const product = await api.getProduct(editId);
      openModal(product);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  if (deleteId) {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;

    try {
      await api.deleteProduct(deleteId);
      toast("Produto excluido");
      loadProducts();
    } catch (error) {
      toast(error.message, "error");
    }
  }
});
```

#### 🎯 Delegação de eventos — o conceito-chave desta etapa

Os botões "Editar" e "Excluir" são criados **depois** que a página carrega, dentro do `renderRows`.

Se tentássemos assim:

```javascript
// ❌ NÃO FUNCIONA
document.querySelectorAll("[data-edit]").forEach((btn) => {
  btn.addEventListener("click", ...);
});
```

...não aconteceria nada, porque **na hora em que essa linha roda, os botões ainda não existem**. E mesmo se existissem, os botões criados depois (ao filtrar, por exemplo) ficariam sem evento.

**A solução:** ouvir o clique no **container**, que existe desde o início:

```javascript
// ✅ FUNCIONA sempre
rowsContainer.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  if (editId) { ... }
});
```

**Como funciona?** Todo clique "borbulha" do elemento clicado até os pais. O `<tbody>` recebe o aviso e `event.target` diz **qual** elemento foi realmente clicado.

```text
   clique no botão "Editar"
            |
            v  (borbulha)
        <td>
            |
            v
        <tr>
            |
            v
      <tbody>  ← nosso listener está aqui
                 event.target = o botão original
```

Vantagens:

| | Sem delegação | Com delegação |
|---|---|---|
| Listeners com 100 produtos | 200 | **1** |
| Funciona em linhas novas | ❌ | ✅ |
| Memória | Alta | Baixa |

#### `dataset` — lendo o `data-edit`

```html
<button data-edit="8">Editar</button>
```

```javascript
event.target.dataset.edit    // "8"
```

O `data-edit` no HTML vira `dataset.edit` no JavaScript. É assim que o botão "carrega" o id do produto.

#### ⏱️ O `setTimeout` no reset

```javascript
filtersForm.addEventListener("reset", () => {
  setTimeout(loadProducts, 0);
});
```

**Por que isso?** Porque o evento `reset` dispara **antes** de o navegador limpar os campos.

```text
   usuário clica em "Limpar"
        |
        v
   evento reset dispara     <- os campos AINDA têm os valores antigos
        |
        v
   navegador limpa os campos
```

O `setTimeout(..., 0)` empurra a chamada para "logo depois de agora", quando os campos já estão limpos. Sem isso, você recarregaria a lista com os filtros antigos.

### Parte F — Salvar (criar ou editar)

```javascript
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);

  const payload = {
    name: data.get("name"),
    sku: data.get("sku"),
    categoryId: data.get("categoryId") || null,
    costPrice: Number(data.get("costPrice")),
    salePrice: Number(data.get("salePrice")),
    quantity: Number(data.get("quantity")),
    minimumStock: Number(data.get("minimumStock")),
    active: data.get("active") === "on",
  };

  const id = data.get("id");

  try {
    if (id) {
      await api.updateProduct(id, payload);
      toast("Produto atualizado");
    } else {
      await api.createProduct(payload);
      toast("Produto cadastrado");
    }

    closeModal();
    loadProducts();
  } catch (error) {
    toast(error.message, "error");
  }
});

async function init() {
  try {
    await loadCategories();
    await loadProducts();
  } catch (error) {
    toast(error.message, "error");
  }
}

init();
```

#### `event.preventDefault()` — obrigatório

```javascript
event.preventDefault();
```

Sem essa linha, o navegador faria o comportamento **antigo** de formulário: recarregar a página inteira, perdendo tudo. Nós queremos enviar via `fetch` e continuar na mesma tela.

> ⚠️ **Esquecer o `preventDefault` é um erro clássico.** O sintoma é: a página pisca, os dados somem e nada acontece.

#### Todo campo de formulário vira string

```javascript
costPrice: Number(data.get("costPrice")),
```

Mesmo com `type="number"` no HTML, o `FormData` devolve **string**. Convertemos explicitamente.

> 📌 Sem o `Number()`, o backend receberia `"28.00"` e, embora nosso validador use `Number(value)` e resolvesse, é boa prática mandar o tipo correto desde a origem.

#### `data.get("categoryId") || null`

Se o usuário escolheu "Sem categoria", o valor é `""`. Convertemos para `null`, que é o que o backend espera para "sem categoria".

#### A decisão criar/editar

```javascript
const id = data.get("id");

if (id) {
  await api.updateProduct(id, payload);
} else {
  await api.createProduct(payload);
}
```

Simples assim: tem id → é edição; não tem → é criação.

#### Depois de salvar, recarrega

```javascript
closeModal();
loadProducts();
```

Buscamos a lista de novo, em vez de tentar atualizar a linha na tela. É mais simples e garante que os dados exibidos sejam **exatamente** os do banco.

---

## Passo 3 — Montar o arquivo completo

Crie `public/js/produtos.js` juntando as partes A até F, na ordem.

---

## Passo 4 — 🧪 Testar tudo na tela

Acesse:

```text
http://localhost:3000/produtos.html
```

### Roteiro de teste

1. **Ver a lista** — 7 produtos aparecem, 3 com etiqueta vermelha "Estoque baixo"
2. **Buscar** — digite `caneta` e clique em **Filtrar**
3. **Limpar** — clique em **Limpar**; a lista volta completa
4. **Filtrar por estoque baixo** — marque a caixa e filtre; devem sobrar 3
5. **Criar** — clique em **+ Novo produto**:
   - Nome: `Banana prata`
   - SKU: `hor-001` (em minúsculas de propósito!)
   - Custo: `4` / Venda: `7.50`
   - Quantidade: `30` / Mínimo: `10`
   - **Salvar** → toast verde e o produto aparece com SKU `HOR-001` ✅
6. **Testar a validação** — crie outro com o **mesmo SKU** → toast vermelho: *"Ja existe um produto com o SKU HOR-001"*
7. **Testar a regra de preço** — crie com custo `50` e venda `10` → toast vermelho
8. **Editar** — clique em **Editar** na banana, mude a quantidade para `5`, salve → o status vira **"Estoque baixo"**
9. **Fechar o modal** — abra e teste as três formas: `Esc`, clique no fundo, botão `X`
10. **Excluir** — clique em **Excluir**, confirme → o produto some

### 🎯 O que observar

- As mensagens de erro em vermelho vêm **do backend**, das validações que você escreveu na Etapa 12
- O SKU em maiúsculas é o `.toUpperCase()` do validador
- A etiqueta vermelha usa o `lowStock` calculado no repository

---

## ✅ Confira se deu certo

- [ ] `public/produtos.html` e `public/js/produtos.js` existem
- [ ] A tabela lista os produtos com valores em `R$`
- [ ] Os 3 filtros funcionam
- [ ] O botão **+ Novo produto** abre o modal
- [ ] O modal fecha de três formas
- [ ] Criar produto mostra toast verde
- [ ] SKU duplicado mostra toast vermelho com a mensagem do backend
- [ ] **Editar** abre o modal já preenchido
- [ ] **Excluir** pede confirmação
- [ ] As etiquetas de status aparecem coloridas

---

## 🔧 Se deu erro

| Sintoma | Causa | Solução |
|---|---|---|
| A página recarrega ao salvar | Faltou `event.preventDefault()` | Acrescente na primeira linha do submit |
| Botões Editar/Excluir não fazem nada | Sem delegação de eventos | Ouça o clique no `rowsContainer`, não nos botões |
| O modal não abre | Classes trocadas | Deve remover `hidden` **e** adicionar `flex` |
| O modal fecha ao clicar dentro | Faltou a checagem | Use `if (event.target === modal)` |
| O select de categoria vem vazio | `loadCategories` não rodou | Confira o `init()` no final do arquivo |
| Filtro "estoque baixo" não funciona | Comparação errada | `data.get("lowStock") === "on"` |
| "Limpar" filtra com valores antigos | Faltou o `setTimeout` | `setTimeout(loadProducts, 0)` |
| Erro `Cannot read properties of null` | Elemento não encontrado | Confira a grafia dos `data-*` |

---

## ➡️ Próximo passo

Falta a tela onde o estoque realmente sobe e desce.

**[Etapa 18 — Tela de Movimentações](18-front-movimentacoes.md)**
