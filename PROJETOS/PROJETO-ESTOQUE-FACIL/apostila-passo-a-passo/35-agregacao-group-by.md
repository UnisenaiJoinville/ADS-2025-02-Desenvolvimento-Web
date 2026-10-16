# Aula 35 — Agregação, GROUP BY e HAVING

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** laboratório SQL + código JavaScript

---

## O que vamos construir

Dois relatórios que **resumem** em vez de listar:

```text
   GET /api/reports/stock-summary       ->  os números gerais do estoque
   GET /api/reports/stock-by-category   ->  uma linha por categoria
```

E vamos acrescentar ao relatório de produtos da Aula 34 uma linha de **totais da seleção inteira** — não só da página que está na tela.

### Por que precisamos disso

Compare as duas perguntas:

| Pergunta | Resposta |
|---|---|
| "quais produtos eu tenho?" | uma **lista** — a Aula 34 resolveu |
| "**quanto** dinheiro tenho parado em estoque?" | um **número** |

A segunda não se responde listando. Se o sistema trouxesse os 12 produtos para o JavaScript somar, imagine com 50.000: seriam 50.000 linhas atravessando a rede para produzir **um** número.

```text
   ERRADO                            CERTO
   ------                            -----
   banco  --50.000 linhas-->  API    banco  --1 linha-->  API
                               │              ^
                               ▼              │
                          soma em JS     soma no banco
```

> 📌 **O princípio desta aula:** quem tem os dados é quem deve fazer a conta. O banco já tem tudo na mão e foi construído exatamente para isso.

---

## Antes de começar

- [ ] [Aula 34](34-select-filtros-ordenacao.md) concluída (`/api/reports/products` funcionando)
- [ ] Terminal do MySQL aberto:

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db
```

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
└── src/modules/reports/
    ├── product-report-repository.js   (3 funções novas)
    ├── report-service.js              (2 funções novas + 1 melhorada)
    ├── report-controller.js           (2 funções novas)
    └── report-routes.js               (2 rotas novas)
```

Nenhum arquivo novo: o esqueleto da Aula 34 já está pronto para crescer.

---

# PARTE 1 — SQL no terminal

## 1. O conceito: colapsar linhas

Uma **função de agregação** recebe muitas linhas e devolve **uma**.

```text
   products                        SELECT SUM(quantity)
   --------                        FROM products
   quantity = 2    ┐
   quantity = 8    │                      ┌───────┐
   quantity = 45   ├──── colapsa ───────► │  150  │
   quantity = 15   │                      └───────┘
   ...             ┘                       1 linha
```

Você já viu isso na [Aula 14](14-dashboard-api.md), no `dashboard-repository.js`. Agora vamos entender o que estava acontecendo.

### As cinco funções que importam

| Função | O que faz |
|---|---|
| `COUNT()` | conta |
| `SUM()` | soma |
| `AVG()` | média |
| `MIN()` | o menor |
| `MAX()` | o maior |

---

## 2. `COUNT` — e a pegadinha do `NULL`

### `[35.1]` Contar linhas

```sql
SELECT COUNT(*) AS total_de_produtos FROM products;
```

### `[35.2]` Agora olhe com atenção

```sql
SELECT COUNT(*)           AS linhas,
       COUNT(category_id) AS com_categoria,
       COUNT(*) - COUNT(category_id) AS sem_categoria
  FROM products;
```

```text
+--------+---------------+---------------+
| linhas | com_categoria | sem_categoria |
+--------+---------------+---------------+
|     12 |            11 |             1 |
+--------+---------------+---------------+
```

**Os dois primeiros números são diferentes.** Por quê?

### 🔍 A regra que vale para todas as funções de agregação

> **`COUNT(*)` conta linhas. `COUNT(coluna)` conta valores não nulos.**

E isso não é exclusividade do `COUNT`: **toda** função de agregação ignora `NULL`.

