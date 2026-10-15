import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

async function loadDashboard() {
  try {
    const data = await api.getDashboard();
    
    if (!data) return;

    // 1. Renderiza os Cards Principais (Injeção dinâmica em data-cards usando as chaves reais: data.totals)
    const cardsContainer = document.querySelector("[data-cards]");
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Produtos Ativos</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">` + (data.totals?.totalProducts ?? 0) + `</p>
          <p class="mt-1 text-xs text-slate-400">` + (data.totals?.totalUnits ?? 0) + ` unidades em estoque</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Custo Total</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">` + currency.format(data.totals?.stockCostValue ?? 0) + `</p>
          <p class="mt-1 text-xs text-slate-400">Investimento imobilizado</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Valor de Venda Potencial</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">` + currency.format(data.totals?.stockSaleValue ?? 0) + `</p>
          <p class="mt-1 text-xs text-slate-400">Faturamento estimado (Lucro: ` + currency.format(data.totals?.potentialProfit ?? 0) + `)</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Produtos com Estoque Baixo</p>
          <p class="mt-2 text-3xl font-bold text-rose-600">` + (data.totals?.lowStockCount ?? 0) + `</p>
          <p class="mt-1 text-xs text-slate-400">` + (data.totals?.outOfStockCount ?? 0) + ` produto(s) zerado(s)</p>
        </div>
      `;
    }

    // 2. Renderiza o resumo financeiro do mês (Injeção dinâmica em data-month usando as chaves reais: data.month)
    const monthContainer = document.querySelector("[data-month]");
    if (monthContainer) {
      const totalIn = data.month?.unitsIn ?? 0;
      const totalOut = data.month?.unitsOut ?? 0;
      const balance = data.month?.balance ?? 0;

      monthContainer.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Entradas do Mês</p>
          <p class="mt-2 text-2xl font-bold text-emerald-600">+ ` + totalIn + ` un.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Saídas do Mês</p>
          <p class="mt-2 text-2xl font-bold text-rose-600">- ` + totalOut + ` un.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Saldo Operacional</p>
          <p class="mt-2 text-2xl font-bold ` + (balance >= 0 ? "text-emerald-600" : "text-rose-600") + `">
            ` + (balance >= 0 ? "+ " + balance : balance) + ` un.
          </p>
        </div>
      `;
    }

    // 3. Renderiza a lista de estoque por categoria (data-by-category usando as chaves reais: data.byCategory)
    const categoryContainer = document.querySelector("[data-by-category]");
    if (categoryContainer) {
      if (!data.byCategory || data.byCategory.length === 0) {
        categoryContainer.innerHTML = '<p class="text-sm text-slate-400 py-2">Nenhuma categoria registrada.</p>';
      } else {
        categoryContainer.innerHTML = data.byCategory.map(cat => `
          <div class="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-0">
            <div>
              <p class="font-medium text-slate-900">` + escapeHtml(cat.categoryName) + `</p>
              <p class="text-xs text-slate-500">` + cat.productCount + ` produto(s) - ` + cat.units + ` unidades</p>
            </div>
            <p class="font-semibold text-slate-900">` + currency.format(cat.costValue) + `</p>
          </div>
        `).join("");
      }
    }

    // 4. Renderiza a lista de estoque baixo (data-low-stock usando as chaves reais: data.lowStock)
    const lowStockContainer = document.querySelector("[data-low-stock]");
    if (lowStockContainer) {
      if (!data.lowStock || data.lowStock.length === 0) {
        lowStockContainer.innerHTML = '<p class="text-sm text-slate-400 py-2">Nenhum produto abaixo do mínimo.</p>';
      } else {
        lowStockContainer.innerHTML = data.lowStock.map(item => `
          <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
            <div>
              <p class="font-medium text-slate-900">` + escapeHtml(item.name) + `</p>
              <p class="text-xs text-slate-400">SKU: ` + escapeHtml(item.sku) + `</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-rose-600">` + item.quantity + ` un.</p>
              <p class="text-xs text-slate-400">mínimo ` + item.minimumStock + `</p>
            </div>
          </div>
        `).join("");
      }
    }

    // 5. Renderiza a tabela de últimas movimentações (data-recent usando as chaves reais: data.recentMovements)
    const recentContainer = document.querySelector("[data-recent]");
    if (recentContainer) {
      if (!data.recentMovements || data.recentMovements.length === 0) {
        recentContainer.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-sm text-slate-400 py-4">Nenhuma movimentação recente encontrada.</td>
          </tr>
        `;
      } else {
        recentContainer.innerHTML = data.recentMovements.map(mov => `
          <tr class="text-sm text-slate-700 hover:bg-slate-50/50">
            <td class="py-3 pr-4 font-medium text-slate-900">` + escapeHtml(mov.productName) + `</td>
            <td class="py-3 pr-4">
              <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ` + (mov.type === "IN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200") + `">
                ` + (mov.type === "IN" ? "Entrada" : "Saída") + `
              </span>
            </td>
            <td class="py-3 pr-4 text-right font-semibold ` + (mov.type === "IN" ? "text-emerald-600" : "text-rose-600") + `">
              ` + (mov.type === "IN" ? "+" + mov.quantity : "-" + mov.quantity) + `
            </td>
            <td class="py-3 text-right text-xs text-slate-400">` + formatDateTime(mov.createdAt) + `</td>
          </tr>
        `).join("");
      }
    }

  } catch (error) {
    toast(error.message, "error");
  }
}

if (requireAuth()) {
  mountLayout("/index.html");
  loadDashboard();
  
  document.querySelector("[data-reload]")?.addEventListener("click", loadDashboard);
}
