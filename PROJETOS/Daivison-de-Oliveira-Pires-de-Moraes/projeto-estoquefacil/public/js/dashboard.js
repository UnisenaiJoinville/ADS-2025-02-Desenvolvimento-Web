import { renderIcons } from "./icons.js";
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import {
  currency,
  escapeHtml,
  formatDateTime,
  mountLayout,
  toast,
} from "./layout.js";

mountLayout("/index.html");

const cardsContainer = document.querySelector("[data-cards]");
const monthContainer = document.querySelector("[data-month]");
const byCategoryContainer = document.querySelector("[data-by-category]");
const lowStockContainer = document.querySelector("[data-low-stock]");
const recentContainer = document.querySelector("[data-recent]");

function card({ label, value, hint, accent, icon = "package" }) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="flex items-start justify-between gap-3">
        <p class="flex items-center gap-2 text-sm font-medium text-slate-500"><i data-lucide="${icon}"></i>${label}</p>
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
      icon: "wallet",
      value: currency.format(totals.stockCostValue),
      hint: "Capital investido no estoque",
      accent: "bg-sky-500",
    }),
    card({
      label: "Valor de venda",
      icon: "trending-up",
      value: currency.format(totals.stockSaleValue),
      hint: `Lucro potencial de ${currency.format(totals.potentialProfit)}`,
      accent: "bg-emerald-500",
    }),
    card({
      label: "Estoque baixo",
      icon: "triangle-alert",
      value: totals.lowStockCount,
      hint: `${totals.outOfStockCount} produto(s) zerado(s)`,
      accent: totals.lowStockCount > 0 ? "bg-rose-500" : "bg-emerald-500",
    }),
    card({
      label: "Preco medio de venda",
      value: currency.format(totals.averageSalePrice),
      hint: "Media dos produtos ativos",
      accent: "bg-sky-500",
      icon: "badge-dollar-sign",
    }),
  ].join("");
  renderIcons();
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
      <p class="mt-2 text-3xl font-bold ${
        balanceIsPositive ? "text-emerald-600" : "text-rose-600"
      }">
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
            <span class="font-medium text-slate-700">
              ${escapeHtml(row.categoryName)}
            </span>

            <span class="text-slate-500">
              ${currency.format(row.costValue)}
            </span>
          </div>

          <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-slate-900"
              style="width: ${percentage}%"
            ></div>
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
            <p class="text-sm font-semibold text-slate-800">
              ${escapeHtml(row.name)}
            </p>

            <p class="text-xs text-slate-500">
              ${escapeHtml(row.sku)}
            </p>
          </div>

          <div class="text-right">
            <p class="text-sm font-bold text-rose-600">
              ${row.quantity} un.
            </p>

            <p class="text-xs text-slate-500">
              minimo ${row.minimumStock}
            </p>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderRecent(rows) {
  if (rows.length === 0) {
    recentContainer.innerHTML = `
      <tr>
        <td colspan="4" class="py-6 text-center text-sm text-slate-500">
          Nenhuma movimentacao registrada
        </td>
      </tr>`;
    return;
  }

  recentContainer.innerHTML = rows
    .map((row) => {
      const isIn = row.type === "IN";

      return `
        <tr>
          <td class="py-3 pr-4">
            <p class="font-medium text-slate-800">
              ${escapeHtml(row.productName)}
            </p>

            <p class="text-xs text-slate-500">
              ${escapeHtml(row.productSku)}
            </p>
          </td>

          <td class="py-3 pr-4">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${
              isIn
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }">
              ${row.type === "ADJUST" ? "Ajuste" : isIn ? "Entrada" : "Saida"}
            </span>
          </td>

          <td class="py-3 pr-4 text-right font-semibold ${
            isIn ? "text-emerald-600" : "text-rose-600"
          }">
            ${row.type === "ADJUST" ? "=" : isIn ? "+" : "-"}${row.quantity}
          </td>

          <td class="py-3 text-right text-slate-500">
            ${formatDateTime(row.createdAt)}
          </td>
        </tr>
      `;
    })
    .join("");
}

function emptyState(message) {
  return `
    <p class="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      ${message}
    </p>
  `;
}

async function loadDashboard() {
  cardsContainer.innerHTML = Array.from(
    { length: 5 },
    () =>
      '<div class="animate-pulse rounded-2xl bg-slate-200 p-8" aria-label="Carregando indicador"><div class="h-16"></div></div>',
  ).join("");
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
  loadChart();
  toast("Dashboard atualizado", "info");
});

// Protege o dashboard.
// Se nao houver sessao, o usuario sera enviado para o login.
if (requireAuth()) {
  loadDashboard();
}
let chart = null,
  chartSequence = 0;
async function loadChart() {
  const sequence = ++chartSequence;
  try {
    const rows = await api.getDailyMovements(
      Number(document.querySelector("[data-chart-days]").value),
    );
    if (sequence !== chartSequence) return;
    document.querySelector("[data-chart-summary]").textContent =
      `${rows.length} dias: ${rows.reduce((s, r) => s + r.unitsIn, 0)} entradas e ${rows.reduce((s, r) => s + r.unitsOut, 0)} saidas (ajustes de inventario ficam no historico).`;
    if (!window.Chart) return;
    const data = {
      labels: rows.map((r) => r.day.slice(8, 10) + "/" + r.day.slice(5, 7)),
      datasets: [
        {
          label: "Entradas",
          data: rows.map((r) => r.unitsIn),
          backgroundColor: "#059669",
        },
        {
          label: "Saidas",
          data: rows.map((r) => r.unitsOut),
          backgroundColor: "#e11d48",
        },
      ],
    };
    if (chart) {
      chart.data = data;
      chart.update();
    } else
      chart = new Chart(document.querySelector("[data-chart]"), {
        type: "bar",
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? false
            : { duration: 300 },
          scales: { y: { beginAtZero: true } },
        },
      });
    applyChartTheme(true);
  } catch (e) {
    toast(e.message, "error");
  }
}
document
  .querySelector("[data-chart-days]")
  .addEventListener("change", loadChart);
if (requireAuth()) loadChart();

function applyChartTheme(animate = false) {
  if (!chart) return;
  const dark = document.documentElement.classList.contains("dark");
  const color = dark ? "#cbd5e1" : "#475569",
    grid = dark ? "#334155" : "#e2e8f0";
  chart.options.plugins.legend.labels.color = color;
  for (const axis of ["x", "y"]) {
    chart.options.scales[axis].ticks.color = color;
    chart.options.scales[axis].grid.color = grid;
  }
  chart.update(animate ? undefined : "none");
}
window.addEventListener("themechange", () => applyChartTheme(false));
