import { api, isCanceled } from "./api.js";
import { requireAuth } from "./auth.js";
import { escapeHtml, formatDateTime, mountLayout, setButtonLoading, skeletonRows, toast } from "./layout.js";
import { renderIcons } from "./icons.js";

mountLayout("/movimentacoes.html");

const form = document.querySelector("[data-form]");
const rows = document.querySelector("[data-rows]");
const hint = document.querySelector("[data-stock-hint]");
const searchInput = document.querySelector("[data-product-search]");
const combobox = document.querySelector("[data-product-combobox]");
const productIdInput = form.elements.productId;
const suggestions = document.querySelector("[data-product-suggestions]");
const submitButton = document.querySelector("[data-submit]");
const buttons = document.querySelectorAll("[data-filter]");

let activeFilter = "";
let selectedProduct = null;
let displayedProducts = [];
let searchTimer;
let requestController;
let activeOptionIndex = -1;

function render(list) {
  rows.innerHTML = list.length
    ? list.map((movement) => `<tr>
        <td class="px-6 py-3">${escapeHtml(movement.productName)}<small class="block text-xs text-slate-500">${escapeHtml(movement.productSku)}</small></td>
        <td>${movement.type === "IN" ? "Entrada" : "Saida"}</td>
        <td class="text-right ${movement.type === "IN" ? "text-emerald-600" : "text-rose-600"}">${movement.type === "IN" ? "+" : "-"}${movement.quantity}</td>
        <td>${escapeHtml(movement.note ?? "-")}</td>
        <td class="px-6 text-right text-slate-500">${formatDateTime(movement.createdAt)}</td>
      </tr>`).join("")
    : "<tr><td colspan='5' class='px-6 py-10 text-center text-sm text-slate-500'>Nenhuma movimentacao registrada</td></tr>";
}

async function loadMovements() {
  rows.innerHTML = skeletonRows(5, 5);
  rows.setAttribute("aria-busy", "true");

  try {
    render(await api.listMovements({ type: activeFilter }));
  } catch (error) {
    toast(error.message, "error");
  } finally {
    rows.removeAttribute("aria-busy");
  }
}

function updateHint() {
  hint.textContent = selectedProduct
    ? `Estoque atual: ${selectedProduct.quantity} unidade(s) - minimo ${selectedProduct.minimumStock}`
    : "";
}

function hideSuggestions() {
  suggestions.classList.add("hidden");
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  activeOptionIndex = -1;
}

function highlightMatch(text, term) {
  const index = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  if (!term || index < 0) return escapeHtml(text);

  return `${escapeHtml(text.slice(0, index))}<mark class="rounded bg-amber-100">${escapeHtml(text.slice(index, index + term.length))}</mark>${escapeHtml(text.slice(index + term.length))}`;
}

function renderSuggestions(products, term) {
  displayedProducts = products;
  activeOptionIndex = -1;
  searchInput.removeAttribute("aria-activedescendant");

  if (!products.length) {
    suggestions.innerHTML = '<li role="option" aria-disabled="true" class="px-4 py-3 text-sm text-slate-500">Nenhum produto encontrado</li>';
  } else {
    suggestions.innerHTML = products.map((product, index) => `<li id="product-option-${product.id}" role="option" aria-selected="false" data-product-option="${product.id}" data-option-index="${index}" class="cursor-pointer border-b px-4 py-3 last:border-0 hover:bg-slate-50">
      <span class="block font-medium">${highlightMatch(product.name, term)}<small class="ml-2 text-xs text-slate-500">${highlightMatch(product.sku, term)}</small></span>
      <span class="block text-xs text-slate-500">Estoque: ${product.quantity} unidade(s)</span>
    </li>`).join("");
  }

  suggestions.classList.remove("hidden");
  searchInput.setAttribute("aria-expanded", "true");
  renderIcons();
}

