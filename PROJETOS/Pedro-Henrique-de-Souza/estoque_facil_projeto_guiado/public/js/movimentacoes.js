import { api, isCanceled } from "./api.js";
import { requireAuth } from "./auth.js";
import { renderIcons } from "./icons.js";
import {
  escapeHtml,
  formatDateTime,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";

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
  rowsContainer.innerHTML = skeletonRows(5);

  try {
    const movements = await api.listMovements({ type: activeFilter });
    renderRows(movements);
  } catch (error) {
    toast(error.message, "error");
  }
}

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

// ------------------------------------------------------------
// Dica de saldo e validacao da saida
// ------------------------------------------------------------

function updateStockHint() {
  // Enquanto o envio esta em andamento (aria-busy, Aula 66), o botao
  // continua travado: quem destrava e o setButtonLoading no finally.
  const isBusy = submitButton.getAttribute("aria-busy") === "true";

  if (!selectedProduct) {
    stockHint.textContent = "";
    submitButton.disabled = isBusy;
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
  submitButton.disabled = exceedsStock || isBusy;
}

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
