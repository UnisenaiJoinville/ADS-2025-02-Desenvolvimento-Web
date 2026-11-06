# Aula 37 — LEFT JOIN: os registros sem par

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** laboratório SQL + código JavaScript

---

## O que vamos construir

Três coisas, todas consertando defeitos que já vimos:

| Entrega | Defeito que resolve |
|---|---|
| Nome da categoria no relatório de produtos | "categoria 4" não diz nada |
| Categorias vazias no resumo por categoria | "Ferramentas" sumia (Aula 35) |
| Relatório de **produtos parados** | não existia como perguntar isso |

```text
   GET /api/reports/products                 (agora com categoria)
   GET /api/reports/stock-by-category        (agora completo)
   GET /api/reports/products-without-movement   <- novo
```

### O conceito

A [Aula 36](36-inner-join.md) terminou com uma frase:

> `INNER JOIN` só traz as linhas que têm par dos **dois** lados.

Hoje aprendemos a dizer: **"traga tudo deste lado, com par ou sem par"**.

E, de quebra, a fazer a pergunta que mais aparece em relatório de verdade: **"quem NÃO tem par?"**

---

## Antes de começar

- [ ] [Aula 36](36-inner-join.md) concluída
- [ ] Terminal do MySQL aberto

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db
```

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
└── src/modules/reports/
    ├── product-report-repository.js   (reescreve 2, acrescenta 1)
    ├── report-service.js              (melhora 1, acrescenta 1)
    ├── report-controller.js           (1 função nova)
    └── report-routes.js               (1 rota nova)
```

---

# PARTE 1 — SQL no terminal

## 1. `LEFT JOIN`: a esquerda vem inteira

### `[37.1]` e `[37.2]`

```sql
SELECT p.name AS produto,
       p.sku,
       c.name AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY p.name;
```

Uma palavra mudou: `INNER` virou `LEFT`. Conte:

```sql
SELECT COUNT(*) AS linhas_no_left_join
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id;
```

```text
+---------------------+
| linhas_no_left_join |
+---------------------+
|                  12 |
+---------------------+
```

```text
   products               12
   INNER JOIN             11   ← perdeu 1
   LEFT  JOIN             12   ← não perdeu nada
```

### Quem é "a esquerda"?

A tabela que aparece **antes** da palavra `JOIN`:

```text
   FROM products p                    LEFT JOIN categories c
        ^^^^^^^^                                ^^^^^^^^^^
        a ESQUERDA                              a DIREITA
      (vem inteira)                         (vem se tiver par)
```

> 📌 **"Left" é literalmente a posição no texto.** Numa consulta escrita em várias linhas, é a de cima. Quando houver vários `JOIN`s (Aula 38), "a esquerda" é tudo que veio antes.

### `[37.3]` O que entra quando não há par

```sql
SELECT p.name AS produto, c.name AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.id IS NULL;
```

```text
+---------------------------+-----------+
| produto                   | categoria |
+---------------------------+-----------+
| Fita adesiva transparente | NULL      |
+---------------------------+-----------+
```

O produto **está lá**. O que está faltando são as colunas da direita, preenchidas com `NULL`.

### A mecânica, passo a passo

```text
   Para cada linha de products:

      achou par em categories?
            │
       ┌────┴────┐
      SIM        NÃO
       │          │
       ▼          ▼
   junta as    junta a linha da esquerda
   colunas     com NULL em TODAS as colunas
   das duas    da direita
```

```text
   INNER JOIN                      LEFT JOIN
   ----------                      ---------
   Café      | Bebidas             Café      | Bebidas
   Água      | Bebidas             Água      | Bebidas
   ...                             ...
   (fita não aparece)              Fita      | NULL      ← a diferença
```

### `[37.4]` `COALESCE`: um nome apresentável para o nada

```sql
SELECT p.name AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY categoria, produto;
```

`NULL` é correto no banco, mas feio na tela. `COALESCE` troca por um texto.

> 💡 **Onde traduzir o `NULL`: no SQL ou no front?** Nós traduzimos no SQL, por um motivo prático: a mesma resposta vai para a tela, para o CSV e para quem consumir a API. Traduzir uma vez, na origem, evita três traduções diferentes.

---

## 2. Virando o lado

### `[37.5]` Partindo das categorias

