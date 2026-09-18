import { api } from "./api.js";
import { escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/movimentacoes.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const stockHint = document.querySelector("[data-stock-hint]");
const filterButtons = document.querySelectorAll("[data-filter]");

// Elementos de filtro por data
const fromInput = document.querySelector("[data-filter-from]");
const toInput = document.querySelector("[data-filter-to]");
const dateFilterForm = document.querySelector("[data-date-filter-form]");

let products = [];
let activeFilter = "";

function highlightFilters() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;

    button.className = isActive
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}

function getBadgeAndQuantity(movement) {
  if (movement.type === "IN") {
    return {
      badge: '<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Entrada</span>',
      qtyClass: "text-emerald-600",
      prefix: "+",
    };
  }

  if (movement.type === "OUT") {
    return {
      badge: '<span class="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Saída</span>',
      qtyClass: "text-rose-600",
      prefix: "-",
    };
  }

  return {
    badge: '<span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Ajuste</span>',
    qtyClass: "text-amber-600",
    prefix: "=",
  };
}

function renderRows(movements) {
  if (!movements || movements.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="5" class="px-6 py-10 text-center text-sm text-slate-500">
        Nenhuma movimentação registrada
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = movements
    .map((movement) => {
      const { badge, qtyClass, prefix } = getBadgeAndQuantity(movement);

      return `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3">
            <p class="font-medium text-slate-800">${escapeHtml(movement.productName)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(movement.productSku)}</p>
          </td>
          <td class="px-4 py-3">
            ${badge}
          </td>
          <td class="px-4 py-3 text-right font-semibold ${qtyClass}">
            ${prefix}${movement.quantity}
          </td>
          <td class="px-4 py-3 text-slate-600">${escapeHtml(movement.note ?? "-")}</td>
          <td class="px-6 py-3 text-right text-slate-500">${formatDateTime(movement.createdAt)}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadProducts() {
  const response = await api.listProducts({ perPage: 100 });
  products = response.data ?? response; // Suporta resposta paginada ou lista direta

  form.elements.productId.innerHTML =
    '<option value="">Selecione...</option>' +
    products
      .map(
        (product) =>
          `<option value="${product.id}">${escapeHtml(product.name)} (${escapeHtml(product.sku)})</option>`
      )
      .join("");
}

async function loadMovements() {
  try {
    const filters = {
      type: activeFilter,
      from: fromInput?.value || null,
      to: toInput?.value || null,
    };

    const movements = await api.listMovements(filters);
    renderRows(movements);
  } catch (error) {
    toast(error.message, "error");
  }
}

function updateStockHint() {
  const productId = Number(form.elements.productId.value);
  const product = products.find((item) => item.id === productId);

  stockHint.textContent = product
    ? `Estoque atual: ${product.quantity} unidade(s) - mínimo ${product.minimumStock}`
    : "";
}

form.elements.productId.addEventListener("change", updateStockHint);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    highlightFilters();
    loadMovements();
  });
});

if (dateFilterForm) {
  dateFilterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadMovements();
  });

  dateFilterForm.addEventListener("reset", () => {
    setTimeout(loadMovements, 0);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);

  const payload = {
    productId: Number(data.get("productId")),
    type: data.get("type"),
    quantity: Number(data.get("quantity")),
    note: data.get("note"),
  };

  try {
    await api.createMovement(payload);

    const messages = {
      IN: "Entrada registrada",
      OUT: "Saída registrada",
      ADJUST: "Estoque ajustado com sucesso",
    };

    toast(messages[payload.type] ?? "Movimentação registrada");

    form.reset();
    stockHint.textContent = "";

    await loadProducts();
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
});

async function init() {
  highlightFilters();

  try {
    await loadProducts();
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
}

init();