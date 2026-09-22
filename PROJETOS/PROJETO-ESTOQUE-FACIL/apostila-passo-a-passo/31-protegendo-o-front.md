# Aula 31 — Protegendo as telas e mostrando quem está logado

**Tipo:** prática (alterações em arquivos já existentes)

**Tempo estimado:** 40 minutos

---

## Objetivo

Fechar o círculo da autenticação no front-end:

- colocar um **porteiro** nas 4 telas internas;
- mostrar **quem está logado** no menu, com um botão "Sair";
- entender por que isso é conveniência, e não segurança.

Nesta aula você não cria arquivos novos: **altera cinco** que já existem.

---

## Antes de começar

- [ ] [Aula 30](30-tela-login-vue.md) concluída (você consegue entrar e ver o token no F12)
- [ ] `public/js/auth.js` criado na [Aula 29](29-tela-cadastro-vue.md)

---

## 1. O que falta

Hoje o sistema está assim:

```text
   [x] A API recusa quem não tem token              (Aula 27)
   [x] O token é gerado no login                    (Aula 30)
   [x] O api.js manda o token em toda requisição    (Aula 29)
   [ ] As telas internas abrem para qualquer um
   [ ] Ninguém sabe quem está logado
   [ ] Não existe como sair
```

Teste o problema: abra o F12 → Application → Local Storage, **apague as duas chaves** e recarregue o dashboard.

O que acontece: a tela abre vazia, e no canto aparece uma notificação vermelha com "Token nao informado".

Não está errado — a API cumpriu o papel dela. Mas é uma péssima experiência: o certo era mandar a pessoa para o login.

---

## Passo 1 — O porteiro nas 4 telas

A função já existe (você a escreveu na Aula 29):

```javascript
export function requireAuth() {
  if (isAuthenticated()) {
    return true;
  }

  window.location.replace(LOGIN_PAGE);

  return false;
}
```

Falta usá-la. São **duas linhas** em cada um dos quatro arquivos.

### 1.1 `public/js/dashboard.js`

Acrescente o import logo abaixo do `api.js`:

```javascript
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";
```

E troque a **última linha** do arquivo (`loadDashboard();`) por:

```javascript
// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  loadDashboard();
}
```

### 1.2 `public/js/produtos.js`

```javascript
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { currency, escapeHtml, mountLayout, toast } from "./layout.js";
```

Última linha (`init();`):

```javascript
// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  init();
}
```

### 1.3 `public/js/movimentacoes.js`

```javascript
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { escapeHtml, formatDateTime, mountLayout, toast } from "./layout.js";
```

Última linha (`init();`):

```javascript
// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  init();
}
```

### 1.4 `public/js/categorias.js`

```javascript
import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { escapeHtml, mountLayout, toast } from "./layout.js";
```

Última linha (`loadCategories();`):

```javascript
// Porteiro da tela: requireAuth() manda para o login quando nao ha
// sessao e devolve false, entao nada aqui chega a ser carregado.
if (requireAuth()) {
  loadCategories();
}
```

---

## 2. Por que **essa** forma de proteger

Existiriam outras. Vale entender a escolha.

### Alternativa A — parar o módulo com `throw`

```javascript
if (!requireAuth()) {
  throw new Error("Sem sessao");   // funciona, mas...
}
```

Funciona, porque um `throw` no topo de um módulo interrompe a execução dele. Mas deixa um erro vermelho no console — e em aula isso confunde: o aluno acha que quebrou alguma coisa.

### Alternativa B — envolver o arquivo inteiro

```javascript
if (requireAuth()) {
  // ... 200 linhas indentadas ...
}
```

Mudaria a indentação de todo o arquivo por causa de uma checagem.

### O que fizemos

```javascript
if (requireAuth()) {
  init();
}
```

Repare no que existe nesses arquivos **acima** dessa linha: definições de função, `document.querySelector`, `addEventListener`. Nada disso busca dados nem mostra informação — é tudo inofensivo.

