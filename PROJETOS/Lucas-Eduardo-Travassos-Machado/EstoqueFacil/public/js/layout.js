// Funcoes compartilhadas por todas as telas.

import { renderIcons } from "./icons.js";
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
  { href: "/relatorios.html", label: "Relatorios", icon: "chart-column" },
  { href: "/index.html", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/produtos.html", label: "Produtos", icon: "package" },
  {
    href: "/movimentacoes.html",
    label: "Movimentacoes",
    icon: "arrow-left-right",
  },
  { href: "/categorias.html", label: "Categorias", icon: "tag" },
];

export function renderNav(active) {
  const links = NAV_ITEMS.map((item) => {
    const isActive = item.href === active;

    const classes = isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900";

    return `<a href="${item.href}" ${isActive ? 'aria-current="page"' : ""} class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${classes}"><i data-lucide="${item.icon}" class="h-4 w-4"></i>${item.label}</a>`;
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

  // "Ana Paula Souza" -> "AS"
  const initials = escapeHtml(
    user.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .filter((_, index, all) => index === 0 || index === all.length - 1)
      .join("")
      .toUpperCase(),
  );

  return `
    <div class="flex items-center gap-3 border-l border-slate-200 pl-4">
      <div class="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">${initials}</div>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold leading-tight text-slate-900">${escapeHtml(user.name)}</p>
        <p class="text-xs leading-tight text-slate-500">${escapeHtml(user.email)}</p>
      </div>
      <button
        data-logout aria-label="Sair do sistema" title="Sair do sistema"
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        <i data-lucide="log-out" class="inline h-4 w-4"></i><span class="ml-1">Sair</span>
      </button>
    </div>
  `;
}

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);
    renderIcons();

    // O botao so existe depois do innerHTML acima.
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
  element.setAttribute("role", variant === "error" ? "alert" : "status");

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
// Botao "trabalhando" (Aula 66): trava o botao e mostra um spinner.
// Chame com true antes do await e com false no finally.
export function setButtonLoading(button, loading, loadingText = "Salvando...") {
  if (!button) return;
  if (loading) {
    if (button.dataset.originalHtml !== undefined) return;
    // Guarda o conteudo original para devolver depois.
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML = `
      <span class="inline-flex items-center justify-center gap-2">
        <i data-lucide="loader-circle" class="h-4 w-4 animate-spin"></i>
        ${escapeHtml(loadingText)}
      </span>`;
    renderIcons();
    return;
  }

  button.disabled = false;
  button.removeAttribute("aria-busy");

  if (button.dataset.originalHtml !== undefined) {
    button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
  }
}

// Linhas "fantasma" enquanto uma tabela carrega (Aula 66).
// O formato lembra o conteudo que vai chegar, entao a tela nao "pula".
export function skeletonRows(columns, rows = 5) {
  const cells = Array.from(
    { length: columns },
    () =>
      '<td class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-slate-200"></div></td>',
  ).join("");

  return Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("");
}

let confirmation = null;
export function confirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  variant = "danger",
}) {
  if (confirmation) return Promise.resolve(false);
  const previousFocus = document.activeElement;
  const dialog = document.createElement("dialog");
  confirmation = dialog;
  dialog.className =
    "w-full max-w-md rounded-2xl border-0 bg-white p-6 shadow-xl backdrop:bg-slate-900/50";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "confirm-title");
  dialog.setAttribute("aria-describedby", "confirm-message");
  dialog.innerHTML = `<i data-lucide="${variant === "danger" ? "trash-2" : "triangle-alert"}" class="mb-3 h-6 w-6 ${variant === "danger" ? "text-rose-600" : "text-amber-700"}"></i><h2 id="confirm-title" class="text-lg font-semibold">${escapeHtml(title)}</h2>
    <p id="confirm-message" class="mt-2 text-sm text-slate-600">${escapeHtml(message)}</p>
    <form method="dialog" class="mt-6 flex justify-end gap-2">
      <button value="cancel" autofocus class="rounded-xl border px-4 py-2">Cancelar</button>
      <button value="confirm" class="rounded-xl px-4 py-2 text-white ${variant === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-700"}">${escapeHtml(confirmLabel)}</button>
    </form>`;
  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        const answer = dialog.returnValue === "confirm";
        dialog.remove();
        confirmation = null;
        if (previousFocus?.isConnected) previousFocus.focus();
        resolve(answer);
      },
      { once: true },
    );
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close("cancel");
      }
    });
    document.body.append(dialog);
    renderIcons(dialog);
    dialog.showModal();
  });
}
