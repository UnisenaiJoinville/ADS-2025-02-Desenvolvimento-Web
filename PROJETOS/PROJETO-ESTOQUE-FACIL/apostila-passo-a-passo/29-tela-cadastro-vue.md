# Aula 29 — Tela de cadastro com Vue

**Tipo:** prática (HTML + Vue)

**Tempo estimado:** 50 minutos

---

## Objetivo

Construir a primeira tela em Vue do projeto, e com ela três arquivos:

- `public/js/auth.js` — onde a sessão do usuário mora
- `public/js/api.js` — atualizado para falar de token
- `public/cadastro.html` + `public/js/cadastro.js` — a tela

---

## Antes de começar

- [ ] [Aula 28](28-vue-primeiros-passos.md) concluída (o laboratório funcionando)
- [ ] API protegida, testada por `curl` na [Aula 27](27-auth-rotas-e-middleware.md)

---

## 1. Onde o token vai morar

Antes da tela, uma decisão: depois do login, **onde** o navegador guarda o token?

| Lugar | Sobrevive ao F5? | Sobrevive a fechar o navegador? |
|---|---|---|
| Variável JavaScript | não | não |
| `sessionStorage` | sim | não |
| `localStorage` | sim | sim |
| Cookie `httpOnly` | sim | sim |

Vamos usar **`localStorage`**: é simples, visível no F12 (ótimo para aula) e não exige mudar nada no servidor.

> **Sendo honesto sobre a escolha:** `localStorage` é legível por qualquer JavaScript da página. Se um invasor conseguir injetar script no seu site (ataque **XSS**), ele lê o token. A defesa de verdade, em produção, é o cookie `httpOnly`, que o JavaScript **não** enxerga — mas ele exige configurar CORS, CSRF e `SameSite`, assunto para outro módulo. Aqui, o que nos protege de XSS é o que já fazemos: `escapeHtml` nas telas antigas e `{{ }}` nas telas Vue.

### Uma regra de organização

Nenhuma tela vai chamar `localStorage` diretamente. Todas passam por `auth.js`.

```text
   login.js ─┐
   cadastro.js ─┤
   api.js ──────┼──►  auth.js  ──►  localStorage
   layout.js ───┤
   dashboard.js ┘
```

Por quê? Porque no dia em que você trocar `localStorage` por cookie, **um arquivo** muda. É a mesma lógica das camadas do back-end: quem usa não precisa saber como é guardado.

---

## Passo 1 — O arquivo da sessão

Crie `public/js/auth.js`:

```javascript
// Guarda a sessao do usuario no navegador.
// Nenhuma tela mexe no localStorage direto: todo mundo passa por aqui.

const TOKEN_KEY = "estoque-facil:token";
const USER_KEY = "estoque-facil:user";

export const LOGIN_PAGE = "/login.html";
export const HOME_PAGE = "/index.html";

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  // localStorage so guarda texto: objeto precisa virar JSON.
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Se alguem editou o localStorage na mao, nao quebramos a tela.
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Porteiro das telas internas: sem token, nem carrega a pagina.
// Devolve false para a tela poder parar o que estava fazendo.
export function requireAuth() {
  if (isAuthenticated()) {
    return true;
  }

  window.location.replace(LOGIN_PAGE);

  return false;
}

// O contrario: quem ja esta logado nao precisa ver login/cadastro.
export function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.replace(HOME_PAGE);

    return true;
  }

  return false;
}

export function logout() {
  clearSession();
  window.location.replace(LOGIN_PAGE);
}
```

Salve.

---

## 2. Dissecando o `auth.js`

### 2.1 As chaves com prefixo

```javascript
const TOKEN_KEY = "estoque-facil:token";
const USER_KEY = "estoque-facil:user";
```

O `localStorage` é compartilhado por **todo** o endereço (`localhost:3000`). Se você rodar dois projetos diferentes na mesma porta durante o curso, uma chave chamada só `"token"` seria sobrescrita pelo outro projeto.

O prefixo evita isso. É convenção comum: `nome-do-app:coisa`.

### 2.2 `localStorage` só guarda texto

```javascript
localStorage.setItem(USER_KEY, JSON.stringify(user));
```

Se você gravasse o objeto direto, ele viraria a string `"[object Object]"` — e você perderia tudo.

Na volta, o caminho inverso:

