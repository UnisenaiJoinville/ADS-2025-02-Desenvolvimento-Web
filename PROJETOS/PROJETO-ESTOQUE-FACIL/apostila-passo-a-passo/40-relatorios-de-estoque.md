# Aula 40 — Relatórios de estoque

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** laboratório SQL + código JavaScript

---

## O que vamos construir

Os filtros que transformam o relatório de produtos numa ferramenta de trabalho:

```text
   GET /api/reports/products?stockStatus=OUT       ->  o que acabou
   GET /api/reports/products?stockStatus=LOW       ->  o que vai acabar
   GET /api/reports/products?stockStatus=OK        ->  o que está tranquilo
   GET /api/reports/products?withoutCategory=true  ->  o que está mal cadastrado
```

### Por que precisamos disso

Desde a [Aula 37](37-left-join.md) o relatório já **mostra** a situação de cada produto, na coluna `stockStatus`. Mas mostrar não basta.

```text
   HOJE                               O QUE FALTA
   ----                               -----------
   "veja os 12 produtos e             "me dê só os que
    repare quais estão em             estão acabando"
    vermelho"
```

Com 12 produtos dá para ler tudo. Com 3.000, o relatório só serve se filtrar.

### O conceito

Esta aula tem menos novidade de SQL e mais de **modelagem de filtro**. A pergunta central é:

> O usuário escolhe entre opções que **nós** definimos, ou digita o que quiser?

Já respondemos isso uma vez, na lista branca de ordenação da [Aula 34](34-select-filtros-ordenacao.md). Agora o mesmo princípio aparece de outro jeito.

---

## Antes de começar

- [ ] [Aula 39](39-join-agrupamento-having.md) concluída
- [ ] Terminal do MySQL aberto

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
└── src/modules/reports/
    ├── report-filters.js             (parseChoice + filtros novos)
    └── product-report-repository.js  (buildProductWhere final)
```

---

# PARTE 1 — SQL no terminal

## 1. As três situações

A regra de negócio do Estoque Fácil tem três estados. Você já a viu na [Aula 34](34-select-filtros-ordenacao.md), como `CASE`:

```text
   quantity = 0                 ->  OUT   (zerado)
   quantity <= minimum_stock    ->  LOW   (abaixo do mínimo)
   senão                        ->  OK
```

### Quantos há de cada

```sql
SELECT CASE
         WHEN quantity = 0              THEN 'OUT'
         WHEN quantity <= minimum_stock THEN 'LOW'
         ELSE 'OK'
       END     AS situacao,
       COUNT(*) AS produtos
  FROM products
 WHERE active = TRUE
 GROUP BY situacao
 ORDER BY produtos DESC;
```

```text
+----------+----------+
| situacao | produtos |
+----------+----------+
| OK       |        7 |
| LOW      |        4 |
| OUT      |        1 |
+----------+----------+
```

### 🔍 `GROUP BY` por uma expressão

Repare: agrupamos por `situacao`, que **não é uma coluna** — é o apelido de um `CASE`.

O MySQL aceita isso. Em bancos mais rígidos você repetiria o `CASE` inteiro no `GROUP BY`.

> 💡 Note também que o `GROUP BY` enxerga o apelido, mas o `WHERE` não — a ordem de execução de sempre. O `GROUP BY` roda depois do `SELECT`? Não: formalmente roda antes, mas o MySQL resolve os apelidos de agrupamento por conveniência, assim como faz no `HAVING`.

---

## 2. Cada situação, isolada

### Abaixo do mínimo

```sql
SELECT p.name,
       p.sku,
       p.quantity,
       p.minimum_stock,
       (p.minimum_stock - p.quantity) AS falta
  FROM products p
 WHERE p.active = TRUE
   AND p.quantity > 0
   AND p.quantity <= p.minimum_stock
 ORDER BY falta DESC;
```

```text
+-------------------------+---------+----------+---------------+-------+
| name                    | sku     | quantity | minimum_stock | falta |
+-------------------------+---------+----------+---------------+-------+
| Caneta esferografica    | PAP-002 |        5 |            25 |    20 |
| Bloco de notas adesivas | PAP-003 |        7 |            20 |    13 |
| Agua mineral 500ml      | BEB-002 |        8 |            20 |    12 |
| Teclado mecanico        | INF-002 |        3 |             4 |     1 |
+-------------------------+---------+----------+---------------+-------+
```

### 🔍 Por que `quantity > 0` junto

Sem essa condição, os produtos zerados também entrariam — afinal `0 <= 12` é verdade.

```text
   sem quantity > 0:   LOW inclui os zerados   ->  4 + 1 = 5
   com quantity > 0:   LOW e OUT são exclusivos ->  4
