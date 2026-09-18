import { api } from "./api.js";
import { escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/categorias.html");

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
      // O botao carrega o nome em data-name: editar nao precisa de requisicao.
      // O escapeHtml aqui e essencial: XSS acontece tambem dentro de atributos.
      (category) => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3 font-medium text-slate-800">${escapeHtml(category.name)}</td>
          <td class="px-4 py-3 text-right text-slate-600">${category.productCount}</td>
          <td class="px-6 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${category.id}"
              data-name="${escapeHtml(category.name)}"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >Editar</button>
            <button
              data-delete="${category.id}"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >Excluir</button>
          </td>
        </tr>
      `
    )
    .join("");
}

// Desfaz o modo edicao: limpa campos, zera o id e esconde o Cancelar
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

// Delegacao de eventos no container da tabela
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
    // A mensagem explica a consequencia (ON DELETE SET NULL)
    if (!window.confirm("Excluir esta categoria? Os produtos ficarao sem categoria.")) return;

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

loadCategories();