```javascript
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Se alguem editou o localStorage na mao, nao quebramos a tela.
    return null;
  }
}
```

### 2.3 Por que o `try/catch` aqui

Abra o F12 → **Application** → **Local Storage**. Você consegue **editar** aqueles valores à mão.

Se alguém apagar metade do JSON, o `JSON.parse` lança um erro — e um erro não tratado no topo do módulo **impede a tela inteira de carregar**. Com o `catch`, tratamos como "não tem usuário" e a vida segue.

> Tudo que vem do navegador do usuário é dado **não confiável**, igualzinho ao que vem numa requisição HTTP. Mesmo princípio da [Aula 25](25-auth-validator-repository.md), do outro lado do fio.

### 2.4 O porteiro do front

```javascript
export function requireAuth() {
  if (isAuthenticated()) {
    return true;
  }

  window.location.replace(LOGIN_PAGE);

  return false;
}
```

Usado nas telas internas: sem token, manda para o login e devolve `false` para a tela saber que não deve carregar nada.

E o contrário, usado no cadastro e no login:

```javascript
export function redirectIfAuthenticated() { ... }
```

> **Isto não é segurança.** É conveniência.
>
> `requireAuth()` só olha se **existe** um texto no `localStorage` — não valida assinatura nem expiração. Qualquer pessoa pode digitar `localStorage.setItem("estoque-facil:token", "xxx")` no console e a tela abre.
>
> E aí não acontece nada de mais: a tela abre **vazia**, porque cada `fetch` vai levar esse token falso e a API vai responder `401`.
>
> **Guarde esta frase:** a segurança está no servidor. O front só evita mostrar uma tela que não vai funcionar.

### 2.5 `replace()` e não `href`

```javascript
window.location.replace(LOGIN_PAGE);
```

| Método | O que faz com o histórico |
|---|---|
| `location.href = "..."` | **empilha** a página nova |
| `location.replace("...")` | **troca** a atual |

Com `href`, o usuário deslogado clicaria em "voltar" e cairia de novo na tela protegida — que o mandaria para o login de novo, e o botão "voltar" viraria um laço infinito.

Com `replace`, isso não acontece.

---

## Passo 2 — O `api.js` aprende sobre token

Abra `public/js/api.js` e deixe assim:

```javascript
// Camada unica de acesso a API.
// Centralizar o fetch evita repetir tratamento de erro em cada tela.

import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";

const BASE_URL = "/api";

async function request(path, options = {}) {
  const token = getToken();

  const headers = { "Content-Type": "application/json", ...options.headers };

  // Se ha sessao, todo pedido leva o cracha junto.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 COM token = a sessao venceu. Limpamos e voltamos para o login.
  // 401 SEM token = e a propria tela de login dizendo "senha errada",
  // e nela nao pode haver redirecionamento nenhum.
  if (response.status === 401 && token) {
    clearSession();
    window.location.replace(LOGIN_PAGE);

    throw new Error("Sessao expirada. Faca login novamente");
  }

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
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),

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

## 3. Dissecando o `api.js`

Só a função `request` mudou (e três métodos novos foram acrescentados na lista).

### 3.1 O crachá vai junto, automaticamente

```javascript
const token = getToken();

const headers = { "Content-Type": "application/json", ...options.headers };

// Se ha sessao, todo pedido leva o cracha junto.
if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

Esta é a grande vantagem de ter centralizado o `fetch` lá na [Aula 15](15-front-base.md).

São **quatro linhas**, escritas **uma vez**, e agora as 20 chamadas de API do sistema inteiro passam a mandar o token. Nenhuma tela precisou mudar.

> Imagine se cada tela tivesse o seu próprio `fetch`. Seriam 20 lugares para editar — e um deles ficaria esquecido.

### 3.2 O `...options.headers`

```javascript
const headers = { "Content-Type": "application/json", ...options.headers };
```

O espalhamento preserva cabeçalhos que alguém tenha passado na chamada, sem perder o padrão. Sutil, mas é o que evita bugs no futuro.

### 3.3 A regra do 401

```javascript
// 401 COM token = a sessao venceu. Limpamos e voltamos para o login.
// 401 SEM token = e a propria tela de login dizendo "senha errada",
// e nela nao pode haver redirecionamento nenhum.
if (response.status === 401 && token) {
  clearSession();
  window.location.replace(LOGIN_PAGE);

  throw new Error("Sessao expirada. Faca login novamente");
}
```

