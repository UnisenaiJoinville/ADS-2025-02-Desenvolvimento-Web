import { api } from "./api.js";
import { currency, escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/index.html");
const cards = document.querySelector("[data-cards]");
const month = document.querySelector("[data-month]");
const byCategory = document.querySelector("[data-by-category]");
const lowStock = document.querySelector("[data-low-stock]");
const recent = document.querySelector("[data-recent]");

const card = (label, value, hint) => `<article class="rounded-2xl border bg-white p-5"><p class="text-sm text-slate-500">${label}</p><p class="mt-2 text-3xl font-bold">${value}</p><p class="mt-1 text-xs text-slate-500">${hint}</p></article>`;
function render(data) {
  const t = data.totals;
  cards.innerHTML = [card("Produtos ativos", t.totalProducts, `${t.totalUnits} unidades em estoque`), card("Valor de custo", currency.format(t.stockCostValue), "Capital investido"), card("Valor de venda", currency.format(t.stockSaleValue), `Lucro potencial de ${currency.format(t.potentialProfit)}`), card("Estoque baixo", t.lowStockCount, `${t.outOfStockCount} produto(s) zerado(s)`)].join("");
  month.innerHTML = [card("Entradas do mes", `+${data.month.unitsIn}`, "unidades que entraram"), card("Saidas do mes", `-${data.month.unitsOut}`, "unidades que sairam"), card("Saldo do mes", `${data.month.balance >= 0 ? "+" : ""}${data.month.balance}`, "entradas menos saidas")].join("");
  const max = Math.max(...data.byCategory.map((row) => row.costValue), 1);
  byCategory.innerHTML = data.byCategory.length ? data.byCategory.map((row) => `<div><div class="flex justify-between text-sm"><span>${escapeHtml(row.categoryName)}</span><span>${currency.format(row.costValue)}</span></div><div class="mt-2 h-2 rounded-full bg-slate-100"><div class="h-full rounded-full bg-slate-900" style="width:${Math.round(row.costValue / max * 100)}%"></div></div><p class="mt-1 text-xs text-slate-500">${row.productCount} produto(s) - ${row.units} unidades</p></div>`).join("") : "<p class='text-sm text-slate-500'>Nenhum produto cadastrado</p>";
  lowStock.innerHTML = data.lowStock.length ? data.lowStock.map((row) => `<div class="flex justify-between rounded-xl bg-rose-50 px-4 py-3"><div><p class="font-semibold">${escapeHtml(row.name)}</p><p class="text-xs text-slate-500">${escapeHtml(row.sku)}</p></div><strong class="text-rose-600">${row.quantity} / min ${row.minimumStock}</strong></div>`).join("") : "<p class='text-sm text-slate-500'>Nenhum produto abaixo do minimo</p>";
  recent.innerHTML = data.recentMovements.length ? data.recentMovements.map((row) => `<tr><td class="py-3">${escapeHtml(row.productName)}<small class="block text-xs text-slate-500">${escapeHtml(row.productSku)}</small></td><td>${row.type === "IN" ? "Entrada" : "Saida"}</td><td class="text-right ${row.type === "IN" ? "text-emerald-600" : "text-rose-600"}">${row.type === "IN" ? "+" : "-"}${row.quantity}</td><td class="text-right text-slate-500">${formatDateTime(row.createdAt)}</td></tr>`).join("") : "<tr><td colspan='4' class='py-6 text-center text-sm text-slate-500'>Nenhuma movimentacao registrada</td></tr>";
}
async function load() { try { render(await api.getDashboard()); } catch (error) { toast(error.message, "error"); } }
document.querySelector("[data-reload]").addEventListener("click", () => { load(); toast("Dashboard atualizado", "info"); });
load();
