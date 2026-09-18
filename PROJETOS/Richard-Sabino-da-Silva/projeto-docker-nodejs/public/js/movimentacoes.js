import { api } from "./api.js";
import { escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/movimentacoes.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const stockHint = document.querySelector("[data-stock-hint]");
const filterButtons = document.querySelectorAll("[data-filter]");

let products = [];
let activeFilter = "";
function highlightFilters() {
    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === activeFilter;
  
      button.className = isActive
        ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
        : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
    });
  }function renderRows(movements) {
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
  async function loadProducts() {
    products = await api.listProducts();
  
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
      const movements = await api.listMovements({ type: activeFilter });
      renderRows(movements);
    } catch (error) {
      toast(error.message, "error");
    }
  }
  function updateStockHint() {
    const productId = Number(form.elements.productId.value);
    const product = products.find((item) => item.id === productId);
  
    stockHint.textContent = product
      ? `Estoque atual: ${product.quantity} unidade(s) - minimo ${product.minimumStock}`
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
  
      toast(payload.type === "IN" ? "Entrada registrada" : "Saida registrada");
  
      form.reset();
      stockHint.textContent = "";
  
      // Recarrega os produtos para refletir o novo saldo no seletor.
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