```sql
SELECT c.name  AS categoria,
       p.name  AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 ORDER BY c.name, p.name;
```

```text
+-------------+-------------------------+
| categoria   | produto                 |
+-------------+-------------------------+
| Bebidas     | Agua mineral 500ml      |
| Bebidas     | Cafe em graos 1kg       |
| Bebidas     | Cha verde 50 saches     |
| Ferramentas | NULL                    |   ← a categoria vazia!
| Informatica | Cabo HDMI 2m            |
| Informatica | Mouse sem fio           |
...
```

🎉 **"Ferramentas" apareceu.** É a linha que sumia na Aula 35.

### 🔍 Repare no que mudou

```sql
-- antes: começa em produtos, busca a categoria
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id

-- agora: começa em categorias, busca os produtos
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
```

**Quem está à esquerda é quem vem inteiro.** Trocar a ordem muda a pergunta:

| Esquerda | Pergunta respondida |
|---|---|
| `products` | "todo produto, com ou sem categoria" |
| `categories` | "toda categoria, com ou sem produto" |

> 📌 **Esta é a decisão mais importante ao escrever um `LEFT JOIN`:** qual lado não pode perder ninguém? Esse lado vai à esquerda.

### `[37.6]` A pergunta "quem não tem par?"

```sql
SELECT c.name AS categoria, p.name AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 WHERE p.id IS NULL;
```

```text
+-------------+---------+
| categoria   | produto |
+-------------+---------+
| Ferramentas | NULL    |
+-------------+---------+
```

### 🔍 O padrão `LEFT JOIN ... IS NULL`

Este é um dos padrões mais úteis de SQL. Vale decorar:

```text
   LEFT JOIN  ──►  traz tudo da esquerda, com NULL onde não houve par
        +
   WHERE direita IS NULL  ──►  fica SÓ com quem não teve par
        =
   "quem da esquerda NÃO existe na direita"
```

```text
      categorias                produtos
   ┌──────────────┐          ┌──────────────┐
   │              │          │              │
   │  Bebidas     │──────────│  Café, Água  │
   │  Limpeza     │──────────│  Detergente  │
   │  Papelaria   │──────────│  Papel A4    │
   │  Informatica │──────────│  Mouse       │
   │              │          │              │
   │  Ferramentas │          │              │
   └──────┬───────┘          └──────────────┘
          └── o LEFT JOIN traz, o IS NULL isola
```

> ⚠️ **Cuidado com qual coluna você testa.** Use uma coluna que **nunca** é nula na tabela da direita — a chave primária é a escolha segura (`p.id IS NULL`).
>
> Se você testasse `p.name IS NULL`, pegaria também os produtos que **existem** mas têm nome nulo. No nosso banco `name` é `NOT NULL`, então daria no mesmo — mas é sorte, não desenho.

### `[37.7]` O relatório de produtos parados

```sql
SELECT p.name AS produto,
       p.sku,
       p.quantity AS saldo
  FROM products p
  LEFT JOIN stock_movements m ON m.product_id = p.id
 WHERE m.id IS NULL
 ORDER BY p.name;
```

```text
+--------------+---------+-------+
| produto      | sku     | saldo |
+--------------+---------+-------+
| Cabo HDMI 2m | INF-003 |    15 |
+--------------+---------+-------+
```

O mesmo padrão, agora respondendo uma pergunta de negócio real: **"que produtos estão no cadastro e nunca se mexeram?"**

> 💡 Em um estoque de verdade, essa lista é dinheiro parado. É o tipo de relatório que paga o seu salário.

### `[37.8]` O mesmo, com `NOT EXISTS`

```sql
SELECT p.name AS produto, p.sku
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id)
 ORDER BY p.name;
```

Mesmo resultado, caminho diferente. Qual usar?

| | `LEFT JOIN ... IS NULL` | `NOT EXISTS` |
|---|---|---|
| Leitura | "junte e fique com quem não casou" | "fique com quem não tem nenhum" |
| Intenção | menos explícita | **mais explícita** |
| Desempenho | parecido no MySQL 8 | parecido |

> 🔍 Use `NOT EXISTS` quando você só quer saber **se existe**, e `LEFT JOIN` quando você também vai **usar colunas** do outro lado. Nós vamos usar `LEFT JOIN` no repositório porque já precisamos do nome da categoria na mesma consulta.