```

> 📌 **As três situações precisam ser mutuamente exclusivas.** Se um produto puder ser contado em duas, os totais param de fechar — e o usuário percebe antes de você.

### 🔍 A coluna `falta` ordena por urgência

```sql
(p.minimum_stock - p.quantity) AS falta
ORDER BY falta DESC
```

Ordenar por `quantity` colocaria o Teclado (3 unidades) antes da Caneta (5). Mas o Teclado precisa de 1 e a Caneta de 20.

**A urgência não é o saldo: é a distância até o mínimo.** Uma expressão calculada resolve.

### Zerados

```sql
SELECT name, sku, minimum_stock FROM products WHERE active = TRUE AND quantity = 0;
```

```text
+---------------------+---------+---------------+
| name                | sku     | minimum_stock |
+---------------------+---------+---------------+
| Alcool em gel 500ml | LIM-002 |            12 |
+---------------------+---------+---------------+
```

### Maiores valores em estoque

```sql
SELECT p.name,
       p.quantity,
       ROUND(p.quantity * p.cost_price, 2) AS valor
  FROM products p
 WHERE p.active = TRUE
 ORDER BY valor DESC
 LIMIT 5;
```

```text
+---------------------+----------+---------+
| name                | quantity | valor   |
+---------------------+----------+---------+
| Cafe em graos 1kg   |       40 | 1120.00 |
| Mouse sem fio       |       18 |  702.00 |
| Teclado mecanico    |        3 |  540.00 |
| Cha verde 50 saches |       45 |  400.50 |
| Papel A4 500 folhas |       12 |  264.00 |
+---------------------+----------+---------+
```

### 🔍 Quantidade e valor contam histórias diferentes

Olhe as duas últimas colunas:

```text
   Teclado mecanico:    3 unidades  ->  R$ 540,00
   Cha verde:          45 unidades  ->  R$ 400,50
```

O Teclado tem **15 vezes menos unidades** e vale mais. Um relatório ordenado por quantidade colocaria o Chá na frente — e esconderia que o dinheiro está no Teclado.

> 💡 É por isso que o nosso relatório permite ordenar por `quantity` **e** por `stockValue`. São duas perguntas de gestão diferentes.

---

# PARTE 2 — Os filtros

## 3. O problema de modelagem

Como o cliente pede "só os produtos zerados"?

### Opção A — um parâmetro booleano por situação

```text
   ?onlyOutOfStock=true
   ?onlyLowStock=true
   ?onlyOk=true
```

| Problema | |
|---|---|
| Três parâmetros para uma escolha | e se vierem dois `true`? |
| Cresce mal | uma situação nova = um parâmetro novo |

### Opção B — o usuário manda a condição

```text
   ?where=quantity=0
```

Já sabemos onde isso termina: a [Aula 34](34-select-filtros-ordenacao.md).

### Opção C — uma escolha entre opções conhecidas ✅

```text
   ?stockStatus=OUT
   ?stockStatus=LOW
   ?stockStatus=OK
   ?stockStatus=ALL   (o padrão)
