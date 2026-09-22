# Aula 28 — Primeiros passos com Vue.js

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** teórica + laboratório

---

## Objetivo

Entender **por que** as telas de login e cadastro vão usar Vue.js, e aprender os 6 recursos que elas usam:

`{{ }}` · `v-model` · `@evento` · `:atributo` · `v-if` · `v-for` · `computed`

Ao final você vai ter uma página de laboratório para experimentar.

---

## Antes de começar

- [ ] [Aula 27](27-auth-rotas-e-middleware.md) concluída (API protegida e testada por `curl`)
- [ ] Containers no ar

---

## 1. O problema que já estava lá

Abra `public/js/categorias.js`, da [Aula 19](19-front-categorias.md). Você vai encontrar algo assim:

```javascript
function renderCategories(categories) {
  tableBody.innerHTML = categories
    .map(
      (category) => `
      <tr>
        <td class="py-3 pr-4 font-medium">${escapeHtml(category.name)}</td>
        <td class="py-3 pr-4 text-slate-500">${category.productCount}</td>
        ...
      </tr>`
    )
    .join("");
}
```

Funciona muito bem. E foi ótimo escrever isso à mão — você entendeu o que acontece por baixo de qualquer framework.

Mas repare no **trabalho** que dá:

| Você precisa | Porque |
|---|---|
| montar HTML dentro de string | o navegador não faz sozinho |
| lembrar do `escapeHtml` em **cada** campo | senão um nome com `<script>` vira código |
| chamar `render()` toda vez que o dado muda | a tela não sabe que o dado mudou |
| religar os eventos depois de cada `innerHTML` | os botões antigos foram destruídos |

O quarto item é o mais traiçoeiro. Toda vez que você faz `innerHTML = ...`, todos os `addEventListener` daquele pedaço somem junto.

### O ciclo manual

```text
   dado muda  ──►  EU chamo render()  ──►  monto string HTML
                                                  │
                                                  ▼
                                          innerHTML = ...
                                                  │
                                                  ▼
                                       EU religo os eventos
```

Se eu esquecer de qualquer um desses passos, a tela **mente**: mostra um dado velho.

---

## 2. A ideia do Vue: descrever, não mandar

Vue inverte a direção. Em vez de você dizer *como* mudar a tela, você descreve *como ela é* para cada estado — e o Vue se encarrega do resto.

```text
   MANUAL (imperativo)              VUE (declarativo)
   -------------------              -----------------
   "pegue a tabela,                 "a tabela mostra
    apague tudo,                     a lista de itens"
    monte as linhas,
    coloque de volta,                (e pronto — mudou a
    religue os cliques"               lista, mudou a tela)
```

É a mesma diferença entre:

- **Imperativo:** "vire à direita, siga 200 m, vire à esquerda..."
- **Declarativo:** "me leve à padaria"

### O ciclo com Vue

```text
   dado muda  ──►  a tela se atualiza
                   (o Vue percebeu sozinho)
```

Só isso. Esse "perceber sozinho" tem nome: **reatividade**.

> 📌 Você não vai deixar de entender o `innerHTML`. Pelo contrário: agora que você sabe fazer na mão, dá para apreciar o que o Vue economiza. Frameworks só fazem sentido para quem já sentiu o problema que eles resolvem.

---

## 3. Vue sem instalar nada

Vue costuma aparecer junto com `npm`, Vite, `.vue`, build... Nada disso é obrigatório.

Uma linha basta:

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

Exatamente como fizemos com o Tailwind na [Aula 15](15-front-base.md).

| | O que ganhamos | O que perdemos |
|---|---|---|
| **CDN** | zero configuração, o navegador entende na hora | sem arquivos `.vue`, sem otimização |
| **Build (Vite)** | componentes em arquivos, projeto grande organizado | mais uma ferramenta para aprender |

Para aprender os conceitos, o CDN é melhor: nada fica escondido atrás de um compilador.

> ⚠️ **Em produção** você usaria `vue.global.prod.js` (menor e mais rápido) ou um build de verdade. A versão que estamos usando traz mensagens de erro detalhadas no console — ótimo para aprender.

---

## 4. A anatomia de um app Vue

Todo app Vue tem **duas metades**:

