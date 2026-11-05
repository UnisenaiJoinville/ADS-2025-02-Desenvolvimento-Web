# Aula 63 — Autocomplete de produtos em Movimentações

⏱️ **Tempo estimado:** 60 minutos
📋 **Tipo:** prática (HTML + JavaScript)

---

## Objetivo

Trocar o `<select>` que carrega **todos** os produtos na tela de Movimentações por um **campo de busca com autocomplete**:

```text
   ANTES                                 DEPOIS

   Produto                               Produto
   [ Selecione...              v ]       [ 🔍 caf                     x ]
     Agua mineral (BEB-002)              ┌───────────────────────────────┐
     Cafe em graos 1kg (BEB-001)         │ CAFe em graos 1kg      40 un. │ ◄ marcado
     Caneta azul (PAP-001)               │ BEB-001                       │
     Mouse sem fio (INF-002)             │ Bolo de CAFe           12 un. │
     ... (todos os produtos)             │ ALI-007                       │
                                         └───────────────────────────────┘
                                         Estoque atual: 40 unidade(s) - minimo 10
```

No caminho, você vai aprender as técnicas que todo autocomplete profissional usa:

- **debounce**: esperar o usuário parar de digitar;
- **cancelar** a busca velha com `AbortController` (da [Aula 61](61-axios-no-lugar-do-fetch.md));
- navegação pelo **teclado** (setas, Enter, Esc);
- **destacar** o trecho encontrado sem abrir brecha para XSS;
- acessibilidade com `role="combobox"`.

E uma melhoria de regra: avisar **antes de enviar** quando a saída for maior que o estoque.

---

## Antes de começar

- [ ] [Aula 62](62-api-busca-produtos.md) concluída: `api.searchProducts("caf")` funciona no console
- [ ] Lucide carregando na tela de Movimentações ([Aula 60](60-melhorias-icones-lucide.md))

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
├── public/movimentacoes.html      (o formulario)
└── public/js/movimentacoes.js     (reescrito)
```

---

## 1. O que há de errado com o `<select>`?

Releia o `loadProducts` da [Aula 18](18-front-movimentacoes.md):

```javascript
async function loadProducts() {
  products = await api.listProducts();   // TODOS os produtos
  form.elements.productId.innerHTML = ...products.map(...)...;
}
```

| Problema | Com 7 produtos | Com 5.000 produtos |
|---|---|---|
| Tamanho da resposta | pequeno | **megabytes** a cada abertura da tela |
| Achar o produto | rolar um pouco | rolar **5.000 linhas** |
| Buscar pelo SKU | impossível | impossível |
| Saldo mostrado na dica | da hora em que a tela abriu | **desatualizado** se outra pessoa movimentou |

O `<select>` funciona bem para listas **curtas e fixas** (estados do Brasil, tipo de movimentação). Para uma lista que **cresce** com o negócio, o padrão é o **autocomplete**: o usuário digita, o servidor devolve poucos resultados.

```text
   <select>:       abre a tela ──► baixa TUDO ──► usuário procura na lista

   autocomplete:   usuário digita "caf" ──► servidor procura ──► devolve 8
```

> 📌 Repare no último problema da tabela. Com o autocomplete, **cada busca vai ao servidor**: o saldo mostrado é sempre o de agora. O "recarregar os produtos depois de registrar" da Aula 18 deixa de ser necessário, porque não existe mais uma cópia velha guardada na tela.

---

## Passo 1 — O HTML do campo de busca

Abra `public/movimentacoes.html` e localize o primeiro bloco do formulário, o do `<select>`:

```html
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Produto</label>
              <select
                name="productId"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Selecione...</option>
              </select>
              <p data-stock-hint class="mt-1 text-xs text-slate-500"></p>
            </div>