```text
   valores:  10,  NULL,  20,  NULL,  30

   COUNT(*)       -> 5     (conta as linhas)
   COUNT(coluna)  -> 3     (NULL não é valor)
   SUM(coluna)    -> 60    (ignora os dois NULL)
   AVG(coluna)    -> 20    (60 ÷ 3, não 60 ÷ 5!)
```

> ⚠️ **Repare no `AVG`.** A média divide pela quantidade de valores **não nulos**. Se metade da sua coluna for `NULL`, a média é da outra metade — e quase ninguém percebe. Quando isso importar, use `COALESCE(coluna, 0)` para transformar nulo em zero antes de somar.

### `[35.3]` `COUNT(DISTINCT ...)`

```sql
SELECT COUNT(DISTINCT category_id) AS categorias_em_uso FROM products;
```

Responde "quantas categorias **diferentes** aparecem em uso?" — e, de novo, o `NULL` não entra na conta.

---

## 3. `SUM`, `AVG`, `MIN`, `MAX`

### `[35.4]` e `[35.5]` Somar

```sql
SELECT SUM(quantity) AS unidades_em_estoque FROM products WHERE active = TRUE;
```

```sql
SELECT SUM(quantity * cost_price) AS valor_de_custo,
       SUM(quantity * sale_price) AS valor_de_venda
  FROM products
 WHERE active = TRUE;
```

### 🔍 `SUM(a * b)` não é `SUM(a) * SUM(b)`

Este é um erro que parece inofensivo e dá um número completamente errado:

```text
   produto A: 40 unidades × R$ 28,00  =  R$ 1.120,00
   produto B: 45 unidades × R$  8,90  =  R$   400,50
                                         ------------
   SUM(quantity * cost_price)         =  R$ 1.520,50   ✅ certo

   SUM(quantity)   = 85
   SUM(cost_price) = R$ 36,90
   85 × 36,90                         =  R$ 3.136,50   ❌ sem sentido
```

O `SUM(a * b)` multiplica **linha a linha** e só depois soma. É sempre isso que você quer num valor de estoque.

### `[35.6]` e `[35.7]` Média, mínimo, máximo

```sql
SELECT AVG(sale_price) AS preco_medio,
       MIN(sale_price) AS mais_barato,
       MAX(sale_price) AS mais_caro
  FROM products
 WHERE active = TRUE;
```

O `AVG` devolve algo como `21.814286`. Dinheiro não se mostra assim:

```sql
SELECT ROUND(AVG(sale_price), 2) AS preco_medio FROM products WHERE active = TRUE;
```

> 💡 **Onde arredondar: no SQL ou no JavaScript?** Os dois funcionam. Nós vamos arredondar no JavaScript (no service), porque lá a decisão fica junto das outras regras de apresentação. Mas se a consulta for consumida direto por uma ferramenta de BI, arredondar no SQL é melhor.

### `[35.8]` O cartão de resumo

```sql
SELECT COUNT(*)                            AS produtos,
       SUM(quantity)                       AS unidades,
       ROUND(SUM(quantity * cost_price), 2) AS valor_custo,
       ROUND(AVG(cost_price), 2)           AS custo_medio,
       MIN(sale_price)                     AS menor_preco,
       MAX(sale_price)                     AS maior_preco
  FROM products
 WHERE active = TRUE;
```

Seis números, **uma linha**, uma ida ao banco. É o nosso `/api/reports/stock-summary`.

---

## 4. `GROUP BY` — de uma linha para uma linha por grupo

Até agora, agregação devolvia **uma** linha para a tabela inteira. E se eu quiser o mesmo resumo **por categoria**?

### `[35.9]`

```sql
SELECT category_id,
       COUNT(*)      AS produtos,
       SUM(quantity) AS unidades
  FROM products
 WHERE active = TRUE
 GROUP BY category_id;
```

```text
+-------------+----------+----------+
| category_id | produtos | unidades |
+-------------+----------+----------+
|        NULL |        1 |       24 |
|           1 |        3 |       93 |
|           2 |        2 |       60 |
|           3 |        3 |       24 |
|           4 |        3 |       36 |
+-------------+----------+----------+
```

