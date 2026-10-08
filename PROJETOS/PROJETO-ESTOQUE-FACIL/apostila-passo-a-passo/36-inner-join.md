# Aula 36 — INNER JOIN: juntando duas tabelas

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** laboratório SQL + código JavaScript

---

## O que vamos construir

O relatório de **movimentações**, que mostra o nome do produto em vez do número dele:

```text
   GET /api/reports/movements?type=OUT&page=1
```

E, no caminho, o recurso mais importante de todo este bloco: o `JOIN`.

### Por que precisamos disso

A [Aula 35](35-agregacao-group-by.md) terminou com dois problemas sem solução:

```json
{ "categoryId": 4, "productCount": 3, ... }
```

1. Ninguém sabe o que é "categoria 4".
2. A categoria "Ferramentas", que não tem produtos, desapareceu.

Os dois têm a mesma causa: **estávamos olhando uma tabela só**.

### O conceito

Os dados do nosso sistema estão espalhados de propósito:

```text
   products                      categories
   --------                      ----------
   name  = "Cafe em graos"       id   = 1
   sku   = "BEB-001"             name = "Bebidas"
   category_id = 1   ──────────► 
```

Isso se chama **normalização**, e você fez isso lá na [Aula 06](06-banco-de-dados.md). A vantagem: o nome "Bebidas" é escrito **uma vez**. Se amanhã virar "Bebidas e Sucos", muda numa linha só.

A desvantagem: para montar uma frase completa, é preciso **ir buscar o pedaço que está na outra tabela**.

`JOIN` é esse ir buscar.

---

## Antes de começar

- [ ] [Aula 35](35-agregacao-group-by.md) concluída
- [ ] `database/queries/joins-lab.sql` criado na [Aula 33](33-relatorios-mapa-do-banco.md)
- [ ] Terminal do MySQL aberto:

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db
```

> 💡 **A partir daqui mudamos de caderno.** As consultas desta aula e das três seguintes estão em `database/queries/joins-lab.sql`.

---

## Arquivos desta aula

```text
NOVOS ARQUIVOS
└── src/modules/reports/movement-report-repository.js

ARQUIVOS ALTERADOS
└── src/modules/reports/
    ├── report-filters.js     (filtros de movimentação)
    ├── report-service.js     (1 função nova)
    ├── report-controller.js  (1 função nova)
    └── report-routes.js      (1 rota nova)
```

---

# PARTE 1 — SQL no terminal

## 1. O problema, visto de perto

### `[36.1]` O que temos

```sql
SELECT name, sku, category_id FROM products ORDER BY name LIMIT 5;
```

```text
+---------------------------+---------+-------------+
| name                      | sku     | category_id |
+---------------------------+---------+-------------+
| Agua mineral 500ml        | BEB-002 |           1 |
| Alcool em gel 500ml       | LIM-002 |           2 |
| Bloco de notas adesivas   | PAP-003 |           3 |
| Cabo HDMI 2m              | INF-003 |           4 |
| Cafe em graos 1kg         | BEB-001 |           1 |
+---------------------------+---------+-------------+
```

### `[36.2]` O que falta

```sql
SELECT id, name FROM categories ORDER BY id;
```

```text
+----+-------------+
| id | name        |
+----+-------------+
|  1 | Bebidas     |
|  2 | Limpeza     |
|  3 | Papelaria   |
|  4 | Informatica |
|  5 | Ferramentas |
+----+-------------+
```

Nós, humanos, resolvemos isso instantaneamente: "category_id 1... procuro o 1 na segunda tabela... Bebidas".

**`JOIN` é exatamente esse movimento, escrito em SQL.**

---

## 2. O primeiro `JOIN`

### `[36.3]` A forma longa

```sql
SELECT products.name   AS produto,
       categories.name AS categoria
  FROM products
 INNER JOIN categories ON categories.id = products.category_id
 ORDER BY produto;
