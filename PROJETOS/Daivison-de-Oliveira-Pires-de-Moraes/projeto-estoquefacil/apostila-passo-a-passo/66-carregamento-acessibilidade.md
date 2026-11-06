# Aula 66 — Carregamento, skeleton e acessibilidade

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** prática (HTML + JavaScript)

---

## Objetivo

Dar o acabamento que separa um sistema "que funciona" de um sistema **agradável e confiável**:

- botões que mostram que estão **trabalhando** e não aceitam clique duplo;
- tabelas com **skeleton** (linhas "fantasma") enquanto carregam;
- botões de ação com **ícones** (lápis e lixeira), sem quebrar a delegação de eventos;
- formulários **acessíveis**: rótulos ligados aos campos, modal anunciado, foco no lugar certo.

---

## Antes de começar

- [ ] [Aula 65](65-exclusao-segura-confirmacao.md) concluída

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
├── public/js/layout.js            (setButtonLoading + skeletonRows)
├── public/produtos.html           (modal acessivel)
├── public/js/produtos.js          (icones, carregamento, foco)
├── public/movimentacoes.html      (rotulos + fieldset)
├── public/js/movimentacoes.js     (botao e historico carregando)
├── public/categorias.html         (rotulo + botao)
└── public/js/categorias.js        (icones, carregamento)
```

---

## 1. Três problemas reais

### Problema 1 — O clique duplo

Abra Movimentações, F12 → Network → **Slow 3G**. Registre uma entrada e clique **três vezes** rápido em Registrar.

Resultado: **três** entradas no histórico. O estoque subiu o triplo. Na tela não aconteceu nada visível entre os cliques, então a pessoa achou que não tinha funcionado e clicou de novo.

> 📌 **Todo botão que envia algo ao servidor precisa travar enquanto espera.** As telas Vue (login, cadastro) já fazem isso com `:disabled="loading"`. As telas sem Vue, não.

### Problema 2 — A tabela "vazia" que não está vazia

Ainda no Slow 3G, abra Produtos. Por alguns segundos, a tabela fica **em branco**. A pessoa não sabe se está carregando, se não há produtos ou se quebrou.

### Problema 3 — O formulário que não fala

Abra o modal de Novo produto e clique no **texto** "Nome". Nada acontece: o cursor não vai para o campo. Para quem usa leitor de tela é pior: os campos são anunciados como "caixa de edição", sem dizer **qual**.

O motivo está no HTML da [Aula 17](17-front-produtos.md):

```html
<label class="...">Nome</label>
<input name="name" ... />
```

O `<label>` e o `<input>` estão **lado a lado**, mas nada diz que um pertence ao outro.

---

## Passo 1 — Dois ajudantes no `layout.js`

Abra `public/js/layout.js` e acrescente **no fim do arquivo**:

```javascript
// Botao "trabalhando" (Aula 66): trava o botao e mostra um spinner.
// Chame com true antes do await e com false no finally.
export function setButtonLoading(button, loading, loadingText = "Salvando...") {
  if (loading) {
    // Guarda o conteudo original para devolver depois.
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML = `
      <span class="inline-flex items-center justify-center gap-2">
        <i data-lucide="loader-circle" class="h-4 w-4 animate-spin"></i>
        ${escapeHtml(loadingText)}
      </span>`;
    renderIcons();
    return;
  }

  button.disabled = false;
  button.removeAttribute("aria-busy");

  if (button.dataset.originalHtml !== undefined) {
    button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
  }
}

// Linhas "fantasma" enquanto uma tabela carrega (Aula 66).
// O formato lembra o conteudo que vai chegar, entao a tela nao "pula".
export function skeletonRows(columns, rows = 5) {
  const cells = Array.from(
    { length: columns },
    () => '<td class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-slate-200"></div></td>'
  ).join("");

  return Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("");
}
```

Salve.

### 🔍 `setButtonLoading`

```text
   setButtonLoading(botao, true)              setButtonLoading(botao, false)

   [   Salvar   ]  ──►  [ ⟳ Salvando... ]  ──►  [   Salvar   ]
                         (cinza, travado)