### 🔍 Como visualizar o `GROUP BY`

Ele faz duas coisas, nesta ordem:

```text
   1. SEPARA as linhas em pilhas, uma por valor de category_id

      category_id = 1        category_id = 2        category_id = NULL
      ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
      │ Café     40  │       │ Detergente 60│       │ Fita     24  │
      │ Água      8  │       │ Álcool      0│       └──────────────┘
      │ Chá      45  │       └──────────────┘
      └──────────────┘

   2. COLAPSA cada pilha numa linha só, aplicando as funções

      ┌───┬───┬────┐        ┌───┬───┬────┐        ┌──────┬───┬────┐
      │ 1 │ 3 │ 93 │        │ 2 │ 2 │ 60 │        │ NULL │ 1 │ 24 │
      └───┴───┴────┘        └───┴───┴────┘        └──────┴───┴────┘
```

> 📌 **`NULL` vira um grupo.** Diferente do `COUNT(coluna)`, que ignora nulos, o `GROUP BY` junta todos os nulos numa pilha só. É por isso que o produto sem categoria aparece ali — e é uma boa notícia: ele não some.

### A regra que o MySQL 8 impõe

Experimente:

```sql
SELECT category_id, name, COUNT(*) FROM products GROUP BY category_id;
```

```text
ERROR 1055 (42000): Expression #2 of SELECT list is not in GROUP BY clause
and contains nonaggregated column 'estoque_db.products.name' ...
```

### 🔍 Por que isso é um erro

Pense na pilha da categoria 1: ela tem **três** produtos, com três nomes diferentes.

```text
   SELECT category_id, name, COUNT(*)
                       ^^^^
          qual dos três nomes o banco deveria mostrar?
          Café? Água? Chá?
```

Não existe resposta. Então a regra é:

> **Toda coluna do `SELECT` precisa estar no `GROUP BY` ou dentro de uma função de agregação.**

| Coluna | Por que pode | |
|---|---|---|
| `category_id` | está no `GROUP BY` — é igual para a pilha inteira | ✅ |
| `COUNT(*)` | é uma agregação — colapsa a pilha | ✅ |
| `name` | varia dentro da pilha | ❌ |

> 🔍 **Curiosidade útil:** versões antigas do MySQL **aceitavam** isso e devolviam um nome qualquer, sem avisar. Geravam relatórios errados em silêncio. O modo `ONLY_FULL_GROUP_BY`, padrão desde o MySQL 5.7, transformou o bug silencioso em erro — e isso é uma melhoria.

### `[35.10]` Ordenando o resultado agregado

```sql
SELECT category_id,
       COUNT(*)                            AS produtos,
       ROUND(SUM(quantity * cost_price), 2) AS valor_custo
  FROM products
 WHERE active = TRUE
 GROUP BY category_id
 ORDER BY valor_custo DESC;
```

O `ORDER BY` vem **depois** do `GROUP BY` na ordem de execução (lembra da tabela da Aula 34?), então ele já enxerga a coluna agregada e o apelido dela.

### `[35.11]` Agrupando por outra coisa

```sql
SELECT type,
       COUNT(*)      AS lancamentos,
       SUM(quantity) AS unidades
  FROM stock_movements
 GROUP BY type;
```

```text
+------+-------------+----------+
| type | lancamentos | unidades |
+------+-------------+----------+
| IN   |          12 |      387 |
| OUT  |          12 |      165 |
+------+-------------+----------+
```

---

## 5. `HAVING` — filtrar os grupos

### `[35.12]`

```sql
SELECT category_id,
       COUNT(*) AS produtos
  FROM products
 WHERE active = TRUE
 GROUP BY category_id
HAVING COUNT(*) >= 3;
```

### `[35.14]` Por que não dá para usar `WHERE`

```sql
SELECT category_id FROM products WHERE SUM(quantity) > 20 GROUP BY category_id;
```

```text
ERROR 1111 (HY000): Invalid use of group function
```

### 🔍 A diferença, de uma vez por todas