A única linha que **carrega dados do servidor** é a última. É ela que protegemos.

> Duas linhas por arquivo, nenhuma indentação alterada, nenhum erro no console. Quando uma solução simples cobre o caso real, ela ganha da elegante.

---

## Passo 2 — O menu mostra quem está logado

Abra `public/js/layout.js` e deixe assim:

```javascript
// Funcoes compartilhadas por todas as telas.

import { getUser, logout } from "./auth.js";

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
        ${renderUserBadge()}
      </div>
    </header>
  `;
}

// Mostra quem esta logado e o botao de sair.
function renderUserBadge() {
  const user = getUser();

  if (!user) return "";

  // As iniciais do nome: "Ana Paula Souza" -> "AS"
  const initials = escapeHtml(
    user.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .filter((_, index, all) => index === 0 || index === all.length - 1)
      .join("")
      .toUpperCase()
  );

  return `
    <div class="flex items-center gap-3 border-l border-slate-200 pl-4">
      <div class="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">${initials}</div>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold leading-tight text-slate-900">${escapeHtml(user.name)}</p>
        <p class="text-xs leading-tight text-slate-500">${escapeHtml(user.email)}</p>
      </div>
      <button
        data-logout
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        Sair
      </button>
    </div>
  `;
}

export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);

    // O botao so existe depois que o HTML acima foi inserido.
    container.querySelector("[data-logout]")?.addEventListener("click", logout);
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

## 3. Dissecando as mudanças no `layout.js`

Três coisas mudaram. O resto do arquivo está igual desde a [Aula 15](15-front-base.md).

### 3.1 O import

```javascript
import { getUser, logout } from "./auth.js";
```

### 3.2 A função nova `renderUserBadge`

```javascript
// Mostra quem esta logado e o botao de sair.
function renderUserBadge() {
  const user = getUser();

  if (!user) return "";
  ...
}
```

Repare no `if (!user) return "";`. Ele existe porque `renderNav` pode ser chamada por uma tela sem sessão, no instante antes do redirecionamento. Sem essa guarda, `user.name` quebraria com `Cannot read properties of null`.

> Essa linha é o que chamamos de "programação defensiva": tratar o caso improvável antes que ele apareça em sala.

### 3.3 As iniciais do nome

```javascript
// As iniciais do nome: "Ana Paula Souza" -> "AS"
const initials = escapeHtml(
  user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .filter((_, index, all) => index === 0 || index === all.length - 1)
    .join("")
    .toUpperCase()
);
```

Vale destrinchar essa corrente, porque ela usa cinco métodos de array do Módulo 1:

| Passo | Entrada | Saída |
|---|---|---|
| `.split(" ")` | `"Ana Paula Souza"` | `["Ana", "Paula", "Souza"]` |
| `.filter(Boolean)` | com espaços duplos | remove strings vazias |
| `.map((part) => part[0])` | `["Ana","Paula","Souza"]` | `["A","P","S"]` |
| `.filter(...)` | `["A","P","S"]` | `["A","S"]` (primeiro e último) |
| `.join("")` | `["A","S"]` | `"AS"` |
| `.toUpperCase()` | `"as"` | `"AS"` |

#### O `.filter(Boolean)`

Truque que vale conhecer: `Boolean` é uma função, e `filter` chama ela para cada item. Como `""` é *falsy*, as strings vazias caem fora. Se o nome vier `"Ana  Souza"` (dois espaços), o `split` produz um `""` no meio — e esse filtro o descarta.

#### O `filter` com três parâmetros

```javascript
.filter((_, index, all) => index === 0 || index === all.length - 1)
```

| Parâmetro | O que é |
|---|---|
| `_` | o item — que aqui não interessa (por isso o `_`) |
| `index` | a posição |
| `all` | o array inteiro |