Leia com atenção o `&& token`. Ele é o detalhe que faz a tela de login funcionar.

| Situação | Tinha token? | O que fazemos |
|---|---|---|
| Token venceu no meio do uso | sim | limpa e volta ao login |
| Senha errada na tela de login | **não** | deixa a tela mostrar o erro |

Sem o `&& token`, digitar a senha errada recarregaria a tela de login, apagando a mensagem de erro antes que a pessoa a lesse. Um bug irritante e difícil de diagnosticar.

### 3.4 Os três métodos novos

```javascript
register: (payload) =>
  request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
login: (payload) =>
  request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
me: () => request("/auth/me"),
```

Mesmo formato dos outros. Nada de novo aqui — e é esse o ponto: o padrão que você criou na Aula 15 acomodou o recurso novo sem precisar ser repensado.

### 3.5 Cuidado com a ordem dos imports

```javascript
import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";
```

`api.js` importa `auth.js`. Então `auth.js` **não pode** importar `api.js` — isso criaria um ciclo, e ciclos entre módulos causam erros muito confusos (um dos dois chega `undefined`).

Repare que o `auth.js` que escrevemos não importa nada. É uma folha da árvore, de propósito.

---

## Passo 3 — O HTML da tela de cadastro

Crie `public/cadastro.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Criar conta | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
      [v-cloak] {
        display: none;
      }
    </style>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <main id="app" v-cloak class="grid min-h-screen place-items-center px-6 py-10">
      <div class="w-full max-w-md">
        <div class="mb-8 flex flex-col items-center gap-3">
          <div class="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
            EF
          </div>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900">Criar conta</h1>
            <p class="text-sm text-slate-500">Leva menos de um minuto</p>
          </div>
        </div>

        <form
          class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          @submit.prevent="handleSubmit"
        >
          <p
            v-if="errorMessage"
            class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {{ errorMessage }}
          </p>

          <!-- NOME -->
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Nome completo</span>
            <input
              v-model.trim="form.name"
              type="text"
              autocomplete="name"
              placeholder="Ana Paula Souza"
              class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:border-slate-900"
              :class="visibleErrors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-200'"
              @blur="touched.name = true"
            />
            <span v-if="visibleErrors.name" class="mt-1 block text-xs text-rose-600">
              {{ visibleErrors.name }}
            </span>
          </label>

          <!-- E-MAIL -->
          <label class="mt-4 block">
            <span class="text-sm font-medium text-slate-700">E-mail</span>
            <input
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              placeholder="voce@empresa.com"
              class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:border-slate-900"
              :class="visibleErrors.email ? 'border-rose-300 bg-rose-50' : 'border-slate-200'"
              @blur="touched.email = true"
            />
            <span v-if="visibleErrors.email" class="mt-1 block text-xs text-rose-600">
              {{ visibleErrors.email }}
            </span>
          </label>

          <!-- SENHA -->
          <label class="mt-4 block">
            <span class="text-sm font-medium text-slate-700">Senha</span>
            <div class="relative mt-1">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Minimo de 6 caracteres"
                class="w-full rounded-xl border px-4 py-2.5 pr-20 text-sm outline-none transition focus:border-slate-900"
                :class="visibleErrors.password ? 'border-rose-300 bg-rose-50' : 'border-slate-200'"
                @blur="touched.password = true"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Ocultar" : "Mostrar" }}
              </button>
            </div>

            <!-- Medidor de forca: puro estado derivado -->
            <div v-if="form.password" class="mt-2">
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="strength.color"
                  :style="{ width: strength.width }"
                ></div>
              </div>
              <span class="mt-1 block text-xs text-slate-500">
                Forca da senha: {{ strength.label }}
              </span>
            </div>

            <span v-if="visibleErrors.password" class="mt-1 block text-xs text-rose-600">
              {{ visibleErrors.password }}
            </span>
          </label>

          <!-- CONFIRMACAO -->
          <label class="mt-4 block">
            <span class="text-sm font-medium text-slate-700">Confirme a senha</span>
            <input
              v-model="form.passwordConfirmation"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repita a senha"
              class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:border-slate-900"
              :class="visibleErrors.passwordConfirmation ? 'border-rose-300 bg-rose-50' : 'border-slate-200'"
              @blur="touched.passwordConfirmation = true"
            />
            <span
              v-if="visibleErrors.passwordConfirmation"
              class="mt-1 block text-xs text-rose-600"
            >
              {{ visibleErrors.passwordConfirmation }}
            </span>
          </label>

          <button
            type="submit"
            :disabled="!canSubmit"
            class="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {{ loading ? "Criando conta..." : "Criar conta" }}
          </button>

          <p class="mt-6 text-center text-sm text-slate-500">
            Ja tem conta?
            <a href="/login.html" class="font-semibold text-slate-900 hover:underline">
              Entrar
            </a>
          </p>
        </form>
      </div>
    </main>

    <script type="module" src="/js/cadastro.js"></script>
  </body>
</html>
```

