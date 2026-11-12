import { requireAuth } from "./auth.js";
import { api, isCanceled } from "./api.js";
import { renderIcons } from "./icons.js";
import {
  confirmDialog,
  currency,
  escapeHtml,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";
mountLayout("/produtos.html");
const rowsContainer = document.querySelector("[data-rows]");
const filtersForm = document.querySelector("[data-filters]");
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const form = document.querySelector("[data-form]");
const saveButton = form.querySelector("[data-save]");
const pageInfo = document.querySelector("[data-page-info]");
const pageLabel = document.querySelector("[data-page-label]");
const prevButton = document.querySelector("[data-page-prev]");
const nextButton = document.querySelector("[data-page-next]");
const pageSizeSelect = document.querySelector("[data-page-size]");
let currentPage = 1,
  firstLoad = true,
  lastFocused = null,
  searchTimer,
  listController,
  listVersion = 0,
  saving = false;
const pending = new Set();
function openModal(product, trigger = document.activeElement) {
  lastFocused = trigger;
  modalTitle.textContent = product ? "Editar produto" : "Novo produto";
  form.reset();
  form.elements.id.value = product?.id ?? "";
  if (product)
    for (const key of [
      "name",
      "sku",
      "categoryId",
      "costPrice",
      "salePrice",
      "quantity",
      "minimumStock",
    ])
      form.elements[key].value = product[key] ?? "";
  form.elements.active.checked = product?.active ?? true;
  form.elements.quantity.readOnly = Boolean(product);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  form.elements.name.focus();
}
function closeModal() {
  if (saving) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  if (lastFocused?.isConnected) lastFocused.focus();
}
document
  .querySelectorAll("[data-close]")
  .forEach((b) => b.addEventListener("click", closeModal));
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (
    document.querySelector("dialog[open]") ||
    modal.classList.contains("hidden")
  )
    return;
  if (event.key === "Escape") closeModal();
  if (event.key === "Tab") {
    const items = [
      ...modal.querySelectorAll(
        'button:not(:disabled), input:not([type="hidden"]):not(:disabled), select:not(:disabled)',
      ),
    ];
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault();
      items.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      event.preventDefault();
      items[0].focus();
    }
  }
});
document
  .querySelector("[data-new]")
  .addEventListener("click", () => openModal(null));
function renderRows(products) {
  if (products.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="7" class="px-4 py-10 text-center text-sm text-slate-500">
        Nenhum produto encontrado
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = products
    .map(
      (product) => `
        <tr class="hover:bg-slate-50">
          <td class="px-4 py-3">
            <p class="font-medium text-slate-800">${escapeHtml(product.name)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(product.sku)}</p>
          </td>
          <td class="px-4 py-3 text-slate-600">
            ${escapeHtml(product.categoryName ?? "Sem categoria")}
          </td>
          <td class="px-4 py-3 text-right text-slate-600">${currency.format(product.costPrice)}</td>
          <td class="px-4 py-3 text-right text-slate-600">${currency.format(product.salePrice)}</td>
          <td class="px-4 py-3 text-right">
            <span class="font-semibold ${product.lowStock ? "text-rose-600" : "text-slate-800"}">
              ${product.quantity}
            </span>
            <span class="text-xs text-slate-500"> / min ${product.minimumStock}</span>
          </td>
          <td class="px-4 py-3 text-center">
            ${statusBadge(product)}
          </td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${product.id}" aria-label="Editar ${escapeHtml(product.name)}" title="Editar"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            ><i data-lucide="pencil" class="h-4 w-4"></i></button>
            <button
              data-delete="${product.id}" data-name="${escapeHtml(product.name)}" aria-label="Excluir ${escapeHtml(product.name)}" title="Excluir"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            ><i data-lucide="trash-2" class="h-4 w-4"></i></button>
          </td>
        </tr>
      `,
    )
    .join("");
  renderIcons();
}

function statusBadge(product) {
  if (!product.active) {
    return '<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Inativo</span>';
  }

  if (product.lowStock) {
    return '<span class="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Estoque baixo</span>';
  }

  return '<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ok</span>';
}

function currentFilters() {
  const data = new FormData(filtersForm);
  return {
    search: data.get("search").trim(),
    categoryId: data.get("categoryId"),
    lowStock: data.get("lowStock") === "on",
    page: currentPage,
    pageSize: Number(pageSizeSelect.value),
  };
}
function invalidateList() {
  listVersion++;
  listController?.abort();
}
async function loadProducts() {
  invalidateList();
  const version = listVersion;
  const controller = (listController = new AbortController());
  rowsContainer.setAttribute("aria-busy", "true");
  if (firstLoad) rowsContainer.innerHTML = skeletonRows(7);
  else rowsContainer.classList.add("opacity-50");
  prevButton.disabled = nextButton.disabled = true;
  try {
    const { rows, pagination: p } = await api.listProducts(currentFilters(), {
      signal: controller.signal,
    });
    if (version !== listVersion) return;
    if (currentPage > p.totalPages) {
      currentPage = p.totalPages;
      return loadProducts();
    }
    renderRows(rows);
    pageInfo.textContent = p.total
      ? `Mostrando ${(p.page - 1) * p.pageSize + 1}-${Math.min(p.page * p.pageSize, p.total)} de ${p.total} produto(s)`
      : "Nenhum produto";
    pageLabel.textContent = `${p.page} / ${p.totalPages}`;
    prevButton.disabled = p.page <= 1;
    nextButton.disabled = p.page >= p.totalPages;
  } catch (error) {
    if (isCanceled(error) || version !== listVersion) return;
    rowsContainer.innerHTML =
      '<tr><td colspan="7" class="p-6 text-rose-700" role="alert">Nao foi possivel carregar os produtos. Altere um filtro para tentar novamente.</td></tr>';
    toast(error.message, "error");
  } finally {
    if (version === listVersion) {
      rowsContainer.removeAttribute("aria-busy");
      rowsContainer.classList.remove("opacity-50");
      firstLoad = false;
    }
  }
}
function applyFilters() {
  clearTimeout(searchTimer);
  searchTimer = null;
  currentPage = 1;
  loadProducts();
}
filtersForm.addEventListener("submit", (e) => {
  e.preventDefault();
  applyFilters();
});
filtersForm.elements.search.addEventListener("input", () => {
  invalidateList();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 400);
});
for (const key of ["categoryId", "lowStock"])
  filtersForm.elements[key].addEventListener("change", applyFilters);