```

Leia a consulta em três partes:

```text
   FROM products                                  "comece pelos produtos"
   INNER JOIN categories                          "junte com as categorias"
   ON categories.id = products.category_id        "casando por esta regra"
```

### A cláusula `ON` é o coração

```sql
ON categories.id = products.category_id
```

Ela responde: **"qual linha de lá combina com esta linha de cá?"**

```text
   products                        categories
   --------                        ----------
   Café      category_id = 1  ───► id = 1   Bebidas       ✓ casa
                              ╲
                               ╳─► id = 2   Limpeza       ✗ não casa
                                ╲
                                 ─► id = 3  Papelaria     ✗ não casa
```

Para **cada** linha de `products`, o banco procura em `categories` quais linhas satisfazem o `ON`. As que satisfazem viram uma linha nova, com as colunas das duas lado a lado.

> 📌 **Note que o `ON` quase sempre liga uma chave estrangeira à chave primária que ela aponta.** Isso não é regra da linguagem — é consequência de como modelamos o banco. Se você estiver escrevendo um `ON` que não liga uma FK a uma PK, pare e confira se é mesmo o que quer.

### `[36.4]` A forma que vamos usar: com apelidos

```sql
SELECT p.name AS produto,
       p.sku,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 ORDER BY produto;
```

```text
+---------------------------+---------+-------------+
| produto                   | sku     | categoria   |
+---------------------------+---------+-------------+
| Agua mineral 500ml        | BEB-002 | Bebidas     |
| Alcool em gel 500ml       | LIM-002 | Limpeza     |
| Bloco de notas adesivas   | PAP-003 | Papelaria   |
| Cabo HDMI 2m              | INF-003 | Informatica |
| Cafe em graos 1kg         | BEB-001 | Bebidas     |
+---------------------------+---------+-------------+
```

🎉 **Aí está.** O número virou nome.

### 🔍 Os apelidos não são preguiça

`products p` dá à tabela o apelido `p`. Três motivos para sempre usar:

| Motivo | |
|---|---|
| **Legibilidade** | `p.name` e `c.name` é mais claro que o nome completo repetido |
| **Obrigatório às vezes** | se você juntar uma tabela com ela mesma, precisa de dois apelidos |
| **Evita ambiguidade** | as duas tabelas têm uma coluna `name` |

Teste a ambiguidade:

```sql
SELECT name FROM products p INNER JOIN categories c ON c.id = p.category_id;
```

```text
ERROR 1052 (23000): Column 'name' in field list is ambiguous
```

O banco não adivinha qual das duas `name` você quer. **Qualifique sempre**: `p.name` ou `c.name`.

> 💡 **Convenção do projeto:** a primeira letra da tabela. `products p`, `categories c`, `stock_movements m`, `users u`. Quando duas começam igual, use duas letras.

---

## 3. O que o `INNER` significa — e custa

### `[36.5]` Conte as linhas

```sql
SELECT COUNT(*) AS linhas_no_inner_join
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id;
```

```text
+----------------------+
| linhas_no_inner_join |
+----------------------+
|                   11 |
+----------------------+
```

Agora compare:

```sql
SELECT COUNT(*) FROM products;
```

```text
12
```

### 🔍 Um produto sumiu

```text
   products:                12 linhas
   INNER JOIN categories:   11 linhas
                            ──────────
   diferença:                1 linha  ← para onde ela foi?
