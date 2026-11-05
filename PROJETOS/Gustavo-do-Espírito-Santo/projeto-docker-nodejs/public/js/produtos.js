import { api, isCanceled } from "./api.js";
import { requireAuth } from "./auth.js";
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

const SEARCH_DELAY = 400;

let categories = [];
let currentPage = 1;
let searchTimer = null;
let listController = null;
let isFirstLoad = true;
let lastFocused = null;

function openModal(product) {
  lastFocused = document.activeElement;

  modalTitle.textContent = product ? "Editar produto" : "Novo produto";

  form.reset();
  form.elements.id.value = product?.id ?? "";

  if (product) {
    form.elements.name.value = product.name;
    form.elements.sku.value = product.sku;
    form.elements.categoryId.value = product.categoryId ?? "";
    form.elements.costPrice.value = product.costPrice;
    form.elements.salePrice.value = product.salePrice;
    form.elements.quantity.value = product.quantity;
    form.elements.minimumStock.value = product.minimumStock;
    form.elements.active.checked = product.active;
  } else {
    form.elements.active.checked = true;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  form.elements.name.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");

  lastFocused?.focus?.();
  lastFocused = null;
}

function isModalOpen() {
  return !modal.classList.contains("hidden");
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isModalOpen()) closeModal();
});

document.querySelector("[data-new]").addEventListener("click", () => openModal(null));

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
            <span class="text-xs text-slate-400"> / min ${product.minimumStock}</span>
          </td>
          <td class="px-4 py-3 text-center">
            ${statusBadge(product)}
          </td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${product.id}"
              aria-label="Editar ${escapeHtml(product.name)}"
              title="Editar"
              class="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              <i data-lucide="pencil" class="h-4 w-4"></i>
            </button>
            <button
              data-delete="${product.id}"
              data-name="${escapeHtml(product.name)}"
              aria-label="Excluir ${escapeHtml(product.name)}"
              title="Excluir"
              class="inline-grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <i data-lucide="trash-2" class="h-4 w-4"></i>
            </button>
          </td>
        </tr>
      `
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
    search: (data.get("search") ?? "").trim(),
    categoryId: data.get("categoryId") ?? "",
    lowStock: data.get("lowStock") === "on",
    page: currentPage,
    pageSize: Number(pageSizeSelect.value),
  };
}

function renderPagination({ page, pageSize, total, totalPages }) {
  if (total === 0) {
    pageInfo.textContent = "Nenhum produto";
  } else {
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    pageInfo.textContent = `Mostrando ${first}-${last} de ${total} produto(s)`;
  }

  pageLabel.textContent = `${page} / ${totalPages}`;
  prevButton.disabled = page <= 1;
  nextButton.disabled = page >= totalPages;
}

async function loadProducts() {
  listController?.abort();
  const controller = new AbortController();
  listController = controller;

  if (isFirstLoad) {
    rowsContainer.innerHTML = skeletonRows(7);
  } else {
    rowsContainer.classList.add("opacity-50");
  }
  rowsContainer.setAttribute("aria-busy", "true");

  try {
    const { pagination, rows } = await api.listProducts(currentFilters(), {
      signal: controller.signal,
    });

    if (rows.length === 0 && currentPage > pagination.totalPages) {
      currentPage = pagination.totalPages;
      return loadProducts();
    }

    renderRows(rows);
    renderPagination(pagination);
  } catch (error) {
    if (isCanceled(error)) return;

    toast(error.message, "error");
  } finally {
    if (listController === controller) {
      rowsContainer.classList.remove("opacity-50");
      rowsContainer.removeAttribute("aria-busy");
      isFirstLoad = false;
    }
  }
}

function applyFilters() {
  clearTimeout(searchTimer);
  currentPage = 1;
  loadProducts();
}

async function loadCategories() {
  categories = await api.listCategories();

  const options = categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");

  filtersForm.elements.categoryId.innerHTML =
    `<option value="">Todas as categorias</option>${options}`;

  form.elements.categoryId.innerHTML = `<option value="">Sem categoria</option>${options}`;
}

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});

filtersForm.elements.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, SEARCH_DELAY);
});

filtersForm.elements.categoryId.addEventListener("change", applyFilters);
filtersForm.elements.lowStock.addEventListener("change", applyFilters);

filtersForm.addEventListener("reset", () => {
  setTimeout(applyFilters, 0);
});

pageSizeSelect.addEventListener("change", applyFilters);

prevButton.addEventListener("click", () => {
  currentPage -= 1;
  loadProducts();
});

nextButton.addEventListener("click", () => {
  currentPage += 1;
  loadProducts();
});

async function offerDeactivation(id, reason) {
  const confirmed = await confirmDialog({
    title: "Nao e possivel excluir",
    message: `${reason} Voce pode inativa-lo: ele sai da busca de movimentacoes, mas o historico e preservado.`,
    confirmLabel: "Inativar produto",
    variant: "warning",
  });

  if (!confirmed) return;

  try {
    const product = await api.getProduct(id);

    await api.updateProduct(id, { ...product, active: false });

    toast("Produto inativado");
    loadProducts();
  } catch (error) {
    toast(error.message, "error");
  }
}

rowsContainer.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  const editId = editButton?.dataset.edit;
  const deleteId = deleteButton?.dataset.delete;

  if (editId) {
    try {
      const product = await api.getProduct(editId);
      openModal(product);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  if (deleteId) {
    const name = deleteButton.dataset.name;

    const confirmed = await confirmDialog({
      title: "Excluir produto?",
      message: `"${name}" sera excluido definitivamente. Esta acao nao pode ser desfeita.`,
      confirmLabel: "Excluir",
    });

    if (!confirmed) return;

    try {
      await api.deleteProduct(deleteId);
      toast("Produto excluido");
      loadProducts();
    } catch (error) {
      if (error.status === 409) {
        await offerDeactivation(deleteId, error.message);
        return;
      }

      toast(error.message, "error");
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);

  const payload = {
    name: data.get("name"),
    sku: data.get("sku"),
    categoryId: data.get("categoryId") || null,
    costPrice: Number(data.get("costPrice")),
    salePrice: Number(data.get("salePrice")),
    quantity: Number(data.get("quantity")),
    minimumStock: Number(data.get("minimumStock")),
    active: data.get("active") === "on",
  };

  const id = data.get("id");

  setButtonLoading(saveButton, true);

  try {
    if (id) {
      await api.updateProduct(id, payload);
      toast("Produto atualizado");
    } else {
      await api.createProduct(payload);
      toast("Produto cadastrado");
    }

    closeModal();
    loadProducts();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
});

async function init() {
  try {
    await loadCategories();
    await loadProducts();
  } catch (error) {
    toast(error.message, "error");
  }
}

if (requireAuth()) {
  init();
}
