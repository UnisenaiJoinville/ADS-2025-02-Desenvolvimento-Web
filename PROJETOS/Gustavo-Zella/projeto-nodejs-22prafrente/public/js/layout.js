// Funcoes compartilhadas por todas as telas.
import { clearSession, getCurrentUser } from "./api.js";

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
  { href: "/index.html", label: "Dashboard" },
  { href: "/produtos.html", label: "Produtos" },
  { href: "/movimentacoes.html", label: "Movimentacoes" },
  { href: "/categorias.html", label: "Categorias" },
];

export function renderNav(active) {
  const links = NAV_ITEMS.map((item) => {
    const isActive = item.href === active;

    const classes = isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900";

    return `<a href="${item.href}" class="rounded-lg px-4 py-2 text-sm font-medium transition ${classes}">${item.label}</a>`;
  }).join("");

  const user = getCurrentUser();

  const userArea = user
    ? `
      <div class="flex items-center gap-3">
        <span class="hidden text-sm text-slate-500 sm:inline">${escapeHtml(user.name)}</span>
        <button
          data-logout
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >Sair</button>
      </div>`
    : `<a href="/login.html" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Entrar</a>`;

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
        ${userArea}
      </div>
    </header>
  `;
}

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);

    container.querySelector("[data-logout]")?.addEventListener("click", () => {
      clearSession();
      window.location.href = "/login.html";
    });
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

// Exercicio 1.4 — modal de confirmacao no padrao visual do sistema,
// substituindo window.confirm(). Devolve uma Promise<boolean>.
let confirmResolver = null;

function ensureConfirmDialog() {
  if (document.querySelector("[data-confirm-dialog]")) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-confirm-dialog
      class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/50 p-4"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
        <p data-confirm-message class="text-sm text-slate-700"></p>
        <div class="mt-5 flex justify-center gap-2">
          <button
            data-confirm-cancel
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >Cancelar</button>
          <button
            data-confirm-ok
            class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >Confirmar</button>
        </div>
      </div>
    </div>
  `;
  document.body.append(wrapper.firstElementChild);

  const dialog = document.querySelector("[data-confirm-dialog]");

  const close = (result) => {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
    confirmResolver?.(result);
    confirmResolver = null;
  };

  dialog.querySelector("[data-confirm-ok]").addEventListener("click", () => close(true));
  dialog.querySelector("[data-confirm-cancel]").addEventListener("click", () => close(false));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close(false);
  });
}

export function confirmDialog(message) {
  ensureConfirmDialog();

  const dialog = document.querySelector("[data-confirm-dialog]");
  dialog.querySelector("[data-confirm-message]").textContent = message;

  dialog.classList.remove("hidden");
  dialog.classList.add("flex");

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}
