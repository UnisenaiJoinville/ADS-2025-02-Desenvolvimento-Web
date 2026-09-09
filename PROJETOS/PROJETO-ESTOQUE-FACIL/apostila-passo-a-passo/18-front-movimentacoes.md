# Etapa 18 — Tela de Movimentações

📋 **Tipo:** prática (HTML + JavaScript)

---

## Objetivo

Criar a tela onde o estoque **sobe e desce**: formulário de entrada/saída com aviso do saldo atual, e histórico filtrável.

---

## Antes de começar

- [ ] Etapa 17 concluída (tela de produtos funcionando)

---

## O que vamos construir

```text
 +--------------------------------------------------------------+
 |  Movimentacoes                                               |
 |  Cada entrada soma e cada saida subtrai a quantidade         |
 |                                                              |
 |  +-------------------+  +---------------------------------+  |
 |  | Registrar         |  | Historico  [Todas][Entr][Said]  |  |
 |  |                   |  |                                 |  |
 |  | Produto [v]       |  | Teclado    Saida   -2   09/09   |  |
 |  | Estoque atual: 40 |  | Teclado    Entrada +5   09/09   |  |
 |  |                   |  | Mouse      Entrada +18  09/09   |  |
 |  | [Entrada][Saida]  |  | Caneta     Saida   -25  09/09   |  |
 |  | Quantidade [__]   |  |                                 |  |
 |  | Observacao [____] |  |                                 |  |
 |  |    [ Registrar ]  |  |                                 |  |
 |  +-------------------+  +---------------------------------+  |
 +--------------------------------------------------------------+
```

---

## Passo 1 — Criar o `public/movimentacoes.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Movimentacoes | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <div data-nav></div>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Movimentacoes</h1>
        <p class="text-sm text-slate-500">
          Cada entrada soma e cada saida subtrai a quantidade do produto
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Formulario de movimentacao -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-1">
          <h2 class="mb-4 text-lg font-semibold text-slate-900">Registrar movimentacao</h2>

          <form data-form class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Produto</label>
              <select
                name="productId"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Selecione...</option>
              </select>
              <p data-stock-hint class="mt-1 text-xs text-slate-500"></p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="cursor-pointer">
                  <input type="radio" name="type" value="IN" class="peer sr-only" checked />
                  <span
                    class="block rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700"
                  >
                    Entrada
                  </span>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" name="type" value="OUT" class="peer sr-only" />
                  <span
                    class="block rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-600 peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-700"
                  >
                    Saida
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Quantidade</label>
              <input
                name="quantity"
                type="number"
                min="1"
                value="1"
                required
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Observacao</label>
              <input
                name="note"
                placeholder="Compra, venda, ajuste..."
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <button
              class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Registrar
            </button>
          </form>
        </section>

        <!-- Historico -->
        <section class="rounded-2xl border border-slate-200 bg-white lg:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-900">Historico</h2>
            <div class="flex gap-1 rounded-xl bg-slate-100 p-1">
              <button data-filter="" class="rounded-lg px-3 py-1.5 text-xs font-semibold">Todas</button>
              <button data-filter="IN" class="rounded-lg px-3 py-1.5 text-xs font-semibold">Entradas</button>
              <button data-filter="OUT" class="rounded-lg px-3 py-1.5 text-xs font-semibold">Saidas</button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-6 py-3">Produto</th>
                  <th class="px-4 py-3">Tipo</th>
                  <th class="px-4 py-3 text-right">Qtd.</th>
                  <th class="px-4 py-3">Observacao</th>
                  <th class="px-6 py-3 text-right">Data</th>
                </tr>
              </thead>
              <tbody data-rows class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </section>
      </div>
    </main>

    <div data-toast-stack class="fixed bottom-6 right-6 z-50 flex flex-col gap-2"></div>

    <script type="module" src="/js/movimentacoes.js"></script>
  </body>
</html>
```

Salve.

---

## 🎨 O truque do `peer` — botões bonitos que ainda são radio

Esta é a parte mais interessante do HTML desta etapa:

```html
<label class="cursor-pointer">
  <input type="radio" name="type" value="IN" class="peer sr-only" checked />
  <span class="block rounded-xl border ... peer-checked:border-emerald-500
               peer-checked:bg-emerald-50 peer-checked:text-emerald-700">
    Entrada
  </span>
</label>
```

| Classe | O que faz |
|---|---|
| `sr-only` | Esconde **visualmente**, mas mantém para leitores de tela |
| `peer` | Marca este input como "referência" para os irmãos |
| `peer-checked:` | Aplica o estilo ao `<span>` **quando o input estiver marcado** |

### O resultado

```text
   Entrada selecionada:        Saída selecionada:

   +----------+----------+     +----------+----------+
   | Entrada  | Saida    |     | Entrada  | Saida    |
   | (verde)  | (cinza)  |     | (cinza)  |(vermelho)|
   +----------+----------+     +----------+----------+