```text
   HTML                              JAVASCRIPT
   ----                              ----------
   <div id="app">                    createApp({
     <p>{{ nome }}</p>       ◄────►    data() {
     <input v-model="nome">              return { nome: "Ana" };
   </div>                               }
                                      }).mount("#app");
```

| Metade | Responsabilidade |
|---|---|
| HTML | como a tela **parece** para cada estado |
| JavaScript | qual é o **estado** e o que os botões fazem |

E o `.mount("#app")` é o momento em que o Vue assume o comando daquele pedaço da página.

> 🔍 O Vue só controla o que está **dentro** de `#app`. O resto da página continua sendo HTML comum.

---

## Passo 1 — Criar o laboratório

Crie `public/vue-lab.html`. Este arquivo **não faz parte do sistema** — é um parquinho para experimentar, e você pode apagá-lo depois da aula.

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Laboratorio Vue | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
      [v-cloak] {
        display: none;
      }
    </style>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <!-- ==========================================================
         Pagina de laboratorio da Aula 28.
         Nao faz parte do sistema: serve para experimentar o Vue.
         Pode ser apagada depois da aula.
         ========================================================== -->
    <main id="app" v-cloak class="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <header>
        <h1 class="text-2xl font-bold">Laboratorio Vue</h1>
        <p class="text-sm text-slate-500">Aula 28 - experimente e veja o que acontece</p>
      </header>

      <!-- 1. REATIVIDADE -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="font-semibold">1. Reatividade</h2>
        <p class="mb-4 text-sm text-slate-500">
          Nenhuma linha de codigo toca no HTML. Mudou o dado, mudou a tela.
        </p>

        <div class="flex items-center gap-3">
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
            @click="contador = contador - 1"
          >
            -
          </button>
          <span class="w-16 text-center text-2xl font-bold">{{ contador }}</span>
          <button
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
            @click="contador = contador + 1"
          >
            +
          </button>
          <span class="ml-4 text-sm text-slate-500">o dobro e {{ contador * 2 }}</span>
        </div>
      </section>

      <!-- 2. v-model -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="font-semibold">2. v-model: mao dupla</h2>
        <p class="mb-4 text-sm text-slate-500">Digite e veja o dado acompanhar.</p>

        <input
          v-model="nome"
          placeholder="Seu nome"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
        />
        <p class="mt-3 text-sm">
          Ola, <strong>{{ nome || "visitante" }}</strong> - voce digitou
          {{ nome.length }} caractere(s).
        </p>
      </section>

      <!-- 3. computed -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="font-semibold">3. computed: valor derivado</h2>
        <p class="mb-4 text-sm text-slate-500">
          O "e valido" se recalcula sozinho a cada tecla.
        </p>

        <input
          v-model.trim="email"
          placeholder="voce@empresa.com"
          class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-slate-900"
          :class="emailValido ? 'border-emerald-300' : 'border-rose-300'"
        />
        <p class="mt-3 text-sm" :class="emailValido ? 'text-emerald-700' : 'text-rose-700'">
          {{ emailValido ? "E-mail com cara de valido" : "Ainda nao parece um e-mail" }}
        </p>
      </section>

      <!-- 4. v-if e v-show -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="font-semibold">4. v-if x v-show</h2>
        <p class="mb-4 text-sm text-slate-500">
          Abra o inspetor (F12) e compare: o v-if some do HTML, o v-show so fica invisivel.
        </p>

        <button
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          @click="mostrar = !mostrar"
        >
          {{ mostrar ? "Esconder" : "Mostrar" }}
        </button>

        <p v-if="mostrar" class="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm">
          Eu uso v-if (saio do HTML)
        </p>
        <p v-show="mostrar" class="mt-2 rounded-xl bg-amber-50 px-4 py-2 text-sm">
          Eu uso v-show (fico no HTML com display:none)
        </p>
      </section>

      <!-- 5. v-for -->
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="font-semibold">5. v-for: lista que se mantem sozinha</h2>
        <p class="mb-4 text-sm text-slate-500">
          Acrescente itens e repare que nao existe innerHTML em lugar nenhum.
        </p>

        <form class="flex gap-2" @submit.prevent="adicionar">
          <input
            v-model.trim="novoItem"
            placeholder="Nome do produto"
            class="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
          />
          <button
            type="submit"
            :disabled="!novoItem"
            class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            Adicionar
          </button>
        </form>

        <ul class="mt-4 space-y-2">
          <li
            v-for="(item, indice) in itens"
            :key="item.id"
            class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm"
          >
            <span>{{ indice + 1 }}. {{ item.nome }}</span>
            <button class="text-xs font-semibold text-rose-600" @click="remover(item.id)">
              remover
            </button>
          </li>
        </ul>

        <p v-if="itens.length === 0" class="mt-4 text-center text-sm text-slate-400">
          Nenhum item ainda.
        </p>
        <p v-else class="mt-4 text-sm text-slate-500">Total: {{ itens.length }} item(ns)</p>
      </section>
    </main>

    <script>
      const { createApp } = Vue;

      createApp({
        data() {
          return {
            contador: 0,
            nome: "",
            email: "",
            mostrar: true,
            novoItem: "",
            itens: [
              { id: 1, nome: "Cafe em graos" },
              { id: 2, nome: "Papel A4" },
            ],
            proximoId: 3,
          };
        },

        computed: {
          emailValido() {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
          },
        },

        methods: {
          adicionar() {
            this.itens.push({ id: this.proximoId, nome: this.novoItem });
            this.proximoId = this.proximoId + 1;
            this.novoItem = "";
          },

          remover(id) {
            this.itens = this.itens.filter((item) => item.id !== id);
          },
        },
      }).mount("#app");
    </script>
  </body>