Mantém só a primeira e a última letra: `"Maria de Lourdes Silva"` vira `"MS"`, não `"MDLS"`.

> **Por que um caso especial?** Um nome só, como `"Ana"`, tem índice 0 que é ao mesmo tempo o primeiro e o último. O `||` faz as duas condições baterem na mesma letra e o resultado é `"A"` — uma letra, não `"AA"`, porque é o mesmo item filtrado uma vez.

#### E o `escapeHtml` continua obrigatório

```javascript
<p class="...">${escapeHtml(user.name)}</p>
```

Esta parte do sistema **não usa Vue** — ela monta HTML com template string, como nas Aulas 15 a 19. Então a proteção contra injeção continua sendo manual.

Se alguém se cadastrasse com o nome `<img src=x onerror=alert(1)>`, sem `escapeHtml` esse código rodaria no menu. Com ele, aparece o texto literal.

> É um bom momento para comparar: nas telas Vue, `{{ }}` faz isso sozinho. Aqui, você faz na mão. Mesma proteção, esforços diferentes.

### 3.4 Ligando o botão "Sair"

```javascript
export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);

    // O botao so existe depois que o HTML acima foi inserido.
    container.querySelector("[data-logout]")?.addEventListener("click", logout);
  }
}
```

**A ordem importa muito aqui.** O `addEventListener` vem **depois** do `innerHTML`, porque antes disso o botão simplesmente não existe no documento.

É exatamente o problema que a [Aula 28](28-vue-primeiros-passos.md) citou: com `innerHTML`, os eventos precisam ser religados toda vez.

#### O `?.` antes do `addEventListener`

```javascript
container.querySelector("[data-logout]")?.addEventListener("click", logout);
```

O *optional chaining* cobre o caso "não achei o botão" (usuário sem sessão → `renderUserBadge` devolveu `""`). Sem ele: `Cannot read properties of null`.

### 3.5 O que o `logout` faz

```javascript
export function logout() {
  clearSession();
  window.location.replace(LOGIN_PAGE);
}
```

Duas linhas. **Nenhuma requisição ao servidor.**

Isso costuma incomodar quem está aprendendo: "mas o servidor não precisa saber que eu saí?"

Não precisa — e não tem como saber. O servidor **não guarda sessão nenhuma**: ele só confere assinaturas de token. Apagar o token do navegador é, literalmente, sair.

> **A consequência honesta:** um token que já tenha sido copiado continua válido até vencer. Se você "sair" mas alguém tiver anotado o seu token, ele ainda funciona pelo tempo restante.
>
> Sistemas que precisam de logout imediato mantêm uma lista de tokens revogados no servidor — e aí voltam a ter estado. É a troca clássica: tokens sem estado são simples e escaláveis, mas não se cancelam.

---

## Passo 3 — Testar o sistema inteiro

Recarregue com **Ctrl + Shift + R** (força recarregar, ignorando o cache).

### Roteiro

| # | Faça | Esperado |
|---|---|---|
| 1 | Apague as chaves do Local Storage e abra `/index.html` | Vai para `/login.html` |
| 2 | Repita com `/produtos.html`, `/movimentacoes.html`, `/categorias.html` | Todas mandam para o login |
| 3 | Faça login | Dashboard carrega |
| 4 | Olhe o canto direito do menu | Iniciais, nome, e-mail e o botão "Sair" |
| 5 | Navegue entre as 4 telas | O badge continua em todas |
| 6 | Recarregue com F5 | Continua logado |
| 7 | Feche o navegador e abra de novo | Continua logado (`localStorage`) |
| 8 | Clique em "Sair" | Vai para o login; as chaves somem do Local Storage |
| 9 | Aperte "voltar" | **Não** volta para dentro do sistema |

### O teste do token adulterado

Este vale fazer com a turma inteira olhando:

1. Entre normalmente.
2. F12 → Application → Local Storage.
3. Mude **uma letra** do `estoque-facil:token`.
4. Recarregue o dashboard.