```

| Detalhe | Por quê |
|---|---|
| `dataset.originalHtml` | o botão pode ter ícone e texto; guardamos o HTML inteiro para restaurar igual |
| `disabled = true` | é **isso** que impede o clique duplo; o spinner é só o aviso visual |
| `aria-busy="true"` | o leitor de tela anuncia "ocupado" |
| `animate-spin` | classe do Tailwind que gira o elemento; o Lucide copia a classe para o `<svg>` |

> ⚠️ **O par obrigatório:** todo `setButtonLoading(botao, true)` precisa de um `setButtonLoading(botao, false)` dentro de um `finally`. Se ficar no fim do `try`, um erro pula a linha e o botão fica travado em "Salvando..." para sempre. É a lição do `finally` da [Aula 29](29-tela-cadastro-vue.md).

### 🔍 `skeletonRows`

```text
   +----------------------------------------------------------+
   | ▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓   ▓▓▓   ▓▓ |   <- pulsando
   | ▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓   ▓▓▓   ▓▓ |
   | ▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓   ▓▓▓   ▓▓ |
   +----------------------------------------------------------+
```

Por que barras cinzas, e não um spinner no meio?

| Spinner | Skeleton |
|---|---|
| diz "espere" | diz "espere, **e é isto** que vai aparecer" |
| quando os dados chegam, a tabela "pula" de altura | a tabela já tem a altura certa |
| parece mais lento | parece mais rápido (o olho já está lendo a estrutura) |

`Array.from({ length: 7 }, () => "...")` é o jeito curto de dizer "um array com 7 itens, cada um gerado por esta função".

---

# PARTE 1 — Produtos

## Passo 2 — O modal acessível

Abra `public/produtos.html` e substitua o bloco `<!-- Modal de cadastro / edicao -->` **inteiro** por:

```html
    <!-- Modal de cadastro / edicao (acessivel desde a Aula 66) -->
    <div data-modal class="fixed inset-0 z-40 hidden items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6"
      >
        <div class="mb-4 flex items-start justify-between">
          <h2 id="product-modal-title" data-modal-title class="text-lg font-semibold text-slate-900">
            Novo produto
          </h2>
          <button
            type="button"
            data-close
            aria-label="Fechar"
            title="Fechar"
            class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <i data-lucide="x" class="h-5 w-5"></i>
          </button>
        </div>

        <form data-form class="space-y-4">
          <input type="hidden" name="id" />

          <div>
            <label for="product-name" class="mb-1 block text-sm font-medium text-slate-700">Nome</label>
            <input
              id="product-name"
              name="name"
              required
              maxlength="120"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="product-sku" class="mb-1 block text-sm font-medium text-slate-700">SKU</label>
              <input
                id="product-sku"
                name="sku"
                required
                maxlength="40"
                placeholder="BEB-001"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label for="product-category" class="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
              <select
                id="product-category"
                name="categoryId"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Sem categoria</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="product-cost" class="mb-1 block text-sm font-medium text-slate-700">Preco de custo</label>
              <input
                id="product-cost"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                value="0"
                required
                inputmode="decimal"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label for="product-sale" class="mb-1 block text-sm font-medium text-slate-700">Preco de venda</label>
              <input
                id="product-sale"
                name="salePrice"
                type="number"
                step="0.01"
                min="0"
                value="0"
                required
                inputmode="decimal"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="product-quantity" class="mb-1 block text-sm font-medium text-slate-700">Quantidade inicial</label>
              <input
                id="product-quantity"
                name="quantity"
                type="number"
                min="0"
                value="0"
                required
                inputmode="numeric"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label for="product-minimum" class="mb-1 block text-sm font-medium text-slate-700">Estoque minimo</label>
              <input
                id="product-minimum"
                name="minimumStock"
                type="number"
                min="0"
                value="0"
                required
                inputmode="numeric"
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
            <button
              type="submit"
              data-save
              class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
```

Salve.

### O que mudou

| Mudança | Efeito |
|---|---|
| `for="product-name"` no label + `id="product-name"` no input | clicar no rótulo foca o campo; o leitor de tela anuncia "Nome, caixa de edição" |
| `role="dialog"` + `aria-modal` + `aria-labelledby` | o leitor de tela anuncia "Novo produto, caixa de diálogo" ao abrir |
| botão `×` virou ícone `x` com `aria-label="Fechar"` | o "×" era lido como "vezes" por alguns leitores de tela |
| `maxlength="120"` / `"40"` | o navegador não deixa passar do tamanho da coluna (o validador continua valendo) |
| `inputmode="decimal"` / `"numeric"` | no celular, abre o **teclado numérico** |
| `data-save` + `disabled:` no Salvar | para o `setButtonLoading` encontrar e estilizar o botão |

### 🔍 Duas formas de ligar `<label>` e campo

```html
<!-- 1. Envolvendo (o que usamos no login e no checkbox "Produto ativo") -->
<label>
  Nome
  <input name="name" />