Salve.

---

## 4. Lendo o HTML

Não se assuste com o tamanho: é o mesmo bloco repetido quatro vezes, um por campo.

### 4.1 O cabeçalho

```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<style>
  [v-cloak] { display: none; }
</style>
```

Tailwind, Vue e o truque do `v-cloak` da [Aula 28](28-vue-primeiros-passos.md).

> **Atenção:** Repare que **não existe** `<div data-nav>` aqui. Quem ainda não tem conta não deve ver o menu do sistema.

### 4.2 O molde de um campo

```html
<label class="block">
  <span class="text-sm font-medium text-slate-700">Nome completo</span>
  <input
    v-model.trim="form.name"
    type="text"
    autocomplete="name"
    class="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm ..."
    :class="visibleErrors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-200'"
    @blur="touched.name = true"
  />
  <span v-if="visibleErrors.name" class="mt-1 block text-xs text-rose-600">
    {{ visibleErrors.name }}
  </span>
</label>
```

Quatro coisas acontecendo:

| Linha | O que faz |
|---|---|
| `v-model.trim="form.name"` | amarra o campo ao estado, sem espaços nas pontas |
| `:class="..."` | fica vermelho **se** houver erro visível |
| `@blur="touched.name = true"` | marca que o usuário já passou por aqui |
| `<span v-if="...">` | a mensagem só existe quando há erro |

### 4.3 `class` e `:class` no mesmo elemento

```html
class="mt-1 w-full rounded-xl border px-4 py-2.5 ..."
:class="visibleErrors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-200'"
```

Não é erro: o Vue **junta** os dois. O `class` traz o que é fixo, o `:class` traz o que depende do estado.

Repare que o `class` fixo tem `border` (a espessura) mas não tem `border-slate-200` (a cor) — a cor fica toda no `:class`, senão as duas brigariam.

### 4.4 O `<label>` envolvendo o campo

```html
<label>
  <span>Nome completo</span>
  <input ... />
</label>
```

Com o `<input>` **dentro** do `<label>`, clicar no texto foca o campo — sem precisar de `for` e `id`. É acessibilidade de graça, e um leitor de tela anuncia o rótulo correto.

### 4.5 O medidor de força

```html
<div v-if="form.password" class="mt-2">
  <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
    <div
      class="h-full rounded-full transition-all duration-300"
      :class="strength.color"
      :style="{ width: strength.width }"
    ></div>
  </div>
  <span class="mt-1 block text-xs text-slate-500">
    Forca da senha: {{ strength.label }}
  </span>
</div>
```

Duas novidades:

- `:style="{ width: strength.width }"` — estilo vindo de um objeto JavaScript.
- `v-if="form.password"` — a barra só existe quando há algo digitado (string vazia é *falsy*).

### 4.6 O botão que se desabilita sozinho

```html
<button type="submit" :disabled="!canSubmit" class="... disabled:bg-slate-300">
  {{ loading ? "Criando conta..." : "Criar conta" }}
</button>
```

Duas mensagens em um botão só. Enquanto `loading` for `true`, o texto muda e o botão trava — o que impede o clique duplo que criaria duas contas.

---

## Passo 4 — O JavaScript da tela

Crie `public/js/cadastro.js`:

