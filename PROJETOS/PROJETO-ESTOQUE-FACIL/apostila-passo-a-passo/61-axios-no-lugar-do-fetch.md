# Aula 61 — Axios no lugar do fetch

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática (JavaScript do navegador)

---

## Objetivo

Reescrever o `public/js/api.js` usando a biblioteca **axios** e aprender:

- o que o axios faz que o `fetch` não faz;
- **interceptors**: código que roda em **toda** requisição e em **toda** resposta;
- como **cancelar** uma requisição que ficou velha (o que vamos usar na busca da Aula 63).

E tudo isso **sem mudar nenhuma tela**.

---

## Antes de começar

- [ ] [Aula 60](60-melhorias-icones-lucide.md) concluída
- [ ] Você consegue fazer login e navegar pelas telas

---

## Arquivos desta aula

```text
ARQUIVO ALTERADO
└── public/js/api.js   (reescrito por completo)
```

Só um arquivo. E é esse o ponto da aula.

---

## 1. Por que trocar o que funciona?

O `api.js` atual funciona. Mas releia a função `request` e conte quantas coisas ela faz **na mão**:

```javascript
async function request(path, options = {}) {
  const token = getToken();                                       // 1. pega o token
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;           // 2. monta o cabecalho
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && token) { ... }                   // 3. trata a sessao vencida
  if (response.status === 204) return null;                        // 4. trata o 204
  const data = await response.json().catch(() => ({}));           // 5. converte o JSON
  if (!response.ok) throw new Error(...);                         // 6. transforma 4xx/5xx em erro
  return data;
}
```

E nas chamadas:

```javascript
createProduct: (payload) =>
  request("/products", { method: "POST", body: JSON.stringify(payload) }),
//                                            ^^^^^^^^^^^^^^ 7. converte para JSON na mao
```

E o `buildQuery` da [Aula 42](42-tela-relatorios-vue.md), que monta a query string na mão (**8**).

### O que o axios faz sozinho

| Tarefa | `fetch` | axios |
|---|---|---|
| Converter o corpo para JSON | `JSON.stringify` na mão | automático |
| Mandar `Content-Type: application/json` | na mão | automático |
| Converter a resposta de JSON | `await response.json()` | automático (`response.data`) |
| **Erro em 404, 500...** | **não lança** (lembra da [Aula 15](15-front-base.md)?) | **lança** |
| Montar `?search=...&page=2` | `URLSearchParams` na mão | `params: { search, page }` |
| Tempo limite (*timeout*) | não tem (precisa de `AbortController`) | `timeout: 15000` |
| Código antes/depois de **toda** requisição | precisa de função própria (`request`) | **interceptors** |
| Cancelar requisição | `AbortController` | `AbortController` (igual) |

> 📌 **O `fetch` não é ruim.** Ele é a peça básica do navegador, e foi ótimo para aprender o que acontece por baixo. O axios é uma camada **em cima** dele que já resolve o que todo projeto acaba resolvendo na mão. Agora que você sabe o que ele faz por você, vale usá-lo.

---

## 2. Como o axios entra no projeto

Sem `npm install` no front: o projeto não tem etapa de build para o navegador. Vamos importar o axios **direto do CDN**, como módulo:

```javascript
import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/esm/axios.min.js";
```

| Parte da URL | Significado |
|---|---|
| `cdn.jsdelivr.net/npm/` | CDN que serve qualquer pacote publicado no npm |
| `axios@1.7.9` | **versão fixa**, pelo mesmo motivo da Aula 60 |
| `dist/esm/axios.min.js` | a versão **ESM** (com `export`), que funciona com `import` |

> 🔍 **Por que `import` aqui e `<script>` no Lucide?** O Lucide do CDN é UMD (cria uma variável global). O axios tem uma versão **ESM**, que conversa com `import`/`export` como os nossos arquivos. A vantagem: o axios entra em **um arquivo só** (`api.js`), e nenhum HTML precisa mudar.

---

## Passo 1 — O novo `api.js`

Abra `public/js/api.js`, **apague tudo** e escreva:

