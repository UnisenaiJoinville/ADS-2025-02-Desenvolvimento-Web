# Aula 30 — Tela de login com Vue

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** prática (HTML + Vue)

---

## Objetivo

Construir a tela de login e **guardar a sessão**:

- `public/login.html` + `public/js/login.js`
- ler os parâmetros da URL que a tela de cadastro manda
- gravar token e usuário com o `auth.js`

Ao final desta aula você vai entrar no sistema — e ver o token nascer no F12.

---

## Antes de começar

- [ ] [Aula 29](29-tela-cadastro-vue.md) concluída
- [ ] Você já criou pelo menos uma conta pela tela de cadastro

---

## 1. O que a tela de login faz (e o que não faz)

```text
   1. recebe e-mail e senha
   2. manda para POST /api/auth/login
   3. GUARDA o { user, token } que voltou      <- o passo novo
   4. vai para o dashboard
```

O passo 3 é a diferença. A tela de cadastro não guardava nada; esta guarda — e é por isso que, a partir daqui, o sistema todo passa a saber quem você é.

### Menos validação que no cadastro

Repare no contraste com a Aula 29:

| | Cadastro | Login |
|---|---|---|
| Valida formato do e-mail | sim | não |
| Cobra senha de 6+ caracteres | sim | não |
| Mostra erro por campo | sim | não |
| Mensagem de erro | específica | uma só, genérica |

Por quê? Duas razões:

1. **Segurança** — "a senha deve ter 6 caracteres" já conta algo sobre a conta (veja a [Aula 25](25-auth-validator-repository.md)).
2. **A senha pode ser antiga** — se a regra mudou desde que a pessoa se cadastrou, a senha dela continua valendo. Bloquear por regra nova trancaria um usuário legítimo para fora.

> 📌 **Regra geral:** cadastro valida muito, login valida quase nada. Quem decide é o servidor.

---

## Passo 1 — O HTML

Crie `public/login.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Entrar | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Vue 3 pelo CDN: nenhuma instalacao, nenhum build -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
      /* Esconde a tela ate o Vue assumir o controle, para o
         usuario nunca enxergar {{ }} piscando na pagina. */
      [v-cloak] {
        display: none;
      }
    </style>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <main id="app" v-cloak class="grid min-h-screen place-items-center px-6 py-10">
      <div class="w-full max-w-md">
        <!-- Marca -->
        <div class="mb-8 flex flex-col items-center gap-3">
          <div class="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
            EF
          </div>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-slate-900">Estoque Facil</h1>
            <p class="text-sm text-slate-500">Entre para gerenciar seu estoque</p>
          </div>
        </div>

        <form
          class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          @submit.prevent="handleSubmit"
        >
          <!-- Mensagem de sucesso vinda da tela de cadastro -->
          <p
            v-if="successMessage"
            class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {{ successMessage }}
          </p>

          <!-- Erro devolvido pela API -->
          <p
            v-if="errorMessage"
            class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {{ errorMessage }}
          </p>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">E-mail</span>
            <input
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              placeholder="voce@empresa.com"
              class="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-900"
            />
          </label>

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

          <button
            type="submit"
            :disabled="!canSubmit"
            class="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {{ loading ? "Entrando..." : "Entrar" }}
          </button>

          <p class="mt-6 text-center text-sm text-slate-500">
            Ainda nao tem conta?
            <a href="/cadastro.html" class="font-semibold text-slate-900 hover:underline">
              Criar conta
            </a>
          </p>
        </form>

        <!-- Atalho de sala de aula -->
        <div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center">
          <p class="text-xs text-slate-500">
            Conta de demonstracao:
            <strong class="text-slate-700">professor@estoquefacil.com</strong> / <strong class="text-slate-700">123456</strong>
          </p>
          <button
            type="button"
            class="mt-2 text-xs font-semibold text-slate-900 hover:underline"
            @click="fillDemo"
          >
            Preencher automaticamente
          </button>
        </div>
      </div>
    </main>

    <script type="module" src="/js/login.js"></script>
  </body>
</html>
```

Salve.

---

## 2. Lendo o HTML

### 2.1 Duas faixas de aviso

```html
<p v-if="successMessage" class="... border-emerald-200 bg-emerald-50 ...">
  {{ successMessage }}
</p>

<p v-if="errorMessage" class="... border-rose-200 bg-rose-50 ...">
  {{ errorMessage }}
</p>
```

