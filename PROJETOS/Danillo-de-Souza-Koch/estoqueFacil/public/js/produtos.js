import { api, isCanceled } from "./api.js";
import { requireAuth } from "./auth.js";
import {
  confirmDialog,
  currency,
  escapeHtml,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";
import { renderIcons } from "./icons.js";

mountLayout("/produtos.html");

const rows = document.querySelector("[data-rows]");
const filters = document.querySelector("[data-filters]");
const modal = document.querySelector("[data-modal]");
const form = document.querySelector("[data-form]");
const title = document.querySelector("[data-modal-title]");
const pageInfo = document.querySelector("[data-page-info]");
const pageLabel = document.querySelector("[data-page-label]");
const pageSizeSelect = document.querySelector("[data-page-size]");
const previousButton = document.querySelector("[data-page-prev]");
const nextButton = document.querySelector("[data-page-next]");
const saveButton = document.querySelector("[data-save]");

let page = 1;
let totalPages = 1;
let pageSize = Number(pageSizeSelect.value);
let previousFocus = null;
let searchTimer;
let listController;

function status(product) {
  return !product.active ? "Inativo" : product.lowStock ? "Estoque baixo" : "Ok";
}

function render(list) {
  rows.innerHTML = list.length
    ? list.map((product) => `<tr class="hover:bg-slate-50">
        <td class="px-4 py-3 font-medium">${escapeHtml(product.name)}<small class="block text-xs text-slate-500">${escapeHtml(product.sku)}</small></td>
        <td class="px-4 py-3">${escapeHtml(product.categoryName ?? "Sem categoria")}</td>
        <td class="px-4 py-3 text-right">${currency.format(product.costPrice)}</td>
        <td class="px-4 py-3 text-right">${currency.format(product.salePrice)}</td>
        <td class="px-4 py-3 text-right ${product.lowStock ? "text-rose-600" : ""}">${product.quantity} / ${product.minimumStock}</td>
        <td class="px-4 py-3 text-center">${status(product)}</td>
        <td class="whitespace-nowrap px-4 py-3 text-right">
          <button type="button" data-edit="${product.id}" aria-label="Editar ${escapeHtml(product.name)}" title="Editar" class="mr-2 inline-flex rounded border px-2 py-1 text-xs"><i data-lucide="pencil" class="h-4 w-4"></i></button>
          <button type="button" data-delete="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}" title="Excluir" class="inline-flex rounded border border-rose-200 px-2 py-1 text-xs text-rose-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
        </td>
      </tr>`).join("")
    : "<tr><td colspan='7' class='px-4 py-10 text-center text-sm text-slate-500'>Nenhum produto encontrado</td></tr>";

  renderIcons();
}

function updatePagination(pagination) {
  page = pagination.page;
  totalPages = pagination.totalPages;
  pageSize = pagination.pageSize;

  const firstItem = pagination.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, pagination.total);
  pageInfo.textContent = `Mostrando ${firstItem}-${lastItem} de ${pagination.total} produto(s)`;
  pageLabel.textContent = `${page} / ${totalPages}`;
  previousButton.disabled = page <= 1;
  nextButton.disabled = page >= totalPages;
}

function readFilters() {
  const data = new FormData(filters);
  return {
    search: String(data.get("search") ?? "").trim(),
    categoryId: data.get("categoryId"),
    lowStock: data.get("lowStock") === "on",
    page,
    pageSize,
  };
}

async function load() {
  listController?.abort();
  const controller = new AbortController();
  listController = controller;
  rows.innerHTML = skeletonRows(7, 5);
  rows.setAttribute("aria-busy", "true");

  try {
    const result = await api.listProducts(readFilters(), { signal: controller.signal });
    if (result.pagination.page > result.pagination.totalPages) {
      page = result.pagination.totalPages;
      await load();
      return;
    }

    render(result.rows);
    updatePagination(result.pagination);
  } catch (error) {
    if (isCanceled(error)) return;
    rows.innerHTML = "<tr><td colspan='7' class='px-4 py-10 text-center text-sm text-rose-600'>Nao foi possivel carregar os produtos.</td></tr>";
    toast(error.message, "error");
  } finally {
    if (listController === controller) rows.removeAttribute("aria-busy");
  }
}

