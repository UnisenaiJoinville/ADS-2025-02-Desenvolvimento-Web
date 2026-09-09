# Aula 15 — Base do front-end

⏱️ **Tempo estimado:** 30 minutos
📋 **Tipo:** prática (JavaScript do navegador)

---

## Objetivo

Criar os dois arquivos que **todas as telas** vão usar:

- `public/js/api.js` — a camada única de acesso à API
- `public/js/layout.js` — menu, formatação e notificações

E entender como o Tailwind CSS entra no projeto.

---

## Antes de começar

- [ ] Aula 14 concluída (API completa, `/api/dashboard` respondendo)

---

## 1. Como o Tailwind entra no projeto

Tailwind CSS é um framework de **classes utilitárias**. Em vez de escrever CSS em outro arquivo, você compõe o visual direto no HTML.

### A diferença na prática

```html
<!-- CSS tradicional: dois lugares para manter -->
<div class="card">...</div>

<style>
  .card {
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: white;
    padding: 24px;
  }
</style>
```

```html
<!-- Tailwind: tudo em um lugar -->
<div class="rounded-2xl border border-slate-200 bg-white p-6">...</div>
```

### Como incluir

Basta uma linha no `<head>` de cada página:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

> ⚠️ **Aviso para produção:** o CDN compila o CSS no navegador do usuário. É perfeito para aprender e prototipar, mas pesado em produção. Em um projeto real, você instalaria o Tailwind via `npm` e geraria um CSS mínimo, só com as classes usadas.

### As classes que mais vamos repetir

Guarde esta tabela — ela explica 90% do que veremos:

| Classe | O que faz |
|---|---|
| `flex` / `grid` | Define o tipo de layout |
| `gap-4` | Espaço entre os itens |
| `p-6` / `px-4` / `py-2` | Padding (espaço interno) |
| `mt-4` / `mb-6` | Margin (espaço externo) |
| `rounded-xl` | Cantos arredondados |
| `border border-slate-200` | Borda fina cinza |
| `bg-white` / `text-slate-900` | Cor de fundo / do texto |
| `text-sm` / `font-semibold` | Tamanho e peso do texto |
| `hover:bg-slate-700` | Muda ao passar o mouse |
| `sm:grid-cols-2` | A partir de telas médias, 2 colunas |

### A escala de números

Quase toda classe usa uma escala: `1` = 4px.

| Classe | Pixels |
|---|---|
| `p-1` | 4px |
| `p-2` | 8px |
| `p-4` | 16px |
| `p-6` | 24px |

E as cores vão de 50 (mais claro) a 900 (mais escuro):

```text
slate-50   slate-100   slate-200  ...  slate-800   slate-900
(quase branco)                                    (quase preto)
```

### Responsividade: *mobile first*

```html
<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

Leia assim:

| Trecho | Significa |
|---|---|
| `grid-cols-1` (padrão) | No celular: 1 coluna |
| `sm:grid-cols-2` | A partir de 640px: 2 colunas |
| `xl:grid-cols-4` | A partir de 1280px: 4 colunas |

> 📌 Você escreve primeiro para o celular e vai **acrescentando** para telas maiores. É o contrário do CSS tradicional.

---

## Passo 1 — Criar o `public/js/api.js`

Na pasta `public/js`, crie `api.js`:

```javascript
// Camada unica de acesso a API.
// Centralizar o fetch evita repetir tratamento de erro em cada tela.

const BASE_URL = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Erro ao comunicar com o servidor");
  }

  return data;
}