---

## 3. ⚠️ A armadilha: `ON` ou `WHERE`

Esta seção é a que mais derruba gente em entrevista — e em produção.

### `[37.9]` A condição no `WHERE`

```sql
SELECT COUNT(*) AS com_a_condicao_no_where
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.name <> 'Bebidas';
```

```text
8
```

### `[37.10]` A condição no `ON`

```sql
SELECT COUNT(*) AS com_a_condicao_no_on
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id AND c.name <> 'Bebidas';
```

```text
12
```

### 🔍 A mesma condição, resultados diferentes

```text
   total de produtos:             12
   condição no ON:                12   ← não perdeu ninguém
   condição no WHERE:              8   ← perdeu 4
```

São 12 produtos, 3 de Bebidas. Era de esperar **9**. Deram 8 ou 12.

### Por que o `WHERE` derrubou 4

Lembre da ordem de execução: o `JOIN` acontece **antes** do `WHERE`.

```text
   1. O LEFT JOIN monta as linhas:

      Café       | Bebidas
      Água       | Bebidas
      Chá        | Bebidas
      Detergente | Limpeza
      ...
      Fita       | NULL        ← o produto sem categoria

   2. O WHERE avalia c.name <> 'Bebidas' em cada uma:

      'Bebidas'  <> 'Bebidas'  ->  FALSO          ✗ sai (3 linhas)
      'Limpeza'  <> 'Bebidas'  ->  VERDADEIRO     ✓ fica
      NULL       <> 'Bebidas'  ->  DESCONHECIDO   ✗ sai!  ← aqui
```

`NULL <> 'Bebidas'` **não é verdadeiro**. É desconhecido. E o `WHERE` só deixa passar o que é verdadeiro.

> ⚠️ **Resultado:** o `WHERE` desfez o trabalho do `LEFT JOIN`. Na prática, ele virou um `INNER JOIN`.
>
> 12 − 3 (Bebidas) − 1 (a Fita, injustamente) = **8**.

### Por que o `ON` manteve os 12

No `ON`, a condição decide **quem é o par**, não quem fica na tabela:

```text
   1. Para o Café, procura categoria com id=1 E nome <> 'Bebidas'
      → não achou → o LEFT JOIN preserva a linha com NULL à direita

      Café  | NULL      ← a linha CONTINUA, só sem categoria

   2. Para a Fita, procura categoria com id=NULL E ...
      → não achou → preserva com NULL

      Fita  | NULL
```

Ninguém é descartado. **Por definição**, o `LEFT JOIN` nunca perde linha da esquerda.

### `[37.11]` A terceira forma

```sql
SELECT COUNT(*) AS aceitando_o_null
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 WHERE c.name <> 'Bebidas' OR c.name IS NULL;
```

```text
9
```

**Agora sim: 9.** 12 produtos menos os 3 de Bebidas.

### As três, lado a lado

| Onde a condição está | Linhas | O que realmente significa |
|---|---|---|
| `WHERE c.name <> 'Bebidas'` | 8 | "produtos que **têm** categoria e ela não é Bebidas" |
| `ON ... AND c.name <> 'Bebidas'` | 12 | "todos os produtos; mostre a categoria só se não for Bebidas" |
| `WHERE ... OR c.name IS NULL` | 9 | "produtos que não são de Bebidas" ✅ |

**Nenhuma está errada. São três perguntas diferentes.** O erro é escrever uma achando que está perguntando outra.

> 📌 **A regra que evita o problema**, e que já adotamos na Aula 36:
>
> | Cláusula | O que vai nela |
> |---|---|
> | `ON` | **só** a regra de casamento entre as tabelas |
> | `WHERE` | os filtros — lembrando de tratar o `NULL` |
>
> E, se um filtro precisa valer **só quando há par**, ele vai no `ON` — conscientemente.

---

## 4. `RIGHT JOIN` e `FULL OUTER JOIN`

### `[37.12]` e `[37.13]` `RIGHT JOIN` existe

```sql
-- com RIGHT JOIN
SELECT c.name AS categoria, p.name AS produto
  FROM products p
 RIGHT JOIN categories c ON c.id = p.category_id
 ORDER BY c.name, p.name;

-- o MESMO, com LEFT JOIN
SELECT c.name AS categoria, p.name AS produto
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 ORDER BY c.name, p.name;
```