Verde para "conta criada", vermelho para "senha errada". Cada uma com seu `v-if`, então normalmente nenhuma das duas está na tela.

### 2.2 O botão "Mostrar" dentro do campo

```html
<div class="relative mt-1">
  <input
    v-model="form.password"
    :type="showPassword ? 'text' : 'password'"
    class="w-full rounded-xl border ... pr-20 ..."
  />
  <button
    type="button"
    class="absolute inset-y-0 right-0 px-4 ..."
    @click="showPassword = !showPassword"
  >
    {{ showPassword ? "Ocultar" : "Mostrar" }}
  </button>
</div>
```

Três detalhes que valem discussão:

| Detalhe | Por quê |
|---|---|
| `:type="showPassword ? 'text' : 'password'"` | o **tipo** do campo é reativo; não existe JS mexendo no DOM |
| `type="button"` | **sem isso, o botão enviaria o formulário** — dentro de `<form>`, o padrão de `<button>` é `submit` |
| `pr-20` no input | reserva espaço à direita para o texto não ficar embaixo do botão |

> ⚠️ O `type="button"` é um dos erros mais comuns em formulários. Sem ele, clicar em "Mostrar" tentaria fazer login.

### 2.3 `autocomplete`: ajudando o gerenciador de senhas

```html
<input autocomplete="email" ... />
<input autocomplete="current-password" ... />
```

Na tela de cadastro usamos `new-password`; aqui, `current-password`. Isso diz ao navegador:

| Valor | O navegador entende |
|---|---|
| `new-password` | "vou criar uma senha" → oferece gerar uma forte |
| `current-password` | "vou usar a que já tenho" → oferece preencher |

Dois atributos, e a tela passa a funcionar bem com gerenciadores de senha.

### 2.4 O atalho da conta de demonstração

```html
<button type="button" @click="fillDemo">Preencher automaticamente</button>
```

Um conforto de sala de aula.

> ⚠️ **Em um sistema real, apague este bloco inteiro.** Ele anuncia em letras garrafais um e-mail e uma senha válidos.

---

## Passo 2 — O JavaScript

Crie `public/js/login.js`:

```javascript
import { api } from "./api.js";
import { HOME_PAGE, redirectIfAuthenticated, saveSession } from "./auth.js";

// O CDN do Vue publica tudo dentro da variavel global "Vue".
const { createApp } = Vue;

// Quem ja tem sessao nao precisa ver esta tela.
redirectIfAuthenticated();

createApp({
  // data() devolve o ESTADO da tela. Tudo que esta aqui e reativo:
  // mudou o valor, o HTML se redesenha sozinho.
  data() {
    return {
      form: {
        email: "",
        password: "",
      },
      showPassword: false,
      loading: false,
      errorMessage: "",
      successMessage: "",
    };
  },

  // computed: valores DERIVADOS do estado. O Vue recalcula
  // automaticamente quando alguma peca usada aqui muda.
  computed: {
    canSubmit() {
      return (
        this.form.email.trim() !== "" &&
        this.form.password !== "" &&
        !this.loading
      );
    },
  },

  // mounted() roda uma vez, logo depois que a tela aparece.
  mounted() {
    // A tela de cadastro nos manda para ca com ?cadastro=ok
    const params = new URLSearchParams(window.location.search);

    if (params.get("cadastro") === "ok") {
      this.successMessage = "Conta criada com sucesso! Agora e so entrar.";
      this.form.email = params.get("email") ?? "";
    }
  },

  methods: {
    fillDemo() {
      this.form.email = "professor@estoquefacil.com";
      this.form.password = "123456";
      this.errorMessage = "";
    },

    async handleSubmit() {
      this.errorMessage = "";
      this.successMessage = "";
      this.loading = true;

      try {
        const { user, token } = await api.login({
          email: this.form.email,
          password: this.form.password,
        });

        saveSession({ user, token });

        // replace() troca a pagina SEM deixar o login no historico:
        // o botao "voltar" nao devolve o usuario para ca.
        window.location.replace(HOME_PAGE);
      } catch (error) {
        this.errorMessage = error.message;
        this.form.password = "";
      } finally {
        // finally roda deu certo ou deu errado - o botao sempre destrava.
        this.loading = false;
      }
    },
  },
}).mount("#app");
```

Salve.

---

## 3. Dissecando o `login.js`

### 3.1 A porta de entrada, antes de tudo

