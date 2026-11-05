import { getUser, logout } from "./auth.js";
import { renderIcons } from "./icons.js";

export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatDateTime(value) {
  if (!value) return "-";

  return new Date(String(value).replace(" ", "T")).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const NAV_ITEMS = [
  { href: "/index.html", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/produtos.html", label: "Produtos", icon: "package" },
  { href: "/movimentacoes.html", label: "Movimentacoes", icon: "arrow-left-right" },
  { href: "/categorias.html", label: "Categorias", icon: "tag" },
  { href: "/relatorios.html", label: "Relatorios", icon: "chart-column" },
];

function renderUserBadge() {
  const user = getUser();

  if (!user) return "";

  const name = String(user.name ?? "");
  const initials = name
    .split(" ")
    .filter(Boolean)
    .filter((_, index, parts) => index === 0 || index === parts.length - 1)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return `<div class="flex items-center gap-3 border-l border-slate-200 pl-4">
    <div class="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">${escapeHtml(initials)}</div>
    <div class="hidden sm:block"><p class="text-sm font-semibold">${escapeHtml(name)}</p><p class="text-xs text-slate-500">${escapeHtml(user.email ?? "")}</p></div>
    <button data-logout aria-label="Sair do sistema" title="Sair do sistema" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
      <i data-lucide="log-out" class="h-4 w-4"></i><span class="hidden sm:inline">Sair</span>
    </button>
  </div>`;
}

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");
  if (!container) return;

  container.innerHTML = `<header class="border-b border-slate-200 bg-white"><div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4"><a href="/" class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 font-bold text-white">EF</span><span><strong class="block text-base">Estoque Facil</strong><small class="text-xs text-slate-500">Gestao de estoque</small></span></a><nav class="flex flex-wrap gap-1">${NAV_ITEMS.map((item) => {
    const isActive = item.href === activeHref;
    const classes = isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100";

    return `<a href="${item.href}" ${isActive ? 'aria-current="page"' : ""} class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${classes}"><i data-lucide="${item.icon}" class="h-4 w-4"></i>${item.label}</a>`;
  }).join("")}</nav>${renderUserBadge()}</div></header>`;

  renderIcons();
  container.querySelector("[data-logout]")?.addEventListener("click", logout);
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

export function setButtonLoading(button, isLoading, loadingText = "Carregando...") {
  if (!button) return;

  if (isLoading) {
    if (!button.hasAttribute("data-original-html")) {
      button.dataset.originalHtml = button.innerHTML;
      button.dataset.wasDisabled = String(button.disabled);
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML = `<span class="inline-flex items-center justify-center gap-2"><i data-lucide="loader-circle" class="h-4 w-4 animate-spin"></i>${escapeHtml(loadingText)}</span>`;
    renderIcons();
    return;
  }

  if (button.hasAttribute("data-original-html")) {
    button.innerHTML = button.dataset.originalHtml;
    button.disabled = button.dataset.wasDisabled === "true";
    delete button.dataset.originalHtml;
    delete button.dataset.wasDisabled;
  }

  button.removeAttribute("aria-busy");
}

export function skeletonRows(columnCount, rowCount = 5) {
  const cells = Array.from(
    { length: columnCount },
    () => '<td class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-slate-200"></div></td>'
  ).join("");

  return Array.from(
    { length: rowCount },
    () => `<tr aria-hidden="true">${cells}</tr>`
  ).join("");
}

export function confirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  variant = "danger",
}) {
  return new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const isDanger = variant === "danger";
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4";
    overlay.innerHTML = `
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        aria-describedby="confirm-message" class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex gap-4">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full ${isDanger ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}">
            <i data-lucide="${isDanger ? "trash-2" : "triangle-alert"}" class="h-5 w-5"></i>
          </div>
          <div>
            <h2 id="confirm-title" class="text-lg font-semibold text-slate-900">${escapeHtml(title)}</h2>
            <p id="confirm-message" class="mt-1 text-sm text-slate-600">${escapeHtml(message)}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" data-answer="no" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="button" data-answer="yes" class="rounded-xl px-4 py-2 text-sm font-semibold text-white ${isDanger ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-700"}">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    let closed = false;
    const buttons = () => [...overlay.querySelectorAll("button[data-answer]")];

    function close(answer) {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      previousFocus?.focus?.();
      resolve(answer);
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        close(false);
        return;
      }

      if (event.key === "Tab") {
        const [cancelButton, confirmButton] = buttons();
        if (event.shiftKey && document.activeElement === cancelButton) {
          event.preventDefault();
          confirmButton.focus();
        } else if (!event.shiftKey && document.activeElement === confirmButton) {
          event.preventDefault();
          cancelButton.focus();
        }
      }
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close(false);
        return;
      }

      const button = event.target.closest("[data-answer]");
      if (button) close(button.dataset.answer === "yes");
    });

    document.addEventListener("keydown", onKeydown);
    document.body.append(overlay);
    renderIcons();
    overlay.querySelector('[data-answer="no"]').focus();
  });
}