```javascript
// Camada unica de acesso a API.
// Desde a Aula 61 quem faz as requisicoes e o axios. As telas nao
// perceberam a troca: elas so conhecem o objeto "api" la embaixo.

import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/esm/axios.min.js";

import { clearSession, getToken, LOGIN_PAGE } from "./auth.js";

// Uma "instancia" do axios ja configurada para a nossa API.
// Tudo que for comum a todas as requisicoes fica aqui, uma vez so.
const http = axios.create({
  baseURL: "/api",
  // Sem resposta em 15 segundos, desiste e avisa o usuario.
  timeout: 15000,
});

// ------------------------------------------------------------
// Interceptor de REQUISICAO: roda antes de TODO pedido sair.
// ------------------------------------------------------------
http.interceptors.request.use((config) => {
  const token = getToken();

  // Se ha sessao, todo pedido leva o cracha junto.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ------------------------------------------------------------
// Interceptor de RESPOSTA: roda quando TODA resposta chega.
// ------------------------------------------------------------
http.interceptors.response.use(
  // Deu certo (2xx): as telas so querem o corpo da resposta.
  // O 204 do DELETE chega com corpo vazio (""): devolvemos null.
  (response) => (response.data === "" ? null : response.data),

  (error) => {
    // Requisicao cancelada DE PROPOSITO (uma busca que ficou velha).
    // Nao e um erro de verdade: devolvemos como veio, e a tela ignora.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // 401 COM token = a sessao venceu. Limpamos e voltamos para o login.
    // 401 SEM token = e a propria tela de login dizendo "senha errada",
    // e nela nao pode haver redirecionamento nenhum.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearSession();
      window.location.replace(LOGIN_PAGE);

      return Promise.reject(toAppError(error, "Sessao expirada. Faca login novamente"));
    }

    return Promise.reject(toAppError(error));
  }
);

// Transforma o erro do axios em um Error simples, com a mensagem que
// o NOSSO back-end mandou ({ "error": "..." }) e o status HTTP.
function toAppError(error, fallbackMessage) {
  let message = fallbackMessage ?? error.response?.data?.error;

  if (!message && error.code === "ECONNABORTED") {
    message = "O servidor demorou demais para responder. Tente de novo";
  }

  if (!message && !error.response) {
    message = "Sem conexao com o servidor";
  }

  const appError = new Error(message ?? "Erro ao comunicar com o servidor");

  // O status deixa a tela decidir pelo TIPO do erro (409, 404...),
  // e nao comparando o texto da mensagem. Vamos usar na Aula 65.
  appError.status = error.response?.status ?? 0;

  return appError;
}

// A tela usa isto para ignorar buscas canceladas (Aula 63).
export function isCanceled(error) {
  return axios.isCancel(error);
}

// Tira do objeto o que esta vazio. Sem isso, "?search=&categoryId="
// chegaria ao servidor cheio de filtros em branco.
// (Antes o buildQuery montava a string inteira; agora o axios monta,
// e nos so escolhemos o que entra.)
function cleanParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "" && value !== false
    )
  );
}

export const api = {
  // --- Autenticacao ---
  register: (payload) => http.post("/auth/register", payload),
  login: (payload) => http.post("/auth/login", payload),
  me: () => http.get("/auth/me"),

  // --- Dashboard ---
  getDashboard: () => http.get("/dashboard"),

  // --- Categorias ---
  listCategories: () => http.get("/categories"),
  createCategory: (payload) => http.post("/categories", payload),
  updateCategory: (id, payload) => http.put(`/categories/${id}`, payload),
  deleteCategory: (id) => http.delete(`/categories/${id}`),

  // --- Produtos ---
  // options.signal permite cancelar a busca (veja a secao 6).
  listProducts: (filters = {}, options = {}) =>
    http.get("/products", { params: cleanParams(filters), signal: options.signal }),
  getProduct: (id) => http.get(`/products/${id}`),
  createProduct: (payload) => http.post("/products", payload),
  updateProduct: (id, payload) => http.put(`/products/${id}`, payload),
  deleteProduct: (id) => http.delete(`/products/${id}`),

  // --- Movimentacoes ---
  listMovements: (filters = {}) => http.get("/movements", { params: cleanParams(filters) }),
  createMovement: (payload) => http.post("/movements", payload),

  // --- Relatorios ---
  reportProducts: (filters) => http.get("/reports/products", { params: cleanParams(filters) }),
  reportStockSummary: () => http.get("/reports/stock-summary"),
  reportStockByCategory: () => http.get("/reports/stock-by-category"),
  reportProductsWithoutMovement: () => http.get("/reports/products-without-movement"),
  reportAbcCurve: () => http.get("/reports/abc-curve"),
  reportMovements: (filters) => http.get("/reports/movements", { params: cleanParams(filters) }),
  reportMovementsByUser: (filters) =>
    http.get("/reports/movements-by-user", { params: cleanParams(filters) }),
  reportMovementsByMonth: (filters) =>
    http.get("/reports/movements-by-month", { params: cleanParams(filters) }),
  reportTopProducts: (filters) =>
    http.get("/reports/top-products", { params: cleanParams(filters) }),
};

// Baixar um arquivo e diferente de buscar JSON: com responseType "blob"
// a resposta nao e convertida, vira um arquivo e o navegador salva.
// O interceptor continua colocando o token - era o motivo de o
// download morar aqui desde a Aula 44.
export async function downloadReport(path, filters, fileName) {
  let blob;

  try {
    blob = await http.get(path, {
      params: cleanParams({ ...filters, format: "csv" }),
      responseType: "blob",
    });
  } catch (error) {
    // Com responseType "blob", ate a mensagem de erro chega como
    // arquivo, e nao como JSON. Por isso uma mensagem propria.
    if (error.status === 401) throw error;

    throw new Error("Nao foi possivel gerar o arquivo");
  }

  const url = URL.createObjectURL(blob);

  // Truque padrao: cria um link invisivel, clica nele e descarta.
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();

  // Libera a memoria que o Blob ocupava.
  URL.revokeObjectURL(url);
}
```