</html>
```

Salve e abra `http://localhost:3000/vue-lab.html`.

> 💡 Repare que esta página não chama a API. Por isso ela funciona mesmo com a API protegida pela [Aula 27](27-auth-rotas-e-middleware.md).

---

## 5. Os 6 recursos, um a um

Agora vamos ler o laboratório por partes. Mexa na tela enquanto lê.

### 5.1 `{{ }}` — mostrar um dado

```html
<span>{{ contador }}</span>
<span>o dobro e {{ contador * 2 }}</span>
```

As chaves duplas se chamam **interpolação** (ou "bigode"). Dentro delas cabe qualquer expressão JavaScript.

O equivalente que você escreveria na mão:

```javascript
document.querySelector("#contador").textContent = contador;
```

Só que você teria que se lembrar de chamar isso **toda vez** que `contador` mudasse. O Vue não esquece.

> 🔒 **Bônus de segurança:** `{{ }}` sempre escreve **texto**, nunca HTML. Se o nome do produto for `<script>alert(1)</script>`, aparece essa string na tela — não executa. Ou seja: o `escapeHtml` da [Aula 15](15-front-base.md) vem de graça.

### 5.2 `v-model` — o campo e o dado, amarrados

```html
<input v-model="nome" />
<p>Ola, <strong>{{ nome || "visitante" }}</strong></p>
```

Digite no campo e veja o texto mudar **enquanto você digita**.

`v-model` é uma ligação de **mão dupla**:

```text
    usuário digita  ──►  nome muda  ──►  {{ nome }} atualiza
    código muda nome  ──►  o campo na tela muda também
```

Na mão, seriam duas coisas:

```javascript
input.addEventListener("input", (e) => { nome = e.target.value; render(); });
input.value = nome;
```

#### Os modificadores

```html
<input v-model.trim="email" />
```

| Modificador | O que faz |
|---|---|
| `.trim` | remove espaços das pontas automaticamente |
| `.number` | converte para número |
| `.lazy` | só atualiza quando sair do campo, em vez de a cada tecla |

> ⚠️ **Guarde para a Aula 29:** vamos usar `.trim` no nome e no e-mail — e **nunca** na senha, pelo mesmo motivo da [Aula 25](25-auth-validator-repository.md).

### 5.3 `@evento` — reagir a cliques

```html
<button @click="contador = contador + 1">+</button>
<form @submit.prevent="adicionar">
```

`@click` é atalho para `v-on:click`.

O `.prevent` é o modificador mais importante da aula:

```javascript
// O que você escrevia antes, em TODO formulário:
form.addEventListener("submit", (event) => {
  event.preventDefault();   // senão a página recarrega
  ...
});
```