async function searchProducts(term = searchInput.value.trim()) {
  requestController?.abort();
  requestController = new AbortController();

  try {
    const products = await api.searchProducts(term, 8, { signal: requestController.signal });
    renderSuggestions(products, term);
  } catch (error) {
    if (!isCanceled(error)) {
      hideSuggestions();
      toast(error.message, "error");
    }
  }
}

function scheduleSearch() {
  selectedProduct = null;
  productIdInput.value = "";
  updateHint();
  searchInput.removeAttribute("aria-activedescendant");
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => searchProducts(), 250);
}

function chooseProduct(product) {
  window.clearTimeout(searchTimer);
  requestController?.abort();
  selectedProduct = product;
  productIdInput.value = String(product.id);
  searchInput.value = `${product.name} (${product.sku})`;
  hideSuggestions();
  updateHint();
  form.elements.quantity.focus();
}

function setActiveOption(index) {
  const options = suggestions.querySelectorAll("[data-product-option]");
  if (!options.length) return;

  activeOptionIndex = ((index % options.length) + options.length) % options.length;
  options.forEach((option, optionIndex) => {
    const active = optionIndex === activeOptionIndex;
    option.setAttribute("aria-selected", String(active));
    option.classList.toggle("bg-slate-100", active);
  });

  const activeOption = options[activeOptionIndex];
  searchInput.setAttribute("aria-activedescendant", activeOption.id);
  activeOption.scrollIntoView({ block: "nearest" });
}

searchInput.addEventListener("input", scheduleSearch);
searchInput.addEventListener("focus", () => {
  if (!selectedProduct) searchProducts();
});
searchInput.addEventListener("blur", () => {
  window.setTimeout(() => {
    if (!combobox.contains(document.activeElement)) hideSuggestions();
  }, 0);
});
searchInput.addEventListener("keydown", (event) => {
  const options = suggestions.querySelectorAll("[data-product-option]");

  if (event.key === "ArrowDown" && !suggestions.classList.contains("hidden")) {
    event.preventDefault();
    setActiveOption(activeOptionIndex + 1);
  } else if (event.key === "ArrowUp" && !suggestions.classList.contains("hidden")) {
    event.preventDefault();
    setActiveOption(activeOptionIndex - 1);
  } else if (event.key === "Enter" && activeOptionIndex >= 0 && options[activeOptionIndex]) {
    event.preventDefault();
    options[activeOptionIndex].click();
  } else if (event.key === "Escape") {
    hideSuggestions();
  }
});

suggestions.addEventListener("click", (event) => {
  const option = event.target.closest("[data-product-option]");
  if (!option) return;

  const product = displayedProducts.find((item) => item.id === Number(option.dataset.productOption));
  if (product) chooseProduct(product);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-product-combobox]")) hideSuggestions();
});

buttons.forEach((button) => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter;
  buttons.forEach((item) => {
    const active = item === button;
    item.className = active
      ? "rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white"
      : "rounded-lg border px-3 py-1.5 text-xs";
    item.setAttribute("aria-pressed", String(active));
  });
  loadMovements();
}));

form.addEventListener("reset", () => {
  window.clearTimeout(searchTimer);
  requestController?.abort();
  selectedProduct = null;
  productIdInput.value = "";
  searchInput.value = "";
  updateHint();
  hideSuggestions();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedProduct) {
    toast("Selecione um produto da lista de busca", "error");
    searchInput.focus();
    return;
  }

  const data = new FormData(form);
  const quantity = Number(data.get("quantity"));
  const type = data.get("type");

  if (type === "OUT" && quantity > selectedProduct.quantity) {
    toast(`Estoque insuficiente. Disponivel: ${selectedProduct.quantity} unidade(s)`, "error");
    return;
  }

  setButtonLoading(submitButton, true, "Registrando...");
  try {
    await api.createMovement({
      productId: selectedProduct.id,
      type,
      quantity,
      note: data.get("note"),
    });
    toast(type === "IN" ? "Entrada registrada" : "Saida registrada");
    form.reset();
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});

if (requireAuth()) loadMovements();
