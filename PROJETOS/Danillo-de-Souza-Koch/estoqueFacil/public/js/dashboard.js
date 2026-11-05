import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/index.html");

const cards = document.querySelector("[data-cards]");
const month = document.querySelector("[data-month]");
const byCategory = document.querySelector("[data-by-category]");
const lowStock = document.querySelector("[data-low-stock]");
const recent = document.querySelector("[data-recent]");
const chartCanvas = document.querySelector("[data-chart]");
const chartSummary = document.querySelector("[data-chart-summary]");
const chartError = document.querySelector("[data-chart-error]");
const daysButtons = document.querySelectorAll("[data-days]");

let chart = null;
let chartDays = 30;

const card = (label, value, hint) => `<article class="rounded-2xl border bg-white p-5"><p class="text-sm text-slate-500">${label}</p><p class="mt-2 text-3xl font-bold">${value}</p><p class="mt-1 text-xs text-slate-500">${hint}</p></article>`;

function render(data) {
  const totals = data.totals;
  cards.innerHTML = [
    card("Produtos ativos", totals.totalProducts, `${totals.totalUnits} unidades em estoque`),
    card("Valor de custo", currency.format(totals.stockCostValue), "Capital investido"),
    card("Valor de venda", currency.format(totals.stockSaleValue), `Lucro potencial de ${currency.format(totals.potentialProfit)}`),
    card("Estoque baixo", totals.lowStockCount, `${totals.outOfStockCount} produto(s) zerado(s)`),
  ].join("");

  month.innerHTML = [
    card("Entradas do mes", `+${data.month.unitsIn}`, "unidades que entraram"),
    card("Saidas do mes", `-${data.month.unitsOut}`, "unidades que sairam"),
    card("Saldo do mes", `${data.month.balance >= 0 ? "+" : ""}${data.month.balance}`, "entradas menos saidas"),
  ].join("");

  const max = Math.max(...data.byCategory.map((row) => row.costValue), 1);
  byCategory.innerHTML = data.byCategory.length
    ? data.byCategory.map((row) => `<div>
        <div class="flex justify-between text-sm"><span>${escapeHtml(row.categoryName)}</span><span>${currency.format(row.costValue)}</span></div>
        <div class="mt-2 h-2 rounded-full bg-slate-100"><div class="h-full rounded-full bg-slate-900" style="width:${Math.round(row.costValue / max * 100)}%"></div></div>
        <p class="mt-1 text-xs text-slate-500">${row.productCount} produto(s) - ${row.units} unidades</p>
      </div>`).join("")
    : "<p class='text-sm text-slate-500'>Nenhum produto cadastrado</p>";

  lowStock.innerHTML = data.lowStock.length
    ? data.lowStock.map((row) => `<div class="flex justify-between rounded-xl bg-rose-50 px-4 py-3">
        <div><p class="font-semibold">${escapeHtml(row.name)}</p><p class="text-xs text-slate-500">${escapeHtml(row.sku)}</p></div>
        <strong class="text-rose-600">${row.quantity} / min ${row.minimumStock}</strong>
      </div>`).join("")
    : "<p class='text-sm text-slate-500'>Nenhum produto abaixo do minimo</p>";

  recent.innerHTML = data.recentMovements.length
    ? data.recentMovements.map((row) => `<tr>
        <td class="py-3">${escapeHtml(row.productName)}<small class="block text-xs text-slate-500">${escapeHtml(row.productSku)}</small></td>
        <td>${row.type === "IN" ? "Entrada" : "Saida"}</td>
        <td class="text-right ${row.type === "IN" ? "text-emerald-600" : "text-rose-600"}">${row.type === "IN" ? "+" : "-"}${row.quantity}</td>
        <td class="text-right text-slate-500">${formatDateTime(row.createdAt)}</td>
      </tr>`).join("")
    : "<tr><td colspan='4' class='py-6 text-center text-sm text-slate-500'>Nenhuma movimentacao registrada</td></tr>";
}

function formatDay(isoDay) {
  const [, monthNumber, day] = isoDay.split("-");
  return `${day}/${monthNumber}`;
}

function highlightDaysButtons() {
  daysButtons.forEach((button) => {
    const active = Number(button.dataset.days) === chartDays;
    button.setAttribute("aria-pressed", String(active));
    button.className = active
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}

function renderChart(rows) {
  if (!window.Chart) {
    chartError.textContent = "Nao foi possivel carregar a biblioteca do grafico.";
    chartError.classList.remove("hidden");
    chartSummary.classList.remove("sr-only");
    chartSummary.textContent = chartError.textContent;
    return;
  }

  chartError.classList.add("hidden");
  const labels = rows.map((row) => formatDay(row.day));
  const unitsIn = rows.map((row) => row.unitsIn);
  const unitsOut = rows.map((row) => row.unitsOut);
  const totalIn = unitsIn.reduce((sum, value) => sum + value, 0);
  const totalOut = unitsOut.reduce((sum, value) => sum + value, 0);
  chartSummary.textContent = `Nos ultimos ${chartDays} dias: ${totalIn} unidades de entrada e ${totalOut} unidades de saida.`;

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = unitsIn;
    chart.data.datasets[1].data = unitsOut;
    chart.update();
    return;
  }

  chart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Entradas", data: unitsIn, backgroundColor: "#10b981", borderRadius: 4 },
        { label: "Saidas", data: unitsOut, backgroundColor: "#f43f5e", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: { enabled: true },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

async function loadDashboard() {
  try {
    render(await api.getDashboard());
  } catch (error) {
    toast(error.message, "error");
  }
}

async function loadChart() {
  highlightDaysButtons();
  chartError.classList.add("hidden");

  try {
    renderChart(await api.getDailyMovements(chartDays));
  } catch (error) {
    chartError.textContent = error.message;
    chartError.classList.remove("hidden");
    toast(error.message, "error");
  }
}

daysButtons.forEach((button) => button.addEventListener("click", () => {
  chartDays = Number(button.dataset.days);
  loadChart();
}));

document.querySelector("[data-reload]").addEventListener("click", () => {
  void loadDashboard();
  void loadChart();
  toast("Dashboard atualizado", "info");
});

if (requireAuth()) {
  void loadDashboard();
  void loadChart();
}