```

Um parâmetro, valores fechados, impossível combinar o que não deve.

> 📌 **É o mesmo princípio da lista branca de ordenação:** o cliente escolhe uma **chave**; nós decidimos o SQL correspondente. A diferença é que lá a chave virava nome de coluna, e aqui vira uma condição inteira.

---

## Passo 1 — O `parseChoice`

Abra `src/modules/reports/report-filters.js`.

Acrescente, junto das outras listas brancas:

```javascript
const STOCK_STATUS = ["ALL", "OK", "LOW", "OUT"];
const MOVEMENT_TYPES = ["IN", "OUT"];
```

E a função genérica, junto dos outros `parse...`:

```javascript
function parseChoice(value, { field, allowed, fallback }) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const choice = String(value).trim().toUpperCase();

  if (!allowed.includes(choice)) {
    throw new AppError(
      `O filtro ${field} deve ser um destes valores: ${allowed.join(", ")}`
    );
  }

  return choice;
}
```

Salve.

### 🔍 Uma função, dois usos

```javascript
parseChoice(query.stockStatus, { field: "stockStatus", allowed: STOCK_STATUS, fallback: "ALL" })
parseChoice(query.type,        { field: "type",        allowed: MOVEMENT_TYPES, fallback: null })
```

Mesma função para situação de estoque e para tipo de movimentação. O que muda é a lista e o padrão.

> 💡 Repare no padrão que já se repetiu quatro vezes neste módulo: **uma função pequena e genérica, configurada por parâmetro**. É o que torna o quinto filtro barato de escrever.

### 🔍 `fallback: null` vs `fallback: "ALL"`

| Filtro | Sem valor significa | Padrão |
|---|---|---|
| `stockStatus` | "todas as situações" | `"ALL"` |
| `type` | "entradas e saídas" | `null` |

São duas formas de dizer "não filtre": uma palavra explícita ou a ausência. Usamos `"ALL"` em `stockStatus` porque o front precisa de um valor para marcar no `<select>`.

> 🔍 O `MOVEMENT_TYPES` só vai ser usado na [Aula 41](41-relatorios-por-periodo.md). Criamos os dois juntos porque eles são a mesma ideia.

### 🔍 `.toUpperCase()` e a gentileza com quem chama

```javascript
const choice = String(value).trim().toUpperCase();
```

`?stockStatus=low`, `?stockStatus=Low` e `?stockStatus=LOW` funcionam igual. Normalizar na entrada evita suporte desnecessário.

---

## Passo 2 — Os filtros no `parseProductReportFilters`

**Substitua** a função inteira:

```javascript
export function parseProductReportFilters(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);

  return {
    search: parseText(query.search, { field: "search" }),
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
    // "sem categoria" nao e um id: e a ausencia de um.
    // Por isso vira um filtro booleano separado.
    withoutCategory: String(query.withoutCategory ?? "") === "true",
    stockStatus: parseChoice(query.stockStatus, {
      field: "stockStatus",
      allowed: STOCK_STATUS,
      fallback: "ALL",
    }),
    onlyActive: String(query.onlyActive ?? "true") !== "false",
    sort: parseSort(query.sort, { columns: PRODUCT_SORT_COLUMNS, fallback: "name" }),
    direction: parseDirection(query.direction),
    page,
    pageSize,
    offset,
  };
}
```

Salve.

### 🔍 `withoutCategory` é um caso à parte

```javascript
// "sem categoria" nao e um id: e a ausencia de um.
// Por isso vira um filtro booleano separado.
withoutCategory: String(query.withoutCategory ?? "") === "true",
```

Por que não `?categoryId=null`?

Porque `categoryId` recebe um **id**, e "nenhuma categoria" não é um id. Tentar representar a ausência dentro de um campo de identificador leva a gambiarras como `categoryId=0` ou `categoryId=-1`.

```text
   ?categoryId=3            ->  WHERE p.category_id = 3
   ?withoutCategory=true    ->  WHERE p.category_id IS NULL