As duas devolvem exatamente o mesmo.

`RIGHT JOIN` é o espelho: traz tudo da **direita**. E como você sempre pode trocar a ordem das tabelas, ele nunca é necessário.

> 📌 **Convenção do mercado:** use só `LEFT JOIN`. Com três ou quatro tabelas encadeadas, misturar `LEFT` e `RIGHT` fica ilegível muito rápido. Se encontrar um `RIGHT JOIN` em código antigo, saiba lê-lo — mas escreva `LEFT`.

### `[37.14]` `FULL OUTER JOIN` **não existe** no MySQL

Ele traria tudo dos dois lados ao mesmo tempo. PostgreSQL e SQL Server têm; MySQL não.

A imitação é colar dois `LEFT JOIN` com `UNION`:

```sql
SELECT COALESCE(c.name, 'Sem categoria') AS categoria,
       COALESCE(p.name, '(sem produto)') AS produto
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
 UNION
SELECT COALESCE(c.name, 'Sem categoria'),
       COALESCE(p.name, '(sem produto)')
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 ORDER BY categoria, produto;
```

```text
   primeira metade:  todo produto, com ou sem categoria
   segunda metade:   toda categoria, com ou sem produto
   UNION:            junta e remove as repetições
```

> 🔍 **Aqui é `UNION`, não `UNION ALL`.** As linhas que têm par aparecem nas **duas** metades; o `UNION` elimina a duplicata. Foi o caso prometido na [Aula 33](33-relatorios-mapa-do-banco.md).

---

# PARTE 2 — Consertando o código

## Passo 1 — O relatório de produtos ganha a categoria

Abra `src/modules/reports/product-report-repository.js`.

**Substitua** a constante `PRODUCT_COLUMNS` por esta:

```javascript
// A coluna calculada stockStatus traduz duas regras de negocio
// numa unica palavra, que o front usa para pintar a linha.
const PRODUCT_COLUMNS = `
         p.id,
         p.name,
         p.sku,
         p.quantity,
         p.minimum_stock             AS minimumStock,
         p.cost_price                AS costPrice,
         p.sale_price                AS salePrice,
         p.active,
         p.created_at                AS createdAt,
         c.id                        AS categoryId,
         COALESCE(c.name, 'Sem categoria') AS categoryName,
         (p.quantity * p.cost_price) AS stockCostValue,
         (p.quantity * p.sale_price) AS stockSaleValue,
         CASE
           WHEN p.quantity = 0                 THEN 'OUT'
           WHEN p.quantity <= p.minimum_stock  THEN 'LOW'
           ELSE 'OK'
         END                         AS stockStatus
`;
```

E acrescente, logo abaixo dela, a constante do `FROM`:

```javascript
// LEFT JOIN, e nao INNER JOIN: produto sem categoria TEM que aparecer
// no relatorio de produtos. Veja a Aula 37.
const FROM_PRODUCT = `
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;
```

Agora **substitua** o `findProducts`:

```javascript
export async function findProducts(filters) {
  const { where, params } = buildProductWhere(filters);

  // filters.sort.column e filters.direction NAO vem do usuario:
  // vieram da lista branca do report-filters.js. Por isso podem
  // ser interpolados sem risco.
  const [rows] = await pool.query(
    `SELECT ${PRODUCT_COLUMNS}
     ${FROM_PRODUCT}
     ${where}
     ORDER BY ${filters.sort.column} ${filters.direction}, p.id
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows.map(toProductRow);
}
```

E, nas funções `countProducts` e `sumProducts`, troque a linha `FROM products p` por `${FROM_PRODUCT}`:

```javascript
// Conta o total SEM paginar: e o que permite ao front dizer
// "pagina 2 de 7".
export async function countProducts(filters) {
  const { where, params } = buildProductWhere(filters);

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     ${FROM_PRODUCT}
     ${where}`,
    params
  );

  return Number(rows[0].total);
}
```

Salve.

### 🔍 As três consultas precisam do MESMO `FROM`

Esse é o motivo de `FROM_PRODUCT` ser uma constante.

```text
   findProducts   ─┐
   countProducts  ─┼─► FROM_PRODUCT
   sumProducts    ─┘