Volte à ordem de execução da [Aula 34](34-select-filtros-ordenacao.md):

```text
   1. FROM        de onde vêm as linhas
   2. WHERE   ◄── joga LINHAS fora          (os grupos ainda não existem!)
   3. GROUP BY    monta as pilhas
   4. HAVING  ◄── joga GRUPOS fora          (agora o SUM já existe)
   5. SELECT
   6. ORDER BY
```

O `WHERE` roda **antes** do `GROUP BY`. Quando ele é avaliado, não existe pilha nenhuma, logo não existe `SUM` para comparar.

| | `WHERE` | `HAVING` |
|---|---|---|
| Quando roda | antes de agrupar | depois de agrupar |
| Filtra | linhas | grupos |
| Pode usar agregação | não | **sim** |
| Pode usar coluna crua | sim | só se estiver no `GROUP BY` |

### `[35.13]` Os dois na mesma consulta

```sql
SELECT category_id,
       COUNT(*)      AS produtos,
       SUM(quantity) AS unidades
  FROM products
 WHERE active = TRUE          -- linha por linha
 GROUP BY category_id
HAVING SUM(quantity) > 20     -- grupo por grupo
 ORDER BY unidades DESC;
```

Leia em voz alta: "dos produtos **ativos**, agrupe por categoria e mostre só as categorias que somam **mais de 20 unidades**".

> ⚠️ **Não use `HAVING` no lugar de `WHERE`.** `HAVING p.active = TRUE` até funcionaria em alguns casos, mas obrigaria o banco a agrupar linhas que seriam descartadas depois. Filtre cedo: o `WHERE` reduz o trabalho de tudo que vem a seguir.

---

## 6. `GROUP BY` por período

### `[35.15]`

```sql
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       COUNT(*)      AS movimentacoes,
       SUM(quantity) AS unidades
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;
```

`DATE_FORMAT` transforma `2026-07-23 16:45:00` no texto `'2026-07'`. Como todas as movimentações de julho viram o mesmo texto, o `GROUP BY` as junta.

| Formato | Resultado |
|---|---|
| `'%Y-%m'` | `2026-07` |
| `'%Y-%m-%d'` | `2026-07-23` |
| `'%Y'` | `2026` |

> 💡 **Por que `'%Y-%m'` e não `'%m/%Y'`?** Porque `2026-07` ordena corretamente como texto; `07/2026` colocaria julho de 2026 antes de dezembro de 2025. Formato de ordenação é um, formato de exibição é outro — a tradução para "jul/2026" é trabalho do front-end.

### `[35.16]` Entradas e saídas na mesma linha

```sql
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE -quantity END) AS saldo
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;
```

### 🔍 `SUM` + `CASE`: a técnica mais útil da aula

Sem ela, "entradas" e "saídas" seriam **duas linhas** por mês. Com ela, viram **duas colunas** na mesma linha.

```text
   SEM a técnica (GROUP BY mes, type)   COM a técnica (GROUP BY mes)
   ---------------------------------    ---------------------------
   mes       type   unidades            mes      entradas  saidas
   2026-06   IN     70                  2026-06    70        5
   2026-06   OUT     5                  2026-07     0       22
   2026-07   OUT    22
```

Como funciona: o `CASE` devolve a quantidade **ou zero**, e o `SUM` soma. O zero não atrapalha a soma — é o elemento neutro.

```text
   type='IN',  quantity=70  ->  CASE devolve 70  ┐
   type='OUT', quantity=5   ->  CASE devolve  0  ├─ SUM = 70
   type='IN',  quantity=0   ->  CASE devolve  0  ┘
```

> 📌 Esse padrão tem nome: **pivô** (ou tabela dinâmica). Você acabou de transformar linhas em colunas, à mão. É o mesmo truque que o `dashboard-repository.js` já usava na [Aula 14](14-dashboard-api.md) — volte lá e releia agora.

---

# PARTE 2 — Do SQL para a API

## Passo 1 — O resumo do estoque

Abra `src/modules/reports/product-report-repository.js` e acrescente, **no final do arquivo**:

