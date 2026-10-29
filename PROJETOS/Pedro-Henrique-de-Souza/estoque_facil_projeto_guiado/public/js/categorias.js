import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { renderIcons } from "./icons.js";
import {
  confirmDialog,
  escapeHtml,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";

mountLayout("/categorias.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const cancelButton = document.querySelector("[data-cancel]");
const saveButton = form.querySelector("[data-save]");

function renderRows(categories) {
  if (categories.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="3" class="px-6 py-10 text-center text-sm text-slate-500">
        Nenhuma categoria cadastrada
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = categories
    .map(
      (category) => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3 font-medium text-slate-800">${escapeHtml(category.name)}</td>
          <td class="px-4 py-3 text-right text-slate-600">${category.productCount}</td>
          <td class="px-6 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${category.id}"
              data-name="${escapeHtml(category.name)}"
              aria-label="Editar ${escapeHtml(category.name)}"
              title="Editar"
              class="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              <i data-lucide="pencil" class="h-4 w-4"></i>
            </button>
            <button
              data-delete="${category.id}"
              aria-label="Excluir ${escapeHtml(category.name)}"
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

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  cancelButton.classList.add("hidden");
}

async function loadCategories() {
  rowsContainer.innerHTML = skeletonRows(3);

  try {
    const categories = await api.listCategories();
    renderRows(categories);
  } catch (error) {
    toast(error.message, "error");
  }
}

cancelButton.addEventListener("click", resetForm);

rowsContainer.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  const editId = editButton?.dataset.edit;
  const deleteId = deleteButton?.dataset.delete;

  if (editId) {
    form.elements.id.value = editId;
    form.elements.name.value = editButton.dataset.name;
    form.elements.name.focus();
    cancelButton.classList.remove("hidden");
  }

  if (deleteId) {
    const confirmed = await confirmDialog({
      title: "Excluir categoria?",
      message: "Os produtos desta categoria nao serao apagados: eles ficarao sem categoria.",
      confirmLabel: "Excluir",
    });

    if (!confirmed) return;

    try {
      await api.deleteCategory(deleteId);
      toast("Categoria excluida");
      resetForm();
      loadCategories();
    } catch (error) {
      toast(error.message, "error");
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const id = data.get("id");
  const payload = { name: data.get("name") };

  setButtonLoading(saveButton, true);

  try {
    if (id) {
      await api.updateCategory(id, payload);
      toast("Categoria atualizada");
    } else {
      await api.createCategory(payload);
      toast("Categoria cadastrada");
    }

    resetForm();
    loadCategories();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
});

// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  loadCategories();
}