Salve.

> ⚠️ **Confira a lista de relatórios com a sua.** Se você fez os exercícios das Aulas 43 a 45 e criou métodos a mais no `api.js`, reescreva-os no formato novo: `http.get("/caminho", { params: cleanParams(filters) })`.

---

## 3. Dissecando o novo `api.js`

### 3.1 `axios.create`: a instância

```javascript
const http = axios.create({
  baseURL: "/api",
  timeout: 15000,
});
```

Em vez de usar o `axios` "puro", criamos uma **cópia configurada**. Tudo que vale para todas as requisições da nossa API fica aqui:

| Opção | Efeito |
|---|---|
| `baseURL: "/api"` | `http.get("/products")` vira `GET /api/products` |
| `timeout: 15000` | depois de 15 s sem resposta, a requisição é abortada e vira erro |

> 🔍 **Por que o nome `http` e não `api`?** Porque `api` já é o nosso "cardápio" de métodos (`api.listProducts`). O `http` é a ferramenta interna, que **não é exportada**: nenhuma tela pode usá-la diretamente. Mesma ideia do `request` antigo.

### 3.2 Os métodos ficaram de uma linha

Compare:

```javascript
// ANTES (fetch)
createProduct: (payload) =>
  request("/products", { method: "POST", body: JSON.stringify(payload) }),

// DEPOIS (axios)
createProduct: (payload) => http.post("/products", payload),
```

| Antes | Depois |
|---|---|
| `method: "POST"` | o nome do método: `http.post` |
| `JSON.stringify(payload)` | o axios converte sozinho |
| `Content-Type` no cabeçalho | o axios coloca sozinho quando o corpo é um objeto |

### 3.3 Os interceptors: o coração da aula

Um **interceptor** é uma função que o axios chama **automaticamente** em toda requisição. Pense neles como os middlewares do Express ([Aula 27](27-auth-rotas-e-middleware.md)), só que do lado do navegador:

```text
   tela chama api.listProducts()
            |
            v
   ┌──────────────────────────────┐
   │ interceptor de REQUISICAO    │  coloca o token
   └──────────────────────────────┘
            |
            v
        servidor  ──── responde ────┐
                                    v
   ┌──────────────────────────────────────────────┐
   │ interceptor de RESPOSTA                      │
   │   2xx  -> devolve so o response.data         │
   │   erro -> 401? limpa a sessao                │
   │           transforma em Error com mensagem   │
   └──────────────────────────────────────────────┘
            |
            v
   a tela recebe os DADOS (ou um Error com mensagem boa)
```