```javascript
import { api } from "./api.js";
import { LOGIN_PAGE, redirectIfAuthenticated } from "./auth.js";

const { createApp } = Vue;

// A MESMA regra do back-end (src/modules/auth/user-validator.js).
// Validar aqui e so conforto: quem manda e sempre o servidor.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

redirectIfAuthenticated();

createApp({
  data() {
    return {
      form: {
        name: "",
        email: "",
        password: "",
        passwordConfirmation: "",
      },
      // Guarda quais campos o usuario ja visitou, para so
      // cobrar o preenchimento depois que ele sair do campo.
      touched: {
        name: false,
        email: false,
        password: false,
        passwordConfirmation: false,
      },
      showPassword: false,
      loading: false,
      errorMessage: "",
    };
  },

  computed: {
    // Todos os erros do formulario, sempre atualizados.
    errors() {
      const errors = {};
      const { name, email, password, passwordConfirmation } = this.form;

      if (!name) {
        errors.name = "Informe seu nome";
      } else if (name.length < 3) {
        errors.name = "O nome deve ter pelo menos 3 caracteres";
      }

      if (!email) {
        errors.email = "Informe seu e-mail";
      } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = "Esse e-mail nao parece valido";
      }

      if (!password) {
        errors.password = "Informe uma senha";
      } else if (password.length < 6) {
        errors.password = "A senha deve ter pelo menos 6 caracteres";
      }

      if (!passwordConfirmation) {
        errors.passwordConfirmation = "Repita a senha";
      } else if (password !== passwordConfirmation) {
        errors.passwordConfirmation = "As senhas nao conferem";
      }

      return errors;
    },

    // Os erros que a tela pode EXIBIR agora: so dos campos ja visitados.
    visibleErrors() {
      const visible = {};

      for (const field of Object.keys(this.errors)) {
        if (this.touched[field]) {
          visible[field] = this.errors[field];
        }
      }

      return visible;
    },

    strength() {
      const { password } = this.form;

      // Um ponto para cada criterio atendido.
      let score = 0;

      if (password.length >= 6) score += 1;
      if (password.length >= 10) score += 1;
      if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      if (score <= 2) {
        return { label: "fraca", width: "33%", color: "bg-rose-500" };
      }

      if (score <= 3) {
        return { label: "media", width: "66%", color: "bg-amber-500" };
      }

      return { label: "forte", width: "100%", color: "bg-emerald-500" };
    },

    canSubmit() {
      // Object.keys({}).length === 0 significa "nenhum erro".
      return Object.keys(this.errors).length === 0 && !this.loading;
    },
  },

  methods: {
    markAllTouched() {
      for (const field of Object.keys(this.touched)) {
        this.touched[field] = true;
      }
    },

    async handleSubmit() {
      this.markAllTouched();
      this.errorMessage = "";

      if (Object.keys(this.errors).length > 0) {
        return;
      }

      this.loading = true;

      try {
        await api.register({
          name: this.form.name,
          email: this.form.email,
          password: this.form.password,
          passwordConfirmation: this.form.passwordConfirmation,
        });

        // Manda para o login com um recado e o e-mail ja preenchido.
        const email = encodeURIComponent(this.form.email);

        window.location.replace(`${LOGIN_PAGE}?cadastro=ok&email=${email}`);
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },
  },
}).mount("#app");
```

Salve.

---

## 5. Dissecando o `cadastro.js`

### 5.1 Como o Vue e os módulos convivem

```javascript
import { api } from "./api.js";
import { LOGIN_PAGE, redirectIfAuthenticated } from "./auth.js";

const { createApp } = Vue;
```

O `<script src="...vue.global.js">` do HTML publica tudo numa variável global chamada `Vue`. Como o nosso arquivo é um **módulo** (`<script type="module">`), ele pode ao mesmo tempo:

- usar `import` para os **nossos** arquivos;
- ler a global `Vue`, que o CDN já deixou pronta.

> Repare que o `api.js` é exatamente o mesmo usado pelas telas antigas. Vue não substituiu nada do que você já tinha.

### 5.2 O estado

```javascript
data() {
  return {
    form: { name: "", email: "", password: "", passwordConfirmation: "" },
    touched: { name: false, email: false, password: false, passwordConfirmation: false },
    showPassword: false,
    loading: false,
    errorMessage: "",
  };
}
```

Agrupar os campos em `form` tem um motivo prático: é exatamente o formato que a API espera, então na hora de enviar não precisamos remontar nada.

### 5.3 `touched`: por que não mostrar o erro logo de cara

Sem esse controle, a tela abriria assim:

```text
   Nome completo
   [                    ]
   Informe seu nome            <- a pessoa nem começou!
```