```

Se `findProducts` tivesse o `JOIN` e `countProducts` não, o total poderia divergir da lista. Com `LEFT JOIN` não divergiria (ele não muda a contagem) — mas um dia alguém troca por `INNER`, e aí os números passam a mentir.

### 🔍 Por que `LEFT` e não `INNER`

```javascript
// LEFT JOIN, e nao INNER JOIN: produto sem categoria TEM que aparecer
// no relatorio de produtos. Veja a Aula 37.
```

Um relatório que se chama "produtos" precisa listar **todos** os produtos. Com `INNER JOIN`, a Fita adesiva sumiria — e o usuário nunca saberia que ela existe.

### 🔍 A coluna `stockStatus`

```sql
CASE
  WHEN p.quantity = 0                 THEN 'OUT'
  WHEN p.quantity <= p.minimum_stock  THEN 'LOW'
  ELSE 'OK'
END AS stockStatus
```

É o `CASE` da [Aula 34](34-select-filtros-ordenacao.md), transformando duas regras de negócio numa palavra. O front vai usá-la para pintar a linha.

> 📌 Na [Aula 40](40-relatorios-de-estoque.md) ela vira também um **filtro**. Por ora, é só uma coluna de saída.

### 🔍 Repare na lista branca

```javascript
category: "categoryName",
stockValue: "stockCostValue",
```

Se você ainda não tem essas duas chaves em `PRODUCT_SORT_COLUMNS` (no `report-filters.js`), acrescente-as agora:

```javascript
const PRODUCT_SORT_COLUMNS = {
  name: "p.name",
  sku: "p.sku",
  category: "categoryName",
  quantity: "p.quantity",
  costPrice: "p.cost_price",
  salePrice: "p.sale_price",
  stockValue: "stockCostValue",
  createdAt: "p.created_at",
};
```

> 🔍 **`categoryName` e `stockCostValue` são apelidos, não colunas.** Funcionam porque o `ORDER BY` roda **depois** do `SELECT` — a ordem de execução da Aula 34, de novo.

### 🔍 O `toProductRow`

Acrescente no final do arquivo:

```javascript
// O MySQL devolve BOOLEAN como 0/1 e DECIMAL ja chega como numero
// (decimalNumbers: true no config/database.js). Normalizamos o resto.
function toProductRow(row) {
  return {
    ...row,
    active: Boolean(row.active),
    quantity: Number(row.quantity),
    minimumStock: Number(row.minimumStock),
    stockCostValue: Number(row.stockCostValue),
    stockSaleValue: Number(row.stockSaleValue),
  };
}
```

E lembre de usá-lo no `findProducts`: `return rows.map(toProductRow);`

---

## Passo 2 — O resumo por categoria, completo

Ainda no mesmo arquivo, **substitua** o `getStockByCategory`:

```javascript
// Duas consultas coladas por UNION ALL, e cada metade existe por um motivo:
//
//   parte 1: categorias -> produtos, com LEFT JOIN
//            mostra ate as categorias que nao tem nenhum produto (zeros).
//   parte 2: os produtos orfaos (category_id IS NULL)
//            que a parte 1 nunca alcanca, porque nao ha categoria de onde partir.
//
// Veja na Aula 37 por que uma coisa nao substitui a outra.
export async function getStockByCategory() {
  const [rows] = await pool.query(
    `SELECT c.id                                        AS categoryId,
            c.name                                      AS categoryName,
            COUNT(p.id)                                 AS productCount,
            COALESCE(SUM(p.quantity), 0)                AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
      GROUP BY c.id, c.name

      UNION ALL

     SELECT NULL                                        AS categoryId,
            'Sem categoria'                             AS categoryName,
            COUNT(p.id)                                 AS productCount,
            COALESCE(SUM(p.quantity), 0)                AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue
       FROM products p
      WHERE p.category_id IS NULL
        AND p.active = TRUE
     HAVING productCount > 0

      ORDER BY totalCostValue DESC, categoryName`
  );

  return rows;
}
```

Salve.

### 🔍 Por que duas consultas coladas

Esta é a parte que merece atenção. O `LEFT JOIN` partindo de `categories` resolve **um** dos dois problemas:

```text
   FROM categories c LEFT JOIN products p ...

   ✅ traz "Ferramentas" (categoria sem produto)
   ❌ NÃO traz a "Fita adesiva" (produto sem categoria)
