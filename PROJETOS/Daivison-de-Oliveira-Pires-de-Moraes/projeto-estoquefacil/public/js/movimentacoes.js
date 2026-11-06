import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { createProductPicker } from "./product-picker.js";
import {
  escapeHtml,
  formatDateTime,
  mountLayout,
  toast,
  setButtonLoading,
  skeletonRows,
} from "./layout.js";
mountLayout("/movimentacoes.html");
const form = document.querySelector("[data-form]"),
  rows = document.querySelector("[data-rows]"),
  hint = document.querySelector("[data-stock-hint]"),
  submit = form.querySelector("button");
let selected = null,
  busy = false,
  activeFilter = "",
  loadSequence = 0;
const picker = createProductPicker(
  document.querySelector("[data-product-picker]"),
  {
    onSelect(p) {
      selected = p;
      updateHint();
    },
  },
);
function updateHint() {
  const quantity = Number(form.elements.quantity.value),
    type = form.elements.type.value;
  const insufficient =
    selected && type === "OUT" && quantity > selected.quantity;
  form.elements.quantity.min = type === "ADJUST" ? "0" : "1";
  form.elements.note.required = type === "ADJUST";
  hint.textContent = selected
    ? `Saldo atual: ${selected.quantity}. ${type === "ADJUST" ? "Ajuste define o novo saldo contado." : ""} ${insufficient ? "Estoque insuficiente." : ""}`
    : "";
  hint.className = insufficient
    ? "text-sm text-rose-600"
    : "text-sm text-slate-600";
  submit.disabled = busy || insufficient;
}
async function load() {
  const sequence = ++loadSequence;
  rows.innerHTML = skeletonRows(6);
  try {
    const movements = await api.listMovements({
      type: activeFilter,
      from: document.querySelector("[data-from]").value,
      to: document.querySelector("[data-to]").value,
    });
    if (sequence !== loadSequence) return;
    rows.innerHTML = movements.length
      ? movements
          .map(
            (m) =>
              `<tr class="border-b"><td class="px-4 py-3">${escapeHtml(m.productName)}<small class="block">${escapeHtml(m.productSku)}</small></td><td class="px-4">${{ IN: "Entrada", OUT: "Saida", ADJUST: "Ajuste" }[m.type]}</td><td class="px-4 text-right">${m.type === "IN" ? "+" : m.type === "OUT" ? "-" : "="}${m.quantity}${m.type === "ADJUST" ? `<small class="block">${m.previousQuantity} → ${m.resultingQuantity}</small>` : ""}</td><td class="px-4">${escapeHtml(m.userName)}</td><td class="px-4">${escapeHtml(m.note ?? "-")}</td><td class="px-4">${formatDateTime(m.createdAt)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="6" class="p-8 text-center">Nenhuma movimentacao encontrada</td></tr>';
  } catch (e) {
    if (sequence === loadSequence) {
      rows.innerHTML =
        '<tr><td colspan="6" class="p-4">Nao foi possivel carregar.</td></tr>';
      toast(e.message, "error");
    }
  }
}
form.addEventListener("input", updateHint);
form.addEventListener("change", updateHint);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  if (!selected) return toast("Selecione um produto nas sugestoes", "error");
  busy = true;
  setButtonLoading(submit, true, "Registrando...");
  try {
    await api.createMovement({
      productId: selected.id,
      type: form.elements.type.value,
      quantity: Number(form.elements.quantity.value),
      note: form.elements.note.value,
    });
    toast("Movimentacao registrada");
    form.reset();
    picker.reset();
    await load();
  } catch (e) {
    toast(e.message, "error");
  } finally {
    busy = false;
    setButtonLoading(submit, false);
    updateHint();
  }
});
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    load();
  }),
);
for (const key of ["from", "to"])
  document.querySelector(`[data-${key}]`).addEventListener("change", load);
if (requireAuth()) load();
