import { renderIcons } from "./icons.js";
import { confirmDialog, setButtonLoading, skeletonRows } from "./layout.js";
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/categorias.html");

let saving = false;
const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const cancelButton = document.querySelector("[data-cancel]");

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
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
             aria-label="Editar categoria"><i data-lucide="pencil"></i><span class="sr-only">Editar</span></button>

            <button
              data-delete="${category.id}"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
             aria-label="Excluir categoria"><i data-lucide="trash-2"></i><span class="sr-only">Excluir</span></button>
          </td>
        </tr>
      `,
    )
    .join("");
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  cancelButton.classList.add("hidden");
}

async function loadCategories() {
  try {
    const categories = await api.listCategories();
    renderRows(categories);
    renderIcons();
  } catch (error) {
    toast(error.message, "error");
  }
}

cancelButton.addEventListener("click", resetForm);

rowsContainer.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const editId = editButton?.dataset.edit;
  const deleteId = event.target.closest("[data-delete]")?.dataset.delete;

  if (editId) {
    form.elements.id.value = editId;
    form.elements.name.value = editButton.dataset.name;
    form.elements.name.focus();
    cancelButton.classList.remove("hidden");
  }

  if (deleteId) {
    if (
      !(await confirmDialog({
        title: "Excluir categoria?",
        message: "Os produtos ficarao sem categoria.",
        confirmLabel: "Excluir",
      }))
    )
      return;
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
  if (saving) return;
  saving = true;
  const saveButton = form.querySelector("button:not([type=button])");
  setButtonLoading(saveButton, true);

  const data = new FormData(form);
  const id = data.get("id");
  const payload = {
    name: data.get("name"),
  };

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

// Protege a página e só carrega os dados se houver uma sessão válida.
if (requireAuth()) {
  rowsContainer.innerHTML = skeletonRows(3);
  loadCategories();
}