```html
<!-- Com Vue: -->
<form @submit.prevent="adicionar">
```

> ⚠️ **Se você esquecer o `.prevent`**, a página recarrega ao enviar o formulário, o estado se perde e parece que "não aconteceu nada". É o erro nº 1 de quem começa com Vue.

### 5.4 `:atributo` — atributo que muda sozinho

```html
<input :class="emailValido ? 'border-emerald-300' : 'border-rose-300'" />
<button :disabled="!novoItem">Adicionar</button>
<li :key="item.id">
```

Os dois pontos são atalho para `v-bind:`. A diferença é sutil e essencial:

```html
<input class="border-slate-200" />     <!-- texto fixo -->
<input :class="minhaVariavel" />       <!-- resultado de uma expressão -->
```

Experimente no laboratório: apague o campo da seção 5 e veja o botão "Adicionar" ficar cinza sozinho. Ninguém escreveu `button.disabled = true`.

### 5.5 `v-if` e `v-show` — mostrar ou esconder

```html
<p v-if="itens.length === 0">Nenhum item ainda.</p>
<p v-else>Total: {{ itens.length }} item(ns)</p>
```

| Diretiva | O que faz | Use quando |
|---|---|---|
| `v-if` | **remove** o elemento do HTML | a condição muda pouco |
| `v-show` | mantém o elemento, com `display: none` | liga/desliga toda hora |

> 🔍 **Faça este teste em sala:** abra o inspetor (F12), vá na seção 4 do laboratório e clique em "Esconder". O parágrafo com `v-if` **desaparece** do HTML; o com `v-show` continua lá, riscado com `display: none`.

### 5.6 `v-for` — repetir para cada item

```html
<li v-for="(item, indice) in itens" :key="item.id">
  {{ indice + 1 }}. {{ item.nome }}
</li>
```

Escreve-se **um** `<li>` e o Vue faz quantos forem necessários.

Compare com o que fazíamos:

```javascript
tableBody.innerHTML = categories.map((c) => `<tr>...</tr>`).join("");
```

#### O `:key` não é enfeite

```html
:key="item.id"
```

É como o Vue reconhece cada item entre uma atualização e outra. Sem ele, ao remover o item do meio da lista, o Vue pode reaproveitar o elemento errado — e um texto digitado dentro de um item "pula" para outro.

> 📌 **Regra:** todo `v-for` tem `:key`, e a chave é algo **único e estável** — o `id` do banco, nunca o índice da posição.

### 5.7 `computed` — valor que se calcula sozinho

```javascript
computed: {
  emailValido() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  },
},
```

E no HTML:

```html
<p :class="emailValido ? 'text-emerald-700' : 'text-rose-700'">
```

Digite no campo de e-mail do laboratório: a borda e o texto mudam de cor a cada tecla. Ninguém chamou `emailValido()` — o Vue percebeu que ela usa `this.email` e passou a recalculá-la sempre que `email` muda.

#### `computed` × `methods`

| | `computed` | `methods` |
|---|---|---|
| Como se usa no HTML | `{{ total }}` | `{{ total() }}` |
| Quando roda | quando o que ele usa muda | toda vez que é chamado |
| Para quê | **calcular** um valor | **fazer** alguma coisa |

Regra simples: se a função só devolve um valor a partir do estado, é `computed`. Se ela muda alguma coisa (grava, envia, navega), é `method`.

---

## 6. As três chaves do objeto

Repare que o `createApp` do laboratório tem exatamente três blocos:

```javascript
createApp({
  data() { return { ... } },   // 1. o estado
  computed: { ... },           // 2. valores derivados do estado
  methods: { ... },            // 3. ações
}).mount("#app");
```

| Bloco | Pergunta que responde |
|---|---|
| `data()` | O que essa tela precisa **lembrar**? |
| `computed` | O que dá para **calcular** a partir disso? |
| `methods` | O que essa tela **faz**? |

E existe um quarto, que usaremos na Aula 30:

```javascript
mounted() { ... }   // roda uma vez, quando a tela aparece
```

### 🔍 Por que `data()` é uma função?

```javascript
data() {
  return { contador: 0 };
}
```