```

Por quê? Porque a consulta **parte das categorias**. Um produto órfão não tem categoria de onde ser alcançado — ele não existe para essa consulta.

```text
      categories              products
   ┌──────────────┐        ┌──────────────┐
   │ Bebidas      │────────│ Café, Água…  │
   │ Limpeza      │────────│ Detergente   │
   │ Ferramentas  │        │              │  ← o LEFT JOIN alcança
   └──────────────┘        │ Fita adesiva │  ← este NÃO alcança
                           └──────────────┘
```

A segunda metade do `UNION ALL` vai buscá-lo:

```sql
SELECT NULL AS categoryId, 'Sem categoria' AS categoryName, ...
  FROM products p
 WHERE p.category_id IS NULL
```

> 📌 **É o `FULL OUTER JOIN` da seção 4, só que montado à mão** — e aqui com `UNION ALL`, porque as duas metades nunca produzem a mesma linha (uma só traz quem tem categoria, a outra só quem não tem).

### 🔍 `COUNT(p.id)`, nunca `COUNT(*)`

```sql
COUNT(p.id) AS productCount
```

Teste a diferença no terminal:

```sql
SELECT c.name      AS categoria,
       COUNT(*)    AS count_estrela,
       COUNT(p.id) AS count_da_coluna
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
 ORDER BY count_da_coluna;
```

```text
+-------------+---------------+-----------------+
| categoria   | count_estrela | count_da_coluna |
+-------------+---------------+-----------------+
| Ferramentas |             1 |               0 |
| Limpeza     |             2 |               2 |
| Bebidas     |             3 |               3 |
...
```

**"Ferramentas" tem `COUNT(*) = 1` e `COUNT(p.id) = 0`.**

Por quê? O `LEFT JOIN` produziu **uma linha** para ela — com todas as colunas de produto em `NULL`. O `COUNT(*)` conta essa linha. O `COUNT(p.id)` ignora o `NULL`.

> ⚠️ **Zero é a resposta certa**: a categoria não tem produto nenhum. Este é o bug clássico do `LEFT JOIN` com agregação — e, de novo, ele não dá erro: só mostra 1 onde deveria mostrar 0.

### 🔍 O filtro no `ON`, desta vez de propósito

```sql
LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
```

Lembra da armadilha da seção 3? Aqui usamos ela **a nosso favor**.

| Onde | O que aconteceria |
|---|---|
| `WHERE p.active = TRUE` | a categoria vazia sumiria (seu `p.active` é `NULL`) |
| `ON ... AND p.active = TRUE` | a categoria vazia **fica**, com contagem 0 ✅ |

Queremos contar só os ativos **sem** perder as categorias. A condição é parte do casamento, não um filtro de linhas.

> 💡 **Esta é a aplicação prática da armadilha.** Entender a diferença entre `ON` e `WHERE` não é curiosidade acadêmica: é a diferença entre o relatório certo e o errado.

---

## Passo 3 — Produtos sem movimentação

Acrescente, no final do repositório:

```javascript
// LEFT JOIN + IS NULL: o jeito classico de perguntar
// "quem NAO tem correspondencia do outro lado?"
export async function findProductsWithoutMovement() {
  const [rows] = await pool.query(
    `SELECT p.id,
            p.name,
            p.sku,
            p.quantity,
            p.created_at                      AS createdAt,
            COALESCE(c.name, 'Sem categoria') AS categoryName
       FROM products p
       LEFT JOIN categories c      ON c.id = p.category_id
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE m.id IS NULL
        AND p.active = TRUE
      ORDER BY p.created_at DESC, p.name`
  );

  return rows;
}
```

Salve.

### 🔍 Dois `LEFT JOIN` com papéis diferentes

```sql
  LEFT JOIN categories c      ON c.id = p.category_id      -- para EXIBIR o nome
  LEFT JOIN stock_movements m ON m.product_id = p.id       -- para FILTRAR
 WHERE m.id IS NULL