| Middleware do Express | Interceptor do axios |
|---|---|
| roda no **servidor** | roda no **navegador** |
| antes da rota | antes da requisição sair / depois da resposta chegar |
| `next()` para seguir | `return config` / `return response` para seguir |
| `throw` para interromper | `Promise.reject` para interromper |

### 3.4 O interceptor de requisição

```javascript
http.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

O `config` é a "ficha" da requisição que está para sair: URL, método, cabeçalhos, corpo. Podemos alterá-la e **precisamos devolvê-la**.

> ⚠️ **Esquecer o `return config` é o erro clássico.** Sem ele, o axios não sabe o que enviar e todas as requisições falham.

> 🔍 **Por que pegar o token aqui dentro, e não uma vez no topo do arquivo?** Porque o token **muda**: ele nasce no login e some no logout. Lendo dentro do interceptor, cada requisição usa o token **daquele momento**.

### 3.5 O interceptor de resposta: o caminho feliz

```javascript
(response) => (response.data === "" ? null : response.data),
```

O axios entrega um objeto grande (`status`, `headers`, `config`, `data`...). As nossas telas só querem o `data`. Devolvendo só ele aqui, **nenhuma tela precisou mudar**: `await api.listProducts()` continua devolvendo o array de produtos, como antes.

O `=== ""` cuida do `204` do `DELETE`, que não tem corpo, exatamente como o antigo `if (response.status === 204) return null`.

### 3.6 O interceptor de resposta: o caminho do erro

O axios **lança erro** para qualquer status fora de 2xx. Esse é o comportamento que o `fetch` **não** tinha e que nos obrigou ao `if (!response.ok)` na [Aula 15](15-front-base.md).

O erro do axios tem esta forma:

```javascript
error.response.status       // 404
error.response.data         // { error: "Produto nao encontrado" }  <- o JSON do NOSSO back-end
error.config                // a ficha da requisicao que falhou
error.code                  // "ECONNABORTED" (timeout), "ERR_NETWORK" (sem rede)...
```

E é por isso que temos o `toAppError`.

### 3.7 `toAppError`: uma mensagem boa para cada situação

```javascript
function toAppError(error, fallbackMessage) {
  let message = fallbackMessage ?? error.response?.data?.error;

  if (!message && error.code === "ECONNABORTED") {
    message = "O servidor demorou demais para responder. Tente de novo";
  }

  if (!message && !error.response) {
    message = "Sem conexao com o servidor";
  }

  const appError = new Error(message ?? "Erro ao comunicar com o servidor");
  appError.status = error.response?.status ?? 0;

  return appError;
}
```

| Situação | `error.response` | Mensagem que chega na tela |
|---|---|---|
| Regra de negócio (400, 404, 409) | existe, com `{ error }` | **a do back-end**: "Produto nao encontrado" |
| Servidor lento (timeout) | não existe | "O servidor demorou demais..." |
| API fora do ar / sem internet | não existe | "Sem conexao com o servidor" |
| Qualquer outra coisa | — | "Erro ao comunicar com o servidor" |

> 📌 **Por que não devolver o erro do axios direto para a tela?** Porque a mensagem dele é técnica: `Request failed with status code 404`. Ninguém quer ver isso num toast. O combinado da [Aula 08](08-tratamento-de-erros.md) continua valendo: **o back-end manda `{ error }`, o front mostra esse texto**.

#### O `status` pendurado no erro

```javascript
appError.status = error.response?.status ?? 0;
```

Uma novidade em relação ao `api.js` antigo. Com ela, uma tela pode perguntar **que tipo** de erro aconteceu:

```javascript
catch (error) {
  if (error.status === 409) {
    // conflito: por exemplo, produto com historico (Aula 65)
  }
}
```

Comparar o **número** é muito mais seguro do que comparar o **texto** da mensagem: se alguém corrigir um acento na mensagem do back-end, um `if (error.message === "...")` quebra sem aviso.

### 3.8 A regra do 401, agora no interceptor

```javascript
if (error.response?.status === 401 && error.config?.headers?.Authorization) {
```

A mesma regra da [Aula 29](29-tela-cadastro-vue.md), com uma diferença sutil: em vez de olhar uma variável `token`, olhamos se **aquela requisição** saiu com o cabeçalho `Authorization`.

| Situação | Saiu com `Authorization`? | O que fazemos |
|---|---|---|
| Token venceu no meio do uso | sim | limpa e volta ao login |
| Senha errada na tela de login | **não** | deixa a tela mostrar o erro |

### 3.9 `cleanParams`: o substituto do `buildQuery`

```javascript
function cleanParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "" && value !== false
    )
  );
}
```

O axios monta a query string sozinho a partir do objeto `params`:

```javascript
http.get("/products", { params: { search: "cafe", lowStock: true } });
// GET /api/products?search=cafe&lowStock=true
```

Mas ele **não** descarta os vazios: `{ search: "" }` viraria `?search=`. Por isso o `cleanParams` filtra antes, com a **mesma regra** do `buildQuery` da [Aula 42](42-tela-relatorios-vue.md).

Passo a passo com `{ search: "", categoryId: 3, lowStock: false }`:

| Etapa | Resultado |
|---|---|
| `Object.entries(...)` | `[["search",""], ["categoryId",3], ["lowStock",false]]` |
| `.filter(...)` | `[["categoryId",3]]` |
| `Object.fromEntries(...)` | `{ categoryId: 3 }` |
| o axios monta | `?categoryId=3` |

> 🔍 `([, value]) =>` é desestruturação de array **pulando** o primeiro item: só queremos o valor, não a chave.

---

## 4. A prova: nenhuma tela mudou

Recarregue com **Ctrl + Shift + R** e percorra o sistema:

| # | Faça | Esperado |
|---|---|---|
| 1 | Faça login | Entra normalmente |
| 2 | Senha errada no login | Faixa vermelha "E-mail ou senha invalidos", **sem** recarregar a tela |
| 3 | Dashboard | Cards preenchidos |
| 4 | Produtos: filtre por "caneta" | Filtra |
| 5 | Crie um produto com SKU repetido | Toast vermelho com a mensagem do back-end |
| 6 | Exclua um produto de teste | Some da lista (o `204` virou `null`) |
| 7 | Registre uma movimentação | Toast verde |
| 8 | Relatórios: filtre e exporte CSV | O arquivo baixa |
| 9 | Categorias: crie e exclua uma | Funciona |

Se tudo passou, você trocou a **fundação** da comunicação do sistema e nenhuma das 7 telas percebeu.

> 📌 **Esse é o prêmio de ter centralizado tudo no `api.js` lá na [Aula 15](15-front-base.md).** Se cada tela tivesse o seu próprio `fetch`, esta aula seria editar 7 arquivos, com 7 chances de esquecer algo.

---

## 5. Explorando o axios no console

Abra o F12 → **Console** (em qualquer tela interna, já logado):

```javascript
const { api } = await import("/js/api.js");

