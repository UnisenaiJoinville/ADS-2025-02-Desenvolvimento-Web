import { requireAuth } from "./auth.js";
import { renderIcons } from "./icons.js";
import { api, isCanceled } from "./api.js";
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
let saving = false,
  listController;
const pending = new Set();

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
              data-edit="${category.id}" aria-label="Editar ${escapeHtml(category.name)}" title="Editar"
              data-name="${escapeHtml(category.name)}"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            ><i data-lucide="pencil" class="h-4 w-4"></i></button>
            <button
              data-delete="${category.id}" aria-label="Excluir ${escapeHtml(category.name)}" title="Excluir"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            ><i data-lucide="trash-2" class="h-4 w-4"></i></button>
          </td>
        </tr>
      `,
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
  listController?.abort();
  const controller = (listController = new AbortController());
  rowsContainer.innerHTML = skeletonRows(3);
  try {
    const categories = await api.listCategories({ signal: controller.signal });
    if (listController !== controller) return;
    renderRows(categories);
  } catch (error) {
    if (!isCanceled(error)) {
      rowsContainer.innerHTML =
        '<tr><td colspan="3" class="p-6 text-rose-700" role="alert">Nao foi possivel carregar as categorias.</td></tr>';
      toast(error.message, "error");
    }
  }
}

cancelButton.addEventListener("click", resetForm);

rowsContainer.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const editId = editButton?.dataset.edit;
  const deleteId = deleteButton?.dataset.delete;
  if (saving) return;

  if (editId) {
    form.elements.id.value = editId;
    form.elements.name.value = editButton.dataset.name;
    form.elements.name.focus();
    cancelButton.classList.remove("hidden");
  }

  if (deleteId) {
    if (pending.has(deleteId)) return;
    pending.add(deleteId);
    const confirmed = await confirmDialog({
      title: "Excluir categoria?",
      message:
        "Os produtos desta categoria ficarao sem categoria. Eles nao serao apagados.",
      confirmLabel: "Excluir",
    });
    if (!confirmed) {
      pending.delete(deleteId);
      return;
    }
    setButtonLoading(deleteButton, true, "Excluindo...");

    try {
      await api.deleteCategory(deleteId);
      toast("Categoria excluida");
      resetForm();
      await loadCategories();
      form.elements.name.focus();
    } catch (error) {
      toast(error.message, "error");
    } finally {
      pending.delete(deleteId);
      setButtonLoading(deleteButton, false);
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;

  const data = new FormData(form);
  const id = data.get("id");
  const payload = { name: data.get("name") };

  saving = true;
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
    saving = false;
    setButtonLoading(saveButton, false);
  }
});

if (requireAuth()) {
  loadCategories();
}