O que acontece, em ordem:

```text
   1. requireAuth() vê que existe um token  ->  deixa a tela abrir
   2. a tela chama GET /api/dashboard com o token adulterado
   3. ensureAuthenticated vê a assinatura quebrada -> 401
   4. o api.js vê "401 COM token" -> limpa a sessão e volta ao login
```

**Este é o resumo das dez aulas.** O front foi enganado com facilidade. O servidor, não.

### O teste do token inventado

Ainda mais direto — no console:

```javascript
localStorage.setItem("estoque-facil:token", "eu-inventei-esse-token");
location.reload();
```

Mesmo final: a tela abre e é imediatamente expulsa.

> Se algum aluno perguntar "então o `requireAuth` não serve para nada?", a resposta é: ele serve para **experiência**, não para segurança. Sem ele, quem não está logado veria uma tela quebrada em vez de um formulário de login. A tranca de verdade está no `ensureAuthenticated`, do outro lado.

---

## 4. O sistema completo, agora

```text
   ┌─────────────────────── NAVEGADOR ──────────────────────┐
   │                                                        │
   │   login.html / cadastro.html  (Vue)                    │
   │        │                                               │
   │        │ saveSession()                                 │
   │        ▼                                               │
   │   auth.js  ──►  localStorage { token, user }           │
   │        ▲                                               │
   │        │ getToken()                                    │
   │   api.js  ──── Authorization: Bearer ... ─────────┐    │
   │        ▲                                          │    │
   │   index / produtos / movimentacoes / categorias   │    │
   │   (com requireAuth e o badge do usuário)          │    │
   └───────────────────────────────────────────────────┼────┘
                                                       │
   ┌─────────────────────── SERVIDOR ──────────────────┼────┐
   │                                                   ▼    │
   │   /api/health          ──── público                    │
   │   /api/auth/register   ──── público                    │
   │   /api/auth/login      ──── público                    │
   │   ─────────── ensureAuthenticated ───────────          │
   │   /api/auth/me                                         │
   │   /api/categories  /api/products                       │
   │   /api/movements   /api/dashboard                      │
   └────────────────────────────────────────────────────────┘
```

---

## Confira se deu certo

- [ ] As 4 telas internas redirecionam para o login quando não há sessão
- [ ] O menu mostra iniciais, nome e e-mail de quem entrou
- [ ] "Sair" limpa o Local Storage e volta ao login
- [ ] Depois de sair, "voltar" não entra de novo
- [ ] F5 mantém a sessão
- [ ] Token adulterado expulsa o usuário
- [ ] O console (F12) está limpo em todas as telas

---

## Se deu erro

### `requireAuth is not defined`

Faltou o import no topo do arquivo:

```javascript
import { requireAuth } from "./auth.js";
```

### O nome não aparece no menu

Confira no F12 → Application se a chave `estoque-facil:user` existe e tem um JSON válido. Se estiver faltando, o `saveSession` da Aula 30 não gravou o usuário — só o token.

### O botão "Sair" não faz nada

O `addEventListener` está **antes** do `innerHTML`. Ele precisa vir depois, dentro do mesmo `if`.

### Laço infinito: a tela pisca sem parar

Alguma tela protegida está mandando para si mesma, ou o `login.html` está chamando `requireAuth()` em vez de `redirectIfAuthenticated()`. Confira o `login.js`.

### As telas antigas continuam abrindo sem login

Você editou o arquivo mas o navegador serviu a versão em cache. **Ctrl + Shift + R**.

### `Cannot read properties of null (reading 'addEventListener')`

Faltou o `?.`:

```javascript
container.querySelector("[data-logout]")?.addEventListener("click", logout);
```

---

## Próximo passo

Tudo funcionando. Hora de testar do zero, com roteiro, e fixar com exercícios.

**[Aula 32 — Teste final, problemas comuns e exercícios](32-teste-final-autenticacao.md)**
