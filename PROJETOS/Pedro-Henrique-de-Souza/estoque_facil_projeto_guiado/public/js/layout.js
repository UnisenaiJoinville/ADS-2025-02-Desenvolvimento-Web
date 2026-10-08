// Funcoes compartilhadas por todas as telas.

import { getUser, logout } from "./auth.js";

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value.replace(" ", "T"));

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Evita injecao de HTML ao montar tabelas com dados do banco.
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const NAV_ITEMS = [
  { href: "/index.html", label: "Dashboard", icon: "grid" },
  { href: "/produtos.html", label: "Produtos", icon: "box" },
  { href: "/movimentacoes.html", label: "Movimentacoes", icon: "swap" },
  { href: "/categorias.html", label: "Categorias", icon: "tag" },
];

export function renderNav(active) {
  const links = NAV_ITEMS.map((item) => {
    const isActive = item.href === active;

    const classes = isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900";

    return `<a href="${item.href}" class="rounded-lg px-4 py-2 text-sm font-medium transition ${classes}">${item.label}</a>`;
  }).join("");

  return `
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-lg font-bold text-white">EF</div>
          <div>
            <p class="text-base font-semibold text-slate-900">Estoque Facil</p>
            <p class="text-xs text-slate-500">Gestao de estoque</p>
          </div>
        </div>
        <nav class="flex flex-wrap items-center gap-1">${links}</nav>
        ${renderUserBadge()}
      </div>
    </header>
  `;
}

// Mostra quem esta logado e o botao de sair.
function renderUserBadge() {
  const user = getUser();

  if (!user) return "";

  // As iniciais do nome: "Ana Paula Souza" -> "AS"
  const initials = escapeHtml(
    user.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .filter((_, index, all) => index === 0 || index === all.length - 1)
      .join("")
      .toUpperCase()
  );

  return `
    <div class="flex items-center gap-3 border-l border-slate-200 pl-4">
      <div class="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">${initials}</div>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold leading-tight text-slate-900">${escapeHtml(user.name)}</p>
        <p class="text-xs leading-tight text-slate-500">${escapeHtml(user.email)}</p>
      </div>
      <button
        data-logout
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        Sair
      </button>
    </div>
  `;
}

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);

    // O botao so existe depois que o HTML acima foi inserido.
    container.querySelector("[data-logout]")?.addEventListener("click", logout);
  }
}

// Notificacao simples no canto da tela.
export function toast(message, variant = "success") {
  const colors = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-slate-800",
  };

  const element = document.createElement("div");
  element.className = `${colors[variant] ?? colors.info} pointer-events-none translate-y-2 rounded-xl px-4 py-3 text-sm font-medium text-white opacity-0 shadow-lg transition-all duration-200`;
  element.textContent = message;

  const stack = document.querySelector("[data-toast-stack]");
  stack.append(element);

  requestAnimationFrame(() => {
    element.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    element.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => element.remove(), 250);
  }, 3000);
}