```

### 💡 Por que não usar dois botões comuns?

Porque aí você teria que:

- guardar o estado em uma variável;
- escrever JavaScript para trocar as classes;
- perder a navegação por teclado e a acessibilidade.

Com o `peer`, o **navegador** cuida de tudo. O elemento continua sendo um `<input type="radio">` de verdade: funciona com `Tab`, setas do teclado, leitores de tela e é lido pelo `FormData` normalmente.

> 📌 **Princípio:** use o elemento HTML semanticamente correto e estilize por cima. Não recrie comportamentos que o navegador já oferece de graça.

---

## Passo 2 — Criar o `public/js/movimentacoes.js`

### Parte A — Imports e estado

```javascript
import { api } from "./api.js";
import { escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";

mountLayout("/movimentacoes.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const stockHint = document.querySelector("[data-stock-hint]");
const filterButtons = document.querySelectorAll("[data-filter]");

let products = [];
let activeFilter = "";
```

Duas variáveis guardam o **estado** da tela:

| Variável | Guarda |
|---|---|
| `products` | A lista carregada, para consultar o saldo sem ir à API |
| `activeFilter` | Qual aba está selecionada (`""`, `"IN"` ou `"OUT"`) |

### Parte B — Destacar a aba ativa

```javascript
function highlightFilters() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;

    button.className = isActive
      ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800";
  });
}
```

Trocamos a classe inteira conforme o botão está ativo ou não. O ativo ganha fundo branco e sombra, parecendo "levantado" sobre a trilha cinza.

### Parte C — Renderizar o histórico

```javascript
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
```

O `isIn` controla **três** coisas de uma vez: a cor da etiqueta, o texto (Entrada/Saída) e o sinal (`+`/`-`).

### Parte D — Carregar dados

```javascript
async function loadProducts() {
  products = await api.listProducts();

  form.elements.productId.innerHTML =
    '<option value="">Selecione...</option>' +
    products
      .map(
        (product) =>
          `<option value="${product.id}">${escapeHtml(product.name)} (${escapeHtml(product.sku)})</option>`
      )
      .join("");
}

async function loadMovements() {
  try {
    const movements = await api.listMovements({ type: activeFilter });
    renderRows(movements);
  } catch (error) {
    toast(error.message, "error");
  }
}
```

Repare que `loadProducts` guarda a lista na variável `products` **e** monta o select. Vamos usar a lista guardada no próximo trecho.

### Parte E — A dica de saldo

```javascript
function updateStockHint() {
  const productId = Number(form.elements.productId.value);
  const product = products.find((item) => item.id === productId);

  stockHint.textContent = product
    ? `Estoque atual: ${product.quantity} unidade(s) - minimo ${product.minimumStock}`
    : "";
}

form.elements.productId.addEventListener("change", updateStockHint);
```

Quando o usuário escolhe um produto, aparece embaixo do select:

```text
Estoque atual: 40 unidade(s) - minimo 10
```

#### 🔍 Dois detalhes importantes

**1. Usa `find`, não `for` com flag**

```javascript
const product = products.find((item) => item.id === productId);
```

Compare com a abordagem problemática:

```javascript
// ❌ Abordagem problemática: percorre TUDO mesmo depois de achar
var achou = null;
for (var i = 0; i < x.length; i++) {
  if (x[i].nome == n) {
    achou = x[i];
  }
}
```

O `find` **para na primeira ocorrência** e é muito mais legível.

**2. Converte antes de comparar**

```javascript
const productId = Number(form.elements.productId.value);
//                ^^^^^^
products.find((item) => item.id === productId);
```

O `value` de um `<select>` é sempre **string**. Sem o `Number()`:

```javascript
"5" === 5     // false 😱 nunca encontraria o produto
```

> 📌 Esse é o mesmo cuidado com coerção de tipos que aplicamos no backend. A regra vale nos dois lados.

**3. Consulta local, sem ir à API**

Como já temos a lista em `products`, a dica aparece **instantaneamente**, sem nova requisição.

### Parte F — Os filtros e o envio

```javascript
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

  try {
    await api.createMovement(payload);

    toast(payload.type === "IN" ? "Entrada registrada" : "Saida registrada");

    form.reset();
    stockHint.textContent = "";

    // Recarrega os produtos para refletir o novo saldo no seletor.
    await loadProducts();
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
});

async function init() {
  highlightFilters();

  try {
    await loadProducts();
    await loadMovements();
  } catch (error) {
    toast(error.message, "error");
  }
}