// 1. Um GET normal: volta direto o array
await api.listProducts({ search: "cafe" });

// 2. Um erro de regra de negocio
try {
  await api.getProduct(99999);
} catch (error) {
  console.log(error.message);   // "Produto nao encontrado"
  console.log(error.status);    // 404
}
```

Agora vá na aba **Network** (Rede) e clique na requisição `products?search=cafe`. Em **Headers**, confira:

- [ ] `Request URL` termina em `/api/products?search=cafe`
- [ ] `Authorization: Bearer eyJ...` está nos **Request Headers** (o interceptor colocou)

---

## 6. Cancelando uma requisição

Esta é a ferramenta que vamos usar na **busca com autocomplete** da Aula 63. Vale entender agora, com calma.

### O problema: respostas fora de ordem

Imagine um campo de busca que pesquisa a cada letra digitada:

```text
   tempo ──────────────────────────────────────────────►

   digita "c"      ──► GET ?search=c      ─────────────────────► chega por ULTIMO (lenta)
   digita "ca"     ──► GET ?search=ca     ──────────► chega
   digita "caf"    ──► GET ?search=caf    ─────► chega primeiro

   Resultado na tela: os produtos de "c"!  (a resposta mais velha chegou por ultimo)
```

Nada garante que as respostas cheguem **na ordem** em que as perguntas foram feitas. Uma consulta mais pesada, uma rede instável, e a tela mostra o resultado de uma busca que **o usuário já abandonou**.

### A solução: cancelar a anterior

```javascript
let controller = null;