```javascript
export async function getStockSummary() {
  const [rows] = await pool.query(
    `SELECT COUNT(*)                                  AS productCount,
            COUNT(DISTINCT p.category_id)             AS categoryCount,
            COALESCE(SUM(p.quantity), 0)              AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue,
            COALESCE(AVG(p.cost_price), 0)            AS averageCostPrice,
            COALESCE(MIN(p.sale_price), 0)            AS minSalePrice,
            COALESCE(MAX(p.sale_price), 0)            AS maxSalePrice,
            SUM(CASE WHEN p.quantity = 0 THEN 1 ELSE 0 END)                        AS outOfStockCount,
            SUM(CASE WHEN p.quantity > 0 AND p.quantity <= p.minimum_stock
                     THEN 1 ELSE 0 END)                                            AS lowStockCount
       FROM products p
      WHERE p.active = TRUE`
  );

  return rows[0];
}
```

Salve.

### 🔍 Por que tanto `COALESCE`

```sql
COALESCE(SUM(p.quantity), 0) AS totalUnits
```

`COALESCE(a, b)` devolve `a`, a menos que `a` seja `NULL` — aí devolve `b`.

E quando `SUM` devolveria `NULL`? **Quando não houver nenhuma linha.** Num banco recém-criado, sem produto nenhum:

```text
   SEM coalesce:  { "totalUnits": null }   -> a tela mostra "null unidades"
   COM coalesce:  { "totalUnits": 0 }      -> a tela mostra "0 unidades"
```

> ⚠️ Repare na diferença: `COUNT(*)` devolve `0` numa tabela vazia, mas `SUM()` devolve `NULL`. Faz sentido — "quantas linhas?" é zero; "qual a soma de nada?" é indefinido. Mas é uma inconsistência que pega todo mundo uma vez.

### 🔍 As duas contagens com `CASE`

```sql
SUM(CASE WHEN p.quantity = 0 THEN 1 ELSE 0 END) AS outOfStockCount
```

É o mesmo pivô de antes, usado para **contar**: some 1 quando a condição bate, 0 quando não bate. O resultado é a contagem de quem bate.

> 🔍 Daria para escrever `COUNT(CASE WHEN p.quantity = 0 THEN 1 END)` — sem `ELSE`, o `CASE` devolve `NULL`, e o `COUNT` ignora nulos. As duas formas funcionam; a com `SUM` é mais explícita.

---

## Passo 2 — Os totais da seleção

Ainda no mesmo arquivo, acrescente:

```javascript
// Totais da selecao inteira, nao so da pagina atual.
export async function sumProducts(filters) {
  const { where, params } = buildProductWhere(filters);

  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(p.quantity), 0)                 AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0)  AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0)  AS totalSaleValue
     ${FROM_PRODUCT}
     ${where}`,
    params
  );

  return rows[0];
}
```

Salve.

> 📌 Na versão final esta função usa `${FROM_PRODUCT}` no lugar de `FROM products p`. Por enquanto escreva `FROM products p`, igual ao `findProducts` e ao `countProducts` da Aula 34 — na [Aula 37](37-left-join.md) trocamos os três de uma vez.

### 🔍 Por que isto não é o `getStockSummary`

As duas funções somam as mesmas colunas. A diferença é **o que elas enxergam**:

| Função | Escopo |
|---|---|
| `getStockSummary` | o estoque **inteiro**, sempre |
| `sumProducts` | só o que passou **pelos filtros do usuário** |

Repare que `sumProducts` recebe `filters` e chama o mesmo `buildProductWhere` do `findProducts`. É isso que faz o rodapé da tabela dizer "total **da seleção**" e não "total geral".

> 💡 **E por que não somar as linhas da página em JavaScript?** Porque a página tem 25 linhas de 168. O rodapé mostraria o total de 25 produtos e diria que é o total de 168. Erro clássico de relatório paginado.

---

## Passo 3 — O estoque por categoria

Acrescente:

> 📌 **Versão desta aula.** Ela tem um defeito que você vai notar no teste — e que a [Aula 37](37-left-join.md) vai consertar.

```javascript
export async function getStockByCategory() {
  const [rows] = await pool.query(
    `SELECT p.category_id                               AS categoryId,
            COUNT(*)                                    AS productCount,
            COALESCE(SUM(p.quantity), 0)                AS totalUnits,
            COALESCE(SUM(p.quantity * p.cost_price), 0) AS totalCostValue,
            COALESCE(SUM(p.quantity * p.sale_price), 0) AS totalSaleValue
       FROM products p
      WHERE p.active = TRUE
      GROUP BY p.category_id
      ORDER BY totalCostValue DESC`
  );

  return rows;
}
```

Salve.

---

## Passo 4 — O service

Abra `src/modules/reports/report-service.js`.

Primeiro, **melhore** o `getProductReport` para incluir os totais — agora são **três** consultas em paralelo:

```javascript
export async function getProductReport(filters) {
  // As tres consultas sao independentes entre si: nenhuma precisa
  // do resultado da outra. Promise.all roda as tres ao mesmo tempo.
  const [rows, total, totals] = await Promise.all([
    productRepository.findProducts(filters),
    productRepository.countProducts(filters),
    productRepository.sumProducts(filters),
  ]);

  return {
    pagination: buildPagination(filters, total),
    totals: {
      totalUnits: Number(totals.totalUnits),
      totalCostValue: Number(totals.totalCostValue),
      totalSaleValue: Number(totals.totalSaleValue),
      potentialProfit: Number(totals.totalSaleValue) - Number(totals.totalCostValue),
    },
    sort: { key: filters.sort.key, direction: filters.direction.toLowerCase() },
    rows,
  };
}
```

Depois acrescente, no final do arquivo:

```javascript
export async function getStockSummary() {
  const summary = await productRepository.getStockSummary();

  const totalCostValue = Number(summary.totalCostValue);
  const totalSaleValue = Number(summary.totalSaleValue);

  return {
    productCount: Number(summary.productCount),
    categoryCount: Number(summary.categoryCount),
    totalUnits: Number(summary.totalUnits),
    totalCostValue,
    totalSaleValue,
    potentialProfit: totalSaleValue - totalCostValue,
    // AVG devolve muitas casas decimais. Dinheiro mostra duas.
    averageCostPrice: Math.round(Number(summary.averageCostPrice) * 100) / 100,
    minSalePrice: Number(summary.minSalePrice),
    maxSalePrice: Number(summary.maxSalePrice),
    outOfStockCount: Number(summary.outOfStockCount ?? 0),
    lowStockCount: Number(summary.lowStockCount ?? 0),
  };
}
```

E a versão desta aula do resumo por categoria:

```javascript
export async function getStockByCategory() {
  const rows = await productRepository.getStockByCategory();

  return rows.map((row) => ({
    categoryId: row.categoryId,
    productCount: Number(row.productCount),
    totalUnits: Number(row.totalUnits),
    totalCostValue: Number(row.totalCostValue),
    totalSaleValue: Number(row.totalSaleValue),
  }));
}
```

Salve.

### 🔍 Por que tanto `Number(...)`

```javascript
totalUnits: Number(totals.totalUnits),
```

O driver `mysql2` devolve `COUNT()` e `SUM()` como **string** em alguns casos, para não perder precisão com números gigantes (`BIGINT` vai além do que o JavaScript representa com segurança).

E string estraga conta:

```javascript
"150" + 20     // "15020"   ← concatenou!
Number("150") + 20  // 170   ← somou
```

> 📌 **Converter na fronteira.** O service é o último lugar que toca no dado antes de ele virar JSON. Converter aqui garante que o front nunca receba um número disfarçado de texto.

### 🔍 O cálculo que fica no JavaScript

```javascript
potentialProfit: totalSaleValue - totalCostValue,
```

Essa subtração poderia estar no SQL. Deixamos no service porque é **regra de negócio** ("lucro potencial é venda menos custo"), não extração de dado.

> 💡 A linha divisória que usamos no projeto: o **banco** calcula o que depende de muitas linhas (somas, contagens, agrupamentos); o **service** calcula o que depende de poucos números já prontos.

---

## Passo 5 — Controller e rotas

Em `src/modules/reports/report-controller.js`, acrescente:

```javascript
export async function stockSummary(request, response) {
  const summary = await service.getStockSummary();

  response.json(summary);
}
```

```javascript
export async function stockByCategory(request, response) {
  const rows = await service.getStockByCategory();

  response.json(rows);
}
```

Em `src/modules/reports/report-routes.js`, acrescente as duas rotas:

```javascript
reportRoutes.get("/stock-summary", asyncHandler(controller.stockSummary));
reportRoutes.get("/stock-by-category", asyncHandler(controller.stockByCategory));
```

Salve tudo.

### 🔍 Por que esses controllers não têm filtros

```javascript
export async function stockSummary(request, response) {
  const summary = await service.getStockSummary();

  response.json(summary);
}
```

Eles não chamam `parseProductReportFilters` porque **não recebem filtro nenhum**: o resumo é sempre do estoque inteiro.

> 💡 Dá para transformar isso num exercício: fazer o `stock-summary` respeitar os mesmos filtros do relatório de produtos. A peça já existe — é só passar `filters` adiante.

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

### Teste 1 — O resumo

```bash
curl -s "http://localhost:3000/api/reports/stock-summary" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "productCount": 12,
  "categoryCount": 4,
  "totalUnits": 237,
  "totalCostValue": 3409,
  "totalSaleValue": 6423.1,
  "potentialProfit": 3014.1,
  "averageCostPrice": 25.28,
  "minSalePrice": 2,
  "maxSalePrice": 299,
  "outOfStockCount": 1,
  "lowStockCount": 4
}
```

> 🔍 **Confira à mão:** `potentialProfit` tem que ser `totalSaleValue − totalCostValue`. Se não bater, há um `Number()` faltando em algum lugar.

### Teste 2 — Os totais da seleção

```bash
curl -s "http://localhost:3000/api/reports/products?pageSize=3" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "pagination": { "page": 1, "pageSize": 3, "total": 12, "totalPages": 4 },
  "totals": { "totalUnits": 237, "totalCostValue": 3409, ... },
  "rows": [ ...3 produtos... ]
}
```

🎉 **O ponto é este:** vieram 3 linhas, mas `totals` é de todos os 12.

Agora com filtro:

```bash
curl -s "http://localhost:3000/api/reports/products?search=cha" -H "Authorization: Bearer $TOKEN"
```

Os totais mudam junto com o filtro — porque `sumProducts` usa o mesmo `WHERE`.

### Teste 3 — Por categoria (e o defeito)

```bash
curl -s "http://localhost:3000/api/reports/stock-by-category" -H "Authorization: Bearer $TOKEN"
```

```json
[
  { "categoryId": 1, "productCount": 3, "totalUnits": 93, "totalCostValue": 1527.7 },
  { "categoryId": 4, "productCount": 3, "totalUnits": 36, "totalCostValue": 1422 },
  { "categoryId": 3, "productCount": 3, "totalUnits": 24, "totalCostValue": 291.3 },
  { "categoryId": 2, "productCount": 2, "totalUnits": 60, "totalCostValue": 108 },
  { "categoryId": null, "productCount": 1, "totalUnits": 24, "totalCostValue": 60 }
]
```

---

## 7. ⚠️ Os dois defeitos deste relatório

Olhe de novo a resposta acima. Ela **funciona**, mas é inutilizável numa tela. Dois motivos:

### Defeito 1 — ninguém sabe o que é "categoryId: 4"

```json
{ "categoryId": 4, ... }
```

O usuário quer ler **"Informatica"**. O nome está em `categories`, e nós nunca saímos de `products`.

### Defeito 2 — a categoria vazia sumiu

Rode no terminal:

```sql
SELECT id, name FROM categories;
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