init();
```

#### ⭐ A linha mais importante da tela

```javascript
// Recarrega os produtos para refletir o novo saldo no seletor.
await loadProducts();
```

**Por que recarregar os produtos depois de registrar?**

Porque a movimentação **mudou o saldo** do produto no banco. Se não recarregássemos, a variável `products` ficaria com o valor antigo e a dica de estoque mostraria um número **desatualizado**.

```text
   1. products em memória: Café tem 40
   2. usuário registra entrada de 15
   3. no banco agora: Café tem 55
   4. sem recarregar, a dica ainda diria "40"  ❌
   5. com recarregar, a dica diz "55"  ✅
```

> 📌 **Lição geral:** sempre que uma ação mudar dados no servidor, recarregue o que depende deles. Estado desatualizado na tela é fonte de confusão para o usuário.

#### `data.get("type")` com radio buttons

```javascript
type: data.get("type"),
```

Como os dois radios têm o mesmo `name="type"`, o `FormData` devolve o valor do que estiver **marcado**: `"IN"` ou `"OUT"`. Não precisa de nenhuma lógica extra.

#### O toast contextual

```javascript
toast(payload.type === "IN" ? "Entrada registrada" : "Saida registrada");
```

Mensagem específica em vez de um genérico "salvo com sucesso". O usuário confirma visualmente **o que** foi feito.

---

## Passo 3 — Montar o arquivo

Crie `public/js/movimentacoes.js` juntando as partes A até F, na ordem.

---

## Passo 4 — 🧪 O teste que fecha o projeto

Acesse:

```text
http://localhost:3000/movimentacoes.html
```

### Roteiro completo

1. **Selecione** `Cafe em graos 1kg` no seletor
   → aparece: *"Estoque atual: 40 unidade(s) - minimo 10"*

2. **Deixe em "Entrada"**, quantidade `50`, observação `Compra fornecedor`
   → clique em **Registrar**
   → toast verde: *"Entrada registrada"*

3. **Selecione o café de novo**
   → agora a dica diz **90 unidades** ✅ (40 + 50)

4. **Clique em "Saida"** (o botão fica vermelho), quantidade `30`
   → **Registrar**
   → toast: *"Saida registrada"*, linha vermelha com `-30` no histórico

5. **Selecione o café**
   → agora **60 unidades** ✅ (90 - 30)

6. **🎯 Teste o limite:** escolha o café, **Saida**, quantidade `9999`
   → toast **vermelho**: *"Estoque insuficiente. Disponivel: 60 unidade(s)"*

7. **Confirme que nada mudou:** selecione o café de novo → continua **60**
   E o histórico **não** ganhou linha nova

8. **Teste os filtros:** clique em **Entradas**, depois **Saídas**, depois **Todas**

9. **Volte ao Dashboard** → os cards de entrada/saída do mês refletem tudo

### 🎉 O que você acabou de ver

O toast vermelho do passo 6 é a **transação da Etapa 13** funcionando:

```text
   navegador  ->  api.js  ->  Express  ->  service  ->  repository
                                                            |
                                            BEGIN TRANSACTION
                                            SELECT ... FOR UPDATE
                                            saldo ficaria negativo!
                                            ROLLBACK
                                                            |
   toast vermelho <- errorHandler <- AppError <- "INSUFFICIENT_STOCK"
```

Todo o caminho que construímos ao longo do projeto, funcionando de ponta a ponta.

---

## ✅ Confira se deu certo

- [ ] `public/movimentacoes.html` e `public/js/movimentacoes.js` existem
- [ ] Os botões Entrada/Saída mudam de cor ao serem selecionados
- [ ] Ao escolher um produto, aparece a dica com o estoque atual
- [ ] Registrar entrada **aumenta** o saldo mostrado na dica
- [ ] Registrar saída **diminui** o saldo
- [ ] Saída maior que o estoque mostra o toast vermelho com o disponível
- [ ] Após a recusa, o histórico **não** ganhou linha nova
- [ ] Os três filtros do histórico funcionam
- [ ] Entradas aparecem em verde com `+`, saídas em vermelho com `-`

---

## 🔧 Se deu erro

| Sintoma | Causa | Solução |
|---|---|---|
| A dica de estoque não aparece | Faltou o listener | `form.elements.productId.addEventListener("change", updateStockHint)` |
| A dica mostra saldo desatualizado | Não recarregou | `await loadProducts()` depois de registrar |
| A dica nunca encontra o produto | Comparação de tipos | `Number(form.elements.productId.value)` |
| Os botões Entrada/Saída não mudam de cor | Classes do peer | Confira `peer sr-only` no input e `peer-checked:` no span |
| `type` chega `undefined` | `name` diferente nos radios | Os dois precisam ter `name="type"` |
| Os filtros não destacam | `highlightFilters` não chamada | Chame no `init()` e a cada clique |

---

## ➡️ Próximo passo

Falta a tela mais simples do sistema.

**[Etapa 19 — Tela de Categorias](19-front-categorias.md)**
