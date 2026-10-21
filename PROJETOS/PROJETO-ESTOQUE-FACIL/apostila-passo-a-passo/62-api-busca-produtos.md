# Aula 62 — API de busca de produtos

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** prática (back-end: Node.js + MySQL)

---

## Objetivo

Criar a rota que vai alimentar o campo de busca com autocomplete da próxima aula:

```text
GET /api/products/search?q=caf&limit=8
```

E aprender três coisas que toda busca de verdade precisa:

- **limitar** a quantidade de resultados;
- **ordenar por relevância** (o mais parecido primeiro);
- tratar os **curingas do `LIKE`** (`%` e `_`) que o usuário pode digitar.

---

## Antes de começar

- [ ] [Aula 61](61-axios-no-lugar-do-fetch.md) concluída (`api.js` com axios)
- [ ] Containers no ar: `docker compose up -d`

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
├── src/modules/products/product-repository.js   (funcao search)
├── src/modules/products/product-service.js      (funcao searchProducts)
├── src/modules/products/product-controller.js   (funcao search)
├── src/modules/products/product-routes.js       (rota /search)
└── public/js/api.js                             (metodo searchProducts)
```

---

## 1. Por que não usar o `GET /api/products?search=` que já existe?

A rota de listagem da [Aula 12](12-crud-produtos.md) já aceita `search`. Mas ela foi feita para **outra** finalidade:

| | `GET /api/products` (listagem) | `GET /api/products/search` (autocomplete) |
|---|---|---|
| Quem usa | a tabela da tela de Produtos | o campo de busca de Movimentações |
| Quantos resultados | todos os que batem (paginado na Aula 64) | **poucos** (8 por padrão) |
| Produtos inativos | aparecem (com etiqueta) | **não** aparecem: não se movimenta produto inativo |
| Ordem | alfabética | **relevância**: o mais parecido primeiro |
| Frequência | quando o usuário filtra | **a cada pausa na digitação** |

Uma rota tentando servir aos dois casos acabaria cheia de `if`. Duas rotas pequenas, cada uma com um propósito claro, são mais fáceis de entender e de manter.

> 📌 **Uma rota por caso de uso** é um princípio comum em APIs. O padrão de camadas continua o mesmo: rota → controller → service → repository.

---

## Passo 1 — O repositório

Abra `src/modules/products/product-repository.js` e acrescente esta função **depois** do `findAll`:

```javascript
// Busca enxuta para o campo de autocomplete (Aula 62).
// Devolve poucos produtos, so os ativos, e os mais parecidos primeiro.
export async function search({ term, limit }) {
  // % e _ sao CURINGAS do LIKE. Se o usuario digitar "50%", queremos
  // procurar o texto "50%", e nao "50 seguido de qualquer coisa".
  // A barra invertida diz ao MySQL: "o proximo caractere e literal".
  const escaped = term.replace(/[\\%_]/g, "\\$&");

  const [rows] = await pool.query(
    `${SELECT_PRODUCT}
      WHERE p.active = TRUE
        AND (p.name LIKE ? OR p.sku LIKE ?)
      ORDER BY (p.sku = ?) DESC,
               (p.name LIKE ?) DESC,
               p.name
      LIMIT ?`,
    [`%${escaped}%`, `%${escaped}%`, term, `${escaped}%`, limit]
  );

  return rows.map(toProduct);
}
```

Salve.

---

## 2. Dissecando o `search`

### 2.1 A consulta montada

Para a busca `caf`, o MySQL recebe (com os valores no lugar dos `?`):

```sql
SELECT ... FROM products p LEFT JOIN categories c ON c.id = p.category_id
 WHERE p.active = TRUE
   AND (p.name LIKE '%caf%' OR p.sku LIKE '%caf%')
 ORDER BY (p.sku = 'caf') DESC,
          (p.name LIKE 'caf%') DESC,
          p.name
 LIMIT 8
```

| Trecho | O que faz |
|---|---|
| `p.active = TRUE` | só produtos ativos: inativo não recebe movimentação |
| `LIKE '%caf%'` no nome **ou** no SKU | "contém `caf` em qualquer posição" |
| `ORDER BY ...` | a ordem por relevância (seção 2.2) |
| `LIMIT 8` | no máximo 8 linhas, por maior que seja o estoque |

### 2.2 Ordenar por relevância com `ORDER BY` de condição

Esta é a parte mais interessante da aula.

No MySQL, uma **comparação** pode ser usada como valor: ela vale `1` (verdadeiro) ou `0` (falso). E dá para ordenar por ela.

```sql
ORDER BY (p.sku = 'caf') DESC,      -- 1o critério: SKU exatamente igual
         (p.name LIKE 'caf%') DESC, -- 2o critério: nome COMEÇA com o termo
         p.name                     -- 3o critério: ordem alfabética