</label>

<!-- 2. Com for + id (o que usamos aqui) -->
<label for="product-name">Nome</label>
<input id="product-name" name="name" />
```

As duas são corretas. A segunda é útil quando o rótulo e o campo precisam ficar em lugares diferentes do layout, como nesta grade de duas colunas.

> ⚠️ **O `id` precisa ser único na página.** Por isso o prefixo `product-`: se um dia a mesma tela tiver um formulário de categoria, `category-name` e `product-name` não colidem.

## Passo 3 — O JavaScript de Produtos

Abra `public/js/produtos.js`.

### 3.1 Os imports

```javascript
import { api, isCanceled } from "./api.js";
import { requireAuth } from "./auth.js";
import { renderIcons } from "./icons.js";
import {
  confirmDialog,
  currency,
  escapeHtml,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";
```

E, junto das outras referências da Parte A, acrescente:

```javascript
const saveButton = form.querySelector("[data-save]");
```

E, junto das variáveis de estado:

```javascript
let isFirstLoad = true;      // na primeira carga, skeleton; nas outras, so esmaece
let lastFocused = null;      // quem abriu o modal (para devolver o foco)
```

### 3.2 O modal devolve o foco (Parte B)

Troque as funções `openModal` e `closeModal` e o listener do `Escape`:

```javascript
function openModal(product) {
  // Guarda quem abriu (o botao "Novo" ou o "Editar" da linha).
  lastFocused = document.activeElement;

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

  // Devolve o foco para quem abriu: quem usa teclado nao se perde.
  lastFocused?.focus?.();
  lastFocused = null;
}

function isModalOpen() {
  return !modal.classList.contains("hidden");
}
```

E troque o listener do `Escape`:

```javascript
document.addEventListener("keydown", (event) => {
  // So fecha o modal de produto se ELE estiver aberto.
  if (event.key === "Escape" && isModalOpen()) closeModal();
});
```

> 🔍 **Por que o `isModalOpen()` no Esc?** Desde a Aula 65 existe outro modal na tela (o `confirmDialog`). Sem a checagem, apertar Esc para fechar o modal de confirmação **também** chamaria o `closeModal`, que devolveria o foco para um lugar errado.

### 3.3 Botões de ação com ícones (Parte C)

No `renderRows`, troque a célula das ações (o último `<td>`) por:

```javascript
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${product.id}"
              aria-label="Editar ${escapeHtml(product.name)}"
              title="Editar"
              class="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              <i data-lucide="pencil" class="h-4 w-4"></i>
            </button>
            <button
              data-delete="${product.id}"
              data-name="${escapeHtml(product.name)}"
              aria-label="Excluir ${escapeHtml(product.name)}"
              title="Excluir"
              class="inline-grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <i data-lucide="trash-2" class="h-4 w-4"></i>
            </button>
          </td>
```

E, no **fim** da função `renderRows` (depois do `.join("")` que preenche o `rowsContainer`), acrescente:

```javascript
  // Os <i> dos botoes acabaram de nascer (regra da Aula 60).
  renderIcons();
```

> 🔍 **O `aria-label` com o nome do produto.** Numa tabela com 10 produtos, o leitor de tela anunciaria "Editar, botão" dez vezes, sem dizer **qual**. Com `Editar Cafe em graos 1kg`, cada botão é inconfundível.

### 3.4 A pegadinha: a delegação de eventos com ícones (Parte E)

Agora o botão tem um `<svg>` dentro, e o `<svg>` tem `<path>`s. Quem clica no lápis clica no **`<path>`**, e não no `<button>`:

```text
   <button data-edit="7">          <- quem tem o data-edit
     <svg>                         
       <path d="..."/>             <- event.target (onde o clique caiu)
     </svg>
   </button>
```

Com o código atual, `event.target.dataset.edit` é `undefined` e **nada acontece**. A correção é subir até o botão com `closest`, como fizemos no autocomplete da Aula 63.

No listener do `rowsContainer`, troque o começo:

```javascript
rowsContainer.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
```

por:

```javascript
rowsContainer.addEventListener("click", async (event) => {
  // O clique pode cair no <svg> ou no <path> do icone: subimos ate o botao.
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  const editId = editButton?.dataset.edit;
  const deleteId = deleteButton?.dataset.delete;
```

E, dentro do `if (deleteId)`, troque:

```javascript
    const name = event.target.dataset.name;
```

por:

```javascript
    const name = deleteButton.dataset.name;
```

> 📌 **Regra:** em delegação de eventos, use sempre `event.target.closest("[data-algo]")`. O `event.target` puro só funciona enquanto o botão não tem nada dentro, e um dia ele vai ter.

### 3.5 A tabela carregando (Parte D)

Troque a função `loadProducts` por:

```javascript
async function loadProducts() {
  listController?.abort();
  const controller = new AbortController();
  listController = controller;

  // Primeira carga: skeleton. Depois: esmaece a tabela atual, para
  // ela nao "piscar" vazia a cada letra digitada na busca.
  if (isFirstLoad) {
    rowsContainer.innerHTML = skeletonRows(7);
  } else {
    rowsContainer.classList.add("opacity-50");
  }
  rowsContainer.setAttribute("aria-busy", "true");

  try {
    const { pagination, rows } = await api.listProducts(currentFilters(), {
      signal: controller.signal,
    });

    if (rows.length === 0 && currentPage > pagination.totalPages) {
      currentPage = pagination.totalPages;
      return loadProducts();
    }

    renderRows(rows);
    renderPagination(pagination);
  } catch (error) {
    if (isCanceled(error)) return;

    toast(error.message, "error");
  } finally {
    // So quem ainda e a busca "da vez" desliga o carregando.
    // Uma busca cancelada nao pode tirar o aviso de uma mais nova.
    if (listController === controller) {
      rowsContainer.classList.remove("opacity-50");
      rowsContainer.removeAttribute("aria-busy");
      isFirstLoad = false;
    }
  }
}
```

#### 🔍 O `if (listController === controller)` no `finally`

Cada chamada guarda o **seu** controller numa constante local. Veja o que acontece com duas buscas seguidas:

```text
   busca A comeca  -> listController = A, tabela esmaece
   busca B comeca  -> cancela A, listController = B
   A termina (cancelada) -> finally: listController e B, nao A -> NAO mexe
   B termina             -> finally: listController e B       -> tira o esmaecido
```

Sem a checagem, o `finally` da busca A (cancelada) tiraria o esmaecido **enquanto a B ainda está carregando**.

### 3.6 O botão Salvar trabalhando (Parte F)

No listener de `submit` do `form`, envolva o `try/catch` com o carregando:

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

  setButtonLoading(saveButton, true);

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
  } finally {
    setButtonLoading(saveButton, false);
  }
});
```

Salve.

---

# PARTE 2 — Movimentações

## Passo 4 — Rótulos e `fieldset`

Abra `public/movimentacoes.html`.

### 4.1 O grupo "Tipo"

Troque o bloco do tipo:

```html
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <div class="grid grid-cols-2 gap-2">
```

por:

```html
            <fieldset>
              <legend class="mb-1 block text-sm font-medium text-slate-700">Tipo</legend>
              <div class="grid grid-cols-2 gap-2">
```

E o `</div>` que **fecha** esse bloco (depois do segundo `</label>`, o da Saída) vira `</fieldset>`.

> 🔍 **Por que `fieldset` + `legend`?** O "Tipo" não é rótulo de **um** campo: é o título de **um grupo** de dois radios. O `<label>` antigo não estava ligado a nada. Com `<fieldset>`, o leitor de tela anuncia "Tipo, grupo; Entrada, botão de opção, 1 de 2".

### 4.2 Quantidade e Observação

```html
              <label for="movement-quantity" class="mb-1 block text-sm font-medium text-slate-700">Quantidade</label>
              <input
                id="movement-quantity"
                name="quantity"
                type="number"
                min="1"
                value="1"
                required
                inputmode="numeric"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
```

```html
              <label for="movement-note" class="mb-1 block text-sm font-medium text-slate-700">Observacao</label>
              <input
                id="movement-note"
                name="note"
                maxlength="180"
                placeholder="Compra, venda, ajuste..."
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
```

Salve.

> 🔍 `maxlength="180"` é o tamanho da coluna `note` (`VARCHAR(180)`, Aula 06).

## Passo 5 — O JavaScript de Movimentações

Abra `public/js/movimentacoes.js`.

Troque o import do `layout.js`:

```javascript
import {
  escapeHtml,
  formatDateTime,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";
```

No `loadMovements`, acrescente o skeleton na primeira linha:

```javascript
async function loadMovements() {
  rowsContainer.innerHTML = skeletonRows(5);

  try {
    const movements = await api.listMovements({ type: activeFilter });
    renderRows(movements);
  } catch (error) {
    toast(error.message, "error");
  }
}
```

E, no `submit`, envolva o `try/catch` com o carregando:

```javascript
  setButtonLoading(submitButton, true, "Registrando...");

  try {
    await api.createMovement(payload);

    toast(payload.type === "IN" ? "Entrada registrada" : "Saida registrada");

    form.reset();
    clearButton.classList.add("hidden");
    clearSelection();

    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
    // O botao pode precisar continuar travado (saida maior que o estoque).
    updateStockHint();
  }
```

Salve.

> 🔍 **Por que o `updateStockHint()` no `finally`?** O `setButtonLoading(..., false)` **destrava** o botão. Mas, se o registro deu erro e a quantidade ainda é maior que o estoque, o botão precisa voltar a ficar travado pela regra da Aula 63. Chamar o `updateStockHint` refaz a conta e deixa o botão no estado certo.

> 🔍 **Aqui o skeleton aparece sempre**, e não só na primeira carga como em Produtos. A diferença: em Movimentações a tabela só recarrega quando a pessoa clica numa aba (Todas/Entradas/Saídas), uma ação única. Em Produtos ela recarrega a cada pausa na digitação, e um skeleton a cada letra cansaria a vista.

---

# PARTE 3 — Categorias

## Passo 6 — O HTML

Abra `public/categorias.html`.

No campo do nome, ligue o rótulo:

```html
            <label for="category-name" class="mb-1 block text-sm font-medium text-slate-700">Nome da categoria</label>
            <input
              id="category-name"
              name="name"
              required
              maxlength="80"
              placeholder="Ex.: Bebidas"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
```

> 🔍 `maxlength="80"` é o tamanho da coluna `name` da tabela `categories` (`VARCHAR(80)`, Aula 06).

E marque o botão Salvar:

```html
          <button
            type="submit"
            data-save
            class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Salvar
          </button>
```

Salve.

## Passo 7 — O JavaScript de Categorias

Abra `public/js/categorias.js`.

### 7.1 Imports e referência

```javascript
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { renderIcons } from "./icons.js";
import {
  confirmDialog,
  escapeHtml,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";
```

Junto das outras referências:

```javascript
const saveButton = form.querySelector("[data-save]");
```

### 7.2 Botões com ícones

No `renderRows`, troque a célula das ações:

```javascript
          <td class="px-6 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${category.id}"
              data-name="${escapeHtml(category.name)}"
              aria-label="Editar ${escapeHtml(category.name)}"
              title="Editar"
              class="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              <i data-lucide="pencil" class="h-4 w-4"></i>
            </button>
            <button
              data-delete="${category.id}"
              aria-label="Excluir ${escapeHtml(category.name)}"
              title="Excluir"
              class="inline-grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <i data-lucide="trash-2" class="h-4 w-4"></i>
            </button>
          </td>
```

E, no fim do `renderRows`:

```javascript
  renderIcons();
```

### 7.3 A delegação com `closest`

No listener do `rowsContainer`, troque:

```javascript
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    form.elements.id.value = editId;
    form.elements.name.value = event.target.dataset.name;
```

por:

```javascript
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  const editId = editButton?.dataset.edit;
  const deleteId = deleteButton?.dataset.delete;

  if (editId) {
    form.elements.id.value = editId;
    form.elements.name.value = editButton.dataset.name;
```

### 7.4 Skeleton e botão trabalhando

No `loadCategories`, primeira linha:

```javascript
async function loadCategories() {
  rowsContainer.innerHTML = skeletonRows(3);

  try {
```

E no `submit`, envolva o `try/catch`:

```javascript
  setButtonLoading(saveButton, true);

  try {
    if (id) {
      await api.updateCategory(id, payload);
      toast("Categoria atualizada");
    } else {
      await api.createCategory(payload);
      toast("Categoria cadastrada");
    }

    resetForm();
    loadCategories();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
```

Salve.

---

## Passo 8 — Testar

Recarregue com **Ctrl + Shift + R**.

### Com a rede lenta (F12 → Network → Slow 3G)

| # | Faça | Esperado |
|---|---|---|
| 1 | Abra Produtos | Linhas cinzas pulsando, depois os produtos |
| 2 | Digite na busca | A tabela atual **esmaece** (não pisca vazia) e depois atualiza |
| 3 | Salve um produto | O botão vira "⟳ Salvando...", cinza; **não** aceita outro clique |
| 4 | Movimentações: clique 3 vezes rápido em Registrar | **Uma** movimentação só no histórico |
| 5 | Clique nas abas do histórico | Skeleton a cada troca |
| 6 | Categorias: salve uma | "Salvando..." e depois volta a "Salvar" |

Volte para **No throttling** depois.

### Ícones e delegação

| # | Faça | Esperado |
|---|---|---|
| 7 | Produtos: clique **bem no meio** do lápis | O modal de edição abre |
| 8 | Clique **bem no meio** da lixeira | O modal de confirmação abre, com o nome certo |
| 9 | Pare o mouse sobre um ícone | Dica "Editar" ou "Excluir" |
| 10 | Categorias: o mesmo com lápis e lixeira | Funciona |

### Acessibilidade (sem mouse)

| # | Faça | Esperado |
|---|---|---|
| 11 | Abra Novo produto e clique no **texto** "Preco de venda" | O cursor vai para o campo |
| 12 | Tab até um lápis, Enter | O modal abre com o cursor no Nome |
| 13 | Esc | O modal fecha e o foco **volta para o lápis** (aperte Enter de novo: reabre) |
| 14 | No celular (ou modo responsivo do F12), toque em Preço | Abre o teclado numérico |

### Se quiser ir além: o Lighthouse

F12 → aba **Lighthouse** → marque só **Accessibility** → **Analyze page load**. Rode na tela de Produtos e anote a nota. Os itens que ainda aparecem em vermelho são bons exercícios.

---

## ✅ Confira se deu certo

- [ ] `setButtonLoading` e `skeletonRows` existem no `layout.js`
- [ ] Nenhum botão de envio aceita clique duplo
- [ ] Todo `setButtonLoading(..., true)` tem o par no `finally`
- [ ] Produtos: skeleton na primeira carga e esmaecido nas buscas
- [ ] Editar/Excluir são ícones e funcionam clicando no meio deles
- [ ] A delegação usa `closest` em Produtos e Categorias
- [ ] Todo `<label>` de campo tem `for`, e todo campo tem `id`
- [ ] O modal de produto tem `role="dialog"` e devolve o foco ao fechar
- [ ] O grupo "Tipo" é um `<fieldset>` com `<legend>`

---

## 🔧 Se deu erro

### Clicar no lápis não faz nada

A delegação ainda usa `event.target.dataset.edit`. Troque por `event.target.closest("[data-edit]")` (Passo 3.4).

### Os ícones dos botões da tabela não aparecem

Faltou o `renderIcons()` no fim do `renderRows`.

### O botão fica em "Salvando..." para sempre

O `setButtonLoading(botao, false)` está no fim do `try`, e não no `finally`. Um erro pulou a linha.

### `Cannot read properties of null (reading 'dataset')` ao salvar

O `saveButton` não foi encontrado: faltou o `data-save` no botão do HTML.

### A tabela de Produtos fica esmaecida para sempre

O `finally` do `loadProducts` não está tirando a classe. Confira se a constante local `controller` é a mesma que foi guardada em `listController`.

### Esc no modal de confirmação também fecha o modal de produto

Faltou o `&& isModalOpen()` no listener do `keydown` (Passo 3.2).

### Depois de fechar o modal, a página rola para o topo

O `lastFocused` está `null`: o `openModal` precisa guardar o `document.activeElement` **antes** de mudar o foco para o campo Nome.

---

## ➡️ Próximo passo

A interface ficou redonda. Agora vamos voltar ao servidor e fechar uma porta que está aberta desde a Aula 27: o login aceita **quantas tentativas alguém quiser**.

**[Aula 67 — Limite de tentativas no login](67-limite-tentativas-login.md)**
