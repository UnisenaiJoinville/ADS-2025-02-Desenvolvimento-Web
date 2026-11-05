import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/index.html");

const cardsContainer = document.querySelector("[data-cards]");
const monthContainer = document.querySelector("[data-month]");
const byCategoryContainer = document.querySelector("[data-by-category]");
const lowStockContainer = document.querySelector("[data-low-stock]");
const recentContainer = document.querySelector("[data-recent]");

// Grafico de entradas e saidas por dia (Aula 68)
const chartCanvas = document.querySelector("[data-chart]");
const chartSummary = document.querySelector("[data-chart-summary]");
const daysButtons = document.querySelectorAll("[data-days]");

let chart = null;     // a instancia do Chart.js (criada uma vez so)
let chartDays = 30;   // o periodo escolhido

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

// ------------------------------------------------------------
// Grafico (Aula 68)
// ------------------------------------------------------------

// "2026-10-14" -> "14/10". Cortar o texto evita o new Date() e,
// com ele, qualquer chance de o fuso horario trocar o dia.
function formatDay(isoDay) {
  const [, month, day] = isoDay.split("-");

  return `${day}/${month}`;
}

function highlightDaysButtons() {
  daysButtons.forEach((button) => {
    const isActive = Number(button.dataset.days) === chartDays;

    button.setAttribute("aria-pressed", String(isActive));
    button.className = isActive
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}

function renderChart(rows) {
  // CDN fora do ar: o resto do dashboard continua funcionando.
  if (!window.Chart) {
    chartSummary.classList.remove("sr-only");
    chartSummary.textContent = "Nao foi possivel carregar o grafico.";
    return;
  }

  const labels = rows.map((row) => formatDay(row.day));
  const unitsIn = rows.map((row) => row.unitsIn);
  const unitsOut = rows.map((row) => row.unitsOut);

  if (chart) {
    // O grafico ja existe: so troca os dados e manda redesenhar.
    chart.data.labels = labels;
    chart.data.datasets[0].data = unitsIn;
    chart.data.datasets[1].data = unitsOut;
    chart.update();
  } else {
    chart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          // As mesmas cores dos cards de entrada (emerald) e saida (rose).
          { label: "Entradas", data: unitsIn, backgroundColor: "#10b981", borderRadius: 4 },
          { label: "Saidas", data: unitsOut, backgroundColor: "#f43f5e", borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        // Obedece a altura do <div class="h-72">, em vez de inventar uma.
        maintainAspectRatio: false,
        // Passar o mouse num dia mostra entradas E saidas daquele dia.
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y} un.`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            // Com 90 dias nao cabem 90 rotulos: o Chart.js pula alguns.
            ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          },
          y: {
            beginAtZero: true,
            // Unidades sao inteiras: nada de "2,5" no eixo.
            ticks: { precision: 0 },
          },
        },
      },
    });
  }

  const totalIn = unitsIn.reduce((sum, value) => sum + value, 0);
  const totalOut = unitsOut.reduce((sum, value) => sum + value, 0);

  chartSummary.textContent =
    `Nos ultimos ${rows.length} dias entraram ${totalIn} unidades e sairam ${totalOut}.`;
}

async function loadChart() {
  try {
    const rows = await api.getDailyMovements(chartDays);
    renderChart(rows);
  } catch (error) {
    toast(error.message, "error");
  }
}

daysButtons.forEach((button) => {
  button.addEventListener("click", () => {
    chartDays = Number(button.dataset.days);
    highlightDaysButtons();
    loadChart();
  });
});

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
  loadChart();
  toast("Dashboard atualizado", "info");
});

// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  highlightDaysButtons();
  loadDashboard();
  loadChart();
}