São **5** categorias. O relatório mostrou **4** linhas com id (mais a do `null`).

**Cadê "Ferramentas"?**

Ela não tem nenhum produto. E a nossa consulta parte de `products` — se não há produto, não há linha, logo não há pilha, logo não há grupo.

```text
   FROM products
        ^
        partimos daqui, então só enxergamos
        categorias que TÊM produto
```

> 📌 **E isso é um erro de verdade, não um detalhe.** Um relatório de estoque por categoria que esconde as categorias vazias esconde justamente a informação mais acionável: "você criou a categoria Ferramentas e nunca cadastrou nada nela".

### A solução não está em `GROUP BY`

Os dois defeitos têm a mesma raiz: **estamos olhando uma tabela só**. Para resolver, precisamos juntar `products` com `categories`.

É exatamente o assunto das próximas duas aulas.

---

## ✅ Confira se deu certo

- [ ] `/api/reports/stock-summary` devolve os 11 indicadores
- [ ] `potentialProfit` = `totalSaleValue` − `totalCostValue`
- [ ] `/api/reports/products` agora tem a chave `totals`
- [ ] `totals` é da seleção inteira, não da página
- [ ] `totals` muda quando você aplica um filtro
- [ ] `/api/reports/stock-by-category` responde
- [ ] Você **viu** que a categoria "Ferramentas" não aparece
- [ ] Os números vêm como número, não como `"150"` entre aspas
- [ ] O resto do sistema continua funcionando