async function categories() {
  const list = await api.listCategories();
  const options = list
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");

  filters.elements.categoryId.innerHTML = `<option value="">Todas as categorias</option>${options}`;
  form.elements.categoryId.innerHTML = `<option value="">Sem categoria</option>${options}`;
}

function open(product, trigger = document.activeElement) {
  previousFocus = trigger;
  form.reset();
  title.textContent = product ? "Editar produto" : "Novo produto";
  form.elements.id.value = product?.id ?? "";

  if (product) {
    ["name", "sku", "costPrice", "salePrice", "quantity", "minimumStock"].forEach((key) => {
      form.elements[key].value = product[key];
    });
    form.elements.categoryId.value = product.categoryId ?? "";
    form.elements.active.checked = product.active;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.querySelector("[data-product-name]").focus();
}

function close() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  previousFocus?.focus();
}

function productPayload(product, active = product.active) {
  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    costPrice: Number(product.costPrice),
    salePrice: Number(product.salePrice),
    quantity: Number(product.quantity),
    minimumStock: Number(product.minimumStock),
    active,
  };
}

async function removeProduct(id, trigger) {
  const confirmed = await confirmDialog({
    title: "Excluir produto?",
    message: "A exclusao e permanente e nao pode ser desfeita.",
    confirmLabel: "Excluir",
  });

  if (!confirmed) return;

  try {
    await api.deleteProduct(id);
    toast("Produto excluido");
    await load();
  } catch (error) {
    if (error.status !== 409) {
      toast(error.message, "error");
      return;
    }

    let product;
    try {
      product = await api.getProduct(id);
    } catch (lookupError) {
      toast(lookupError.message, "error");
      return;
    }
    const inactivate = await confirmDialog({
      title: "Preservar o historico?",
      message: `${error.message}. Deseja inativar ${product.name} em vez de excluir?`,
      confirmLabel: "Inativar produto",
      variant: "warning",
    });

    if (!inactivate) return;

    try {
      await api.updateProduct(id, productPayload(product, false));
      toast("Produto inativado; o historico foi preservado");
      await load();
    } catch (updateError) {
      toast(updateError.message, "error");
    }
  } finally {
    trigger?.focus();
  }
}

filters.addEventListener("submit", (event) => {
  event.preventDefault();
  window.clearTimeout(searchTimer);
  page = 1;
  load();
});

filters.elements.search.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    page = 1;
    load();
  }, 300);
});

filters.elements.categoryId.addEventListener("change", () => {
  page = 1;
  load();
});

filters.elements.lowStock.addEventListener("change", () => {
  page = 1;
  load();
});

filters.addEventListener("reset", () => {
  window.setTimeout(() => {
    page = 1;
    load();
  }, 0);
});

pageSizeSelect.addEventListener("change", () => {
  pageSize = Number(pageSizeSelect.value);
  page = 1;
  load();
});

previousButton.addEventListener("click", () => {
  if (page > 1) {
    page -= 1;
    load();
  }
});

nextButton.addEventListener("click", () => {
  if (page < totalPages) {
    page += 1;
    load();
  }
});

document.querySelector("[data-new]").addEventListener("click", (event) => open(null, event.currentTarget));
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", close));
modal.addEventListener("click", (event) => {
  if (event.target === modal) close();
});
modal.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    close();
    return;
  }

  if (event.key === "Tab") {
    const focusable = [...modal.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled])")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

rows.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-edit], button[data-delete]");
  if (!button) return;

  if (button.dataset.edit) {
    try {
      open(await api.getProduct(button.dataset.edit), button);
    } catch (error) {
      toast(error.message, "error");
    }
    return;
  }

  await removeProduct(button.dataset.delete, button);
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

  setButtonLoading(saveButton, true, "Salvando...");
  try {
    const id = data.get("id");
    if (id) {
      await api.updateProduct(id, payload);
      toast("Produto atualizado");
    } else {
      await api.createProduct(payload);
      toast("Produto cadastrado");
    }

    close();
    await load();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
});

if (requireAuth()) {
  (async () => {
    try {
      await categories();
      await load();
    } catch (error) {
      toast(error.message, "error");
    }
  })();
}
