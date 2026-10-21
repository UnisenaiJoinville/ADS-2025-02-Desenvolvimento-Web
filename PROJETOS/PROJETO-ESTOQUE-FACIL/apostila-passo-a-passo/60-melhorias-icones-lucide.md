# Aula 60 — Melhorias do sistema: ícones com Lucide e o "olhinho" da senha

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** prática (HTML + JavaScript + Vue)

---

## Objetivo

Abrir o bloco de **melhorias** do Estoque Fácil e fazer a primeira delas:

- instalar a biblioteca de ícones **Lucide** em todas as telas;
- trocar o botão de texto "Mostrar/Ocultar" da senha por um **ícone de olho aberto/fechado**;
- avisar quando o **Caps Lock** estiver ligado no login;
- colocar ícones no **menu** e no botão **Sair**.

---

## Antes de começar

- [ ] Sistema rodando localmente (`docker compose up -d`) e você consegue fazer login
- [ ] Aulas 00 a 45 concluídas (o bloco de hospedagem, 46 a 59, é opcional para este bloco)

---

## O bloco de melhorias (aulas 60 a 69)

O sistema funciona. Agora vamos deixá-lo **melhor de usar, mais seguro e mais profissional**. Cada aula resolve um problema real que encontramos olhando o sistema pronto:

| Aula | Problema encontrado | Melhoria |
|---|---|---|
| **60** | Senha com botão de texto "Mostrar"; nenhum ícone no sistema | Lucide: olho aberto/fechado, menu com ícones |
| 61 | `fetch` exige muito código manual | Trocar por **axios** com interceptors |
| 62 | Não existe uma busca rápida de produtos na API | Rota `GET /api/products/search` |
| 63 | Movimentações tem um `<select>` com **todos** os produtos | Campo de busca com **autocomplete** via axios |
| 64 | A lista de produtos não tem limite nem paginação | Paginação + busca ao vivo |
| 65 | Excluir produto **apaga o histórico** dele; `window.confirm` feio | Exclusão segura + modal de confirmação |
| 66 | Botões sem "carregando", rótulos sem acessibilidade | Estados de carregamento, *skeleton*, acessibilidade |
| 67 | Login aceita tentativas infinitas | Limite de tentativas (`express-rate-limit`) |
| 68 | Dashboard sem gráfico | Gráfico de entradas e saídas (Chart.js) |
| 69 | Tailwind pelo CDN em produção | Tailwind compilado + teste final do bloco |

> 📌 **Regra do bloco:** ao final de **cada** aula o sistema continua funcionando. Se algo quebrou, não siga para a próxima: volte ao "Se deu erro".

---

## Arquivos desta aula

```text
NOVO ARQUIVO
└── public/js/icons.js

ARQUIVOS ALTERADOS
├── public/index.html          (1 linha no <head>)
├── public/produtos.html       (1 linha no <head>)
├── public/movimentacoes.html  (1 linha no <head>)
├── public/categorias.html     (1 linha no <head>)
├── public/relatorios.html     (1 linha no <head>)
├── public/login.html          (<head> + campo de senha)
├── public/cadastro.html       (<head> + campo de senha)
├── public/js/layout.js        (menu e botao Sair com icones)
├── public/js/login.js         (icones + Caps Lock)
└── public/js/cadastro.js      (icones)
```

---

## 1. O que é o Lucide