```

Duas perguntas diferentes, dois parâmetros. É a mesma lição do `IS NULL` da [Aula 34](34-select-filtros-ordenacao.md), agora na modelagem da API.

### 🔍 `=== "true"`, e não `Boolean(...)`

```javascript
String(query.withoutCategory ?? "") === "true"
```

Tudo que vem na query string é **texto**. E em JavaScript:

```javascript
Boolean("false")   // true  ← a string "false" é truthy!
Boolean("0")       // true
"false" === "true" // false ← correto
```

> ⚠️ **`Boolean("false")` é `true`.** Esse é um dos bugs mais irritantes de query string. Comparar com a string `"true"` é explícito e não tem surpresa.

### 🔍 `onlyActive` com padrão invertido

```javascript
onlyActive: String(query.onlyActive ?? "true") !== "false",
```

Leia: "ativo por padrão; só desliga se vier **exatamente** `false`".

O relatório normal não deve mostrar produtos desativados. Mas, se alguém quiser auditá-los, `?onlyActive=false` abre a porta.

> 📌 **Padrão seguro, exceção explícita.** O mesmo princípio da ordem das rotas na [Aula 27](27-auth-rotas-e-middleware.md).

---

## Passo 3 — As condições no repositório

Abra `src/modules/reports/product-report-repository.js` e **substitua** o `buildProductWhere`:

```javascript
// Monta o WHERE a partir dos filtros ja validados.
// Devolve o texto e a lista de valores na MESMA ordem dos "?".
function buildProductWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.onlyActive) {
    conditions.push("p.active = TRUE");
  }

  if (filters.search) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.withoutCategory) {
    // Procurar NULL com "= NULL" nunca da certo: NULL nao e igual
    // a nada, nem a si mesmo. O operador correto e IS NULL.
    conditions.push("p.category_id IS NULL");
  }

  // O apelido stockStatus NAO pode ser usado aqui: o WHERE e avaliado
  // antes da lista do SELECT existir. Repetimos a condicao.
  if (filters.stockStatus === "OUT") {
    conditions.push("p.quantity = 0");
  }

  if (filters.stockStatus === "LOW") {
    conditions.push("p.quantity > 0 AND p.quantity <= p.minimum_stock");
  }

  if (filters.stockStatus === "OK") {
    conditions.push("p.quantity > p.minimum_stock");
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}
```

Salve.

### 🔍 Por que repetir a condição em vez de usar o apelido

```javascript
// O apelido stockStatus NAO pode ser usado aqui: o WHERE e avaliado
// antes da lista do SELECT existir. Repetimos a condicao.
if (filters.stockStatus === "OUT") {
  conditions.push("p.quantity = 0");
}
```

Seria tentador escrever `WHERE stockStatus = 'OUT'`. Não funciona:

```text
   ERROR 1054 (42S22): Unknown column 'stockStatus' in 'where clause'
```

A ordem de execução, de novo: o `WHERE` roda no passo 2, o `SELECT` (que cria o apelido) no passo 5.

> 🔍 **Existe uma saída:** envolver a consulta inteira numa subconsulta e filtrar por fora. Vamos ver essa técnica na [Aula 45](45-subqueries-e-relatorios-avancados.md). Aqui, repetir a condição é mais simples e mais rápido — o banco pode usar índice.

### ⚠️ O risco de repetir

A regra agora está em **dois** lugares: no `CASE` do `PRODUCT_COLUMNS` e aqui no `buildProductWhere`.

Se alguém mudar "abaixo do mínimo" para `quantity < minimum_stock` (sem o igual) em um só, o relatório fica incoerente: a linha mostra `LOW` mas o filtro `LOW` não a traz.

> 📌 **Quando duplicar é inevitável, deixe as duas cópias coladas e comentadas.** Elas estão no mesmo arquivo, a poucas linhas de distância, justamente para quem mexer numa ver a outra.

### 🔍 A simetria `IS NULL`

```javascript
if (filters.withoutCategory) {
  // Procurar NULL com "= NULL" nunca da certo: NULL nao e igual
  // a nada, nem a si mesmo. O operador correto e IS NULL.
  conditions.push("p.category_id IS NULL");
}
```

Terceira vez que o `NULL` aparece nesta apostila. Ele é, de longe, a maior fonte de bug silencioso em SQL.

---

## Passo 4 — Testar

```bash
docker compose restart api
```

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')
```

### Teste 1 — As três situações

```bash
for S in ALL OK LOW OUT; do
  echo -n "$S: "
  curl -s "http://localhost:3000/api/reports/products?stockStatus=$S" \
    -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
done
```

```text
ALL: "total":12
OK:  "total":7
LOW: "total":4
OUT: "total":1
```

### 🔍 A conta tem que fechar

```text
   OK + LOW + OUT  =  7 + 4 + 1  =  12  =  ALL   ✅
```

> 📌 **Esse é o teste que prova a exclusividade.** Se a soma desse 13, alguma situação estaria contando o mesmo produto duas vezes — provavelmente faltou o `quantity > 0` no `LOW`.

### Teste 2 — Sem categoria

```bash
curl -s "http://localhost:3000/api/reports/products?withoutCategory=true" -H "Authorization: Bearer $TOKEN"
```

```json
{ "pagination": { "total": 1, ... },
  "rows": [ { "sku": "DIV-001", "name": "Fita adesiva transparente", "categoryName": "Sem categoria", ... } ] }
```

### Teste 3 — Os totais acompanham o filtro

```bash
curl -s "http://localhost:3000/api/reports/products?stockStatus=OUT" -H "Authorization: Bearer $TOKEN" | grep -o '"totals":{[^}]*}'
```