```

Veja com a busca `mouse`:

| Produto | `sku = 'mouse'` | `name LIKE 'mouse%'` | Posição |
|---|---|---|---|
| Mouse sem fio | 0 | **1** | 1º |
| Mousepad gamer | 0 | **1** | 2º |
| Kit teclado e mouse | 0 | 0 | 3º |

E com a busca `INF-003` (alguém que já sabe o código):

| Produto | `sku = 'INF-003'` | Posição |
|---|---|---|
| Teclado ABNT2 (INF-003) | **1** | 1º |
| (outros que contêm `INF-003` em algum lugar) | 0 | depois |

O `DESC` coloca o `1` antes do `0`. Cada critério só desempata o anterior.

> 🔍 **Por que isso importa?** Num autocomplete, a pessoa olha só os **primeiros** resultados. Quem digita `mouse` espera ver "Mouse sem fio" no topo, e não "Kit teclado e mouse" só porque o "K" vem antes do "M" no alfabeto.

### 2.3 Os curingas do `LIKE`

O `LIKE` tem dois caracteres especiais:

| Curinga | Significa | `LIKE 'ca_e'` encontra |
|---|---|---|
| `%` | zero ou mais caracteres quaisquer | — |
| `_` | **exatamente um** caractere qualquer | `cafe`, `cale`, `case` |

Agora imagine o produto "Desconto 50% - kit". O usuário digita `50%`:

| Sem escapar | Com escapar |
|---|---|
| `LIKE '%50%%'` → "contém 50" → acha **tudo** que tem 50 | `LIKE '%50\%%'` → "contém 50%" → acha só o kit |

E com `_`: buscar `a_b` sem escapar acharia `axb`, `a1b`, `a b`...

```javascript
const escaped = term.replace(/[\\%_]/g, "\\$&");
```

| Parte | Significado |
|---|---|
| `/[\\%_]/g` | qualquer `\`, `%` ou `_`, em todas as ocorrências |
| `"\\$&"` | coloca uma barra invertida **antes** do caractere encontrado (`$&` = "o que foi encontrado") |

| Digitado | Depois do `replace` | O MySQL entende |
|---|---|---|
| `cafe` | `cafe` | `cafe` |
| `50%` | `50\%` | o texto `50%` |
| `a_b` | `a\_b` | o texto `a_b` |

> ⚠️ **Isso NÃO é proteção contra SQL injection.** Contra injeção, quem protege é o `?` (o valor nunca vira SQL). O escape aqui é sobre **significado**: sem ele, a busca funciona, mas devolve resultados errados. São dois problemas diferentes.

### 2.4 O `escaped` em três lugares, o `term` em um

```javascript
[`%${escaped}%`, `%${escaped}%`, term, `${escaped}%`, limit]
//   LIKE nome     LIKE sku     =  sku   LIKE inicio   LIMIT
```

Os três `LIKE` recebem a versão escapada. O `=` recebe o termo **original**, porque no `=` não existe curinga: `p.sku = '50\%'` procuraria um SKU com barra invertida.

> ⚠️ **Conte:** cinco `?`, cinco valores, na mesma ordem. É o erro da [Aula 34](34-select-filtros-ordenacao.md) esperando para acontecer.

### 2.5 Busca vazia

Se `term` for `""`, os `LIKE` viram `'%%'`, que encontra **tudo**. O resultado: os primeiros 8 produtos ativos em ordem alfabética.

Isso é proposital: quando o usuário **clica** no campo, antes de digitar, já aparece uma lista para ele escolher.

---

## Passo 2 — O service

Abra `src/modules/products/product-service.js` e acrescente, **depois** do `listProducts`:

```javascript
export async function searchProducts(filters) {
  return repository.search(filters);
}
```

Salve.

> 🔍 **Um service que só repassa?** Sim, por enquanto. É o mesmo caso do `listProducts`. O service existe para que, no dia em que surgir uma regra ("vendedor só vê produtos da loja dele"), ela tenha **onde** morar sem bagunçar o controller ou o repository.

---

## Passo 3 — O controller

Abra `src/modules/products/product-controller.js`.

### 3.1 O import do `AppError`

O controller de produtos ainda não usava o `AppError`. Acrescente no topo:

```javascript
import { AppError } from "../../shared/errors/app-error.js";
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";
```

### 3.2 As constantes e a função `search`

Logo abaixo dos imports, acrescente as constantes:

```javascript
// Limites da busca rapida (Aula 62). Toda listagem precisa de um teto.
const SEARCH_DEFAULT_LIMIT = 8;
const SEARCH_MAX_LIMIT = 20;
const SEARCH_MAX_LENGTH = 60;
```

E, **depois** da função `index`, acrescente:

```javascript
export async function search(request, response) {
  const { q, limit } = request.query;

  // ?q=cafe&q=cha chega como ARRAY. So aceitamos texto.
  const term = typeof q === "string" ? q.trim() : "";
  const parsedLimit = limit === undefined ? SEARCH_DEFAULT_LIMIT : Number(limit);

  if (term.length > SEARCH_MAX_LENGTH) {
    throw new AppError(`A busca deve ter no maximo ${SEARCH_MAX_LENGTH} caracteres`);
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > SEARCH_MAX_LIMIT) {
    throw new AppError(`O parametro limit deve ser um inteiro entre 1 e ${SEARCH_MAX_LIMIT}`);
  }

  const products = await service.searchProducts({ term, limit: parsedLimit });

  response.json(products);
}
```

Salve.

### 🔍 O `typeof q === "string"`

O Express transforma a query string em objeto, e tem um comportamento que pega muita gente:

| URL | `request.query.q` |
|---|---|
| `?q=cafe` | `"cafe"` |
| `?q=cafe&q=cha` | `["cafe", "cha"]` **(array!)** |
| (sem `q`) | `undefined` |

Sem a checagem, `q.trim()` quebraria com `q.trim is not a function` no segundo caso, e o usuário receberia um erro 500. Com ela, qualquer coisa que não seja texto vira busca vazia.

> 📌 **Dado vindo de fora não tem o tipo que você imagina.** É o mesmo princípio de sempre: confira o tipo antes de usar.

### 🔍 Por que limitar o tamanho do texto?

Uma busca de 10.000 caracteres não é um usuário: é alguém testando o seu servidor. O `LIKE '%...%'` com um texto enorme custa processamento do banco à toa. Sessenta caracteres sobram para qualquer nome de produto (a coluna `name` tem 120, e ninguém digita o nome inteiro numa busca).

---

## Passo 4 — A rota (e a pegadinha da ordem)

Abra `src/modules/products/product-routes.js` e acrescente a linha marcada, **exatamente nesta posição**:

```javascript
productRoutes.get("/", asyncHandler(controller.index));
// /search ANTES de /:id: o Express testa as rotas de cima para baixo.
productRoutes.get("/search", asyncHandler(controller.search));
productRoutes.get("/:id", asyncHandler(controller.show));
productRoutes.post("/", asyncHandler(controller.store));
productRoutes.put("/:id", asyncHandler(controller.update));
productRoutes.delete("/:id", asyncHandler(controller.destroy));
```

Salve.

### 🔍 Por que a ordem importa

O Express testa as rotas **na ordem em que foram declaradas** e usa a **primeira** que combinar.

Para ele, `/:id` significa "**qualquer** texto nesta posição". E `search` é um texto:

```text
   Pedido: GET /api/products/search?q=caf

   COM /search DEPOIS de /:id:              COM /search ANTES de /:id:

   1. GET /          nao combina            1. GET /          nao combina
   2. GET /:id       COMBINA! id="search"   2. GET /search    COMBINA!
      -> parseId("search")                     -> controller.search
      -> 400 "Parametro id invalido: search"   -> 200 com os produtos
