import { api, isAuthenticated } from "./api.js";
import { confirmDialog, escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/categorias.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const cancelButton = document.querySelector("[data-cancel]");
const authNotice = document.querySelector("[data-auth-notice]");

function applyAuthGuard() {
  const authenticated = isAuthenticated();

  authNotice.classList.toggle("hidden", authenticated);

  document.querySelectorAll("[data-requires-auth]").forEach((element) => {
    element.classList.toggle("hidden", !authenticated);
  });
}

function renderRows(categories) {
  const authenticated = isAuthenticated();

  if (categories.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="3" class="px-6 py-10 text-center text-sm text-slate-500">
        Nenhuma categoria cadastrada
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = categories
    .map((category) => {
      const actions = authenticated
        ? `
          <button
            data-edit="${category.id}"
            data-name="${escapeHtml(category.name)}"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >Editar</button>
          <button
            data-delete="${category.id}"
            class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >Excluir</button>
        `
        : `<span class="text-xs text-slate-400">Somente leitura</span>`;

      return `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3 font-medium text-slate-800">${escapeHtml(category.name)}</td>
          <td class="px-4 py-3 text-right text-slate-600">${category.productCount}</td>
          <td class="px-6 py-3 text-right whitespace-nowrap">${actions}</td>
        </tr>
      `;
    })
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
  } catch (error) {
    toast(error.message, "error");
  }
}

cancelButton.addEventListener("click", resetForm);

rowsContainer.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    form.elements.id.value = editId;
    form.elements.name.value = event.target.dataset.name;
    form.elements.name.focus();
    cancelButton.classList.remove("hidden");
  }

  if (deleteId) {
    // Exercicio 1.4 — modal de confirmacao no padrao visual.
    const confirmed = await confirmDialog(
      "Excluir esta categoria? Os produtos dela ficarao sem categoria."
    );
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
  }
});

applyAuthGuard();
loadCategories();