```

Substitua **esse bloco inteiro** por:

```html
            <!-- Autocomplete de produto (Aula 63) -->
            <div data-product-picker class="relative">
              <label for="product-search" class="mb-1 block text-sm font-medium text-slate-700">
                Produto
              </label>

              <div class="relative">
                <!-- Lupa decorativa dentro do campo -->
                <i
                  data-lucide="search"
                  class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                ></i>

                <input
                  id="product-search"
                  data-product-search
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded="false"
                  aria-controls="product-options"
                  placeholder="Digite o nome ou o SKU..."
                  class="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-9 text-sm outline-none focus:border-slate-900"
                />

                <!-- Botao "x": so aparece quando ha algo no campo -->
                <button
                  type="button"
                  data-product-clear
                  aria-label="Limpar produto"
                  title="Limpar produto"
                  class="absolute inset-y-0 right-0 hidden w-9 place-items-center rounded-r-xl text-slate-400 hover:text-slate-900"
                >
                  <i data-lucide="x" class="h-4 w-4"></i>
                </button>
              </div>

              <!-- O que vai para a API: o id do produto escolhido -->
              <input type="hidden" name="productId" />

              <!-- A lista de sugestoes, flutuando sobre o formulario -->
              <ul
                id="product-options"
                data-product-options
                role="listbox"
                aria-label="Produtos encontrados"
                class="absolute z-20 mt-1 hidden max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              ></ul>

              <p data-stock-hint class="mt-1 text-xs text-slate-500" aria-live="polite"></p>
            </div>
```

Agora localize o botão **Registrar**, no fim do formulário:

```html
            <button
              class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Registrar
            </button>
```

E troque por:

```html
            <button
              type="submit"
              data-submit
              class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Registrar
            </button>
```

Salve.

---

## 2. Lendo o HTML

### 2.1 Dois campos: o que o usuário vê e o que a API recebe

```html
<input id="product-search" ... />            <!-- o usuario digita "caf" -->
<input type="hidden" name="productId" />     <!-- a API recebe 1 -->
```

| Campo | Tem `name`? | Vai no `FormData`? | Guarda |
|---|---|---|---|
| `product-search` | **não** | não | o texto digitado, depois "Cafe em graos 1kg (BEB-001)" |
| `productId` (escondido) | sim | **sim** | o `id` do produto escolhido |

É o mesmo truque do `<input type="hidden" name="id">` do modal de produtos ([Aula 17](17-front-produtos.md)): o que a pessoa **vê** é diferente do que o sistema **envia**.

> 🔍 **Por que o campo de busca não tem `name`?** Sem `name`, o `FormData` o ignora. Não queremos mandar "Cafe em graos 1kg (BEB-001)" para a API: ela espera um número em `productId`.

### 2.2 Os atributos de acessibilidade

Um leitor de tela não "vê" que uma lista apareceu embaixo do campo. Estes atributos contam para ele:

| Atributo | Diz ao leitor de tela |
|---|---|
| `role="combobox"` | "este campo tem uma lista de opções ligada a ele" |
| `aria-autocomplete="list"` | "as opções aparecem enquanto você digita" |
| `aria-expanded="false"` | "a lista está fechada agora" (o JS troca para `true`) |
| `aria-controls="product-options"` | "a lista é o elemento com este `id`" |
| `role="listbox"` / `role="option"` | "isto é uma lista de opções" / "isto é uma opção" |
| `aria-activedescendant` (no JS) | "a opção marcada agora é esta" |
| `aria-live="polite"` na dica | "leia esta frase quando ela mudar" (o saldo) |

### 2.3 Outros detalhes

| Atributo | Por quê |
|---|---|
| `autocomplete="off"` | sem ele, o navegador abre a **própria** lista de sugestões por cima da nossa |
| `spellcheck="false"` | nada de sublinhado vermelho em "BEB-001" |
| `<label for="product-search">` + `id` | clicar em "Produto" coloca o cursor no campo |
| `relative` no `div` de fora + `absolute` na `<ul>` | a lista flutua logo abaixo do campo, por cima do resto |
| `z-20` | a lista fica **acima** dos campos que vêm depois |
| `max-h-72 overflow-y-auto` | se houver muitas opções, a lista rola em vez de crescer |
| `disabled:bg-slate-300` no botão | aparência de "travado" quando a saída for maior que o estoque |

---

## Passo 2 — O JavaScript, por partes

Abra `public/js/movimentacoes.js`, **apague tudo** e vá escrevendo as partes A até J, na ordem.

### Parte A — Imports, elementos e estado

```javascript
import { api, isCanceled } from "./api.js";
import { requireAuth } from "./auth.js";
import { renderIcons } from "./icons.js";
import { escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/movimentacoes.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const stockHint = document.querySelector("[data-stock-hint]");
const filterButtons = document.querySelectorAll("[data-filter]");
const submitButton = document.querySelector("[data-submit]");

// Pecas do autocomplete (Aula 63)
const searchInput = document.querySelector("[data-product-search]");
const optionsList = document.querySelector("[data-product-options]");
const clearButton = document.querySelector("[data-product-clear]");

// Quanto tempo esperar o usuario parar de digitar antes de buscar.
const SEARCH_DELAY = 300;

let activeFilter = "";

let selectedProduct = null;   // o produto escolhido na lista (ou null)
let suggestions = [];         // o que a ultima busca devolveu
let lastTerm = "";            // o texto daquela ultima busca
let highlightedIndex = -1;    // a sugestao marcada pelo teclado (-1 = nenhuma)
let searchTimer = null;       // o "relogio" do debounce
let searchController = null;  // o "controle remoto" da busca em andamento
```

Repare que a variável `products` (a lista inteira) **não existe mais**. No lugar dela, o estado do autocomplete:

| Variável | Guarda |
|---|---|
| `selectedProduct` | o produto escolhido; é dele que sai o saldo da dica |
| `suggestions` | as até 8 opções que estão na lista agora |
| `lastTerm` | o texto que gerou essas opções (para destacar o trecho) |
| `highlightedIndex` | qual opção as setas do teclado marcaram |
| `searchTimer` | o temporizador do debounce (Parte F) |
| `searchController` | o `AbortController` da busca em andamento (Parte F) |

### Parte B — O histórico (igual à Aula 18)

Estas duas funções **não mudaram**. Copie como estavam:

```javascript
function highlightFilters() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;

    button.className = isActive
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}

