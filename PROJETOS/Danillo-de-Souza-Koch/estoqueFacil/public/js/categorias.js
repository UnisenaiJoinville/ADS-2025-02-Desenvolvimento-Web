import { api } from "./api.js";
import { escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/categorias.html");
const form = document.querySelector("[data-form]"), rows = document.querySelector("[data-rows]"), cancel = document.querySelector("[data-cancel]");
function reset() { form.reset(); form.elements.id.value = ""; cancel.classList.add("hidden"); }
function render(list) { rows.innerHTML = list.length ? list.map((c) => `<tr><td class="px-6 py-3 font-medium">${escapeHtml(c.name)}</td><td class="px-4 py-3 text-right">${c.productCount}</td><td class="px-6 py-3 text-right"><button data-edit="${c.id}" data-name="${escapeHtml(c.name)}" class="mr-2 rounded border px-2 py-1 text-xs">Editar</button><button data-delete="${c.id}" class="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600">Excluir</button></td></tr>`).join("") : "<tr><td colspan='3' class='px-6 py-10 text-center text-sm text-slate-500'>Nenhuma categoria cadastrada</td></tr>"; }
async function load() { try { render(await api.listCategories()); } catch (error) { toast(error.message, "error"); } }
cancel.addEventListener("click", reset); rows.addEventListener("click", async (e) => { if (e.target.dataset.edit) { form.elements.id.value = e.target.dataset.edit; form.elements.name.value = e.target.dataset.name; cancel.classList.remove("hidden"); form.elements.name.focus(); } if (e.target.dataset.delete && window.confirm("Excluir esta categoria? Os produtos ficarao sem categoria.")) { try { await api.deleteCategory(e.target.dataset.delete); toast("Categoria excluida"); reset(); load(); } catch (error) { toast(error.message, "error"); } } });
form.addEventListener("submit", async (e) => { e.preventDefault(); const data = new FormData(form); try { if (data.get("id")) { await api.updateCategory(data.get("id"), { name: data.get("name") }); toast("Categoria atualizada"); } else { await api.createCategory({ name: data.get("name") }); toast("Categoria cadastrada"); } reset(); load(); } catch (error) { toast(error.message, "error"); } });
load();