filtersForm.addEventListener("reset", () => {
  invalidateList();
  clearTimeout(searchTimer);
  setTimeout(applyFilters, 0);
});
pageSizeSelect.addEventListener("change", applyFilters);
prevButton.addEventListener("click", () => {
  if (!prevButton.disabled) {
    currentPage--;
    loadProducts();
  }
});
nextButton.addEventListener("click", () => {
  if (!nextButton.disabled) {
    currentPage++;
    loadProducts();
  }
});
rowsContainer.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-edit], [data-delete]");
  if (!button || pending.has(button.dataset.edit ?? button.dataset.delete))
    return;
  const id = button.dataset.edit ?? button.dataset.delete;
  pending.add(id);
  try {
    if (button.dataset.edit) {
      openModal(await api.getProduct(id), button);
      return;
    }
    if (
      !(await confirmDialog({
        title: "Excluir produto?",
        message: `"${button.dataset.name}" sera excluido definitivamente. Esta acao nao pode ser desfeita.`,
        confirmLabel: "Excluir",
      }))
    )
      return;
    setButtonLoading(button, true, "Excluindo...");
    try {
      await api.deleteProduct(id);
      toast("Produto excluido");
    } catch (error) {
      if (error.status !== 409) throw error;
      if (
        !(await confirmDialog({
          title: "Nao e possivel excluir",
          message:
            error.message +
            " Voce pode inativar o produto e preservar seu historico.",
          confirmLabel: "Inativar produto",
          variant: "warning",
        }))
      )
        return;
      const product = await api.getProduct(id);
      await api.updateProduct(id, { ...product, active: false });
      toast("Produto inativado");
    }
    await loadProducts();
    if (!button.isConnected) document.querySelector("[data-new]").focus();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    pending.delete(id);
    setButtonLoading(button, false);
    if (button.dataset.delete && button.isConnected) button.focus();
  }
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;
  const data = new FormData(form),
    id = data.get("id");
  const payload = Object.fromEntries(
    [
      "name",
      "sku",
      "categoryId",
      "costPrice",
      "salePrice",
      "quantity",
      "minimumStock",
    ].map((k) => [k, data.get(k)]),
  );
  payload.categoryId ||= null;
  payload.active = data.get("active") === "on";
  saving = true;
  setButtonLoading(saveButton, true);
  try {
    if (id) await api.updateProduct(id, payload);
    else await api.createProduct(payload);
    toast(id ? "Produto atualizado" : "Produto cadastrado");
    saving = false;
    closeModal();
    await loadProducts();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    saving = false;
    setButtonLoading(saveButton, false);
  }
});
async function init() {
  try {
    const categories = await api.listCategories();
    const options = categories
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join("");
    filtersForm.elements.categoryId.innerHTML =
      '<option value="">Todas as categorias</option>' + options;
    form.elements.categoryId.innerHTML =
      '<option value="">Sem categoria</option>' + options;
    if (!searchTimer) await loadProducts();
  } catch (error) {
    toast(error.message, "error");
  }
}
if (requireAuth()) init();
