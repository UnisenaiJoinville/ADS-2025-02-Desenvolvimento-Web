export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(String(value).replace(" ", "T")).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const NAV_ITEMS = [
  ["/index.html", "Dashboard"],
  ["/produtos.html", "Produtos"],
  ["/movimentacoes.html", "Movimentacoes"],
  ["/categorias.html", "Categorias"],
];

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");
  if (!container) return;
  container.innerHTML = `<header class="border-b border-slate-200 bg-white"><div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4"><a href="/" class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 font-bold text-white">EF</span><span><strong class="block text-base">Estoque Facil</strong><small class="text-xs text-slate-500">Gestao de estoque</small></span></a><nav class="flex flex-wrap gap-1">${NAV_ITEMS.map(([href, label]) => `<a href="${href}" class="rounded-lg px-4 py-2 text-sm font-medium ${href === activeHref ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}">${label}</a>`).join("")}</nav></div></header>`;
}

export function toast(message, variant = "success") {
  const stack = document.querySelector("[data-toast-stack]");
  if (!stack) return;
  const element = document.createElement("div");
  element.className = `rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${variant === "error" ? "bg-rose-600" : variant === "info" ? "bg-slate-800" : "bg-emerald-600"}`;
  element.textContent = message;
  stack.append(element);
  setTimeout(() => element.remove(), 3000);
}