Parece burocracia — por que não `data: { contador: 0 }`?

Porque um mesmo componente pode aparecer várias vezes na tela. Se `data` fosse um objeto direto, todas as cópias compartilhariam o **mesmo** objeto, e mexer em uma mudaria as outras. Sendo função, cada cópia chama e recebe o seu próprio.

### 🔍 O `this`

Dentro de `methods` e `computed`, `this` é o estado da tela:

```javascript
adicionar() {
  this.itens.push({ id: this.proximoId, nome: this.novoItem });
  this.novoItem = "";
}
```

`this.novoItem = ""` limpa o campo na tela — porque ele está amarrado com `v-model`.

> ⚠️ **Nunca use *arrow function* em `methods`.** Escrever `adicionar: () => { this.itens... }` quebra, porque *arrow functions* não têm `this` próprio. Use sempre a forma curta `adicionar() { ... }`.

---

## 7. O `v-cloak`: o detalhe que evita uma feiura

```html
<style>
  [v-cloak] { display: none; }
</style>

<main id="app" v-cloak>
```

O navegador desenha o HTML **antes** de o Vue carregar. Durante essa fração de segundo, o usuário veria literalmente:

```text
Ola, {{ nome }} - voce digitou {{ nome.length }} caractere(s).
```

O atributo `v-cloak` fica no elemento até o Vue assumir; o CSS esconde tudo enquanto ele está lá. Quando o Vue monta, ele remove o atributo e a tela aparece pronta.

> 🔍 Para ver o problema, comente a linha do `<style>` e recarregue algumas vezes com o cache desligado.

---

## 8. Vue não substitui o que você aprendeu

Uma coisa importante antes de seguir:

| Continua igual | Muda |
|---|---|
| `fetch` e a API | como a tela é montada |
| `public/js/api.js` | quem chama `render()` (ninguém) |
| O back-end inteiro | — |
| `async/await`, `try/catch` | — |

As telas de login e cadastro vão usar **o mesmo `api.js`** das outras telas. Vue cuida só da parte visual.

---

## ✅ Confira se deu certo

Abra `http://localhost:3000/vue-lab.html` e marque:

- [ ] Os botões `+` e `-` mudam o número, e "o dobro" acompanha
- [ ] Digitar o nome muda o texto abaixo em tempo real
- [ ] O e-mail muda de cor entre vermelho e verde
- [ ] "Esconder" some com um parágrafo e apaga o outro (veja no F12)
- [ ] Dá para adicionar e remover itens da lista
- [ ] O botão "Adicionar" fica cinza quando o campo está vazio
- [ ] O console (F12) não tem erros em vermelho

### Experimente quebrar

Aprender a reconhecer o erro é tão útil quanto acertar:

| Experimento | O que acontece |
|---|---|
| Troque `@submit.prevent` por `@submit` | a página recarrega e a lista volta ao início |
| Apague o `:key` do `v-for` | funciona, mas o Vue avisa no console |
| Troque `{{ contador }}` por `{{ contadr }}` | aparece vazio + aviso no console |
| Apague o `v-cloak` e recarregue | você vê as chaves `{{ }}` piscando |

---

## 🔧 Se deu erro

### A tela mostra literalmente `{{ contador }}`

O Vue não montou. Três causas, em ordem de probabilidade:

1. O `<script>` do Vue não carregou — veja a aba **Network** do F12 (precisa de internet).
2. O `id` do HTML não bate com o `.mount("#app")`.
3. Há erro de JavaScript **antes** do `createApp` — veja o console.

### `Vue is not defined`

O `<script src="...vue.global.js">` está faltando, ou está **depois** do seu código. A ordem importa: primeiro a biblioteca, depois quem a usa.

### A página pisca e volta ao estado inicial ao enviar o formulário

Faltou o `.prevent` no `@submit`.

### `Cannot read properties of undefined`

Você usou no HTML um nome que não existe no `data()`. Confira a grafia — o console diz qual é.

---

## ➡️ Próximo passo

Agora que o Vue não é mais mistério, vamos construir a primeira tela de verdade.

**[Aula 29 — Tela de cadastro com Vue](29-tela-cadastro-vue.md)**