```

### `[36.6]` O desaparecido

```sql
SELECT name, sku, category_id FROM products WHERE category_id IS NULL;
```

```text
+---------------------------+---------+-------------+
| name                      | sku     | category_id |
+---------------------------+---------+-------------+
| Fita adesiva transparente | DIV-001 |        NULL |
+---------------------------+---------+-------------+
```

É o produto que a [Aula 33](33-relatorios-mapa-do-banco.md) criou **de propósito**.

### Por que ele some

O `ON` pergunta `c.id = p.category_id`. Para a Fita adesiva isso vira:

```sql
c.id = NULL
```

E você já sabe, da [Aula 34](34-select-filtros-ordenacao.md): **nada é igual a `NULL`**. Nenhuma categoria casa. Sem par, sem linha.

> ⚠️ **Guarde esta frase, ela define o `INNER JOIN`:**
>
> **`INNER JOIN` só traz as linhas que têm par dos DOIS lados.**
>
> Quem não tem par **desaparece em silêncio**. Sem erro, sem aviso. Só some.

### Visualizando

```text
         products                    categories
      ┌────────────────┐          ┌────────────────┐
      │                │          │                │
      │   11 produtos  │╲        ╱│  4 categorias  │
      │  com categoria │ ╲══════╱ │  com produto   │
      │                │ ╱ INNER ╲│                │
      │   Fita adesiva │╱        ╲│  Ferramentas   │
      │   (sem cat.)   │          │  (sem produto) │
      └────────────────┘          └────────────────┘
            ✗ fora                      ✗ fora
```

O `INNER JOIN` devolve **só a interseção**. Os dois extremos ficam de fora.

> 📌 **Isto é o bug mais caro que o SQL permite.** Um relatório financeiro com `INNER JOIN` onde devia ter `LEFT JOIN` simplesmente **não mostra** parte do dinheiro — e ninguém percebe, porque a tela está cheia de números bonitos. A [Aula 37](37-left-join.md) é inteira sobre isso.

---

## 4. `JOIN` com filtro

### `[36.7]` Filtrando pela outra tabela

```sql
SELECT p.name AS produto,
       p.quantity,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 WHERE c.name = 'Bebidas'
 ORDER BY p.name;
```

```text
+---------------------+----------+-----------+
| produto             | quantity | categoria |
+---------------------+----------+-----------+
| Agua mineral 500ml  |        8 | Bebidas   |
| Cafe em graos 1kg   |       40 | Bebidas   |
| Cha verde 50 saches |       45 | Bebidas   |
+---------------------+----------+-----------+
```

Repare: filtramos por `c.name`, uma coluna que **não existe** em `products`. Depois do `JOIN`, as colunas das duas tabelas são tratadas como se fossem de uma só.

### `ON` ou `WHERE`? (no `INNER JOIN` dá na mesma)

Estas duas consultas devolvem **exatamente** o mesmo:

```sql
-- A: a condição no ON
FROM products p INNER JOIN categories c ON c.id = p.category_id AND c.name = 'Bebidas'

-- B: a condição no WHERE
FROM products p INNER JOIN categories c ON c.id = p.category_id WHERE c.name = 'Bebidas'
```

> ⚠️ **Isso vale APENAS para `INNER JOIN`.** Com `LEFT JOIN`, a diferença entre `ON` e `WHERE` muda o resultado — e é uma das armadilhas da Aula 37. Por isso adotamos a convenção:
>
> | Onde | O que vai |
> |---|---|
> | `ON` | só a regra de **casamento** entre as tabelas |
> | `WHERE` | os **filtros** do usuário |
>
> Seguindo isso, você nunca é pego pela armadilha.

### `[36.8]` Condições das duas tabelas juntas

```sql
SELECT p.name AS produto,
       p.quantity,
       p.minimum_stock AS minimo,
       c.name AS categoria
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id
 WHERE p.quantity <= p.minimum_stock
   AND c.name IN ('Bebidas', 'Papelaria')
 ORDER BY c.name, p.name;
```

"Produtos abaixo do mínimo, nas categorias Bebidas ou Papelaria."

---

## 5. `JOIN` em movimentações

### `[36.9]`

```sql
SELECT m.created_at AS data,
       p.name       AS produto,
       m.type       AS tipo,
       m.quantity   AS qtd
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 ORDER BY m.created_at DESC
 LIMIT 5;
