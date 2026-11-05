import {renderIcons} from "./icons.js";
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

    return `<a href="${item.href}" class="rounded-lg px-4 py-2 text-sm font-medium transition ${classes}"><i data-lucide="${item.icon}" class="mr-1 inline-block h-4 w-4"></i>${item.label}</a>`;
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

function renderUserBadge() {
  const user = getUser();

  if (!user) return "";

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
        <i data-lucide="log-out" class="mr-1 inline-block h-4 w-4"></i>Sair
      </button>
    </div>
  `;
}

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);
    renderIcons();
    container.querySelector("[data-logout]")?.addEventListener("click", logout);
  }
}

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

export function confirmDialog(message) {
 return new Promise(resolve=>{
  const overlay=document.createElement('div');overlay.className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4';
  overlay.innerHTML=`<div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 id="confirm-title" class="text-lg font-semibold">Confirmar ação</h2><p class="my-4 text-sm"></p><div class="flex justify-end gap-2"><button data-no class="rounded border px-4 py-2">Cancelar</button><button data-yes class="rounded bg-rose-600 px-4 py-2 text-white">Confirmar</button></div></div>`;
  overlay.querySelector('p').textContent=message;
  const finish=value=>{document.removeEventListener('keydown',onKey);overlay.remove();resolve(value);};
  const onKey=e=>{if(e.key==='Escape')finish(false);};document.addEventListener('keydown',onKey);
  overlay.querySelector('[data-no]').onclick=()=>finish(false);overlay.querySelector('[data-yes]').onclick=()=>finish(true);
  document.body.append(overlay);overlay.querySelector('[data-no]').focus();
 });
}
export function setButtonLoading(button,loading,label='Salvando...') {if(!button)return;if(loading){button.dataset.originalHtml=button.innerHTML;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=label;}else{button.disabled=false;button.removeAttribute('aria-busy');if(button.dataset.originalHtml!==undefined){button.innerHTML=button.dataset.originalHtml;delete button.dataset.originalHtml;}}}
export function skeletonRows(columns,rows=5){return Array.from({length:rows},()=>'<tr>'+Array.from({length:columns},()=>'<td class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-slate-200"></div></td>').join('')+'</tr>').join('');}