```

> ⚠️ **Regra para a vida:** rotas **fixas** (`/search`, `/export`, `/me`) vêm **antes** das rotas com **parâmetro** (`/:id`). Você já viu isso de leve na [Aula 27](27-auth-rotas-e-middleware.md), com a ordem do `ensureAuthenticated`: no Express, **a ordem das linhas é comportamento**.

---

## Passo 5 — O método no `api.js`

Abra `public/js/api.js` e, no grupo de produtos, acrescente `searchProducts` logo abaixo de `listProducts`:

```javascript
  // --- Produtos ---
  // options.signal permite cancelar a busca (veja a secao 6 da Aula 61).
  listProducts: (filters = {}, options = {}) =>
    http.get("/products", { params: cleanParams(filters), signal: options.signal }),
  // Busca rapida para o autocomplete (Aula 62).
  searchProducts: (term, options = {}) =>
    http.get("/products/search", {
      params: { q: term, limit: options.limit ?? 8 },
      signal: options.signal,
    }),
  getProduct: (id) => http.get(`/products/${id}`),
```

Salve.

> 🔍 Aqui **não** usamos o `cleanParams`: o `q` vazio é um valor válido ("me mostre os primeiros"). Se ele sumisse da URL, o resultado seria o mesmo, mas deixar explícito documenta a intenção.

---

## Passo 6 — Testar com `curl`

Como o `node --watch` reinicia a API sozinho, basta salvar. Se tiver dúvida, `docker compose restart api`.

Pegue um token (Git Bash):

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')
```