```

O primeiro traz informação. O segundo existe **só** para o `WHERE m.id IS NULL` poder perguntar "quem não tem nenhuma?".

---

## Passo 4 — O service

Em `src/modules/reports/report-service.js`, **substitua** o `getStockByCategory`:

```javascript
export async function getStockByCategory() {
  const rows = await productRepository.getStockByCategory();

  // O percentual nao vem do SQL: ele depende do total de TODAS as
  // linhas, e calcular isso em JavaScript e mais simples de ler.
  const totalCostValue = rows.reduce(
    (accumulated, row) => accumulated + Number(row.totalCostValue),
    0
  );

  return rows.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    productCount: Number(row.productCount),
    totalUnits: Number(row.totalUnits),
    totalCostValue: Number(row.totalCostValue),
    totalSaleValue: Number(row.totalSaleValue),
    sharePercent:
      totalCostValue > 0
        ? Math.round((Number(row.totalCostValue) / totalCostValue) * 10000) / 100
        : 0,
  }));
}
```

E acrescente:

```javascript
export async function getProductsWithoutMovement() {
  return productRepository.findProductsWithoutMovement();
}
```

Salve.

### 🔍 O percentual fica no JavaScript

```javascript
const totalCostValue = rows.reduce(
  (accumulated, row) => accumulated + Number(row.totalCostValue),
  0
);
```

Para calcular "quanto % do estoque esta categoria representa", é preciso do total de **todas** as linhas. No SQL isso exigiria mais um nível de consulta; em JavaScript, com as linhas já na mão, é um `reduce`.

> 💡 A linha divisória de novo: o banco agrega **muitas linhas**; o service combina **poucos números já prontos**.

---

## Passo 5 — Controller e rota

Em `report-controller.js`:

```javascript
export async function productsWithoutMovement(request, response) {
  const rows = await service.getProductsWithoutMovement();

  response.json(rows);
}
```

Em `report-routes.js`:

```javascript
reportRoutes.get("/products-without-movement", asyncHandler(controller.productsWithoutMovement));
```

Salve.

---

## Passo 6 — Testar

```bash
docker compose restart api
```

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')
```

### Teste 1 — A categoria apareceu

```bash
curl -s "http://localhost:3000/api/reports/products?pageSize=2" -H "Authorization: Bearer $TOKEN"
```

Cada linha agora tem `categoryId`, `categoryName` e `stockStatus`.

### Teste 2 — O produto órfão continua na lista

```bash
curl -s "http://localhost:3000/api/reports/products?search=fita" -H "Authorization: Bearer $TOKEN"
```

```json
{ "sku": "DIV-001", "name": "Fita adesiva transparente", "categoryId": null, "categoryName": "Sem categoria", ... }
```

🎉 **`categoryId: null` e, ainda assim, a linha existe.** É o `LEFT JOIN` fazendo o trabalho dele.

> 🔍 **Prove ao contrário:** troque `LEFT JOIN` por `INNER JOIN` no `FROM_PRODUCT`, reinicie, rode de novo. O produto some e o `total` cai de 12 para 11. Depois **desfaça**.

### Teste 3 — O resumo por categoria, completo

```bash
curl -s "http://localhost:3000/api/reports/stock-by-category" -H "Authorization: Bearer $TOKEN"
```

```json
[
  { "categoryId": 1, "categoryName": "Bebidas",       "productCount": 3, "totalUnits": 93, "totalCostValue": 1527.7, "sharePercent": 44.81 },
  { "categoryId": 4, "categoryName": "Informatica",   "productCount": 3, "totalUnits": 36, "totalCostValue": 1422,   "sharePercent": 41.71 },
  { "categoryId": 3, "categoryName": "Papelaria",     "productCount": 3, "totalUnits": 24, "totalCostValue": 291.3,  "sharePercent": 8.55 },
  { "categoryId": 2, "categoryName": "Limpeza",       "productCount": 2, "totalUnits": 60, "totalCostValue": 108,    "sharePercent": 3.17 },
  { "categoryId": null, "categoryName": "Sem categoria", "productCount": 1, "totalUnits": 24, "totalCostValue": 60, "sharePercent": 1.76 },
  { "categoryId": 5, "categoryName": "Ferramentas",   "productCount": 0, "totalUnits": 0,  "totalCostValue": 0,      "sharePercent": 0 }
]
```

