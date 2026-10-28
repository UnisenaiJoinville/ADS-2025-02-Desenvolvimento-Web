import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import {
  confirmDialog,
  escapeHtml,
  mountLayout,
  setButtonLoading,
  skeletonRows,
  toast,
} from "./layout.js";
import { renderIcons } from "./icons.js";

mountLayout("/categorias.html");

const form = document.querySelector("[data-form]");
const rows = document.querySelector("[data-rows]");
const cancel = document.querySelector("[data-cancel]");
const saveButton = document.querySelector("[data-save]");

function reset() {
  form.reset();
  form.elements.id.value = "";
  cancel.classList.add("hidden");
}

function render(list) {
  rows.innerHTML = list.length
    ? list.map((category) => `<tr>
        <td class="px-6 py-3 font-medium">${escapeHtml(category.name)}</td>
        <td class="px-4 py-3 text-right">${category.productCount}</td>
        <td class="px-6 py-3 text-right">
          <button type="button" data-edit="${category.id}" data-name="${escapeHtml(category.name)}" aria-label="Editar ${escapeHtml(category.name)}" title="Editar" class="mr-2 inline-flex rounded border px-2 py-1 text-xs"><i data-lucide="pencil" class="h-4 w-4"></i></button>
          <button type="button" data-delete="${category.id}" aria-label="Excluir ${escapeHtml(category.name)}" title="Excluir" class="inline-flex rounded border border-rose-200 px-2 py-1 text-xs text-rose-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
        </td>
      </tr>`).join("")
    : "<tr><td colspan='3' class='px-6 py-10 text-center text-sm text-slate-500'>Nenhuma categoria cadastrada</td></tr>";

  renderIcons();
}

async function load() {
  rows.innerHTML = skeletonRows(3, 4);
  rows.setAttribute("aria-busy", "true");

  try {
    render(await api.listCategories());
  } catch (error) {
    toast(error.message, "error");
  } finally {
    rows.removeAttribute("aria-busy");
  }
}

cancel.addEventListener("click", reset);

rows.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-edit], button[data-delete]");
  if (!button) return;

  if (button.dataset.edit) {
    form.elements.id.value = button.dataset.edit;
    form.elements.name.value = button.dataset.name;
    cancel.classList.remove("hidden");
    form.elements.name.focus();
    return;
  }

  const confirmed = await confirmDialog({
    title: "Excluir categoria?",
    message: "Os produtos vinculados ficarao sem categoria.",
    confirmLabel: "Excluir",
  });
  if (!confirmed) return;

  try {
    await api.deleteCategory(button.dataset.delete);
    toast("Categoria excluida");
    reset();
    await load();
  } catch (error) {
    toast(error.message, "error");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  setButtonLoading(saveButton, true, "Salvando...");

  try {
    if (data.get("id")) {
      await api.updateCategory(data.get("id"), { name: data.get("name") });
      toast("Categoria atualizada");
    } else {
      await api.createCategory({ name: data.get("name") });
      toast("Categoria cadastrada");
    }

    reset();
    await load();
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
});

if (requireAuth()) load();