| # | Comando | Esperado |
|---|---|---|
| 1 | `curl -s "http://localhost:3000/api/products/search?q=caf" -H "Authorization: Bearer $TOKEN"` | Array com o café |
| 2 | `curl -s "http://localhost:3000/api/products/search" -H "Authorization: Bearer $TOKEN"` | Até 8 produtos, em ordem alfabética |
| 3 | `curl -s "http://localhost:3000/api/products/search?q=a&limit=3" -H "Authorization: Bearer $TOKEN"` | **3** produtos no máximo |
| 4 | `curl -s "http://localhost:3000/api/products/search?limit=50" -H "Authorization: Bearer $TOKEN"` | `400` — "entre 1 e 20" |
| 5 | `curl -s "http://localhost:3000/api/products/search?limit=abc" -H "Authorization: Bearer $TOKEN"` | `400` |
| 6 | `curl -s "http://localhost:3000/api/products/search?q=cafe&q=cha" -H "Authorization: Bearer $TOKEN"` | `200`, **não** 500 (array virou busca vazia) |
| 7 | `curl -s "http://localhost:3000/api/products/search?q=%25" -H "Authorization: Bearer $TOKEN"` | `[]` (ninguém tem `%` no nome) |
| 8 | `curl -s "http://localhost:3000/api/products/search?q=caf"` (sem token) | `401` |
| 9 | `curl -s "http://localhost:3000/api/products/1" -H "Authorization: Bearer $TOKEN"` | O produto 1 (a rota `/:id` continua funcionando) |

> 🔍 **No teste 7**, `%25` é o `%` codificado para URL (lembra do `encodeURIComponent` da [Aula 29](29-tela-cadastro-vue.md)?). Sem o escape do Passo 1, essa busca devolveria **todos** os produtos.

### Teste da relevância

1. Na tela de Produtos, crie dois produtos ativos: **"Kit teclado e mouse"** (SKU `INF-901`) e **"Mouse sem fio"** (SKU `INF-902`).
2. Rode:

```bash
curl -s "http://localhost:3000/api/products/search?q=mouse" -H "Authorization: Bearer $TOKEN"
```

✅ **Esperado:** os produtos que **começam** com "Mouse" vêm antes de "Kit teclado e mouse", mesmo o "K" vindo antes do "M" no alfabeto.

### Teste do inativo

1. Edite "Kit teclado e mouse" e desmarque **Produto ativo**.
2. Rode a busca `mouse` de novo.

✅ **Esperado:** o kit **sumiu** da busca. Mas continua aparecendo na tela de Produtos, com a etiqueta "Inativo".

### Teste pelo `api.js`

No console do navegador (logado):

```javascript
const { api } = await import("/js/api.js");
await api.searchProducts("caf");
await api.searchProducts("", { limit: 3 });
```

---

## ✅ Confira se deu certo

- [ ] `repository.search` existe e usa `LIMIT ?`
- [ ] A busca só devolve produtos **ativos**
- [ ] Os resultados que **começam** com o termo vêm primeiro
- [ ] `%` e `_` digitados são tratados como texto
- [ ] `limit` fora de 1 a 20 dá `400`
- [ ] `?q=a&q=b` não derruba a API
- [ ] A rota `/search` está **antes** de `/:id`
- [ ] `GET /api/products/1` continua funcionando
- [ ] `api.searchProducts` funciona no console

---

## 🔧 Se deu erro

### `400 — Parametro id invalido: search`

A rota `/search` está **depois** da `/:id`. Mova a linha para cima (Passo 4).

### `500` e no log: `ER_PARSE_ERROR`

Confira o SQL do `search`. O erro mais comum é esquecer a vírgula entre os critérios do `ORDER BY`.

### `500` e no log: `Incorrect arguments to mysqld_stmt_execute` (ou resultado estranho)

O número de `?` não bate com o número de valores no array. São **cinco** de cada.

### A busca por `%` devolve todos os produtos

Faltou o `replace` do Passo 1, ou os `LIKE` estão recebendo `term` em vez de `escaped`.

### `AppError is not defined`

Faltou o import no topo do `product-controller.js` (Passo 3.1).

### `api.searchProducts is not a function`

Faltou o Passo 5, ou o navegador está com o `api.js` antigo em cache: **Ctrl + Shift + R**.

---

## ➡️ Próximo passo

A API sabe buscar. Agora vamos trocar o `<select>` gigante de Movimentações por um campo de busca de verdade.

**[Aula 63 — Autocomplete de produtos em Movimentações](63-autocomplete-produtos.md)**
