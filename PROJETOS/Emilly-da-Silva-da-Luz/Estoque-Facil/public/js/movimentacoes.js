import {api,isCanceled} from "./api.js";
import { requireAuth } from "./auth.js";
import { escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/movimentacoes.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const stockHint = document.querySelector("[data-stock-hint]");
const filterButtons = document.querySelectorAll("[data-filter]");

let selectedProduct = null;
let suggestions = [];
let abortSearch;
let searchTimer;
let activeOption = -1;
const searchInput = document.querySelector("[data-product-search]");
const optionsList = document.querySelector("[data-product-options]");
let activeFilter = "";
function highlightFilters() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;

    button.className = isActive
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}
function renderRows(movements) {
  if (movements.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="5" class="px-6 py-10 text-center text-sm text-slate-500">
        Nenhuma movimentacao registrada
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = movements
    .map((movement) => {
      const isIn = movement.type === "IN";

      return `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3">
            <p class="font-medium text-slate-800">${escapeHtml(movement.productName)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(movement.productSku)}</p>
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${
              isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }">${isIn ? "Entrada" : "Saida"}</span>
          </td>
          <td class="px-4 py-3 text-right font-semibold ${
            isIn ? "text-emerald-600" : "text-rose-600"
          }">${isIn ? "+" : "-"}${movement.quantity}</td>
          <td class="px-4 py-3 text-slate-600">${escapeHtml(movement.note ?? "-")}</td>
          <td class="px-6 py-3 text-right text-slate-500">${formatDateTime(movement.createdAt)}</td>
        </tr>
      `;
    })
    .join("");
}
function chooseProduct(product) {
 selectedProduct = product;
 form.elements.productId.value = product.id;
 searchInput.value = `${product.name} (${product.sku})`;
 optionsList.classList.add('hidden');searchInput.setAttribute('aria-expanded','false');
 updateStockHint();
}
function renderSuggestions() {
 optionsList.innerHTML = suggestions.map((x,i)=>`<li role="option" aria-selected="${i===activeOption}" data-option="${i}" class="cursor-pointer px-3 py-2 hover:bg-slate-100 ${i===activeOption?'bg-slate-100':''}">${escapeHtml(x.name)} <small>${escapeHtml(x.sku)} · ${x.quantity} un.</small></li>`).join('') || '<li class="px-3 py-2 text-slate-500">Nenhum produto encontrado</li>';
 optionsList.classList.remove('hidden');searchInput.setAttribute('aria-expanded','true');
}
searchInput.addEventListener('input',()=>{
 selectedProduct=null;form.elements.productId.value='';stockHint.textContent='';
 clearTimeout(searchTimer);abortSearch?.abort();
 if(!searchInput.value.trim()){suggestions=[];optionsList.classList.add('hidden');return;}
 searchTimer=setTimeout(async()=>{abortSearch=new AbortController();try{suggestions=await api.searchProducts(searchInput.value.trim(),8,{signal:abortSearch.signal});activeOption=-1;renderSuggestions();}catch(e){if(!isCanceled(e))toast(e.message,'error');}},250);
});
searchInput.addEventListener('keydown',e=>{
 if(e.key==='Escape'){optionsList.classList.add('hidden');return;}
 if(!suggestions.length)return;
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();activeOption=(activeOption+(e.key==='ArrowDown'?1:-1)+suggestions.length)%suggestions.length;renderSuggestions();}
 if(e.key==='Enter'&&!optionsList.classList.contains('hidden')){e.preventDefault();chooseProduct(suggestions[Math.max(0,activeOption)]);}
});
optionsList.addEventListener('click',e=>{const li=e.target.closest('[data-option]');if(li)chooseProduct(suggestions[Number(li.dataset.option)]);});
document.addEventListener('click',e=>{if(!e.target.closest('[data-product-picker]'))optionsList.classList.add('hidden');});
async function loadMovements() {
  try {
    const movements = await api.listMovements({ type: activeFilter });
    renderRows(movements);
  } catch (error) {
    toast(error.message, "error");
  }
}
function updateStockHint() {stockHint.textContent=selectedProduct?`Estoque atual: ${selectedProduct.quantity} unidade(s) - minimo ${selectedProduct.minimumStock}`:'';}
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    highlightFilters();
    loadMovements();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);

  const payload = {
    productId: Number(data.get("productId")),
    type: data.get("type"),
    quantity: Number(data.get("quantity")),
    note: data.get("note"),
  };

  if (!selectedProduct) {toast("Selecione um produto da lista", "error");return;}
  if (payload.type === "OUT" && payload.quantity > selectedProduct.quantity) {toast("Estoque insuficiente", "error");return;}
  const button = form.querySelector("button[type=submit],button:not([type])");if(button)button.disabled=true;
  try {
    await api.createMovement(payload);

    toast(payload.type === "IN" ? "Entrada registrada" : "Saida registrada");

    form.reset();
    stockHint.textContent = "";

    selectedProduct=null;searchInput.value="";form.elements.productId.value="";
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  } finally {if(button)button.disabled=false;}
});

async function init() {
  highlightFilters();

  try {
    selectedProduct=null;searchInput.value="";form.elements.productId.value="";
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
}

if (requireAuth()) {
  init();
}