export const api = {
  getDashboard: () => request("/dashboard"),

  listCategories: () => request("/categories"),
  createCategory: (payload) =>
    request("/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  listProducts: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.lowStock) params.set("lowStock", "true");

    const query = params.toString();

    return request(query ? `/products?${query}` : "/products");
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  listMovements: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.productId) params.set("productId", filters.productId);
    if (filters.type) params.set("type", filters.type);

    const query = params.toString();

    return request(query ? `/movements?${query}` : "/movements");
  },
  createMovement: (payload) =>
    request("/movements", { method: "POST", body: JSON.stringify(payload) }),
};
```

Salve.

---

## Entendendo o `api.js`

### 🚨 O erro nº 1 de quem começa com `fetch`

**O `fetch` NÃO lança erro quando o servidor responde 404 ou 500.**

Veja o código enganoso:

```javascript
// ❌ ERRADO: o catch NUNCA será executado em um erro 404
try {
  const response = await fetch("/api/products/999");
  const data = await response.json();
  mostrarProduto(data);          // vai mostrar { error: "..." } como se fosse produto!
} catch (error) {
  alert("deu erro");             // nunca chega aqui
}
```

**Por quê?** Para o `fetch`, receber um 404 é uma resposta **bem-sucedida**: ele perguntou e o servidor respondeu. Ele só rejeita quando a **rede** falha (sem internet, servidor fora do ar).

### A solução: verificar `response.ok`

```javascript
if (!response.ok) {
  throw new Error(data.error ?? "Erro ao comunicar com o servidor");
}
```

| Status | `response.ok` |
|---|---|
| 200, 201, 204 | `true` |
| 400, 404, 409, 500 | `false` |

E como nosso backend **sempre** responde `{ "error": "mensagem" }` (lembra do `errorHandler` da Aula 08?), a mensagem real chega até a tela do usuário.

> 🎯 **Repare no encaixe:** o backend padroniza a resposta de erro, e o front-end padroniza a leitura dela. Um combinado com o outro.

### O status 204 sem corpo

```javascript
if (response.status === 204) {
  return null;
}
```

Nosso `DELETE` responde 204 (No Content). Se tentássemos `.json()` numa resposta vazia, daria erro de parse.

> 📌 Aqui você vê por que os detalhes do backend importam: a decisão da Aula 11 (`response.status(204).send()`) tem consequência direta aqui.

### O `.catch(() => ({}))`

```javascript
const data = await response.json().catch(() => ({}));
```

Proteção extra: se a resposta não for JSON válido (uma página de erro HTML do proxy, por exemplo), usamos um objeto vazio em vez de quebrar.

### O *spread* nas opções

```javascript
const response = await fetch(`${BASE_URL}${path}`, {
  headers: { "Content-Type": "application/json" },
  ...options,
});
```

Define o header padrão e depois **mescla** o que foi passado (`method`, `body`). Assim, cada chamada só informa o que é diferente.

### `URLSearchParams` — montando a query string

```javascript
const params = new URLSearchParams();
params.set("search", filters.search);
params.toString();     // "search=cafe%20especial"
```

**Por que não concatenar?** Porque caracteres especiais quebrariam a URL:

| Busca | Concatenando | Com URLSearchParams |
|---|---|---|
| `café & chá` | `?search=café & chá` 💥 | `?search=caf%C3%A9+%26+ch%C3%A1` ✅ |

### O objeto `api` como "cardápio"

```javascript
export const api = {
  getDashboard: () => request("/dashboard"),
  listProducts: (filters) => ...,
  createProduct: (payload) => ...,
};
```

Nas telas, o uso fica limpo e legível:

```javascript
const produtos = await api.listProducts({ lowStock: true });
await api.createProduct({ name: "Café", sku: "BEB-001" });
```

> 📌 **Vantagem:** se um dia a API mudar de `/api` para `/v2/api`, você muda **uma linha** neste arquivo. As 4 telas nem ficam sabendo.

---

## Passo 2 — Criar o `public/js/layout.js`

Na pasta `public/js`, crie `layout.js`:

```javascript
// Funcoes compartilhadas por todas as telas.

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value.replace(" ", "T"));

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Evita injecao de HTML ao montar tabelas com dados do banco.
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const NAV_ITEMS = [
  { href: "/index.html", label: "Dashboard", icon: "grid" },
  { href: "/produtos.html", label: "Produtos", icon: "box" },
  { href: "/movimentacoes.html", label: "Movimentacoes", icon: "swap" },
  { href: "/categorias.html", label: "Categorias", icon: "tag" },
];

export function renderNav(active) {
  const links = NAV_ITEMS.map((item) => {
    const isActive = item.href === active;

    const classes = isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-200 hover:text-slate-900";

    return `<a href="${item.href}" class="rounded-lg px-4 py-2 text-sm font-medium transition ${classes}">${item.label}</a>`;
  }).join("");

  return `
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-lg font-bold text-white">EF</div>
          <div>
            <p class="text-base font-semibold text-slate-900">Estoque Facil</p>
            <p class="text-xs text-slate-500">Gestao de estoque</p>
          </div>
        </div>
        <nav class="flex flex-wrap items-center gap-1">${links}</nav>
      </div>
    </header>
  `;
}

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);
  }
}

// Notificacao simples no canto da tela.
export function toast(message, variant = "success") {
  const colors = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-slate-800",
  };

  const element = document.createElement("div");
  element.className = `${colors[variant] ?? colors.info} pointer-events-none translate-y-2 rounded-xl px-4 py-3 text-sm font-medium text-white opacity-0 shadow-lg transition-all duration-200`;
  element.textContent = message;

  const stack = document.querySelector("[data-toast-stack]");
  stack.append(element);

  requestAnimationFrame(() => {
    element.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    element.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => element.remove(), 250);
  }, 3000);
}
```

Salve.

---

## Entendendo o `layout.js`

### 💰 `Intl.NumberFormat` — moeda sem gambiarra

```javascript
export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