async function buscar(texto) {
  controller?.abort();                 // 1. cancela a busca anterior (se houver)
  controller = new AbortController();  // 2. cria um "controle remoto" novo

  try {
    const produtos = await api.listProducts(
      { search: texto },
      { signal: controller.signal }    // 3. liga o controle a esta requisicao
    );
    mostrar(produtos);
  } catch (error) {
    if (isCanceled(error)) return;     // 4. cancelada de proposito: ignora
    toast(error.message, "error");
  }
}
```

| Peça | Papel |
|---|---|
| `new AbortController()` | um "controle remoto" que pode cancelar uma requisição |
| `controller.signal` | o "fio" que liga o controle à requisição |
| `controller.abort()` | aperta o botão: a requisição é cancelada |
| `isCanceled(error)` | diferencia "cancelei de propósito" de "deu erro de verdade" |

> 🔍 **Por que o interceptor não transforma o cancelamento em `toAppError`?** Porque cancelar não é falha: é a tela dizendo "não quero mais esta resposta". Se virasse um `Error` comum, a tela mostraria um toast vermelho a cada letra digitada.

### Teste no console

```javascript
const { api, isCanceled } = await import("/js/api.js");

const controller = new AbortController();
const promessa = api.listProducts({}, { signal: controller.signal });

controller.abort();   // cancela antes da resposta chegar

try {
  await promessa;
} catch (error) {
  console.log(isCanceled(error));   // true
}
```

Na aba **Network**, a requisição aparece com o status **(canceled)**.

---

## ✅ Confira se deu certo

- [ ] `public/js/api.js` importa o axios do CDN com versão fixa
- [ ] Existe **uma** instância (`http`) com `baseURL` e `timeout`
- [ ] O token é colocado pelo **interceptor de requisição**
- [ ] O interceptor de resposta devolve só o `data` (e `null` no 204)
- [ ] Os erros chegam com `message` do back-end e `status`
- [ ] Senha errada no login **não** recarrega a página
- [ ] As 7 telas funcionam sem nenhuma alteração
- [ ] O CSV dos relatórios continua baixando
- [ ] `isCanceled` é exportado e funciona no teste do console

---

## 🔧 Se deu erro

### `Failed to resolve module specifier "axios"`

Você escreveu `import axios from "axios"`. No navegador, sem build, o `import` precisa da **URL completa** do CDN.

### Nenhuma tela carrega; o console mostra erro de CORS ou 404 no axios

Confira a URL caractere por caractere: `https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/esm/axios.min.js`. Abra essa URL direto no navegador: deve aparecer um código JavaScript.

### Todas as requisições dão `401`

O interceptor de requisição não está devolvendo o `config`, ou está escrevendo em `config.header` (sem o **s**). O certo é `config.headers.Authorization`.

### As telas recebem um objeto com `data`, `status`, `headers`...

O interceptor de resposta não está devolvendo só o `response.data`. Confira a primeira função do `http.interceptors.response.use`.

### O toast mostra "Request failed with status code 400"

O erro não está passando pelo `toAppError`. Confira se a segunda função do interceptor de resposta termina com `return Promise.reject(toAppError(error));`.

### Senha errada no login recarrega a tela

A condição do 401 perdeu o `&& error.config?.headers?.Authorization`. Sem ela, o erro de senha também é tratado como "sessão vencida".

### `downloadReport is not exported` na tela de relatórios

A função `downloadReport` precisa ter `export` na frente, e ficar **fora** do objeto `api`.

---

## ➡️ Próximo passo

Temos uma camada de comunicação capaz de **cancelar** buscas. Falta, no servidor, uma rota feita para busca rápida.

**[Aula 62 — API de busca de produtos](62-api-busca-produtos.md)**