É hostil. O padrão que usamos é o de qualquer formulário bem feito:

```text
   1. campo em branco, sem erro   (a pessoa ainda não mexeu)
   2. a pessoa digita e sai       (@blur marca touched)
   3. AGORA sim o erro aparece
```

O `@blur` é o evento "o campo perdeu o foco".

### 5.4 Dois `computed` trabalhando juntos

```javascript
errors() {
  // TODOS os erros do formulário, sempre atualizados
}

visibleErrors() {
  // só os erros dos campos já visitados
  const visible = {};

  for (const field of Object.keys(this.errors)) {
    if (this.touched[field]) {
      visible[field] = this.errors[field];
    }
  }

  return visible;
}
```

A separação é o que torna isso legível:

| Computed | Quem usa | Para quê |
|---|---|---|
| `errors` | o botão (`canSubmit`) | **posso enviar?** |
| `visibleErrors` | o HTML | **o que mostro agora?** |

O botão fica desabilitado desde o começo (porque `errors` está cheio), mas a tela não grita com ninguém (porque `visibleErrors` está vazio).

### 5.5 O medidor de força

```javascript
strength() {
  const { password } = this.form;

  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: "fraca", width: "33%", color: "bg-rose-500" };
  if (score <= 3) return { label: "media", width: "66%", color: "bg-amber-500" };

  return { label: "forte", width: "100%", color: "bg-emerald-500" };
}
```

Um ponto por critério atendido. Repare que o `computed` devolve um **objeto** com três informações, e o HTML usa as três.

> **Cuidado com o recado que isso passa:** força de senha medida assim é uma estimativa grosseira. `Senha@123` marca "forte" e está em qualquer lista de senhas comuns. É um incentivo visual, não uma garantia.

### 5.6 `canSubmit`

```javascript
canSubmit() {
  // Object.keys({}).length === 0 significa "nenhum erro".
  return Object.keys(this.errors).length === 0 && !this.loading;
}
```

Duas condições: nada errado **e** nada em andamento.

### 5.7 O envio

```javascript
async handleSubmit() {
  this.markAllTouched();
  this.errorMessage = "";

  if (Object.keys(this.errors).length > 0) {
    return;
  }

  this.loading = true;

  try {
    await api.register({ ...this.form });

    const email = encodeURIComponent(this.form.email);

    window.location.replace(`${LOGIN_PAGE}?cadastro=ok&email=${email}`);
  } catch (error) {
    this.errorMessage = error.message;
  } finally {
    this.loading = false;
  }
}
```

Passo a passo:

| Linha | Por quê |
|---|---|
| `markAllTouched()` | se a pessoa apertar Enter direto, todos os erros aparecem de uma vez |
| `if (errors) return` | cinto de segurança: o botão já estava travado, mas Enter pode escapar |
| `loading = true` | trava o botão e muda o texto |
| `await api.register(...)` | a única linha que fala com o servidor |
| `catch` | mostra o erro **que veio da API** |
| `finally` | destrava o botão em qualquer cenário |

### 5.8 Por que `finally`

Se você colocasse `this.loading = false` só no fim do `try`, um erro pularia essa linha e o botão ficaria travado em "Criando conta..." **para sempre**.

O `finally` roda nos dois caminhos. Este é o uso clássico dele.

### 5.9 Validação nos dois lados: redundância proposital

```javascript
// A MESMA regra do back-end (src/modules/auth/user-validator.js).
// Validar aqui e so conforto: quem manda e sempre o servidor.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

"Não estamos repetindo código à toa?" Não — os dois têm papéis diferentes:

| Validação | Para que serve | Dá para burlar? |
|---|---|---|
| No navegador | resposta instantânea, sem ida ao servidor | **sim**, é só usar `curl` |
| No servidor | **a que vale** | não |

Prove em sala: rode aquele `curl` com senha `"123"` da [Aula 27](27-auth-rotas-e-middleware.md). A tela do Vue nem foi consultada, e o back-end recusou.

> **Regra que vale para a carreira inteira:** validação no cliente é UX. Validação no servidor é segurança. Nunca confie na primeira.

### 5.10 Passando dados pela URL

```javascript
const email = encodeURIComponent(this.form.email);