```

```text
+---------------------+-------------------------+------+-----+
| data                | produto                 | tipo | qtd |
+---------------------+-------------------------+------+-----+
| 2026-10-01 22:25:58 | Cafe em graos 1kg       | OUT  |  10 |
| 2026-10-01 22:25:58 | Agua mineral 500ml      | IN   |  30 |
| 2026-10-01 22:25:58 | Agua mineral 500ml      | OUT  |  22 |
| 2026-10-01 22:25:58 | Detergente neutro 500ml | IN   |  60 |
| 2026-10-01 22:25:58 | Papel A4 500 folhas     | IN   |  20 |
+---------------------+-------------------------+------+-----+
```

> 🔍 **Por que todas têm a mesma data e hora?** Porque as movimentações originais do `init.sql` foram inseridas **sem data explícita**, e a coluna `created_at` tem `DEFAULT CURRENT_TIMESTAMP`. Elas ficaram com o instante em que o banco foi criado.
>
> As movimentações que a [Aula 33](33-relatorios-mapa-do-banco.md) acrescentou **têm** data própria, espalhada por cinco meses. É com elas que a [Aula 41](41-relatorios-por-periodo.md) vai trabalhar.

### Aqui o `INNER JOIN` é o tipo certo

Na seção 3 o `INNER JOIN` escondeu um produto. Aqui ele não esconde nada. Por quê?

Olhe a definição da tabela:

```sql
product_id INT NOT NULL,
CONSTRAINT fk_movements_product FOREIGN KEY (product_id) REFERENCES products (id)
```

| Garantia | Consequência |
|---|---|
| `NOT NULL` | **toda** movimentação tem um `product_id` |
| `FOREIGN KEY` | esse id **sempre** existe em `products` |

As duas juntas garantem que **toda movimentação tem par**. O `INNER JOIN` não pode descartar nada.

> 📌 **A regra prática para escolher:**
>
> | A coluna do `ON` é... | Use |
> |---|---|
> | `NOT NULL` + `FOREIGN KEY` | `INNER JOIN` — não há o que perder |
> | pode ser `NULL` | `LEFT JOIN` — senão você perde linhas |
>
> Em dúvida? Rode `DESCRIBE` na tabela e olhe a coluna `Null`.

---

## 6. O erro que vale a pena cometer uma vez

### `[36.10]` `JOIN` sem `ON`

```sql
SELECT COUNT(*) AS linhas_sem_o_on FROM products p, categories c;
```

```text
+-----------------+
| linhas_sem_o_on |
+-----------------+
|              60 |
+-----------------+
```

**60 linhas.** De onde saíram?

```text
   12 produtos × 5 categorias = 60
```

Sem o `ON`, o banco combina **cada** produto com **cada** categoria. "Café com Bebidas", "Café com Limpeza", "Café com Papelaria"... todas as combinações possíveis.

Isso tem nome: **produto cartesiano**.

### `[36.11]` Com o `ON`

```sql
SELECT COUNT(*) AS linhas_com_o_on
  FROM products p
 INNER JOIN categories c ON c.id = p.category_id;
