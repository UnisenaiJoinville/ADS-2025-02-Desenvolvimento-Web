import { renderIcons } from "./icons.js";
import {
  confirmDialog,
  setButtonLoading,
  skeletonRows,
  trapFocus,
} from "./layout.js";
import { api, isCanceled, downloadReport } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/produtos.html");

const rowsContainer = document.querySelector("[data-rows]");
const filtersForm = document.querySelector("[data-filters]");
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const form = document.querySelector("[data-form]");

let categories = [];
let page = 1,
  controller,
  debounceTimer,
  previousFocus,
  saving = false;
let initialLoad = true;
const urlState = new URLSearchParams(location.search);
for (const key of ["search", "categoryId", "orderBy", "direction", "pageSize"])
  if (urlState.has(key) && filtersForm.elements[key])
    filtersForm.elements[key].value = urlState.get(key);
for (const key of ["lowStock", "includeInactive"])
  filtersForm.elements[key].checked = urlState.get(key) === "true";
page = Math.max(1, Number(urlState.get("page")) || 1);
trapFocus(modal);

// ------------------------------------------------------------
// Modal
// ------------------------------------------------------------

function openModal(product) {
  previousFocus = document.activeElement;
  modalTitle.textContent = product ? "Editar produto" : "Novo produto";

  form.reset();
  form.elements.id.value = product?.id ?? "";
  form.elements.supplier.value = product?.supplier ?? "";
  form.elements.quantity.readOnly = Boolean(product);
  form.elements.quantity.title = product
    ? "Altere o saldo usando Ajuste em Movimentacoes"
    : "Saldo inicial";

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
  if (saving) return;
  if (!modal.classList.contains("hidden")) previousFocus?.focus?.();
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

document
  .querySelector("[data-new]")
  .addEventListener("click", () => openModal(null));

// ------------------------------------------------------------
// Listagem
// ------------------------------------------------------------

function renderRows(products) {
  if (products.length === 0) {
    rowsContainer.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-10 text-center text-sm text-slate-500">
          Nenhum produto encontrado
        </td>
      </tr>`;
    return;
  }

  rowsContainer.innerHTML = products
    .map(
      (product) => `
        <tr class="hover:bg-slate-50">
          <td class="px-4 py-3">
            <p class="font-medium text-slate-800">
              ${escapeHtml(product.name)}
            </p>

            <p class="text-xs text-slate-500">
              ${escapeHtml(product.sku)}
            </p>
          </td>

          <td class="px-4 py-3 text-slate-600">
            ${escapeHtml(product.categoryName ?? "Sem categoria")}
          </td>

          <td class="px-4 py-3 text-right text-slate-600">
            ${currency.format(product.costPrice)}
          </td>

          <td class="px-4 py-3 text-right text-slate-600">
            ${currency.format(product.salePrice)}
          </td>

          <td class="px-4 py-3 text-right">
            <span class="font-semibold ${
              product.lowStock ? "text-rose-600" : "text-slate-800"
            }">
              ${product.quantity}
            </span>

            <span class="text-xs text-slate-400">
              / min ${product.minimumStock}
            </span>
          </td>

          <td class="px-4 py-3 text-center">
            ${statusBadge(product)}
          </td>

          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${product.id}" aria-label="Editar ${escapeHtml(product.name)}"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <i data-lucide="pencil"></i><span class="sr-only">Editar</span>
            </button>

            <button
              data-delete="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <i data-lucide="trash-2"></i><span class="sr-only">Excluir</span>
            </button>
          </td>
        </tr>
      `,
    )
    .join("");
}

function statusBadge(product) {
  if (!product.active) {
    return `
      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
        Inativo
      </span>
    `;
  }

  if (product.lowStock) {
    return `
      <span class="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
        Estoque baixo
      </span>
    `;
  }

  return `
    <span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Ok
    </span>
  `;
}

function currentFilters() {
  const data = new FormData(filtersForm);

  return {
    search: data.get("search") ?? "",
    categoryId: data.get("categoryId") ?? "",
    lowStock: data.get("lowStock") === "on",
    includeInactive: data.get("includeInactive") === "on",
    orderBy: data.get("orderBy") || "name",
    direction: data.get("direction") || "asc",
    page,
    pageSize: Number(data.get("pageSize")) || 20,
  };
}

async function loadProducts() {
  controller?.abort();
  const activeController = (controller = new AbortController());
  if (initialLoad) rowsContainer.innerHTML = skeletonRows(7);
  rowsContainer.setAttribute("aria-busy", "true");
  try {
    const filters = currentFilters();
    const result = await api.listProducts(filters, {
      signal: activeController.signal,
    });
    if (activeController !== controller) return;
    if (page > result.pagination.totalPages) {
      page = result.pagination.totalPages;
      return loadProducts();
    }
    renderRows(result.rows);
    renderIcons();
    initialLoad = false;
    const pg = result.pagination;
    document.querySelector("[data-page-info]").textContent =
      `Mostrando ${pg.total ? (page - 1) * pg.pageSize + 1 : 0}-${Math.min(page * pg.pageSize, pg.total)} de ${pg.total}`;
    document.querySelector("[data-page-number]").textContent =
      `${page} / ${pg.totalPages}`;
    document.querySelector("[data-prev]").disabled = page <= 1;
    document.querySelector("[data-next]").disabled = page >= pg.totalPages;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters))
      if (v !== false && v !== "") params.set(k, v);
    history.replaceState(null, "", "?" + params.toString());
  } catch (error) {
    if (!isCanceled(error)) toast(error.message, "error");
  } finally {
    if (controller === activeController)
      rowsContainer.setAttribute("aria-busy", "false");
  }
}
async function loadCategories() {
  categories = await api.listCategories();

  const options = categories
    .map(
      (category) =>
        `<option value="${category.id}">${escapeHtml(category.name)}</option>`,
    )
    .join("");

  filtersForm.elements.categoryId.innerHTML = `<option value="">Todas as categorias</option>${options}`;
  filtersForm.elements.categoryId.value = urlState.get("categoryId") ?? "";

  form.elements.categoryId.innerHTML = `<option value="">Sem categoria</option>${options}`;
}

// ------------------------------------------------------------
// Acoes
// ------------------------------------------------------------

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();

  page = 1;
  loadProducts();
});

filtersForm.addEventListener("reset", () => {
  setTimeout(() => {
    page = 1;
    loadProducts();
  }, 0);
});

rowsContainer.addEventListener("click", async (event) => {
  const editId = event.target.closest("[data-edit]")?.dataset.edit;
  const deleteId = event.target.closest("[data-delete]")?.dataset.delete;

  if (editId) {
    try {
      const product = await api.getProduct(editId);

      openModal(product);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  if (deleteId) {
    if (
      !(await confirmDialog({
        title: "Excluir produto?",
        message:
          "A exclusao e definitiva. Produtos com historico podem ser inativados.",
        confirmLabel: "Excluir",
      }))
    )
      return;

    try {
      await api.deleteProduct(deleteId);

      toast("Produto excluido");

      loadProducts();
    } catch (error) {
      if (
        error.status === 409 &&
        (await confirmDialog({
          title: "Preservar historico",
          message: error.message,
          confirmLabel: "Inativar produto",
          variant: "warning",
        }))
      ) {
        try {
          await api.setProductActive(deleteId, false);
          toast("Produto inativado");
          await loadProducts();
        } catch (e) {
          toast(e.message, "error");
        }
      } else toast(error.message, "error");
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;
  saving = true;
  const saveButton = form.querySelector("button:not([type=button])");
  setButtonLoading(saveButton, true);

  const data = new FormData(form);

  const payload = {
    name: data.get("name"),
    sku: data.get("sku"),
    supplier: data.get("supplier"),
    categoryId: data.get("categoryId") || null,
    costPrice: Number(data.get("costPrice")),
    salePrice: Number(data.get("salePrice")),
    quantity: Number(data.get("quantity")),
    minimumStock: Number(data.get("minimumStock")),
    active: data.get("active") === "on",
  };

  const id = data.get("id");

  try {
    if (id) {
      await api.updateProduct(id, payload);

      toast("Produto atualizado");
    } else {
      await api.createProduct(payload);

      toast("Produto cadastrado");
    }

    saving = false;
    closeModal();
    loadProducts();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    saving = false;
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

// Protege a tela de produtos.
// Sem sessao, o usuario sera enviado para o login.
if (requireAuth()) {
  init();
}
filtersForm.addEventListener("input", (event) => {
  if (event.target.name !== "search") return;
  clearTimeout(debounceTimer);
  controller?.abort();
  debounceTimer = setTimeout(() => {
    page = 1;
    loadProducts();
  }, 300);
});
filtersForm.addEventListener("change", (event) => {
  if (event.target.name === "search") return;
  page = 1;
  loadProducts();
});
document.querySelector("[data-prev]").addEventListener("click", () => {
  page--;
  loadProducts();
});
document.querySelector("[data-next]").addEventListener("click", () => {
  page++;
  loadProducts();
});
document.querySelector("[data-export]").addEventListener("click", async () => {
  try {
    await downloadReport("/products/export", currentFilters(), "produtos.csv");
  } catch (e) {
    toast(e.message, "error");
  }
});