🎉 **Os dois defeitos da Aula 35 resolvidos de uma vez:**

| | Aula 35 | Agora |
|---|---|---|
| Nome da categoria | só o id | ✅ `"Bebidas"` |
| Categoria vazia | sumia | ✅ `"Ferramentas"` com 0 |
| Produto órfão | `categoryId: null` | ✅ `"Sem categoria"` |

### Teste 4 — Produtos parados

```bash
curl -s "http://localhost:3000/api/reports/products-without-movement" -H "Authorization: Bearer $TOKEN"
```

```json
[
  { "id": 9, "name": "Cabo HDMI 2m", "sku": "INF-003", "quantity": 15, "categoryName": "Informatica" }
]
```

### Teste 5 — Ordenar pela categoria

```bash
curl -s "http://localhost:3000/api/reports/products?sort=category&direction=asc&pageSize=3" -H "Authorization: Bearer $TOKEN"
```

Só funciona porque o `JOIN` trouxe `categoryName` para dentro da consulta.

---

## ✅ Confira se deu certo

- [ ] `/api/reports/products` traz `categoryName` em toda linha
- [ ] A "Fita adesiva" aparece com `"categoryName": "Sem categoria"`
- [ ] O `total` continua **12** (nenhum produto se perdeu)
- [ ] `/api/reports/stock-by-category` mostra "Ferramentas" com `productCount: 0`
- [ ] E também mostra "Sem categoria"
- [ ] `sharePercent` soma aproximadamente 100
- [ ] `/api/reports/products-without-movement` lista o Cabo HDMI
- [ ] `?sort=category` funciona
- [ ] No terminal, você viu os números **8 / 12 / 9** da armadilha

---

## 🔧 Erros comuns

### A categoria vazia continua sumindo

Você escreveu `WHERE p.active = TRUE` em vez de `ON ... AND p.active = TRUE`. Veja o Passo 2.

### A categoria vazia aparece com `productCount: 1`

Você usou `COUNT(*)` em vez de `COUNT(p.id)`.

### O produto sem categoria sumiu do relatório

O `FROM_PRODUCT` está com `INNER JOIN`. Troque por `LEFT JOIN`.

### `Unknown column 'categoryName' in 'order clause'`

A lista branca aponta para `categoryName`, mas o `SELECT` não cria esse apelido. Confira o `PRODUCT_COLUMNS`.

### `ERROR 1054: Unknown column 'productCount' in 'having clause'`

Na segunda metade do `UNION ALL`, as colunas precisam dos **mesmos apelidos** da primeira — o `HAVING` usa `productCount`. Confira se escreveu `COUNT(p.id) AS productCount`.

### O `sharePercent` deu `NaN`

Divisão por zero, ou um `Number()` faltando. O service já trata: `totalCostValue > 0 ? ... : 0`.

### Um filtro sumiu com linhas que deveriam aparecer

Clássico da seção 3. Lembre: `NULL <> 'x'` é desconhecido, não verdadeiro. Acrescente `OR coluna IS NULL`.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| `LEFT JOIN` traz a esquerda inteira, com `NULL` onde não há par | seção 1 |
| "Esquerda" é a posição no texto | seção 1 |
| Trocar o lado **muda a pergunta** | `[37.5]` |
| **`LEFT JOIN` + `IS NULL`** = "quem não tem par" | `[37.6]`, `[37.7]` |
| Testar a chave primária, não qualquer coluna | `[37.6]` |
| `NOT EXISTS` como alternativa | `[37.8]` |
| **A armadilha `ON` × `WHERE`** — 8, 12 e 9 | seção 3 |
| Usar o filtro no `ON` **de propósito** | Passo 2 |
| `RIGHT JOIN` existe e não é necessário | `[37.12]` |
| `FULL OUTER JOIN` não existe no MySQL; imita-se com `UNION` | `[37.14]` |
| **`COUNT(coluna)` em vez de `COUNT(*)`** com `LEFT JOIN` | Passo 2 |
| `UNION ALL` para alcançar os órfãos | Passo 2 |

---

## ➡️ Próximo passo

Duas tabelas você já domina. Vamos para quatro — e aí os tipos de `JOIN` precisam ser escolhidos um a um.

**[Aula 38 — Vários JOINs na mesma consulta](38-multiplos-joins.md)**
