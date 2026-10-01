import { api } from "./api.js";
import { currency, escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/index.html");

const cardsContainer = document.querySelector("[data-cards]");
const monthContainer = document.querySelector("[data-month]");
const byCategoryContainer = document.querySelector("[data-by-category]");
const lowStockContainer = document.querySelector("[data-low-stock]");
const recentContainer = document.querySelector("[data-recent]");
function card({ label, value, hint, accent }) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm font-medium text-slate-500">${label}</p>
        <span class="h-2.5 w-2.5 rounded-full ${accent}"></span>
      </div>
      <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">${value}</p>
      <p class="mt-1 text-xs text-slate-500">${hint}</p>
    </article>
  `;
}
function renderCards(totals) {
  cardsContainer.innerHTML = [
    card({
      label: "Produtos ativos",
      value: totals.totalProducts,
      hint: `${totals.totalUnits} unidades em estoque`,
      accent: "bg-slate-900",
    }),
    card({
      label: "Valor de custo",
      value: currency.format(totals.stockCostValue),
      hint: "Capital investido no estoque",
      accent: "bg-sky-500",
    }),
    card({
      label: "Valor de venda",
      value: currency.format(totals.stockSaleValue),
      hint: `Lucro potencial de ${currency.format(totals.potentialProfit)}`,
      accent: "bg-emerald-500",
    }),
    card({
      label: "Estoque baixo",
      value: totals.lowStockCount,
      hint: `${totals.outOfStockCount} produto(s) zerado(s)`,
      accent: totals.lowStockCount > 0 ? "bg-rose-500" : "bg-emerald-500",
    }),
  ].join("");
}
function renderMonth(month) {
  const balanceIsPositive = month.balance >= 0;

  monthContainer.innerHTML = `
    <article class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p class="text-sm font-medium text-emerald-700">Entradas do mes</p>
      <p class="mt-2 text-3xl font-bold text-emerald-700">+ ${month.unitsIn}</p>
      <p class="mt-1 text-xs text-emerald-600">unidades que entraram</p>
    </article>
    <article class="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <p class="text-sm font-medium text-rose-700">Saidas do mes</p>
      <p class="mt-2 text-3xl font-bold text-rose-700">- ${month.unitsOut}</p>
      <p class="mt-1 text-xs text-rose-600">unidades que sairam</p>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <p class="text-sm font-medium text-slate-500">Saldo do mes</p>
      <p class="mt-2 text-3xl font-bold ${balanceIsPositive ? "text-emerald-600" : "text-rose-600"}">
        ${balanceIsPositive ? "+" : ""}${month.balance}
      </p>
      <p class="mt-1 text-xs text-slate-500">entradas menos saidas</p>
    </article>
  `;
}
function renderByCategory(rows) {
  if (rows.length === 0) {
    byCategoryContainer.innerHTML = emptyState("Nenhum produto cadastrado");
    return;
  }

  const maxValue = Math.max(...rows.map((row) => row.costValue), 1);

  byCategoryContainer.innerHTML = rows
    .map((row) => {
      const percentage = Math.round((row.costValue / maxValue) * 100);

      return `
        <div>
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="font-medium text-slate-700">${escapeHtml(row.categoryName)}</span>
            <span class="text-slate-500">${currency.format(row.costValue)}</span>
          </div>
          <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-slate-900" style="width: ${percentage}%"></div>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            ${row.productCount} produto(s) - ${row.units} unidades
          </p>
        </div>
      `;
    })
    .join("");
}
function renderLowStock(rows) {
  if (rows.length === 0) {
    lowStockContainer.innerHTML = emptyState("Nenhum produto abaixo do minimo");
    return;
  }

  lowStockContainer.innerHTML = rows
    .map(
      (row) => `
        <div class="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-slate-800">${escapeHtml(row.name)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(row.sku)}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-rose-600">${row.quantity} un.</p>
            <p class="text-xs text-slate-500">minimo ${row.minimumStock}</p>
          </div>
        </div>
      `
    )
    .join("");
}
function renderRecent(rows) {
  if (rows.length === 0) {
    recentContainer.innerHTML = `
      <tr><td colspan="4" class="py-6 text-center text-sm text-slate-500">
        Nenhuma movimentacao registrada
      </td></tr>`;
    return;
  }

  recentContainer.innerHTML = rows
    .map((row) => {
      const isIn = row.type === "IN";

      return `
        <tr>
          <td class="py-3 pr-4">
            <p class="font-medium text-slate-800">${escapeHtml(row.productName)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(row.productSku)}</p>
          </td>
          <td class="py-3 pr-4">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${
              isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }">${isIn ? "Entrada" : "Saida"}</span>
          </td>
          <td class="py-3 pr-4 text-right font-semibold ${
            isIn ? "text-emerald-600" : "text-rose-600"
          }">${isIn ? "+" : "-"}${row.quantity}</td>
          <td class="py-3 text-right text-slate-500">${formatDateTime(row.createdAt)}</td>
        </tr>
      `;
    })
    .join("");
}
function emptyState(message) {
  return `<p class="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">${message}</p>`;
}

async function loadDashboard() {
  try {
    const data = await api.getDashboard();

    renderCards(data.totals);
    renderMonth(data.month);
    renderByCategory(data.byCategory);
    renderLowStock(data.lowStock);
    renderRecent(data.recentMovements);
  } catch (error) {
    toast(error.message, "error");
  }
}

document.querySelector("[data-reload]").addEventListener("click", () => {
  loadDashboard();
  toast("Dashboard atualizado", "info");
});

loadDashboard();