function renderRows(movements) {
  if (movements.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="5" class="px-6 py-10 text-center text-sm text-slate-500">
        Nenhuma movimentacao registrada
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = movements
    .map((movement) => {
      const isIn = movement.type === "IN";

      return `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3">
            <p class="font-medium text-slate-800">${escapeHtml(movement.productName)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(movement.productSku)}</p>
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${
              isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }">${isIn ? "Entrada" : "Saida"}</span>
          </td>
          <td class="px-4 py-3 text-right font-semibold ${
            isIn ? "text-emerald-600" : "text-rose-600"
          }">${isIn ? "+" : "-"}${movement.quantity}</td>
          <td class="px-4 py-3 text-slate-600">${escapeHtml(movement.note ?? "-")}</td>
          <td class="px-6 py-3 text-right text-slate-500">${formatDateTime(movement.createdAt)}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadMovements() {
  try {
    const movements = await api.listMovements({ type: activeFilter });
    renderRows(movements);
  } catch (error) {
    toast(error.message, "error");
  }
}
```

### Parte C — Abrir e fechar a lista

```javascript
// ------------------------------------------------------------
// Autocomplete: abrir e fechar a lista
// ------------------------------------------------------------

function openOptions() {
  optionsList.classList.remove("hidden");
  searchInput.setAttribute("aria-expanded", "true");
}

function closeOptions() {
  optionsList.classList.add("hidden");
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  highlightedIndex = -1;
}

function isOptionsOpen() {
  return !optionsList.classList.contains("hidden");
}
```

> 🔍 Mostrar ou esconder **e** atualizar o `aria-expanded` na mesma função garante que os dois nunca fiquem diferentes. Se cada lugar do código fizesse as duas coisas separadamente, um dia alguém esqueceria uma delas.

### Parte D — Destacar o trecho encontrado (sem abrir brecha)

```javascript
// "Cafe em graos" + "gra"  ->  "Cafe em <mark>gra</mark>os"
// Cada PEDACO passa pelo escapeHtml: o <mark> e nosso, o resto veio do banco.
function highlightMatch(text, term) {
  const index = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;

  if (index === -1) {
    return escapeHtml(text);
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + term.length);
  const after = text.slice(index + term.length);

  return `${escapeHtml(before)}<mark class="rounded bg-amber-100 px-0.5 text-inherit">${escapeHtml(match)}</mark>${escapeHtml(after)}`;
}
```

Passo a passo com `text = "Cafe em graos 1kg"` e `term = "GRA"`:

| Etapa | Valor |
|---|---|
| `text.toLowerCase()` | `"cafe em graos 1kg"` |
| `.indexOf("gra")` | `8` |
| `before` | `"Cafe em "` |
| `match` | `"gra"` (**do texto original**, com as maiúsculas dele) |
| `after` | `"os 1kg"` |

> ⚠️ **A armadilha de segurança desta parte.** A tentação é fazer assim:
>
> ```javascript
> // PERIGOSO
> escapeHtml(text).replace(term, `<mark>${term}</mark>`)
> ```
>
> Isso coloca o `term`, **que o usuário digitou**, dentro do HTML sem escapar. E ainda quebra com acentos e `&` (o `escapeHtml` troca `&` por `&amp;`, e os índices deixam de bater). A forma segura é **cortar o texto original em três pedaços e escapar cada um**. O único HTML "de verdade" que entra é o `<mark>`, escrito por nós.

### Parte E — Desenhar a lista

```javascript
// ------------------------------------------------------------
// Autocomplete: desenhar a lista
// ------------------------------------------------------------

// Uma linha so com mensagem: "Buscando...", "Nenhum produto...", erro.
function renderMessage(message, icon, iconClass = "") {
  optionsList.innerHTML = `
    <li class="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
      <i data-lucide="${icon}" class="h-4 w-4 shrink-0 ${iconClass}"></i>
      ${escapeHtml(message)}
    </li>`;

  // Os <i> acabaram de nascer pelo innerHTML (regra da Aula 60).
  renderIcons();
  openOptions();
}

function renderSuggestions() {
  if (suggestions.length === 0) {
    renderMessage(
      lastTerm ? `Nenhum produto ativo encontrado para "${lastTerm}"` : "Nenhum produto ativo cadastrado",
      "package-search"
    );
    return;
  }

  optionsList.innerHTML = suggestions
    .map((product, index) => {
      const isHighlighted = index === highlightedIndex;

      return `
        <li
          id="product-option-${product.id}"
          role="option"
          aria-selected="${isHighlighted}"
          data-index="${index}"
          class="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm ${
            isHighlighted ? "bg-slate-100" : "hover:bg-slate-50"
          }"
        >
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-800">${highlightMatch(product.name, lastTerm)}</p>
            <p class="text-xs text-slate-500">${highlightMatch(product.sku, lastTerm)}</p>
          </div>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            product.lowStock ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
          }">${product.quantity} un.</span>
        </li>
      `;
    })
    .join("");

  // Avisa ao leitor de tela qual opcao esta marcada.
  if (highlightedIndex >= 0) {
    searchInput.setAttribute(
      "aria-activedescendant",
      `product-option-${suggestions[highlightedIndex].id}`
    );
  }

  openOptions();
}
```

A lista tem **quatro estados**, como a tela de relatórios da [Aula 42](42-tela-relatorios-vue.md):

| Estado | O que aparece |
|---|---|
| Carregando | ⟳ "Buscando..." |
| Vazio | "Nenhum produto ativo encontrado para "xyz"" |
| Erro | ⚠ a mensagem que veio da API |
| Com dados | as opções, com o trecho destacado e o saldo |

> 🔍 **O saldo em vermelho na própria opção.** `product.lowStock` é o campo calculado da [Aula 12](12-crud-produtos.md). Antes de escolher, a pessoa já vê quais produtos estão com estoque baixo.

### Parte F — Buscar: debounce + cancelamento

```javascript
// ------------------------------------------------------------
// Autocomplete: buscar no servidor
// ------------------------------------------------------------

async function searchProducts(term) {
  // Uma busca nova torna a anterior inutil: cancela (Aula 61).
  searchController?.abort();
  searchController = new AbortController();

  renderMessage("Buscando...", "loader-circle", "animate-spin");

  try {
    suggestions = await api.searchProducts(term, { signal: searchController.signal });
    lastTerm = term;
    // Ja deixa a primeira opcao marcada: Enter escolhe na hora.
    highlightedIndex = suggestions.length > 0 ? 0 : -1;
    renderSuggestions();
  } catch (error) {
    // Cancelada de proposito: uma busca mais nova ja esta a caminho.
    if (isCanceled(error)) return;

    renderMessage(error.message, "triangle-alert");
  }
}

// DEBOUNCE: so busca quando o usuario PARA de digitar.
// Cada tecla zera o relogio; a busca so acontece se ele chegar ao fim.
function scheduleSearch() {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    searchProducts(searchInput.value.trim());
  }, SEARCH_DELAY);
}
```

#### O debounce, desenhado

Sem debounce, digitar `cafe` dispara **quatro** buscas:

```text
   tecla:    c        a        f        e
   busca:    GET ?q=c GET ?q=ca GET ?q=caf GET ?q=cafe      <- 4 requisicoes
```

Com debounce de 300 ms:

```text
   tecla:    c   a   f   e  ......300 ms de silencio......
   relógio:  ▶x  ▶x  ▶x  ▶─────────────────────────────▶ GET ?q=cafe   <- 1 requisicao
             (cada tecla cancela o relógio anterior e começa outro)
```

| Linha | Papel |
|---|---|
| `clearTimeout(searchTimer)` | joga fora o relógio que estava contando |
| `setTimeout(..., SEARCH_DELAY)` | começa a contar de novo |

> 🔍 **Por que 300 ms?** É o intervalo médio entre teclas de alguém digitando uma palavra. Menos que isso e o debounce quase não economiza; muito mais (1 segundo) e a tela parece lenta. Você usou a mesma técnica na busca dos relatórios ([Aula 43](43-integracao-vue-api.md)).

#### Debounce e cancelamento são coisas diferentes

Os dois trabalham juntos, mas resolvem problemas diferentes:

| Técnica | Resolve | Quando age |
|---|---|---|
| **Debounce** | requisições **demais** | **antes** de a requisição sair |
| **Cancelamento** | respostas **fora de ordem** | **depois** que a requisição saiu |

O debounce reduz o número de buscas, mas não zera o problema: se a pessoa digita `caf`, pausa (a busca sai), digita `e`, pausa (outra busca sai), as duas podem estar em andamento ao mesmo tempo. O `abort()` garante que só a última chegue à tela.

### Parte G — Escolher um produto

```javascript
// ------------------------------------------------------------
// Autocomplete: escolher e limpar
// ------------------------------------------------------------

function selectProduct(product) {
  selectedProduct = product;
  form.elements.productId.value = product.id;
  searchInput.value = `${product.name} (${product.sku})`;
  clearButton.classList.remove("hidden");

  closeOptions();
  updateStockHint();
}

function clearSelection() {
  selectedProduct = null;
  form.elements.productId.value = "";
  updateStockHint();
}
```

Ao escolher, três coisas acontecem ao mesmo tempo:

```text
   campo de busca     ← "Cafe em graos 1kg (BEB-001)"     (para a pessoa ver)
   productId          ← 1                                  (para a API receber)
   selectedProduct    ← { id: 1, quantity: 40, ... }       (para a dica de saldo)
```

### Parte H — A dica de saldo e o aviso de saída

```javascript
// ------------------------------------------------------------
// Dica de saldo e validacao da saida
// ------------------------------------------------------------

function updateStockHint() {
  if (!selectedProduct) {
    stockHint.textContent = "";
    submitButton.disabled = false;
    return;
  }

  const quantity = Number(form.elements.quantity.value);
  const isOut = form.elements.type.value === "OUT";
  const exceedsStock = isOut && quantity > selectedProduct.quantity;

  stockHint.className = exceedsStock
    ? "mt-1 text-xs font-semibold text-rose-600"
    : "mt-1 text-xs text-slate-500";

  stockHint.textContent = exceedsStock
    ? `Saida maior que o estoque: so ha ${selectedProduct.quantity} unidade(s)`
    : `Estoque atual: ${selectedProduct.quantity} unidade(s) - minimo ${selectedProduct.minimumStock}`;

  // Avisar E travar: nao faz sentido deixar enviar o que vai ser recusado.
  submitButton.disabled = exceedsStock;
}
```

```text
   Saída de 5 com estoque 40              Saída de 50 com estoque 40

   Estoque atual: 40 unidade(s) - min 10  Saida maior que o estoque: so ha 40 unidade(s)
   [        Registrar        ]            [        Registrar        ]  (cinza, travado)
```

#### `form.elements.type.value` com radio

Os dois radios têm `name="type"`. O `form.elements.type` devolve os dois juntos (um `RadioNodeList`), e o `.value` dele é o valor do que estiver **marcado**: `"IN"` ou `"OUT"`.

#### O servidor continua mandando

> 📌 **Esta validação é conforto, não segurança.** Ela evita uma ida inútil ao servidor e avisa a pessoa antes. Mas o saldo da tela pode estar velho: outra pessoa pode ter registrado uma saída **depois** que você escolheu o produto. Quem decide de verdade é a transação com `FOR UPDATE` da [Aula 13](13-movimentacoes-transacoes.md). É a mesma regra da [Aula 29](29-tela-cadastro-vue.md): **validação no cliente é UX; validação no servidor é segurança.**

### Parte I — Os eventos do autocomplete

```javascript
// ------------------------------------------------------------
// Autocomplete: eventos
// ------------------------------------------------------------

searchInput.addEventListener("input", () => {
  // Mexeu no texto: a escolha anterior deixou de valer.
  if (selectedProduct) clearSelection();

  clearButton.classList.toggle("hidden", searchInput.value === "");
  scheduleSearch();
});

// Clicou no campo vazio: ja mostra os primeiros produtos.
searchInput.addEventListener("focus", () => {
  if (!selectedProduct) scheduleSearch();
});

// Saiu do campo (Tab ou clique fora): fecha a lista e desiste do que
// estava pendente. Sem isso, uma busca agendada abriria a lista DEPOIS,
// com a pessoa ja em outro campo.
searchInput.addEventListener("blur", () => {
  clearTimeout(searchTimer);
  searchController?.abort();
  closeOptions();
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    // Sem isso, a seta move o cursor para o inicio/fim do texto.
    event.preventDefault();

    if (!isOptionsOpen()) {
      scheduleSearch();
      return;
    }

    if (suggestions.length === 0) return;

    const step = event.key === "ArrowDown" ? 1 : -1;
    // O "%" faz a lista dar a volta: da ultima, desce para a primeira.
    highlightedIndex = (highlightedIndex + step + suggestions.length) % suggestions.length;
    renderSuggestions();

    // Se a lista tem rolagem, mantem a opcao marcada visivel.
    optionsList.children[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    return;
  }

  if (event.key === "Enter" && isOptionsOpen() && highlightedIndex >= 0) {
    // Com a lista aberta, Enter ESCOLHE. Nao envia o formulario.
    event.preventDefault();
    selectProduct(suggestions[highlightedIndex]);
    return;
  }

  if (event.key === "Escape") {
    closeOptions();
  }
});

// mousedown, e nao click: o click so dispararia DEPOIS do blur,
// e o blur ja teria fechado a lista. O preventDefault mantem o foco.
optionsList.addEventListener("mousedown", (event) => {
  event.preventDefault();

  const option = event.target.closest("[data-index]");

  if (option) {
    selectProduct(suggestions[Number(option.dataset.index)]);
  }
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  clearButton.classList.add("hidden");
  clearSelection();
  // Voltar o foco dispara o "focus" la de cima: a lista reaparece.
  searchInput.focus();
});

// Mudou o tipo ou a quantidade: refaz a conta da dica.
form.elements.quantity.addEventListener("input", updateStockHint);
form.querySelectorAll('input[name="type"]').forEach((radio) => {
  radio.addEventListener("change", updateStockHint);
});
```

#### O mapa do teclado

| Tecla | Lista fechada | Lista aberta |
|---|---|---|
| ↓ / ↑ | abre a lista | move a marcação (dando a volta) |
| Enter | envia o formulário | **escolhe** a opção marcada |
| Esc | — | fecha a lista |
| Tab | vai para o próximo campo | fecha e vai para o próximo campo |

#### A conta do "dar a volta"

```javascript
highlightedIndex = (highlightedIndex + step + suggestions.length) % suggestions.length;
```

Com 4 sugestões (índices 0 a 3):

| Está em | Tecla | Conta | Vai para |
|---|---|---|---|
| 2 | ↓ | `(2 + 1 + 4) % 4` = `7 % 4` | **3** |
| 3 | ↓ | `(3 + 1 + 4) % 4` = `8 % 4` | **0** (deu a volta) |
| 0 | ↑ | `(0 - 1 + 4) % 4` = `3 % 4` | **3** (deu a volta) |

> 🔍 **Por que somar `suggestions.length`?** Porque em JavaScript `-1 % 4` dá `-1`, e não `3`. Somando o tamanho antes, o número nunca fica negativo.

#### A briga entre `blur` e `click`

Esta é a pegadinha clássica de todo autocomplete. A ordem dos eventos quando você clica numa opção é:

```text
   1. mousedown  (na opcao)
   2. blur       (o campo perde o foco)   -> closeOptions() -> a lista SOME
   3. mouseup
   4. click      (na opcao... que nao existe mais na tela)
```

Se usássemos `click`, a lista fecharia no passo 2 e o clique cairia no vazio. Usando `mousedown` com `preventDefault()`:

- escolhemos a opção **no passo 1**, antes de tudo;
- o `preventDefault()` impede que o campo perca o foco, então o `blur` nem acontece.

> 🔍 O `preventDefault()` está **antes** do `if (option)` de propósito: clicar na barra de rolagem da lista também não pode tirar o foco do campo, senão a lista fecharia no meio da rolagem.

#### `event.target.closest("[data-index]")`

O clique pode cair no `<p>` do nome, no `<mark>` do destaque ou no `<span>` do saldo, e não no `<li>`. O `closest` sobe pela árvore até achar o elemento com `data-index`. É a delegação de eventos da [Aula 17](17-front-produtos.md), com um cuidado a mais.

### Parte J — Filtros, envio e início

```javascript
// ------------------------------------------------------------
// Historico e envio
// ------------------------------------------------------------

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    highlightFilters();
    loadMovements();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Campo escondido nao tem "required" que funcione: conferimos aqui.
  if (!selectedProduct) {
    toast("Escolha um produto da lista", "error");
    searchInput.focus();
    return;
  }

  const data = new FormData(form);

  const payload = {
    productId: Number(data.get("productId")),
    type: data.get("type"),
    quantity: Number(data.get("quantity")),
    note: data.get("note"),
  };

  try {
    await api.createMovement(payload);

    toast(payload.type === "IN" ? "Entrada registrada" : "Saida registrada");

    // reset() limpa os campos (inclusive o de busca e o escondido).
    form.reset();
    clearButton.classList.add("hidden");
    clearSelection();

    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
});

async function init() {
  highlightFilters();
  await loadMovements();
}

// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  init();
}
```

Salve.

#### Por que o `required` não serve mais

```html
<input type="hidden" name="productId" required />   <!-- o navegador IGNORA -->
```

O navegador **não valida** campos escondidos: a pessoa não teria como corrigir um campo que não vê. Por isso a conferência foi para o JavaScript:

```javascript
if (!selectedProduct) {
  toast("Escolha um produto da lista", "error");
  searchInput.focus();
  return;
}
```

Isso também cobre um caso sutil: a pessoa digita "cafe" e aperta Enter **sem escolher** da lista. O texto está lá, mas nenhum produto foi escolhido. Sem essa checagem, a API receberia `productId: 0`.

#### Onde foi parar o `loadProducts()`?

Na Aula 18, depois de registrar, recarregávamos a lista inteira para a dica não ficar com saldo velho. Agora não existe lista guardada: a próxima vez que a pessoa buscar, o saldo virá **fresco** do servidor.

> 📌 **Menos estado guardado, menos estado desatualizado.** Quando dá para perguntar ao servidor na hora, não guarde uma cópia.

---

## Passo 3 — Testar

Recarregue com **Ctrl + Shift + R** e abra `/movimentacoes.html`.

### Roteiro da busca

| # | Faça | Esperado |
|---|---|---|
| 1 | Clique no campo Produto, sem digitar | Aparece "Buscando..." e depois até 8 produtos |
| 2 | Digite `caf` | Depois de uma pausa, o café aparece com **caf** destacado em amarelo |
| 3 | Digite `beb` | Os produtos de SKU `BEB-...` aparecem, com o SKU destacado |
| 4 | Digite `xyz` | "Nenhum produto ativo encontrado para "xyz"" |
| 5 | Digite `caf` e use ↓ ↑ | A marcação cinza anda e dá a volta |
| 6 | Tecle **Enter** | O campo mostra "Cafe em graos 1kg (BEB-001)" e a dica mostra o saldo |
| 7 | Clique no **x** | O campo limpa, a dica some, a lista reaparece |
| 8 | Escolha um produto **com o mouse** | Funciona de primeira (sem a lista fechar antes) |
| 9 | Com a lista aberta, tecle **Esc** | A lista fecha |
| 10 | Escolha o café e depois apague uma letra | A escolha é desfeita (a dica some) |
| 11 | Digite `caf` e aperte **Tab** na mesma hora | A lista **não** aparece depois, com o cursor já em outro campo |

### Roteiro da movimentação (o mesmo da Aula 18)

| # | Faça | Esperado |
|---|---|---|
| 12 | Escolha o café, Entrada de `50`, observação "Compra" → Registrar | Toast verde, linha nova no histórico, campo limpo |
| 13 | Busque o café de novo | O saldo na lista e na dica já soma os 50 |
| 14 | Escolha o café, clique em **Saída**, quantidade `9999` | Dica **vermelha** e o botão Registrar **cinza, travado** |
| 15 | Mude a quantidade para `5` | A dica volta ao normal e o botão destrava |
| 16 | Apague o campo de produto e clique em Registrar | Toast "Escolha um produto da lista" |
| 17 | Digite `cafe` e tecle Enter **sem escolher** e com a lista fechada | Toast "Escolha um produto da lista" |

### O teste que prova o cancelamento

1. F12 → aba **Network** (Rede) → no seletor de velocidade, escolha **Slow 3G** (3G lento)
2. Filtre por `search`
3. No campo, digite `c`, espere meio segundo, digite `a`, espere, digite `f`

✅ **Esperado:** as primeiras requisições aparecem como **(canceled)** em vermelho, e a lista mostra o resultado de `caf`, nunca de `c`.

Volte a velocidade para **No throttling** (Sem limitação) depois.

### O teste do servidor (a última palavra)

A tela agora trava a saída maior que o estoque. Para provar que o servidor **continua** protegendo, use o console:

```javascript
const { api } = await import("/js/api.js");
await api.createMovement({ productId: 1, type: "OUT", quantity: 99999 });
```

✅ **Esperado:** `Error: Estoque insuficiente. Disponivel: ...`. A tela foi contornada, a transação da Aula 13 não.

### O teste de acessibilidade

Faça a movimentação inteira **sem tocar no mouse**: Tab até o campo, digite, setas, Enter, Tab até Saída, setas, Tab até quantidade, Tab até Registrar, Enter.

---

## ✅ Confira se deu certo

- [ ] O `<select>` sumiu; no lugar há um campo com lupa
- [ ] A tela **não** baixa mais a lista inteira de produtos ao abrir (confira na aba Network)
- [ ] A busca só sai depois de uma pausa na digitação (debounce)
- [ ] No 3G lento, as buscas velhas aparecem como **(canceled)**
- [ ] O trecho encontrado aparece destacado, no nome e no SKU
- [ ] Setas, Enter e Esc funcionam
- [ ] Clicar com o mouse numa opção funciona de primeira
- [ ] Saída maior que o estoque deixa a dica vermelha e trava o botão
- [ ] Registrar sem escolher produto mostra o toast
- [ ] O servidor continua recusando a saída maior pelo console

---

## 🔧 Se deu erro

### A lista nunca aparece

Abra o console. Se aparecer `api.searchProducts is not a function`, faltou o Passo 5 da [Aula 62](62-api-busca-produtos.md) ou é cache (**Ctrl + Shift + R**). Se não houver erro, confira se o `<ul>` tem `data-product-options` e o input tem `data-product-search`.

### Clicar numa opção não escolhe nada (a lista só fecha)

O evento está como `click` em vez de `mousedown`, ou faltou o `event.preventDefault()`. Releia "A briga entre `blur` e `click`".

### Enter envia o formulário em vez de escolher

Faltou o `event.preventDefault()` dentro do `if (event.key === "Enter" ...)`.

### A seta para baixo joga o cursor para o fim do texto

Faltou o `event.preventDefault()` no bloco das setas.

### O destaque aparece como texto: `<mark>caf</mark>`

O `highlightMatch` está passando o resultado inteiro pelo `escapeHtml` de novo. Cada **pedaço** é escapado; o resultado final, não.

### Um nome com `<b>` aparece em negrito na lista

O contrário: algum pedaço **não** passou pelo `escapeHtml`. Isso é uma brecha de XSS. Confira os três `escapeHtml` do `highlightMatch`.

### A dica de saldo nunca aparece

`updateStockHint` não está sendo chamada no `selectProduct`, ou o `stockHint` não foi encontrado (`data-stock-hint` no HTML).

### O botão Registrar fica travado para sempre

O `clearSelection` precisa chamar `updateStockHint`, que destrava o botão quando não há produto.

### O "Buscando..." aparece sem a animação

Faltou passar `"animate-spin"` no terceiro parâmetro do `renderMessage`, ou faltou o `renderIcons()` dentro dele.

### Erro `Cannot read properties of undefined (reading 'id')` ao teclar Enter

O `highlightedIndex` aponta para fora da lista. Confira se o `searchProducts` faz `highlightedIndex = suggestions.length > 0 ? 0 : -1`.

---

## ➡️ Próximo passo

O autocomplete resolveu Movimentações. Mas a **tela de Produtos** ainda baixa tudo de uma vez. Vamos paginar.

**[Aula 64 — Paginação e busca ao vivo em Produtos](64-paginacao-busca-produtos.md)**