currency.format(2744.7);    // "R$ 2.744,70"
```

Compare com a gambiarra comum:

```javascript
// ❌ Gambiarra: e o separador de milhar? e valores negativos?
"R$ " + valor.toFixed(2).replace(".", ",")
```

O `Intl` é **nativo do JavaScript** e cuida de tudo: símbolo, separador de milhar, casas decimais e a posição correta do sinal.

### 🛡️ `escapeHtml` — proteção contra XSS

```javascript
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
```

**Por que isso existe?** Imagine que alguém cadastre um produto com este nome:

```text
<script>alert('invadido')</script>
```

Se jogássemos direto no `innerHTML`, o navegador **executaria** o script:

```javascript
// ❌ PERIGOSO
container.innerHTML = `<td>${product.name}</td>`;
```

Com a função, os caracteres perigosos viram entidades HTML e o texto aparece como **texto**:

```javascript
// ✅ SEGURO
container.innerHTML = `<td>${escapeHtml(product.name)}</td>`;
```

Isso se chama **XSS** (*Cross-Site Scripting*). Em um sistema real, um atacante usaria isso para roubar a sessão de quem abrisse a tela.

> 🎯 **O paralelo que fecha o curso:**
>
> | Camada | Ameaça | Proteção |
> |---|---|---|
> | Backend | SQL Injection | Consultas com `?` |
> | Front-end | XSS | `escapeHtml` |
>
> São duas faces do **mesmo princípio**: nunca confie em dado vindo de fora.

### A ordem dos `replaceAll` importa

Repare que `&` é substituído **primeiro**. Se fosse por último, ele estragaria as substituições anteriores (`&lt;` viraria `&amp;lt;`).

### `formatDateTime` e o `.replace(" ", "T")`

```javascript
const date = new Date(value.replace(" ", "T"));
```

O MySQL devolve `"2026-09-09 00:03:42"` (com espaço). O padrão ISO usa `"T"`: `"2026-09-09T00:03:42"`. Alguns navegadores não aceitam o formato com espaço, então trocamos.

### O menu gerado por JavaScript

```javascript
export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");
  if (container) {
    container.innerHTML = renderNav(activeHref);
  }
}
```

**Por que não copiar o menu nas 4 páginas?** Porque aí, ao acrescentar uma tela, você teria que editar 4 arquivos e provavelmente esqueceria um.

Assim, cada página tem só isto no HTML:

```html
<div data-nav></div>
```

E chama:

```javascript
mountLayout("/produtos.html");
```

O parâmetro diz qual item deve aparecer **destacado**.

### 📌 Os atributos `data-*`

Usamos `data-nav`, `data-rows`, `data-form` como pontos de ancoragem do JavaScript:

```javascript
document.querySelector("[data-rows]")    // ✅ recomendado
document.querySelector(".table-rows")    // ❌ frágil
```

**Por quê?** Porque classes CSS servem para **estilo**. Se um dia você trocar o visual e remover a classe `.table-rows`, o JavaScript quebra sem aviso.

Com `data-*`, fica explícito: *"este elemento é usado pelo JavaScript, não mexa"*.

### O `toast` — notificação animada

```javascript
element.className = `... translate-y-2 opacity-0 transition-all duration-200`;
stack.append(element);

requestAnimationFrame(() => {
  element.classList.remove("translate-y-2", "opacity-0");
});
```

A animação funciona em três tempos:

1. O elemento nasce **invisível** (`opacity-0`) e **deslocado** (`translate-y-2`)
2. `requestAnimationFrame` espera o navegador desenhar
3. Removemos as classes → o `transition` anima a entrada suavemente

> 💡 **Por que o `requestAnimationFrame`?** Se removêssemos as classes na mesma linha, o navegador aplicaria tudo de uma vez e não haveria animação. Precisamos de um "respiro" entre criar e animar.

Depois de 3 segundos, o processo se inverte e o elemento é removido.

---

## ✅ Confira se deu certo

```bash
ls public/js
```

```text
api.js  layout.js
```

Marque:

- [ ] `public/js/api.js` existe e exporta `api`
- [ ] `public/js/layout.js` existe e exporta `currency`, `formatDateTime`, `escapeHtml`, `mountLayout` e `toast`
- [ ] Você entendeu por que o `fetch` precisa do `if (!response.ok)`
- [ ] Você entendeu para que serve o `escapeHtml`

### Teste rápido no navegador

Abra `http://localhost:3000/api/health` e, com `F12`, vá no **Console** e digite:

```javascript
const { api } = await import("/js/api.js");
await api.getDashboard();
```

Você deve ver o objeto do dashboard. Se aparecer, os arquivos estão sendo servidos corretamente.

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| `404 /js/api.js` | Arquivo no lugar errado | Deve estar em `public/js/`, não em `src/` |
| `Cannot use import statement outside a module` | Faltou `type="module"` | Nas páginas HTML, use `<script type="module" src="...">` |
| `api is not defined` | Import sem chaves | `import { api } from "./api.js";` |
| Alteração no JS não aparece | Cache do navegador | `Ctrl` + `Shift` + `R` (recarregar forçado) |

---

## ➡️ Próximo passo

Base pronta. Vamos montar a primeira tela: o dashboard com os cards.

**[Aula 16 — Tela do Dashboard](16-front-dashboard.md)**