window.location.replace(`${LOGIN_PAGE}?cadastro=ok&email=${email}`);
```

Vira, por exemplo:

```text
/login.html?cadastro=ok&email=ana%40teste.com
```

O `encodeURIComponent` escapa os caracteres especiais — o `@` vira `%40`. Sem isso, um e-mail com `+` (como `ana+loja@teste.com`) chegaria errado do outro lado, porque `+` significa espaço numa URL.

A Aula 30 lê esses parâmetros.

---

## Passo 5 — Testar

Reinicie, para garantir:

```bash
docker compose restart api
```

Abra `http://localhost:3000/cadastro.html`.

### Roteiro de teste

| # | Faça | Esperado |
|---|---|---|
| 1 | Abra a tela | Nenhum erro vermelho, botão cinza |
| 2 | Clique no campo Nome e saia sem digitar | "Informe seu nome", campo vermelho |
| 3 | Digite "Ana" | O erro some, a borda volta ao normal |
| 4 | Digite `ana` no e-mail e saia | "Esse e-mail nao parece valido" |
| 5 | Digite `123` na senha | Barra vermelha, "Forca da senha: fraca" |
| 6 | Digite `Senha@2026` | Barra verde, "forte" |
| 7 | Confirme com algo diferente | "As senhas nao conferem" |
| 8 | Corrija a confirmação | O botão fica preto (habilitado) |
| 9 | Clique em "Criar conta" | Vai para `/login.html?cadastro=ok&email=...` |
| 10 | Volte e cadastre o **mesmo** e-mail | Faixa vermelha: "Ja existe uma conta com esse e-mail" |
| 11 | Clique em "Mostrar" na senha | O texto aparece nos dois campos |

> **No teste 10**, repare de onde veio a mensagem: do **back-end**. Ela atravessou `service → controller → HTTP → api.js → catch → errorMessage → {{ }}`. É todo o sistema funcionando em conjunto.

### Confira no banco

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db \
  -e "SELECT id, name, email, LEFT(password_hash, 7) AS hash, created_at FROM users;"
```

```text
id  name                  email            hash      created_at
1   Professor Demo        professor@...    $2b$10$   2026-09-22 22:14:15
2   Maria de Lourdes...   maria@teste.com  $2b$10$   2026-09-22 22:31:02
```

A senha que você digitou **não está** ali. Só o hash.

---

## Confira se deu certo

- [ ] `public/js/auth.js` criado
- [ ] `public/js/api.js` manda `Authorization` quando há token
- [ ] `public/cadastro.html` e `public/js/cadastro.js` criados
- [ ] Os erros só aparecem depois de sair do campo
- [ ] O medidor de força muda de cor
- [ ] O botão só habilita com tudo válido
- [ ] Cadastrar leva para `/login.html?cadastro=ok&email=...`
- [ ] E-mail repetido mostra a mensagem do servidor
- [ ] O usuário aparece na tabela `users`, com hash
- [ ] O console (F12) está limpo

---

## Se deu erro

### A tela mostra `{{ form.name }}` literalmente

O Vue não montou. Veja o console (F12) — quase sempre é erro de digitação no `cadastro.js`, que impede o `createApp` de rodar.

### `Vue is not defined`

Falta o `<script src="https://unpkg.com/vue@3/dist/vue.global.js">` no HTML, ou ele está depois do seu script.

### `Failed to resolve module specifier`

O `<script>` do seu arquivo precisa ter `type="module"`:

```html
<script type="module" src="/js/cadastro.js"></script>
```

### A página recarrega ao clicar em "Criar conta" e nada acontece

Faltou o `.prevent`: precisa ser `@submit.prevent="handleSubmit"`.

### O botão nunca habilita

Abra o console e digite:

```javascript
document.querySelector("#app").__vue_app__._instance.proxy.errors
```

Ele mostra exatamente qual campo ainda está com erro.

### `Cannot read properties of undefined (reading 'name')`

Você escreveu `form.name` no HTML, mas o `data()` não tem a chave `form` (ou tem com outro nome).

### O cadastro funciona mas o erro do servidor não aparece

Confira o `catch`: ele precisa atribuir `this.errorMessage = error.message`, e o HTML precisa do bloco `v-if="errorMessage"`.

---

## Próximo passo

A conta existe. Agora vamos entrar com ela.

**[Aula 30 — Tela de login com Vue](30-tela-login-vue.md)**