```javascript
// Quem ja tem sessao nao precisa ver esta tela.
redirectIfAuthenticated();
```

Repare **onde** essa linha está: antes do `createApp`, no corpo do módulo. Ela roda assim que o arquivo carrega.

Sem ela, alguém logado que digitasse `/login.html` veria um formulário de login — confuso, já que ele está dentro do sistema.

### 3.2 `mounted()`: lendo o recado da tela de cadastro

```javascript
// mounted() roda uma vez, logo depois que a tela aparece.
mounted() {
  // A tela de cadastro nos manda para ca com ?cadastro=ok
  const params = new URLSearchParams(window.location.search);

  if (params.get("cadastro") === "ok") {
    this.successMessage = "Conta criada com sucesso! Agora e so entrar.";
    this.form.email = params.get("email") ?? "";
  }
}
```

O `mounted` é o quarto bloco do Vue, junto de `data`, `computed` e `methods`. Ele roda **uma vez**, quando a tela já existe.

| Bloco | Quando roda |
|---|---|
| `data()` | antes de tudo, para criar o estado |
| `computed` | sempre que uma dependência muda |
| `methods` | quando alguém chama |
| `mounted()` | uma vez, logo depois de a tela aparecer |

#### `URLSearchParams`

```javascript
window.location.search            // "?cadastro=ok&email=ana%40teste.com"
params.get("cadastro")            // "ok"
params.get("email")               // "ana@teste.com"  (já decodificado!)
```

Repare: o `%40` voltou a ser `@` sozinho. É o par do `encodeURIComponent` que usamos na Aula 29.

> 🔍 **Por que não `mounted` para tudo?** Porque `mounted` roda **uma vez**. O que precisa acompanhar mudanças vai em `computed`. Aqui cabe porque a URL não muda enquanto a tela está aberta.

### 3.3 `canSubmit`, mais simples que no cadastro

```javascript
canSubmit() {
  return (
    this.form.email.trim() !== "" &&
    this.form.password !== "" &&
    !this.loading
  );
}
```

Só "os dois campos têm algo e não estamos carregando". Nada de formato de e-mail nem tamanho de senha — como decidimos na seção 1.

### 3.4 As três linhas que mudam tudo

```javascript
const { user, token } = await api.login({
  email: this.form.email,
  password: this.form.password,
});

saveSession({ user, token });

window.location.replace(HOME_PAGE);
```

Vamos com lupa:

**Linha 1 — desestruturação da resposta**

A API devolve `{ user: {...}, token: "eyJ..." }` e nós já separamos em duas variáveis.

**Linha 2 — a sessão nasce**

```javascript
saveSession({ user, token });
```

Aqui o `localStorage` ganha duas chaves. **Deste ponto em diante o usuário está logado** — e o `api.js` da Aula 29 vai anexar o token em toda requisição, sozinho.

**Linha 3 — sair da tela de login**

```javascript
// replace() troca a pagina SEM deixar o login no historico:
// o botao "voltar" nao devolve o usuario para ca.
window.location.replace(HOME_PAGE);
```

### 3.5 Limpar a senha depois do erro

```javascript
} catch (error) {
  this.errorMessage = error.message;
  this.form.password = "";
}
```

Duas razões:

1. Se a senha estava errada, o usuário vai digitar outra mesmo.
2. A senha não fica esquecida na tela, visível para quem passar atrás.

Repare que o **e-mail continua** preenchido. Limpar os dois seria irritante.

> 🔍 Uma linha como `this.form.password = ""` limpa o campo de verdade na tela, sem tocar no DOM. É o `v-model` funcionando nas duas direções, como vimos na [Aula 28](28-vue-primeiros-passos.md).

### 3.6 Por que não caímos no redirecionamento do `api.js`

Lembre da regra da Aula 29:

```javascript
if (response.status === 401 && token) {   // <- o "&& token"
```

Quando a senha está errada, a API devolve `401`. Mas nesta tela **ainda não existe token** no `localStorage`. Então a condição é falsa, e o erro chega normalmente ao nosso `catch`, que o mostra na faixa vermelha.

Se não fosse esse `&& token`, a tela recarregaria e a mensagem sumiria antes de ser lida.

### 3.7 `fillDemo`

```javascript
fillDemo() {
  this.form.email = "professor@estoquefacil.com";
  this.form.password = "123456";
  this.errorMessage = "";
}
```