---

## 🔧 Erros comuns

### `ERROR 1055 ... ONLY_FULL_GROUP_BY`

Você colocou no `SELECT` uma coluna que não está no `GROUP BY` nem dentro de uma agregação. Veja a seção 4.

### `ERROR 1111 (HY000): Invalid use of group function`

Você usou `SUM()`, `COUNT()` etc. dentro do `WHERE`. Use `HAVING`.

### Os números vêm como texto: `"totalUnits": "150"`

Faltou o `Number()` no service. Procure a chave que veio entre aspas no JSON.

### `"totalUnits": null` num banco vazio

Faltou o `COALESCE(SUM(...), 0)`.

### O total do rodapé é igual ao da página

O `sumProducts` não está recebendo os filtros, ou o service está somando `rows` em JavaScript em vez de chamá-lo.

### `potentialProfit` deu um número absurdo

Concatenação de string: `"3252" - "1644"` funciona por coerção, mas `"3252" + "1644"` daria `"32521644"`. Confira os `Number()`.

### `Cannot read properties of undefined (reading 'totalUnits')`

O `getProductReport` espera **três** resultados no `Promise.all`, mas o array de destino tem dois nomes. Confira:

```javascript
const [rows, total, totals] = await Promise.all([ ... ]);  // 3 e 3
```

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| Agregação **colapsa** muitas linhas em uma | seção 1 |
| `COUNT(*)` vs `COUNT(coluna)` e o `NULL` | `[35.2]` |
| Toda agregação ignora `NULL` — inclusive o `AVG` | seção 2 |
| `SUM(a * b)` ≠ `SUM(a) * SUM(b)` | seção 3 |
| `SUM` devolve `NULL` sem linhas; `COUNT` devolve `0` | Passo 1 |
| `COALESCE` para dar valor ao vazio | Passo 1 |
| `GROUP BY` monta pilhas e colapsa cada uma | seção 4 |
| A regra `ONLY_FULL_GROUP_BY` e por que ela protege você | seção 4 |
| `HAVING` filtra grupos; `WHERE` filtra linhas | seção 5 |
| `DATE_FORMAT` + `GROUP BY` para agrupar por mês | `[35.15]` |
| **`SUM` + `CASE`**: transformar linhas em colunas (pivô) | `[35.16]` |
| Totais da seleção ≠ totais da página | Passo 2 |
| **Uma tabela só não basta** | seção 7 |

---

## ➡️ Próximo passo

Chegamos no limite do que se faz com uma tabela. Hora de juntar duas.

**[Aula 36 — INNER JOIN: juntando duas tabelas](36-inner-join.md)**
