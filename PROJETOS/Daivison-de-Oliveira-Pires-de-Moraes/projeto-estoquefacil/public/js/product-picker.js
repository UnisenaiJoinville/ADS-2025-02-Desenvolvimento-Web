import { api, isCanceled } from "./api.js";
import { escapeHtml } from "./layout.js";
let nextId = 0;
export function createProductPicker(
  element,
  { onSelect = () => {}, placeholder = "Buscar produto por nome ou SKU" } = {},
) {
  const id = `picker-${++nextId}`;
  element.innerHTML = `<label for="${id}" class="mb-1 block text-sm font-medium">Produto</label><div class="relative"><input id="${id}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list" class="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="${escapeHtml(placeholder)}"><ul id="${id}-list" role="listbox" class="absolute z-30 mt-1 hidden max-h-64 w-full overflow-y-auto rounded-xl border bg-white shadow-lg"></ul></div><p aria-live="polite" class="mt-1 text-xs text-slate-500" data-picker-status></p>`;
  const input = element.querySelector("input"),
    list = element.querySelector("ul"),
    status = element.querySelector("[data-picker-status]");
  let timer,
    controller,
    results = [],
    selected = null,
    index = -1,
    sequence = 0;
  function close() {
    list.classList.add("hidden");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  function highlight(value) {
    const term = input.value.trim(),
      source = String(value),
      at = source.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
    return at < 0 || !term
      ? escapeHtml(source)
      : escapeHtml(source.slice(0, at)) +
          "<mark>" +
          escapeHtml(source.slice(at, at + term.length)) +
          "</mark>" +
          escapeHtml(source.slice(at + term.length));
  }
  function render() {
    list.innerHTML = results
      .map(
        (p, i) =>
          `<li id="${id}-option-${i}" role="option" aria-selected="${i === index}" data-index="${i}" class="cursor-pointer px-3 py-2 ${i === index ? "bg-slate-200" : ""}"><p>${highlight(p.name)}</p><small>${highlight(p.sku)} · saldo ${p.quantity}</small></li>`,
      )
      .join("");
    list.classList.toggle("hidden", !results.length);
    input.setAttribute("aria-expanded", String(!!results.length));
    if (index >= 0) {
      input.setAttribute("aria-activedescendant", `${id}-option-${index}`);
      list.children[index]?.scrollIntoView({ block: "nearest" });
    }
  }
  function choose(product) {
    selected = product;
    input.value = product ? `${product.name} (${product.sku})` : "";
    close();
    status.textContent = "";
    onSelect(product);
  }
  input.addEventListener("input", () => {
    selected = null;
    onSelect(null);
    clearTimeout(timer);
    controller?.abort();
    close();
    sequence++;
    const term = input.value.trim(),
      requestId = sequence;
    if (!term) {
      status.textContent = "";
      return;
    }
    status.textContent = "Buscando...";
    timer = setTimeout(async () => {
      controller = new AbortController();
      try {
        const rows = await api.searchProducts(term, {
          signal: controller.signal,
        });
        if (requestId !== sequence) return;
        results = rows;
        index = -1;
        render();
        status.textContent = rows.length
          ? `${rows.length} sugestoes`
          : "Nenhum produto encontrado";
      } catch (e) {
        if (!isCanceled(e) && requestId === sequence)
          status.textContent = e.message;
      }
    }, 300);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (!results.length || list.classList.contains("hidden")) return;
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      index =
        (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) %
        results.length;
      render();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (index >= 0) choose(results[index]);
    }
  });
  list.addEventListener("mousedown", (event) => {
    const item = event.target.closest("[data-index]");
    if (item) {
      event.preventDefault();
      choose(results[Number(item.dataset.index)]);
    }
  });
  input.addEventListener("blur", close);
  return {
    get value() {
      return selected;
    },
    reset() {
      clearTimeout(timer);
      controller?.abort();
      sequence++;
      results = [];
      index = -1;
      choose(null);
    },
    set: choose,
    destroy() {
      clearTimeout(timer);
      controller?.abort();
      element.innerHTML = "";
    },
  };
}