[Lucide](https://lucide.dev/icons) é uma coleção gratuita com mais de 1.500 ícones em **SVG** (desenho vetorial: fica nítido em qualquer tamanho).

O jeito de usar pelo CDN é bem simples:

```text
   1. Você escreve no HTML:       <i data-lucide="eye"></i>
   2. Chama:                       lucide.createIcons()
   3. O Lucide troca o <i> por:    <svg class="lucide lucide-eye" ...>...</svg>
```

Para descobrir o nome de um ícone, procure em **https://lucide.dev/icons** e copie o nome que aparece embaixo dele (`eye`, `eye-off`, `package`, `log-out`...).

### Por que ícone em SVG e não imagem PNG?

| | PNG | SVG (Lucide) |
|---|---|---|
| Fica nítido em tela grande | não (serrilha) | **sim** |
| Muda de cor com CSS | não | **sim** (`text-rose-600` funciona) |
| Muda de tamanho com CSS | distorce | **sim** (`h-4 w-4`) |
| Peso | um arquivo por ícone | um script para todos |

> 🔍 O SVG do Lucide usa `stroke="currentColor"`: o traço do ícone **herda a cor do texto**. Por isso `class="text-slate-400 hover:text-slate-900"` no botão muda a cor do ícone também.

---

## Passo 1 — Carregar o Lucide em todas as telas

Abra **cada um** dos sete arquivos HTML da pasta `public` e acrescente, no `<head>`, **logo abaixo** da linha do Tailwind:

```html
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Icones (Aula 60). Versao fixa: o site nao muda sozinho amanha. -->
    <script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
```

Os sete arquivos:

- [ ] `public/index.html`
- [ ] `public/produtos.html`
- [ ] `public/movimentacoes.html`
- [ ] `public/categorias.html`
- [ ] `public/relatorios.html`
- [ ] `public/login.html`
- [ ] `public/cadastro.html`

### 🔍 Por que a versão fixa (`@0.469.0`)

Se você escrever `lucide@latest`, o CDN entrega **a versão mais nova do dia**. Se um dia o Lucide renomear um ícone (já aconteceu: `alert-triangle` virou `triangle-alert`), o seu sistema perde o ícone **sem você ter mudado nada**.

> 📌 **Em produção, toda dependência tem versão fixa.** É a mesma ideia do `package-lock.json` da [Aula 47](47-preparando-arquivos-producao.md).

### 🔍 Por que um `<script>` comum, e não `type="module"`

O arquivo `lucide.min.js` é do tipo **UMD**: ao carregar, ele cria uma variável global `lucide` (igual ao Vue, que cria a global `Vue`). Scripts comuns no `<head>` rodam **antes** dos nossos `type="module"`. Então, quando o nosso código rodar, `window.lucide` já existe.

---

## Passo 2 — Um módulo só para os ícones

Crie `public/js/icons.js`:

```javascript
// Desenha os icones do Lucide (Aula 60).
//
// O script do Lucide procura todo <i data-lucide="nome"> da pagina e
// troca por um <svg>. Ele so enxerga o que JA existe no HTML: sempre
// que um innerHTML criar icones novos, esta funcao precisa rodar de novo.
export function renderIcons() {
  // "?." -> se o CDN falhar, a tela continua funcionando, so sem icones.
  window.lucide?.createIcons({
    // Icone decorativo nao deve ser lido pelo leitor de tela:
    // o texto ou o aria-label do botao ja dizem o que ele faz.
    attrs: { "aria-hidden": "true" },
  });
}
```

Salve.

### 🔍 Por que um arquivo só para uma função?

Pelo mesmo motivo do `auth.js` da [Aula 29](29-tela-cadastro-vue.md): **nenhuma tela fala com o Lucide diretamente**. Se um dia você trocar de biblioteca de ícones, muda **um arquivo**.

```text
   layout.js ────┐
   login.js ─────┤
   cadastro.js ──┼──►  icons.js  ──►  window.lucide
   produtos.js ──┘
```

### 🔍 O `window.lucide?.`

Se a internet da sala cair ou o CDN estiver fora, `window.lucide` é `undefined`. Sem o `?.`, a linha lançaria `Cannot read properties of undefined` e **a tela inteira pararia** (um erro no topo de um módulo interrompe o módulo). Com o `?.`, o sistema funciona sem ícones.

> 📌 Ícone é enfeite. Enfeite que falha **não pode** derrubar a tela.

---

## Passo 3 — O olhinho na tela de login

Abra `public/login.html` e localize o bloco da senha. Hoje ele está assim:

```html
          <label class="mt-4 block">
            <span class="text-sm font-medium text-slate-700">Senha</span>
            <div class="relative mt-1">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Sua senha"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-20 text-sm outline-none transition focus:border-slate-900"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Ocultar" : "Mostrar" }}
              </button>
            </div>
          </label>
```

Substitua **o bloco inteiro** por:

```html
          <label class="mt-4 block">
            <span class="text-sm font-medium text-slate-700">Senha</span>
            <div class="relative mt-1">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Sua senha"
                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-12 text-sm outline-none transition focus:border-slate-900"
                @keydown="checkCapsLock"
                @keyup="checkCapsLock"
                @blur="capsLockOn = false"
              />
              <!-- Botao do olho: o icone muda, o rotulo para leitor de tela tambem -->
              <button
                type="button"
                class="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-400 transition hover:text-slate-900 focus-visible:text-slate-900"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <!-- As diretivas ficam no <span>, NUNCA no <i> (veja a secao 2) -->
                <span v-if="showPassword"><i data-lucide="eye-off" class="h-5 w-5"></i></span>
                <span v-else><i data-lucide="eye" class="h-5 w-5"></i></span>
              </button>
            </div>

            <!-- Aviso de Caps Lock: so aparece enquanto a tecla estiver ligada -->
            <span
              v-if="capsLockOn"
              class="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700"
            >
              <span><i data-lucide="triangle-alert" class="h-3.5 w-3.5"></i></span>
              Caps Lock ativado
            </span>
          </label>
```

Salve.

### O que mudou no HTML

| Antes | Depois | Por quê |
|---|---|---|
| texto "Mostrar/Ocultar" | ícone `eye` / `eye-off` | padrão que todo usuário reconhece |
| `pr-20` no input | `pr-12` | o botão ficou mais estreito (só o ícone) |
| — | `:aria-label` | sem texto visível, o leitor de tela precisa de um rótulo |
| — | `:title` | dica que aparece ao parar o mouse em cima |
| — | `:aria-pressed` | avisa ao leitor de tela que é um botão "liga/desliga" |
| — | `@keydown` / `@keyup` | para detectar o Caps Lock |

### 🔍 Qual ícone mostrar em cada estado

Repare na lógica, que confunde muita gente:

| Senha está... | Ícone mostrado | Significa |
|---|---|---|
| escondida (`••••`) | 👁 `eye` | "clique para **ver**" |
| visível (`abc123`) | `eye-off` (olho riscado) | "clique para **esconder**" |

O ícone mostra **a ação que o clique vai fazer**, e não o estado atual. É a convenção usada pelo Google, pela Microsoft e pela maioria dos sistemas.

### 🔍 Botão só com ícone precisa de `aria-label`

Para quem enxerga, o olho é óbvio. Para quem usa leitor de tela, um botão sem texto é anunciado só como **"botão"**, sem dizer para que serve.

```html
:aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
```

> 📌 **Regra de acessibilidade:** todo botão que só tem ícone precisa de `aria-label`. É por isso que, no `icons.js`, marcamos os ícones com `aria-hidden="true"`: quem descreve o botão é o rótulo, não o desenho.

---

## Passo 4 — O JavaScript do login

Abra `public/js/login.js` e faça três alterações.

### 4.1 O import

No topo, acrescente a linha do `icons.js`:

```javascript
import { api } from "./api.js";
import { HOME_PAGE, redirectIfAuthenticated, saveSession } from "./auth.js";
import { renderIcons } from "./icons.js";
```

### 4.2 Desenhar os ícones **antes** de o Vue montar

Logo depois de `redirectIfAuthenticated();` e **antes** do `createApp`, acrescente:

```javascript
// Quem ja tem sessao nao precisa ver esta tela.
redirectIfAuthenticated();

// Os icones viram <svg> ANTES de o Vue ler o HTML. Assim o Vue
// enxerga o desenho pronto e nunca briga com o Lucide pelo DOM.
renderIcons();

createApp({
```

### 4.3 O estado e o método do Caps Lock

No `data()`, acrescente `capsLockOn`:

```javascript
  data() {
    return {
      form: {
        email: "",
        password: "",
      },
      showPassword: false,
      capsLockOn: false,
      loading: false,
      errorMessage: "",
      successMessage: "",
    };
  },
```

E no `methods`, acrescente `checkCapsLock` (pode ser antes do `fillDemo`):

```javascript
  methods: {
    // getModifierState pergunta ao navegador como estao as teclas
    // especiais NO MOMENTO deste evento de teclado.
    checkCapsLock(event) {
      this.capsLockOn = event.getModifierState?.("CapsLock") ?? false;
    },

    fillDemo() {
```

Salve.

---

## 2. A pegadinha: Lucide + Vue

Esta é a parte mais importante da aula. Leia com calma.

### O que o Lucide faz com o DOM

```text
   ANTES do createIcons():          DEPOIS do createIcons():

   <span>                           <span>
     <i data-lucide="eye"></i>        <svg class="lucide lucide-eye">...</svg>
   </span>                          </span>
```

O `<i>` **deixa de existir**. Outro elemento entra no lugar dele.

### O que o Vue faz com o DOM

O Vue guarda uma **referência** para cada elemento que ele criou. Quando o `showPassword` muda, ele vai lá e diz: "remova **aquele** elemento, coloque **este** outro".

### O conflito (se chamássemos o Lucide DEPOIS de montar)

```text
   1. Vue monta a tela e guarda a referencia do <i data-lucide="eye">
   2. Lucide troca esse <i> por um <svg>
   3. Usuario clica no olho -> Vue tenta remover o <i>
   4. O <i> nao esta mais na pagina!
      -> erro no console, ou dois icones aparecendo ao mesmo tempo
```

### A solução que usamos

```javascript
renderIcons();        // 1. o Lucide troca os <i> por <svg> no HTML cru

createApp({ ... })    // 2. o Vue le o HTML ja com os <svg>
  .mount("#app");     //    e trata o desenho como HTML normal
```

O Vue lê o HTML do `#app` **no momento do `mount`**. Como os ícones já viraram `<svg>`, para o Vue eles são só mais um pedaço de HTML. Quando o `v-if` alterna, o Vue cria e remove os `<svg>` sozinho, sem ninguém mexendo por trás.

### E por que as diretivas ficam no `<span>`?

```html
<!-- CERTO: a diretiva fica em um elemento que o Lucide nao troca -->
<span v-if="showPassword"><i data-lucide="eye-off"></i></span>

<!-- ERRADO: o Lucide copia os atributos do <i> para o <svg>... -->
<i v-if="showPassword" data-lucide="eye-off"></i>
```

O Lucide **copia os atributos** do `<i>` para o `<svg>` novo. Um `v-if` copiado para dentro de um `<svg>` é uma receita de comportamento estranho. Com o `<span>` por fora, o Lucide e o Vue mexem em elementos **diferentes**.

> 📌 **Regra para levar:** com Vue, chame `renderIcons()` **antes** do `mount` e **nunca** coloque diretiva (`v-if`, `v-show`, `:class`, `@click`) no próprio `<i data-lucide>`.

---

## 3. Caps Lock: por que isso é uma melhoria de verdade

Senha errada por causa do Caps Lock é um dos motivos mais comuns de chamado de suporte. E, com o limite de tentativas que vamos criar na [Aula 67](67-limite-tentativas-login.md), três erros bobos podem **bloquear** a pessoa por alguns minutos.

```javascript
checkCapsLock(event) {
  this.capsLockOn = event.getModifierState?.("CapsLock") ?? false;
}
```

| Trecho | O que faz |
|---|---|
| `event.getModifierState("CapsLock")` | `true` se o Caps Lock estava ligado quando a tecla foi apertada |
| `?.(...)` | proteção: em alguns navegadores antigos o método não existe |
| `?? false` | se não existir, considera desligado |
| `@keydown` **e** `@keyup` | o `keydown` pega a tecla Caps Lock sendo **ligada**; o `keyup` pega ela sendo **desligada** |
| `@blur="capsLockOn = false"` | saiu do campo, o aviso some |

> 🔍 Por que não avisar o tempo todo, em qualquer lugar da tela? Porque só importa **enquanto a pessoa digita a senha**. No campo de e-mail o Caps Lock não atrapalha: e-mail não diferencia maiúsculas.

---

## Passo 5 — O olhinho na tela de cadastro

Abra `public/cadastro.html` e localize o botão "Mostrar" dentro do bloco `<!-- SENHA -->`:

```html
              <button
                type="button"
                class="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Ocultar" : "Mostrar" }}
              </button>
```

Troque por:

```html
              <button
                type="button"
                class="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-400 transition hover:text-slate-900 focus-visible:text-slate-900"
                :aria-label="showPassword ? 'Ocultar senhas' : 'Mostrar senhas'"
                :title="showPassword ? 'Ocultar senhas' : 'Mostrar senhas'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <span v-if="showPassword"><i data-lucide="eye-off" class="h-5 w-5"></i></span>
                <span v-else><i data-lucide="eye" class="h-5 w-5"></i></span>
              </button>
```

E, no `<input>` da senha logo acima, troque `pr-20` por `pr-12`.

> 🔍 Repare no rótulo no **plural** ("Mostrar senhas"): na tela de cadastro o mesmo botão controla a senha **e** a confirmação, porque os dois campos usam o mesmo `showPassword`.

Salve.

Agora abra `public/js/cadastro.js`. Acrescente o import:

```javascript
import { api } from "./api.js";
import { LOGIN_PAGE, redirectIfAuthenticated } from "./auth.js";
import { renderIcons } from "./icons.js";
```

E, logo depois de `redirectIfAuthenticated();`:

```javascript
redirectIfAuthenticated();

// Icones prontos antes de o Vue ler o HTML (veja a Aula 60).
renderIcons();
```

Salve.

---

## Passo 6 — Ícones no menu e no botão "Sair"

Abra `public/js/layout.js`.

### 6.1 O import

No topo, abaixo do import do `auth.js`:

```javascript
import { getUser, logout } from "./auth.js";
import { renderIcons } from "./icons.js";
```

### 6.2 O `NAV_ITEMS` com nomes reais de ícones

Desde a [Aula 15](15-front-base.md), cada item do menu tem uma propriedade `icon` que **nunca foi usada**. Chegou a hora dela. Troque os valores pelos nomes do Lucide:

```javascript
const NAV_ITEMS = [
  { href: "/index.html", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/produtos.html", label: "Produtos", icon: "package" },
  { href: "/movimentacoes.html", label: "Movimentacoes", icon: "arrow-left-right" },
  { href: "/categorias.html", label: "Categorias", icon: "tag" },
  { href: "/relatorios.html", label: "Relatorios", icon: "chart-column" },
];
```

### 6.3 O link com ícone

Dentro de `renderNav`, troque a linha do `return` do `map`:

```javascript
    return `<a href="${item.href}" class="rounded-lg px-4 py-2 text-sm font-medium transition ${classes}">${item.label}</a>`;
```

por:

```javascript
    // aria-current diz ao leitor de tela "voce esta nesta pagina".
    return `
      <a
        href="${item.href}"
        ${isActive ? 'aria-current="page"' : ""}
        class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${classes}"
      >
        <i data-lucide="${item.icon}" class="h-4 w-4"></i>
        ${item.label}
      </a>
    `;
```

### 6.4 O botão "Sair" com ícone

Em `renderUserBadge`, troque o botão:

```javascript
      <button
        data-logout
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        Sair
      </button>
```

por:

```javascript
      <button
        data-logout
        aria-label="Sair do sistema"
        title="Sair do sistema"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        <i data-lucide="log-out" class="h-4 w-4"></i>
        <span class="hidden sm:inline">Sair</span>
      </button>
```

> 🔍 No celular (`sm:` para baixo) o texto "Sair" some e fica só o ícone, economizando espaço no cabeçalho. Por isso o `aria-label`: sem texto visível, ele é quem diz o que o botão faz.

### 6.5 Desenhar os ícones depois de montar o menu

Em `mountLayout`, acrescente a chamada **depois** do `innerHTML`:

```javascript
export function mountLayout(activeHref) {
  const container = document.querySelector("[data-nav]");

  if (container) {
    container.innerHTML = renderNav(activeHref);

    // Os <i data-lucide> do menu acabaram de nascer: hora de desenha-los.
    renderIcons();

    // O botao so existe depois que o HTML acima foi inserido.
    container.querySelector("[data-logout]")?.addEventListener("click", logout);
  }
}
```

Salve.

### 🔍 Por que aqui o `renderIcons` vem DEPOIS?

Nas telas Vue, chamamos **antes** do `mount`. Aqui, **depois** do `innerHTML`. A regra é a mesma nos dois casos:

> **O Lucide só desenha o que já existe na página.**

O menu é criado por `innerHTML`: antes dessa linha não há `<i>` nenhum para desenhar. E aqui não existe Vue cuidando do menu, então não há conflito.

> ⚠️ **Guarde isto para as próximas aulas:** toda vez que um `innerHTML` criar um `<i data-lucide>`, é preciso chamar `renderIcons()` logo depois. Esquecer isso é o erro nº 1 com Lucide: o ícone simplesmente **não aparece**, e nenhum erro é mostrado.

### 🔍 E na tela de relatórios, que é Vue *e* tem menu?

O `relatorios.js` chama `mountLayout(...)` **antes** do `createApp`. Então o `renderIcons()` de dentro do `mountLayout` roda antes de o Vue montar, que é exatamente a ordem segura que vimos na seção 2. Nada a fazer.

---

## Passo 7 — Testar

Recarregue com **Ctrl + Shift + R** (o navegador guarda os `.js` antigos em cache).

| # | Faça | Esperado |
|---|---|---|
| 1 | Abra `/login.html` | Um olho cinza dentro do campo de senha |
| 2 | Digite uma senha e clique no olho | A senha aparece e o ícone vira o olho **riscado** |
| 3 | Clique de novo | Volta a `••••` e o olho normal |
| 4 | Clique várias vezes seguidas | Sempre **um** ícone só, nenhum erro no console (F12) |
| 5 | Ligue o Caps Lock e digite na senha | Aparece "Caps Lock ativado" em amarelo |
| 6 | Desligue o Caps Lock e digite | O aviso some |
| 7 | Passe o mouse sobre o olho | Dica "Mostrar senha" |
| 8 | Aperte `Tab` até o olho e tecle `Enter` | Alterna a senha (funciona pelo teclado) |
| 9 | Faça login | O menu tem um ícone em cada item |
| 10 | Navegue entre as telas | O item da tela atual fica destacado, com ícone branco |
| 11 | Diminua a janela (largura de celular) | O botão Sair vira só o ícone |
| 12 | Abra `/cadastro.html` (saia antes) | O olho controla os dois campos de senha |

### Teste de resistência: o CDN fora do ar

1. No F12, vá na aba **Network** (Rede)
2. Clique com o botão direito em `lucide.min.js` → **Block request URL** (Bloquear URL)
3. Recarregue a página

✅ **Esperado:** o sistema funciona normalmente, só sem os ícones. Nenhum erro vermelho no console.

Isso é o `window.lucide?.` do `icons.js` trabalhando. Desbloqueie a URL depois do teste.

---

## ✅ Confira se deu certo

- [ ] As sete páginas carregam o `lucide.min.js` com versão fixa
- [ ] `public/js/icons.js` existe e exporta `renderIcons`
- [ ] O olho alterna entre `eye` e `eye-off` no login e no cadastro
- [ ] O botão do olho tem `aria-label` que muda com o estado
- [ ] O aviso de Caps Lock aparece e some
- [ ] O menu mostra ícones e marca a página atual com `aria-current`
- [ ] O botão Sair tem ícone e funciona
- [ ] Bloquear o CDN do Lucide **não** quebra o sistema
- [ ] O console (F12) está limpo

---

## 🔧 Se deu erro

### Os ícones não aparecem (nenhum erro no console)

Três causas possíveis, nesta ordem:

1. **Faltou o `renderIcons()`** depois do `innerHTML` (no menu) ou antes do `createApp` (nas telas Vue).
2. **Faltou o `<script>` do Lucide** no `<head>` daquela página.
3. **Nome do ícone errado.** Confira em https://lucide.dev/icons. No console, rode `lucide.icons` para ver a lista de nomes da versão carregada.

### `lucide is not defined`

Você chamou `lucide.createIcons()` direto em algum lugar, sem passar pelo `icons.js`. Use sempre `renderIcons()`.

### Aparecem os dois olhos ao mesmo tempo, ou o ícone não troca

O `renderIcons()` está sendo chamado **depois** do `mount` do Vue, ou a diretiva `v-if` foi colocada no `<i>`. Releia a seção 2.

### O ícone aparece gigante

Faltou a classe de tamanho (`h-4 w-4`, `h-5 w-5`) no `<i>`. Sem ela, o SVG usa o tamanho padrão de 24 px.

### Clicar no olho tenta fazer login

O botão perdeu o `type="button"`. Dentro de um `<form>`, todo botão sem `type` é `submit` (lembra da [Aula 19](19-front-categorias.md)?).

### O aviso de Caps Lock nunca aparece

Confira se os **dois** eventos estão no input: `@keydown="checkCapsLock"` e `@keyup="checkCapsLock"`, e se `capsLockOn` existe no `data()`.

---

## ➡️ Próximo passo

A tela ficou mais bonita. Agora vamos melhorar o que está **por baixo**: a forma como o front conversa com a API.

**[Aula 61 — Axios no lugar do fetch](61-axios-no-lugar-do-fetch.md)**