```

```text
11
```

> ⚠️ **Por que isso importa:** com 12 × 5 o resultado é engraçado. Com 50.000 produtos × 200 categorias seriam **10 milhões** de linhas, e o servidor trava.
>
> **Sintoma para reconhecer:** sua consulta ficou lentíssima e devolveu muito mais linhas do que deveria, com valores repetidos. Vá direto conferir se todo `JOIN` tem o seu `ON`.

> 🔍 A sintaxe `FROM a, b` é a forma antiga de escrever `JOIN`, de antes de 1992. Evite: ela torna fácil esquecer a condição. Com `INNER JOIN ... ON`, a palavra `ON` cobra a condição de você.

---

# PARTE 2 — Do SQL para a API

## Passo 1 — Filtros de movimentação

Abra `src/modules/reports/report-filters.js`.

Acrescente a lista branca de ordenação, logo abaixo da `PRODUCT_SORT_COLUMNS`:

```javascript
const MOVEMENT_SORT_COLUMNS = {
  date: "m.created_at",
  product: "p.name",
  type: "m.type",
  quantity: "m.quantity",
};
```

E, no final do arquivo, o parser dos filtros:

> 📌 **Versão desta aula.** Ela vai ganhar categoria, usuário e período nas aulas 38 e 41.

```javascript
export function parseMovementReportFilters(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);

  return {
    productId: parseOptionalId(query.productId, "productId"),
    sort: parseSort(query.sort, { columns: MOVEMENT_SORT_COLUMNS, fallback: "date" }),
    direction: parseDirection(query.direction ?? "desc"),
    page,
    pageSize,
    offset,
  };
}
```

Salve.

### 🔍 Repare no reaproveitamento

`parsePagination`, `parseSort`, `parseDirection`, `parseOptionalId` — **nenhuma função nova**. São as mesmas da Aula 34.

É o que acontece quando as peças são pequenas e genéricas: o segundo relatório custa muito menos que o primeiro.

### 🔍 E repare na ordenação padrão diferente

```javascript
direction: parseDirection(query.direction ?? "desc"),
```

Produto se lê em ordem alfabética crescente. Histórico se lê **do mais recente para o mais antigo**. O padrão de cada relatório é o que o usuário espera ver primeiro.

### 🔍 `p.name` na lista branca de movimentações

```javascript
product: "p.name",
```

`p` é o apelido de `products` — uma tabela que **não é** a principal desta consulta. Isso só funciona porque o `JOIN` vai estar lá.

> ⚠️ **Dependência escondida:** se alguém remover o `JOIN` do repositório, esta linha quebra com `Unknown column 'p.name'`. É o tipo de acoplamento que vale um comentário no código.

---

## Passo 2 — O repositório de movimentações

Crie `src/modules/reports/movement-report-repository.js`.

> 📌 **Versão desta aula** — um `JOIN` só. Na [Aula 38](38-multiplos-joins.md) ela chega a quatro tabelas.

```javascript
import { pool } from "../../config/database.js";

// ------------------------------------------------------------------
// Relatorios centrados em MOVIMENTACOES.
// ------------------------------------------------------------------

const MOVEMENT_COLUMNS = `
         m.id,
         m.type,
         m.quantity,
         m.note,
         m.created_at AS createdAt,
         p.id         AS productId,
         p.name       AS productName,
         p.sku        AS productSku,
         (CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END) AS signedQuantity
`;

// INNER JOIN e seguro aqui: product_id e NOT NULL e tem chave
// estrangeira, entao toda movimentacao tem par garantido.
const FROM_MOVEMENT = `
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
`;

function buildMovementWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.productId) {
    conditions.push("m.product_id = ?");
    params.push(filters.productId);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function findMovements(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT ${MOVEMENT_COLUMNS}
     ${FROM_MOVEMENT}
     ${where}
     ORDER BY ${filters.sort.column} ${filters.direction}, m.id DESC
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map(toMovementRow);
}

export async function countMovements(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     ${FROM_MOVEMENT}
     ${where}`,
    params
  );

  return Number(rows[0].total);
}

function toMovementRow(row) {
  return {
    ...row,
    quantity: Number(row.quantity),
    signedQuantity: Number(row.signedQuantity),
  };
}
```

Salve.

### 🔍 A estrutura se repete de propósito

Compare com o `product-report-repository.js` da Aula 34:

```text
   COLUMNS       as colunas do SELECT
   FROM_...      as tabelas e os JOINs          <- a peça nova
   buildWhere()  os filtros
   find...()     a consulta paginada
   count...()    o total sem paginar
   to...Row()    a normalização dos tipos
```

Mesmo esqueleto, dados diferentes. Quem entendeu um, lê o outro sem esforço.

### 🔍 Por que `FROM_MOVEMENT` é uma constante

```javascript
const FROM_MOVEMENT = `
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
`;
```

`findMovements` e `countMovements` precisam **exatamente** das mesmas tabelas. Se os dois escrevessem o `FROM` por conta própria, um dia alguém acrescentaria um `JOIN` em um e esqueceria o outro — e aí o total não bateria mais com a lista.

Uma constante, dois usos, uma verdade só.

### 🔍 A coluna `signedQuantity`

```sql
(CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END) AS signedQuantity
```

Entrada é positiva, saída é negativa. É o `CASE` da [Aula 34](34-select-filtros-ordenacao.md) transformando uma regra de negócio numa coluna.

> 💡 Com isso, a tela mostra `+30` e `−22` sem precisar de nenhum `if` em JavaScript. A regra fica num lugar só: o SQL.

---

## Passo 3 — Service, controller e rota

Em `src/modules/reports/report-service.js`, acrescente o import no topo:

```javascript
import * as movementRepository from "./movement-report-repository.js";
```

E a função, no final do arquivo:

> 📌 **Versão desta aula.** Ela ganha os totais na [Aula 41](41-relatorios-por-periodo.md).

```javascript
export async function getMovementReport(filters) {
  const [rows, total] = await Promise.all([
    movementRepository.findMovements(filters),
    movementRepository.countMovements(filters),
  ]);

  return {
    pagination: buildPagination(filters, total),
    sort: { key: filters.sort.key, direction: filters.direction.toLowerCase() },
    rows,
  };
}
```

Em `src/modules/reports/report-controller.js`, acrescente `parseMovementReportFilters` ao import e a função:

```javascript
export async function movements(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const report = await service.getMovementReport(filters);

  response.json(report);
}
```

Em `src/modules/reports/report-routes.js`:

```javascript
// --- Relatorios de movimentacoes ---
reportRoutes.get("/movements", asyncHandler(controller.movements));
```

Salve tudo.

### 🔍 Mesmo envelope, de novo

```json
{ "pagination": {...}, "sort": {...}, "rows": [...] }
```

É a terceira vez que esse formato aparece. O front vai agradecer: uma função de paginação serve para todos os relatórios.

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

### Teste 1 — O relatório

```bash
curl -s "http://localhost:3000/api/reports/movements?pageSize=2" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "pagination": { "page": 1, "pageSize": 2, "total": 24, "totalPages": 12 },
  "sort": { "key": "date", "direction": "desc" },
  "rows": [
    {
      "id": 12,
      "type": "OUT",
      "quantity": 2,
      "note": "Venda balcao",
      "createdAt": "2026-10-01 22:25:58",
      "productId": 7,
      "productName": "Teclado mecanico",
      "productSku": "INF-002",
      "signedQuantity": -2
    }
  ]
}
```

🎉 **`productName` e `productSku` vieram de outra tabela.** É o `JOIN` trabalhando.

### Teste 2 — Os filtros e a ordenação

```bash
# por produto (descubra o id com: SELECT id, name FROM products WHERE sku = 'BEB-003';)
curl -s "http://localhost:3000/api/reports/movements?productId=11" -H "Authorization: Bearer $TOKEN"

# ordenando pelo nome do produto (coluna da OUTRA tabela)
curl -s "http://localhost:3000/api/reports/movements?sort=product&direction=asc&pageSize=3" -H "Authorization: Bearer $TOKEN"

# pela maior quantidade
curl -s "http://localhost:3000/api/reports/movements?sort=quantity&direction=desc&pageSize=3" -H "Authorization: Bearer $TOKEN"
```

> 🔍 **O segundo comando é o interessante:** ordenar por `p.name`, uma coluna que não está em `stock_movements`. Só funciona porque o `JOIN` a trouxe para dentro da consulta.

### Teste 3 — A contagem bate?

```bash
curl -s "http://localhost:3000/api/reports/movements?pageSize=1" -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
```

```sql
SELECT COUNT(*) FROM stock_movements;
```

Os dois números precisam ser **iguais**. Se forem, o `INNER JOIN` não está perdendo nada — como previmos na seção 5.

> 📌 Guarde este teste. Na [Aula 38](38-multiplos-joins.md) vamos acrescentar mais `JOIN`s a esta mesma consulta, e você vai ver os dois números **deixarem de bater**. Esse será o assunto da aula.

### Teste 4 — Os erros

```bash
curl -i -s "http://localhost:3000/api/reports/movements?sort=categoria" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/movements?productId=abc" -H "Authorization: Bearer $TOKEN"
```

| Esperado | |
|---|---|
| `400` | "Ordenacao invalida: categoria. Use um destes: date, product, type, quantity" |
| `400` | "O filtro productId e invalido: abc" |

> 🔍 Repare que `sort=categoria` é recusado — e está certo, porque ainda **não** juntamos a tabela de categorias. A lista branca documenta o que a consulta sabe fazer.

---

## ✅ Confira se deu certo

- [ ] `/api/reports/movements` responde com `productName` e `productSku`
- [ ] `?productId=` filtra
- [ ] `?sort=product` ordena pelo nome do produto
- [ ] `signedQuantity` é negativo nas saídas
- [ ] O `total` do relatório é igual a `SELECT COUNT(*) FROM stock_movements`
- [ ] `?sort=qualquercoisa` devolve `400`
- [ ] No terminal, você viu o `INNER JOIN` devolver **11** e `products` ter **12**
- [ ] Você viu o produto cartesiano devolver **60**

---

## 🔧 Erros comuns

### `ERROR 1052 (23000): Column 'name' in field list is ambiguous`

As duas tabelas têm uma coluna com esse nome. Qualifique: `p.name` ou `c.name`.

### `ERROR 1054 (42S22): Unknown column 'p.name' in 'order clause'`

Você pediu uma ordenação por uma coluna de uma tabela que **não está** no `JOIN`. Confira o `FROM_MOVEMENT` e a lista branca.

### O relatório devolve linhas demais, repetidas

Faltou o `ON` em algum `JOIN` — é o produto cartesiano. Conte: o total costuma ser o produto das duas tabelas.

### O relatório devolve linhas de menos

Algum `INNER JOIN` está descartando linhas sem par. Troque por `LEFT JOIN` para confirmar: se o número muda, era isso. (A [Aula 37](37-left-join.md) é sobre exatamente isso.)

### `Cannot find module './movement-report-repository.js'`

O nome do arquivo tem que bater exatamente, inclusive os hífens, e o import precisa terminar em `.js` — ES Modules exigem a extensão.

### `buildPagination is not defined`

O `getMovementReport` usa a função que já existia no `report-service.js`. Confira se você colou no arquivo certo.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| Por que os dados ficam em tabelas separadas | seção 1 |
| `INNER JOIN ... ON` — a mecânica do casamento | seção 2 |
| Apelidos de tabela e o erro de coluna ambígua | seção 2 |
| **`INNER JOIN` só traz quem tem par dos dois lados** | seção 3 |
| Linha sem par **some em silêncio** | seção 3 |
| Filtrar por coluna da outra tabela | `[36.7]` |
| `ON` para casar, `WHERE` para filtrar | seção 4 |
| Quando o `INNER JOIN` é seguro (`NOT NULL` + FK) | seção 5 |
| **Produto cartesiano**: o `JOIN` sem `ON` | `[36.10]` |
| Constante para o `FROM`, usada por todas as consultas | Passo 2 |

---

## ➡️ Próximo passo

Você já sabe o que o `INNER JOIN` esconde. Agora vamos trazer de volta.

**[Aula 37 — LEFT JOIN: os registros sem par](37-left-join.md)**