Com só o Álcool em gel (zerado), `totalCostValue` deve ser **0** — ele não tem unidade nenhuma.

> 🔍 É o `sumProducts` da [Aula 35](35-agregacao-group-by.md) usando o mesmo `buildProductWhere`. Uma função, dois usos, números coerentes.

### Teste 4 — Filtros combinados

```bash
# abaixo do mínimo, em Papelaria, ordenado por quantidade
curl -s "http://localhost:3000/api/reports/products?stockStatus=LOW&categoryId=3&sort=quantity" \
  -H "Authorization: Bearer $TOKEN"

# os de maior valor parado
curl -s "http://localhost:3000/api/reports/products?sort=stockValue&direction=desc&pageSize=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Teste 5 — Os erros

```bash
curl -i -s "http://localhost:3000/api/reports/products?stockStatus=TALVEZ" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/products?stockStatus=low" -H "Authorization: Bearer $TOKEN"
```

| Esperado | |
|---|---|
| `400` | "O filtro stockStatus deve ser um destes valores: ALL, OK, LOW, OUT" |
| `200` | minúsculo funciona — o `toUpperCase()` normaliza |

### Teste 6 — A armadilha do booleano

```bash
curl -s "http://localhost:3000/api/reports/products?withoutCategory=false" -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
```

```text
"total":12
```

Deu 12, não 1. Se o código usasse `Boolean("false")`, daria 1 — porque a string `"false"` é *truthy*.

> 🔍 **Faça este teste em sala.** Troque o `=== "true"` por `Boolean(...)`, reinicie e rode de novo. O resultado muda, e ninguém esperaria. Depois desfaça.

---

## ✅ Confira se deu certo

- [ ] `?stockStatus=OUT` traz só o Álcool em gel
- [ ] `?stockStatus=LOW` traz 4 produtos
- [ ] `?stockStatus=OK` traz 7
- [ ] **A soma `OK + LOW + OUT` é igual ao `ALL`**
- [ ] `?withoutCategory=true` traz só a Fita adesiva
- [ ] `?withoutCategory=false` traz todos
- [ ] `?stockStatus=low` (minúsculo) funciona
- [ ] `?stockStatus=TALVEZ` devolve `400`
- [ ] Os `totals` mudam junto com o filtro
- [ ] `?sort=stockValue&direction=desc` traz o Café em primeiro

---

## 🔧 Erros comuns

### A soma das situações dá mais que o total

Faltou `p.quantity > 0` na condição do `LOW`. Produtos zerados estão em dois grupos.

### `Unknown column 'stockStatus' in 'where clause'`

Você tentou filtrar pelo apelido. Repita a condição. Veja o Passo 3.

### `?withoutCategory=false` filtra mesmo assim

Você usou `Boolean(query.withoutCategory)`. Troque por `=== "true"`.

### A linha mostra `LOW` mas o filtro `LOW` não a traz

As duas cópias da regra divergiram: o `CASE` do `PRODUCT_COLUMNS` e o `buildProductWhere`. Compare as duas.

### `?stockStatus=` (vazio) dá erro

O `parseChoice` precisa tratar string vazia como ausência:

```javascript
if (value === undefined || value === null || value === "") {
  return fallback;
}
```

### O filtro funciona mas os totais não mudam

O `sumProducts` não está usando o `buildProductWhere`, ou o service está somando as linhas da página.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| `GROUP BY` por uma expressão | seção 1 |
| Situações precisam ser **mutuamente exclusivas** | seção 2 |
| Ordenar por urgência calculada, não pelo saldo cru | seção 2 |
| Quantidade e valor são perguntas diferentes | seção 2 |
| Modelar filtro como **escolha**, não como texto livre | seção 3 |
| Uma função genérica (`parseChoice`) para vários filtros | Passo 1 |
| Ausência de valor não cabe num campo de id | Passo 2 |
| **`Boolean("false")` é `true`** | Passo 2 |
| Padrão seguro, exceção explícita (`onlyActive`) | Passo 2 |
| O `WHERE` não enxerga apelidos do `SELECT` | Passo 3 |
| Quando duplicar regra, manter as cópias juntas | Passo 3 |

---

## ➡️ Próximo passo

Falta o filtro mais pedido de todos — e o que mais causa bug sutil.

**[Aula 41 — Relatórios por período](41-relatorios-por-periodo.md)**
