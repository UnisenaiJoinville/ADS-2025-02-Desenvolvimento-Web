import { api } from "./api.js";
import { currency, escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/produtos.html");

const rowsContainer = document.querySelector("[data-rows]");
const filtersForm = document.querySelector("[data-filters]");
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const form = document.querySelector("[data-form]");

// Elementos do Modal de Confirmação
const confirmModal = document.querySelector("[data-confirm-modal]");
const confirmTitle = document.querySelector("[data-confirm-title]");
const confirmMessage = document.querySelector("[data-confirm-message]");
const confirmBtnOk = document.querySelector("[data-confirm-ok]");
const confirmBtnCancel = document.querySelector("[data-confirm-cancel]");

let categories = [];
let currentPage = 1;

// ------------------------------------------------------------
// Modal de Confirmação Reutilizável
// ------------------------------------------------------------

function confirmDialog({ title = "Confirmar ação", message = "Tem certeza que deseja prosseguir?" } = {}) {
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;

    confirmModal.classList.remove("hidden");
    confirmModal.classList.add("flex");

    const handleOk = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      confirmModal.classList.add("hidden");
      confirmModal.classList.remove("flex");
      confirmBtnOk.removeEventListener("click", handleOk);
      confirmBtnCancel.removeEventListener("click", handleCancel);
    };

    confirmBtnOk.addEventListener("click", handleOk);
    confirmBtnCancel.addEventListener("click", handleCancel);
  });
}

// ------------------------------------------------------------
// Modal
// ------------------------------------------------------------

function openModal(product) {
  modalTitle.textContent = product ? "Editar produto" : "Novo produto";

  form.reset();
  form.elements.id.value = product?.id ?? "";

  if (product) {
    form.elements.name.value = product.name;
    form.elements.sku.value = product.sku;
    form.elements.categoryId.value = product.categoryId ?? "";
    form.elements.supplier.value = product.supplier ?? "";
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
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

document.querySelector("[data-new]").addEventListener("click", () => openModal(null));

// ------------------------------------------------------------
// Listagem
// ------------------------------------------------------------

function renderRows(products) {
  if (!products || products.length === 0) {
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
            <p class="text-xs text-slate-500">
              ${escapeHtml(product.sku)}
              ${product.supplier ? ` • <span class="italic">${escapeHtml(product.supplier)}</span>` : ""}
            </p>
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
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >Editar</button>
            <button
              data-delete="${product.id}"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >Excluir</button>
          </td>
        </tr>
      `
    )
    .join("");
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
    search: data.get("search") ?? "",
    categoryId: data.get("categoryId") ?? "",
    lowStock: data.get("lowStock") === "on",
    includeInactive: data.get("includeInactive") === "on",
    page: currentPage,
    perPage: 20,
  };
}

async function loadProducts() {
  try {
    const result = await api.listProducts(currentFilters());
    // Garante renderização utilizando a lista 'data' retornada do backend
    renderRows(result.data);
  } catch (error) {
    toast(error.message, "error");
  }
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

// ------------------------------------------------------------
// Ações
// ------------------------------------------------------------

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentPage = 1;
  loadProducts();
});

filtersForm.addEventListener("reset", () => {
  currentPage = 1;
  setTimeout(loadProducts, 0);
});

rowsContainer.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    try {
      const product = await api.getProduct(editId);
      openModal(product);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  if (deleteId) {
    const confirmed = await confirmDialog({
      title: "Desativar produto",
      message: "Deseja realmente desativar este produto?",
    });

    if (!confirmed) return;

    try {
      await api.deleteProduct(deleteId);
      toast("Produto desativado");
      loadProducts();
    } catch (error) {
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
    supplier: data.get("supplier") || null,
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

    closeModal();
    loadProducts();
  } catch (error) {
    toast(error.message, "error");
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

init();