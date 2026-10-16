import { api, isAuthenticated } from "./api.js";
import { escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/movimentacoes.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const stockHint = document.querySelector("[data-stock-hint]");
const filterButtons = document.querySelectorAll("[data-filter]");
const periodForm = document.querySelector("[data-period-form]");
const authNotice = document.querySelector("[data-auth-notice]");
const quantityLabel = document.querySelector("[data-quantity-label]");
const quantityHint = document.querySelector("[data-quantity-hint]");

let products = [];
let activeFilter = "";

const TYPE_LABELS = { IN: "Entrada", OUT: "Saida", ADJUST: "Ajuste" };
const TYPE_BADGE_CLASS = {
  IN: "bg-emerald-100 text-emerald-700",
  OUT: "bg-rose-100 text-rose-700",
  ADJUST: "bg-amber-100 text-amber-700",
};

function applyAuthGuard() {
  const authenticated = isAuthenticated();

  authNotice.classList.toggle("hidden", authenticated);

  document.querySelectorAll("[data-requires-auth]").forEach((element) => {
    element.classList.toggle("hidden", !authenticated);
  });
}

function highlightFilters() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;

    button.className = isActive
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}

function formatQuantity(movement) {
  // Exercicio 2.3 — ADJUST grava a DIFERENCA (pode ser negativa ou zero).
  if (movement.type === "ADJUST") {
    const sign = movement.quantity > 0 ? "+" : "";
    return `${sign}${movement.quantity}`;
  }

  return `${movement.type === "IN" ? "+" : "-"}${movement.quantity}`;
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
      const badgeClass = TYPE_BADGE_CLASS[movement.type] ?? "bg-slate-100 text-slate-600";
      const quantityClass =
        movement.type === "OUT" || (movement.type === "ADJUST" && movement.quantity < 0)
          ? "text-rose-600"
          : "text-emerald-600";

      return `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3">
            <p class="font-medium text-slate-800">${escapeHtml(movement.productName)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(movement.productSku)}</p>
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}">
              ${TYPE_LABELS[movement.type] ?? movement.type}
            </span>
          </td>
          <td class="px-4 py-3 text-right font-semibold ${quantityClass}">${formatQuantity(movement)}</td>
          <td class="px-4 py-3 text-slate-600">${escapeHtml(movement.note ?? "-")}</td>
          <td class="px-6 py-3 text-right text-slate-500">${formatDateTime(movement.createdAt)}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadProducts() {
  products = (await api.listProducts({ perPage: 500 })).data;

  form.elements.productId.innerHTML =
    '<option value="">Selecione...</option>' +
    products
      .map(
        (product) =>
          `<option value="${product.id}">${escapeHtml(product.name)} (${escapeHtml(product.sku)})</option>`
      )
      .join("");
}

function currentPeriod() {
  const data = new FormData(periodForm);
  return { from: data.get("from") || null, to: data.get("to") || null };
}

async function loadMovements() {
  try {
    const movements = await api.listMovements({ type: activeFilter, ...currentPeriod() });
    renderRows(movements);
  } catch (error) {
    toast(error.message, "error");
  }
}

function updateStockHint() {
  const productId = Number(form.elements.productId.value);
  const product = products.find((item) => item.id === productId);
  const type = form.elements.type.value;

  stockHint.textContent = product
    ? `Estoque atual: ${product.quantity} unidade(s) - minimo ${product.minimumStock}`
    : "";

  // Exercicio 2.3 — no ajuste, o rotulo muda para deixar claro que o
  // numero informado e a CONTAGEM, nao a quantidade movimentada.
  if (type === "ADJUST") {
    quantityLabel.textContent = "Quantidade contada (novo total)";
    quantityHint.textContent = "Informe o total real encontrado no inventario.";
    form.elements.quantity.min = "0";
  } else {
    quantityLabel.textContent = "Quantidade";
    quantityHint.textContent = "";
    form.elements.quantity.min = "1";
  }
}

form.elements.productId.addEventListener("change", updateStockHint);
form.querySelectorAll('input[name="type"]').forEach((input) => {
  input.addEventListener("change", updateStockHint);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    highlightFilters();
    loadMovements();
  });
});

periodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadMovements();
});

periodForm.addEventListener("reset", () => {
  setTimeout(loadMovements, 0);
});

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

    toast(
      payload.type === "IN"
        ? "Entrada registrada"
        : payload.type === "OUT"
          ? "Saida registrada"
          : "Ajuste registrado"
    );

    form.reset();
    form.elements.type.value = "IN";
    stockHint.textContent = "";

    // Recarrega os produtos para refletir o novo saldo no seletor.
    await loadProducts();
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
});

async function init() {
  applyAuthGuard();
  highlightFilters();

  try {
    await loadProducts();
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
}

init();