Três atribuições e os dois campos se preenchem na tela. É a reatividade fazendo o trabalho.

---

## Passo 3 — Testar

Abra `http://localhost:3000/login.html`.

### Roteiro de teste

| # | Faça | Esperado |
|---|---|---|
| 1 | Abra a tela | Botão "Entrar" cinza |
| 2 | Digite algo nos dois campos | O botão fica preto |
| 3 | Clique em "Mostrar" | A senha aparece; o formulário **não** é enviado |
| 4 | Clique em "Preencher automaticamente" | Os dois campos se preenchem |
| 5 | Entre com senha errada | Faixa vermelha "E-mail ou senha invalidos"; a senha é limpa; a tela **não** recarrega |
| 6 | Entre com a senha certa | Vai para o dashboard |
| 7 | Digite `/login.html` de novo | Volta sozinho para o dashboard |
| 8 | Aperte "voltar" do navegador | **Não** volta para o login |

### O teste mais importante: ver o token

Depois de entrar, abra o **F12 → Application → Local Storage → http://localhost:3000**:

```text
Key                      Value
-----------------------  ------------------------------------------
estoque-facil:token      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
estoque-facil:user       {"id":2,"name":"Maria de Lourdes Silva",...}
```

🎉 Ali está o crachá.

### E o teste do fluxo completo

Cadastro → login, sem escalas:

1. Vá em `/cadastro.html`
2. Crie uma conta nova
3. Você cai no login **com a faixa verde** e o e-mail já preenchido
4. Digite a senha e entre

### Veja o token viajando

Ainda no F12, abra a aba **Network**, recarregue o dashboard e clique na requisição `dashboard`. Em **Request Headers**:

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ninguém escreveu esse cabeçalho nesta tela. Ele veio das quatro linhas que você acrescentou ao `api.js` na Aula 29.

> 🔍 **Momento jwt.io, parte 2:** copie o valor de `estoque-facil:token`, cole em https://jwt.io e mostre para a turma o `sub` com o id **daquele** usuário, e o `exp` com a data de vencimento.

---

## 4. "O dashboard está vazio!"

Pode ser que sim — e é esperado nesta aula.

As telas internas ainda não têm o porteiro nem mostram quem está logado. Se você entrou agora, o token existe e elas até carregam. Mas se você abrir o dashboard **sem** ter feito login, ele vai piscar vazio com uma notificação de erro, em vez de mandar você para o login.

É exatamente o que a próxima aula resolve.

---

## ✅ Confira se deu certo

- [ ] `public/login.html` e `public/js/login.js` criados
- [ ] Senha errada mostra a faixa vermelha, **sem** recarregar
- [ ] Senha certa leva ao dashboard
- [ ] `estoque-facil:token` e `estoque-facil:user` aparecem no Local Storage
- [ ] Voltar em `/login.html` logado redireciona para o dashboard
- [ ] O cabeçalho `Authorization` aparece na aba Network
- [ ] Cadastro leva ao login com a faixa verde e o e-mail preenchido

---

## 🔧 Se deu erro

### Entro, mas volto para o login na hora

O token não foi salvo. Confira no F12 → Application se as duas chaves existem. Se não existirem, o `saveSession({ user, token })` não foi chamado ou está com nomes trocados.

### "E-mail ou senha invalidos" com a senha certa

Três suspeitos, nesta ordem:

1. **Espaço extra** no campo. Repare: o e-mail tem `v-model.trim`, a senha **não** (de propósito).
2. A conta está **desativada** — a mensagem seria outra, mas confira: `SELECT email, active FROM users;`
3. Você cadastrou com outro e-mail. Confira: `SELECT email FROM users;`

### A tela pisca e volta ao estado inicial

Faltou o `.prevent` no `@submit`.

### Clicar em "Mostrar" tenta fazer login

Faltou `type="button"` no botão.

### `successMessage` nunca aparece

Confira a URL depois do cadastro: precisa ter `?cadastro=ok`. Se não tiver, o problema está no `cadastro.js`, não aqui.

### O dashboard abre mas não carrega os dados

Olhe a aba Network. Se a requisição deu `401`, o token não está indo — reveja o `api.js` da Aula 29.

---

## ➡️ Próximo passo

Você entra no sistema, mas as telas internas ainda não sabem disso. Vamos fechar o círculo.

**[Aula 31 — Protegendo as telas e mostrando quem está logado](31-protegendo-o-front.md)**
