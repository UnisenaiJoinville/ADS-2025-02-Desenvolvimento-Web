# Aula 39 — JOIN com agrupamento e HAVING

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** laboratório SQL + código JavaScript

---

## O que vamos construir

Os dois relatórios que a gerência costuma pedir primeiro:

```text
   GET /api/reports/movements-by-user   ->  o que cada pessoa movimentou
   GET /api/reports/top-products        ->  ranking dos mais movimentados
```

### Por que precisamos disso

Até aqui os relatórios fazem uma coisa **ou** outra:

| Aula | O que faz |
|---|---|
| 35 | agrupa e soma — mas numa tabela só |
| 36 a 38 | junta tabelas — mas devolve linha a linha |

Nenhum responde perguntas como **"quem movimentou mais?"** ou **"qual produto gira mais?"**, porque elas precisam dos dois ao mesmo tempo: juntar as tabelas **e** resumir o resultado.

### O conceito

```text
   JOIN       alarga   (traz colunas de outras tabelas)
   GROUP BY   encolhe  (junta muitas linhas em uma)
   HAVING     filtra   (descarta grupos inteiros)
```

A ordem em que o banco faz isso é fixa — e entender essa ordem é o que faz a consulta sair certa na primeira tentativa.

---

## Antes de começar

- [ ] [Aula 38](38-multiplos-joins.md) concluída (coluna `user_id` criada e preenchida)
- [ ] Terminal do MySQL aberto

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db
```

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
└── src/modules/reports/
    ├── movement-report-repository.js  (2 funções novas)
    ├── report-filters.js              (1 função nova)
    ├── report-service.js              (2 funções novas)
    ├── report-controller.js           (2 funções novas)
    └── report-routes.js               (2 rotas novas)
```

---

# PARTE 1 — SQL no terminal

## 1. A ordem de execução, agora completa

Volte à tabela da [Aula 34](34-select-filtros-ordenacao.md), com o `JOIN` no lugar:

```text
   1. FROM / JOIN     monta a tabela larga, juntando tudo
   2. WHERE           joga LINHAS fora
   3. GROUP BY        empilha as linhas restantes em grupos
   4. HAVING          joga GRUPOS fora
   5. SELECT          calcula as colunas e os apelidos
   6. ORDER BY        ordena
   7. LIMIT / OFFSET  corta o pedaço
```

> 📌 **Guarde esta sequência.** Praticamente toda dúvida de "por que isso não funciona?" se responde perguntando *em que passo isso acontece*.

---

## 2. Agrupar depois de juntar

### `[39.1]` Produtos por categoria — agora com o nome

```sql
SELECT c.name      AS categoria,
       COUNT(p.id) AS produtos
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
 ORDER BY produtos DESC;
```

```text
+-------------+----------+
| categoria   | produtos |
+-------------+----------+
| Bebidas     |        3 |
| Informatica |        3 |
| Papelaria   |        3 |
| Limpeza     |        2 |
| Ferramentas |        0 |
+-------------+----------+
```

É o relatório que a [Aula 35](35-agregacao-group-by.md) não conseguiu fazer: com nome e com a categoria vazia.

### 🔍 Por que `GROUP BY c.id, c.name` e não só `c.name`

```sql
 GROUP BY c.id, c.name
```

Duas razões:

**1. A regra do `ONLY_FULL_GROUP_BY`.** Se `c.name` está no `SELECT`, ele precisa estar no `GROUP BY`.

**2. Duas categorias podem ter o mesmo nome.** No nosso banco `name` é `UNIQUE`, então não aconteceria — mas agrupar pela **chave primária** é sempre correto, e o nome vai junto por ser funcionalmente dependente dela.

> 💡 **Regra prática:** agrupe pela chave primária e acrescente as outras colunas que você quer exibir. Nunca agrupe só por um texto.

### `[39.2]` O erro do `COUNT(*)`, de novo

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
| Informatica |             3 |               3 |
| Papelaria   |             3 |               3 |
+-------------+---------------+-----------------+
```

Já vimos isso na [Aula 37](37-left-join.md). Vale repetir porque é o erro mais comum de `LEFT JOIN` com agregação:

> ⚠️ **Em `LEFT JOIN` + `GROUP BY`, `COUNT(*)` quase sempre está errado.** Ele conta a linha-fantasma que o `LEFT JOIN` criou. Conte uma **coluna da tabela da direita** — de preferência a chave primária.

### `[39.3]` Somando valores por categoria

```sql
SELECT c.name AS categoria,
       COUNT(p.id)                              AS produtos,
       COALESCE(SUM(p.quantity), 0)             AS unidades,
       ROUND(COALESCE(SUM(p.quantity * p.cost_price), 0), 2) AS valor_custo
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
 GROUP BY c.id, c.name
 ORDER BY valor_custo DESC;
```

Repare nos três cuidados acumulados:

| Cuidado | Por quê |
|---|---|
| `COUNT(p.id)` | não contar a linha-fantasma |
| `COALESCE(SUM(...), 0)` | `SUM` de nada é `NULL`, não zero |
| `ON ... AND p.active = TRUE` | filtrar sem derrubar a categoria vazia |

---

## 3. `HAVING` sobre um `JOIN`

### `[39.4]`

```sql
SELECT c.name      AS categoria,
       COUNT(p.id) AS produtos
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
 GROUP BY c.id, c.name
HAVING COUNT(p.id) > 2
 ORDER BY produtos DESC;
```

```text
+-------------+----------+
| categoria   | produtos |
+-------------+----------+
| Bebidas     |        3 |
| Informatica |        3 |
| Papelaria   |        3 |
+-------------+----------+
```

"Ferramentas" (0) e "Limpeza" (2) saíram. O `HAVING` jogou **grupos inteiros** fora.

### 🔍 Por que isso não dá para fazer no `WHERE`

Pense no passo 2 da ordem de execução. Quando o `WHERE` roda:

```text
   as linhas existem        ✓
   os grupos existem        ✗  (o GROUP BY ainda não aconteceu)
   o COUNT existe           ✗
```

Não há o que comparar. Daí o erro `Invalid use of group function`.

---

## 4. O ranking

### `[39.5]` Produtos mais movimentados

```sql
SELECT p.name AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria,
       COUNT(m.id)      AS movimentacoes,
       SUM(m.quantity)  AS unidades_movimentadas
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
 GROUP BY p.id, p.name, c.name
 ORDER BY unidades_movimentadas DESC
 LIMIT 5;
```

```text
+---------------------------+---------------+---------------+-----------------------+
| produto                   | categoria     | movimentacoes | unidades_movimentadas |
+---------------------------+---------------+---------------+-----------------------+
| Cha verde 50 saches       | Bebidas       |             5 |                   115 |
| Cafe em graos 1kg         | Bebidas       |             2 |                    60 |
| Detergente neutro 500ml   | Limpeza       |             1 |                    60 |
| Fita adesiva transparente | Sem categoria |             2 |                    56 |
| Caneta esferografica      | Papelaria     |             2 |                    55 |
+---------------------------+---------------+---------------+-----------------------+
```

### 🔍 Repare na quarta linha

```text
| Fita adesiva transparente | Sem categoria |
```

O produto sem categoria **está no ranking**. Se o `JOIN` com `categories` fosse `INNER`, ele sumiria — e o ranking mostraria um produto a menos, sem avisar.

> 📌 É o mesmo cuidado da Aula 38, agora num relatório agregado. E aqui o estrago é pior: num ranking "top 5", perder uma linha muda **a posição de todas as outras**.

### 🔍 `SUM(m.quantity)` conta entradas e saídas juntas

"Mais movimentado" aqui significa **mais girou** — tanto faz se entrando ou saindo. É o indicador de giro do produto.

Se você quisesse "mais vendido", filtraria `WHERE m.type = 'OUT'`. São perguntas diferentes.

### `[39.6]` Entradas e saídas por produto

```sql
SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) AS saidas,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE -m.quantity END) AS saldo_calculado,
       p.quantity AS saldo_gravado
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name, p.quantity
 ORDER BY produto;
```

### 🔍 Esta consulta é uma auditoria

Compare as duas últimas colunas:

| Coluna | De onde vem |
|---|---|
| `saldo_calculado` | somando o **histórico** de movimentações |
| `saldo_gravado` | a coluna `products.quantity` |

Lembra da [Aula 13](13-movimentacoes-transacoes.md)? As duas precisam **sempre bater**. É exatamente isso que a transação garante.

> 💡 **Rode esta consulta de vez em quando.** Se alguma linha divergir, você encontrou um bug de verdade — alguma gravação aconteceu pela metade.
>
> ⚠️ Uma exceção legítima: produtos cadastrados **com saldo inicial** e nunca movimentados (o Cabo HDMI). Eles nem aparecem aqui, porque o `INNER JOIN` exige pelo menos uma movimentação — o que, neste caso, é o comportamento correto.

### `[39.7]` `HAVING` comparando duas agregações

```sql
SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) AS saidas
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name
HAVING saidas > entradas
 ORDER BY saidas DESC;
```

```text
Empty set
```

### 🔍 O resultado vazio **é** a resposta

Não é bug. É informação: **nenhum produto saiu mais do que entrou**.

E faz sentido — a transação da Aula 13 recusa saída maior que o saldo. O estoque não pode ficar negativo.

Mas então essa consulta é inútil? Não. Ela encontraria produtos cujo saldo veio do **cadastro inicial**, não de entradas:

```text
   Cabo HDMI:  cadastrado com 15 unidades, nenhuma entrada registrada
               se alguém registrar uma saída de 10:
               entradas = 0, saidas = 10  ->  apareceria aqui
```

> 💡 **Teste você mesmo:** registre uma saída no Cabo HDMI pela tela de movimentações e rode a consulta de novo. A linha aparece — e ela está te dizendo "este saldo entrou sem rastro".

### 🔍 `HAVING` pode usar apelidos

```sql
HAVING saidas > entradas
```

`saidas` e `entradas` são apelidos criados no `SELECT`. O `HAVING` roda **antes** do `SELECT` na ordem formal, mas o MySQL permite essa referência por conveniência.

> ⚠️ **Isso é uma extensão do MySQL, não SQL padrão.** PostgreSQL recusa e exige repetir a expressão inteira:
>
> ```sql
> HAVING SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END) > SUM(...)
> ```
>
> Se o seu código pode mudar de banco um dia, repita a expressão.

---

## 5. Agrupando por responsável

### `[39.8]`

```sql
SELECT COALESCE(u.name, 'Nao informado') AS responsavel,
       COUNT(*)                          AS movimentacoes,
       COUNT(DISTINCT m.product_id)      AS produtos_diferentes,
       MIN(m.created_at)                 AS primeira,
       MAX(m.created_at)                 AS ultima
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
 ORDER BY movimentacoes DESC;
```

```text
+-----------------+---------------+---------------------+---------------------+---------------------+
| responsavel     | movimentacoes | produtos_diferentes | primeira            | ultima              |
+-----------------+---------------+---------------------+---------------------+---------------------+
| Nao informado   |            12 |                   7 | 2026-10-01 22:25:58 | 2026-10-01 22:25:58 |
| Professor Demo  |             7 |                   4 | 2026-05-08 10:00:00 | 2026-09-02 11:05:00 |
| Ana Paula Souza |             5 |                   2 | 2026-06-19 14:20:00 | 2026-09-15 13:30:00 |
+-----------------+---------------+---------------------+---------------------+---------------------+
```

### 🔍 Aqui o `COUNT(*)` está certo

Opa — não acabamos de dizer para não usar `COUNT(*)` com `LEFT JOIN`?

A diferença é **de qual lado estamos partindo**:

```text
   [39.2]  FROM categories  LEFT JOIN products
           a categoria vazia gera uma linha-fantasma  -> COUNT(*) mente

   [39.8]  FROM stock_movements  LEFT JOIN users
           toda movimentação é uma linha real          -> COUNT(*) está certo
```

O `LEFT JOIN` aqui não **cria** linhas: ele só deixa de preencher as colunas de `users`. Cada linha contada é uma movimentação que existe de verdade.

> 📌 **A pergunta que resolve a dúvida:** "o `LEFT JOIN` pode gerar uma linha onde a tabela principal não tinha nenhuma?"
>
> Se sim (você partiu do lado "um"), use `COUNT(coluna)`. Se não (partiu do lado "muitos"), `COUNT(*)` está certo.

### 🔍 `COUNT(DISTINCT ...)` dentro de um grupo

```sql
COUNT(DISTINCT m.product_id) AS produtos_diferentes
```

Professor Demo tem 7 movimentações em apenas 4 produtos. Sem `DISTINCT`, daria 7.

### 🔍 `MIN` e `MAX` em datas

`MIN(m.created_at)` é a primeira movimentação daquela pessoa; `MAX`, a última. Funções de agregação funcionam em datas tão bem quanto em números.

### 🔍 O grupo `NULL` é o mais informativo

```text
| Nao informado | 12 | 7 | 2026-10-01 22:25:58 | 2026-10-01 22:25:58 |
```

São as 12 movimentações anteriores ao controle de acesso. Repare que a primeira e a última têm a **mesma** data e hora — elas foram todas criadas juntas, pelo `init.sql`.

> 📌 Um `INNER JOIN` em `users` apagaria esta linha inteira do relatório, e ninguém notaria que faltavam 12 movimentações. É a lição da Aula 38, agora num relatório agregado.

### `[39.9]` Tudo junto

```sql
SELECT c.name AS categoria,
       COUNT(DISTINCT p.id) AS produtos,
       SUM(m.quantity)      AS unidades_movimentadas
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
 INNER JOIN categories c ON c.id = p.category_id
 WHERE m.type = 'OUT'
 GROUP BY c.id, c.name
HAVING SUM(m.quantity) > 10
 ORDER BY unidades_movimentadas DESC
 LIMIT 5;
```

```text
+-----------+----------+-----------------------+
| categoria | produtos | unidades_movimentadas |
+-----------+----------+-----------------------+
| Bebidas   |        3 |                    67 |
| Papelaria |        3 |                    56 |
| Limpeza   |        1 |                    24 |
+-----------+----------+-----------------------+
```

Sete cláusulas, uma consulta. Leia na ordem de execução:

```text
   FROM + 2 JOINs   junta movimentações, produtos e categorias
   WHERE type='OUT' fica só com as saídas
   GROUP BY         empilha por categoria
   HAVING > 10      descarta as categorias que saíram pouco
   SELECT           calcula contagem e soma
   ORDER BY         ordena pela soma
   LIMIT 5          corta
```

> 🔍 **Note o `COUNT(DISTINCT p.id)`.** Sem o `DISTINCT`, contaríamos as movimentações, não os produtos — um produto com 5 saídas contaria 5 vezes. Quando há `JOIN` com o lado "muitos", quase todo `COUNT` de entidade precisa de `DISTINCT`.

---

# PARTE 2 — Do SQL para a API

## Passo 1 — Movimentações por responsável

Abra `src/modules/reports/movement-report-repository.js` e acrescente:

```javascript
// JOIN + GROUP BY: uma linha por usuario, com as movimentacoes somadas.
// O LEFT JOIN em users e o COALESCE fazem o grupo "Nao informado"
// aparecer no relatorio em vez de sumir.
export async function getMovementsByUser(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT u.id                              AS userId,
            COALESCE(u.name, 'Nao informado') AS userName,
            u.email                           AS userEmail,
            COUNT(*)                                                               AS movementCount,
            SUM(CASE WHEN m.type = 'IN'  THEN 1 ELSE 0 END)                        AS entriesCount,
            SUM(CASE WHEN m.type = 'OUT' THEN 1 ELSE 0 END)                        AS exitsCount,
            COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0)  AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0)  AS unitsOut,
            COUNT(DISTINCT m.product_id)                                           AS productCount,
            MIN(m.created_at)                                                      AS firstMovementAt,
            MAX(m.created_at)                                                      AS lastMovementAt
     ${FROM_MOVEMENT}
     ${where}
     GROUP BY u.id, u.name, u.email
     ORDER BY movementCount DESC, userName`,
    params
  );

  return rows;
}
```

Salve.

### 🔍 Reaproveitando o `buildMovementWhere`

```javascript
const { where, params } = buildMovementWhere(filters);
```

O relatório agregado usa **exatamente os mesmos filtros** do relatório detalhado. Isso significa que `?startDate=...&type=OUT` vai funcionar nos dois, de graça.

> 💡 É o retorno do investimento de ter extraído `buildMovementWhere` numa função separada lá na Aula 36.

### 🔍 `u.email` no `GROUP BY`

```sql
 GROUP BY u.id, u.name, u.email
```

Toda coluna não agregada do `SELECT` precisa estar aqui — a regra do `ONLY_FULL_GROUP_BY`.

> 🔍 Para o grupo `NULL`, `u.email` também é `NULL`. O front mostra "Nao informado" pelo nome e simplesmente não exibe e-mail.

---

## Passo 2 — O ranking

Acrescente:

```javascript
// Ranking de produtos mais movimentados.
// HAVING filtra DEPOIS do agrupamento - e so por isso conseguimos
// usar SUM(...) como condicao. No WHERE isso seria um erro.
export async function getTopProducts(filters, { minUnits = 1, limit = 10 } = {}) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT p.id                              AS productId,
            p.name                            AS productName,
            p.sku                             AS productSku,
            COALESCE(c.name, 'Sem categoria') AS categoryName,
            p.quantity                        AS currentStock,
            COUNT(*)                                                              AS movementCount,
            COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0) AS unitsOut,
            SUM(m.quantity)                                                       AS unitsMoved
     ${FROM_MOVEMENT}
     ${where}
     GROUP BY p.id, p.name, p.sku, c.name, p.quantity
     HAVING unitsMoved >= ?
     ORDER BY unitsMoved DESC, productName
     LIMIT ?`,
    [...params, minUnits, limit]
  );

  return rows;
}
```

Salve.

### 🔍 `HAVING ?` — aqui o `?` funciona

```sql
HAVING unitsMoved >= ?
...
LIMIT ?
```

Diferente do `ORDER BY` da [Aula 34](34-select-filtros-ordenacao.md), estes são **valores**, não estrutura. O `?` serve perfeitamente.

```text
   ORDER BY <coluna>   ->  estrutura  ->  lista branca
   HAVING ... >= ?     ->  valor      ->  prepared statement
   LIMIT ?             ->  valor      ->  prepared statement
```

### 🔍 A ordem dos parâmetros

```javascript
[...params, minUnits, limit]
```

Os `?` são substituídos **na ordem em que aparecem no texto**:

```text
   1..n   os do WHERE   (vieram de buildMovementWhere)
   n+1    o do HAVING
   n+2    o do LIMIT
```

> ⚠️ Inverter `minUnits` e `limit` não daria erro — daria um resultado silenciosamente errado, com o limite virando filtro e vice-versa. Sempre confira a ordem contra o texto do SQL.

### 🔍 Opções com valor padrão

```javascript
export async function getTopProducts(filters, { minUnits = 1, limit = 10 } = {}) {
```

Dois níveis de padrão:

| Sintaxe | Cobre |
|---|---|
| `= {}` no final | chamar sem o segundo argumento |
| `minUnits = 1` dentro | passar `{ limit: 5 }` sem `minUnits` |

Sem o `= {}`, `getTopProducts(filters)` quebraria ao tentar desestruturar `undefined`.

---

## Passo 3 — Validar as opções do ranking

Em `src/modules/reports/report-filters.js`, acrescente:

```javascript
// O ranking tem dois ajustes proprios, que tambem precisam ser
// validados: nada que vai para o SQL escapa do validator.
export function parseTopProductsOptions(query = {}) {
  const minUnits = Number(query.minUnits ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(minUnits) || minUnits < 0) {
    throw new AppError("O parametro minUnits deve ser um inteiro maior ou igual a zero");
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new AppError("O parametro limit deve ser um inteiro entre 1 e 100");
  }

  return { minUnits, limit };
}
```

Salve.

### 🔍 Por que validar se o `?` já protege

O `?` protege contra **injeção**, não contra **absurdo**.

```text
   ?limit=abc        ->  Number("abc") = NaN  ->  SQL quebra
   ?limit=999999999  ->  consulta enorme, servidor sofre
   ?minUnits=-5      ->  sem sentido
```

> 📌 **Nada que vai para o SQL escapa do validador** — nem o que é "só um número". A regra vale para o módulo inteiro.

---

## Passo 4 — Service, controller e rotas

Em `report-service.js`:

```javascript
export async function getMovementsByUser(filters) {
  const rows = await movementRepository.getMovementsByUser(filters);

  return rows.map((row) => {
    const unitsIn = Number(row.unitsIn);
    const unitsOut = Number(row.unitsOut);

    return {
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      movementCount: Number(row.movementCount),
      entriesCount: Number(row.entriesCount),
      exitsCount: Number(row.exitsCount),
      productCount: Number(row.productCount),
      unitsIn,
      unitsOut,
      balance: unitsIn - unitsOut,
      firstMovementAt: row.firstMovementAt,
      lastMovementAt: row.lastMovementAt,
    };
  });
}
```

```javascript
export async function getTopProducts(filters, options) {
  const rows = await movementRepository.getTopProducts(filters, options);

  return rows.map((row) => ({
    ...row,
    currentStock: Number(row.currentStock),
    movementCount: Number(row.movementCount),
    unitsIn: Number(row.unitsIn),
    unitsOut: Number(row.unitsOut),
    unitsMoved: Number(row.unitsMoved),
  }));
}
```

Em `report-controller.js` (lembre de acrescentar `parseTopProductsOptions` ao import):

```javascript
export async function movementsByUser(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const rows = await service.getMovementsByUser(filters);

  response.json(rows);
}
```

```javascript
export async function topProducts(request, response) {
  const filters = parseMovementReportFilters(request.query);

  const rows = await service.getTopProducts(filters, parseTopProductsOptions(request.query));

  response.json(rows);
}
```

Em `report-routes.js`:

```javascript
reportRoutes.get("/movements-by-user", asyncHandler(controller.movementsByUser));
reportRoutes.get("/top-products", asyncHandler(controller.topProducts));
```

Salve tudo.

### 🔍 O `balance` calculado no service

```javascript
const unitsIn = Number(row.unitsIn);
const unitsOut = Number(row.unitsOut);
...
balance: unitsIn - unitsOut,
```

Daria para calcular no SQL. Fica aqui porque os dois números já estão na mão — é a mesma linha divisória das aulas anteriores: o **banco** agrega muitas linhas, o **service** combina poucos números prontos.

### 🔍 Estes relatórios não são paginados

Repare que `getMovementsByUser` devolve um array simples, sem envelope:

```json
[ { "userName": "...", "movementCount": 12, ... }, ... ]
```

Por quê? Porque o resultado é **naturalmente pequeno**: uma linha por usuário. Paginar 3 linhas seria burocracia.

> 📌 **Critério:** pagine o que cresce com os dados (produtos, movimentações). Não pagine o que cresce com o cadastro de usuários ou de categorias — a não ser que você tenha milhares deles.

---

## Passo 5 — Testar

```bash
docker compose restart api
```

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')
```

### Teste 1 — Por responsável

```bash
curl -s "http://localhost:3000/api/reports/movements-by-user" -H "Authorization: Bearer $TOKEN"
```

```json
[
  { "userId": null, "userName": "Nao informado", "userEmail": null,
    "movementCount": 12, "entriesCount": 7, "exitsCount": 5,
    "productCount": 7, "unitsIn": 213, "unitsOut": 67, "balance": 146,
    "firstMovementAt": "2026-10-01 22:25:58", "lastMovementAt": "2026-10-01 22:25:58" },
  { "userId": 1, "userName": "Professor Demo", ... },
  { "userId": 2, "userName": "Ana Paula Souza", ... }
]
```

> 🔍 **Os três grupos aparecem** — inclusive o `userId: null`. É o `LEFT JOIN` preservando as movimentações sem dono.

### Teste 2 — O ranking

```bash
curl -s "http://localhost:3000/api/reports/top-products?limit=5" -H "Authorization: Bearer $TOKEN"
```

A primeira posição deve ser `Cha verde 50 saches`, com `unitsMoved: 115`.

### Teste 3 — Ranking com filtro

```bash
# só as saídas
curl -s "http://localhost:3000/api/reports/top-products?type=OUT&limit=3" -H "Authorization: Bearer $TOKEN"

# só o que a Ana movimentou
curl -s "http://localhost:3000/api/reports/top-products?userId=2" -H "Authorization: Bearer $TOKEN"

# só produtos com 50 unidades ou mais de giro
curl -s "http://localhost:3000/api/reports/top-products?minUnits=50" -H "Authorization: Bearer $TOKEN"
```

> 🔍 **O primeiro muda o ranking inteiro**, porque "mais movimentado" e "mais vendido" são perguntas diferentes.

### Teste 4 — Filtros combinados no agrupado

```bash
curl -s "http://localhost:3000/api/reports/movements-by-user?type=OUT" -H "Authorization: Bearer $TOKEN"
```

Os totais mudam, mas os três grupos continuam lá — porque o filtro é por tipo, não por usuário.

### Teste 5 — Os erros

```bash
curl -i -s "http://localhost:3000/api/reports/top-products?limit=abc" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/top-products?limit=5000" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/top-products?minUnits=-3" -H "Authorization: Bearer $TOKEN"
```

| Esperado | |
|---|---|
| `400` | "O parametro limit deve ser um inteiro entre 1 e 100" |
| `400` | idem |
| `400` | "O parametro minUnits deve ser um inteiro maior ou igual a zero" |

### Teste 6 — A auditoria do saldo

No terminal:

```sql
SELECT p.name AS produto,
       SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE -m.quantity END) AS saldo_calculado,
       p.quantity AS saldo_gravado
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 GROUP BY p.id, p.name, p.quantity
HAVING saldo_calculado <> saldo_gravado;
```

**O resultado deve ser vazio.** Se vier alguma linha, o histórico e o saldo divergiram — e aí você tem um problema real para investigar.

> 💡 Guarde esta consulta. Ela é a prova de que a transação da [Aula 13](13-movimentacoes-transacoes.md) está cumprindo o papel dela.
>
> ⚠️ Produtos cadastrados **com saldo inicial** e nunca movimentados (como o Cabo HDMI) não aparecem aqui, porque o `INNER JOIN` os exclui. Para incluí-los, troque por `LEFT JOIN` — e aí o Cabo HDMI apareceria com `saldo_calculado` 0 e `saldo_gravado` 15, o que **não** é um bug.

---

## ✅ Confira se deu certo

- [ ] `/api/reports/movements-by-user` lista os três grupos, inclusive `userId: null`
- [ ] `/api/reports/top-products` traz o ranking, com `Cha verde` em primeiro
- [ ] O produto "Sem categoria" aparece no ranking
- [ ] `?type=OUT` muda o ranking
- [ ] `?minUnits=` e `?limit=` funcionam
- [ ] `?limit=abc` devolve `400`
- [ ] A consulta de auditoria do Teste 6 volta vazia
- [ ] No terminal, você viu `COUNT(*)` dar 1 e `COUNT(p.id)` dar 0 em "Ferramentas"

---

## 🔧 Erros comuns

### `ERROR 1055 ... ONLY_FULL_GROUP_BY`

Alguma coluna do `SELECT` não está no `GROUP BY` nem agregada. Com `JOIN`, o esquecido costuma ser uma coluna da tabela juntada (`c.name`, `u.email`).

### `ERROR 1111: Invalid use of group function`

Agregação no `WHERE`. Mova para o `HAVING`.

### A categoria vazia aparece com contagem 1

`COUNT(*)` em vez de `COUNT(coluna)`. Veja `[39.2]`.

### Um produto conta várias vezes

Faltou `DISTINCT` num `COUNT` de entidade, com `JOIN` para o lado "muitos". Veja `[39.9]`.

### O ranking tem menos produtos do que o esperado

Dois suspeitos: um `INNER JOIN` descartando (o produto sem categoria), ou o `HAVING minUnits` filtrando mais do que você queria.

### `Incorrect arguments to mysqld_stmt_execute`

A ordem ou a quantidade dos parâmetros não bate. Conte os `?` no texto e os valores no array — lembrando que `HAVING` e `LIMIT` entram **depois** dos do `WHERE`.

### `Cannot destructure property 'minUnits' of 'undefined'`

Faltou o `= {}` no segundo parâmetro de `getTopProducts`.

### O grupo "Nao informado" sumiu

`LEFT JOIN users` virou `INNER JOIN` em algum lugar.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| A ordem de execução completa, com `JOIN` | seção 1 |
| `GROUP BY` pela chave primária, não pelo texto | `[39.1]` |
| `COUNT(*)` × `COUNT(coluna)` — e **quando cada um está certo** | `[39.2]`, `[39.8]` |
| Os três cuidados do `LEFT JOIN` agregado | `[39.3]` |
| `HAVING` descarta grupos depois do `JOIN` | `[39.4]` |
| Um `INNER` errado reordena um ranking inteiro | `[39.5]` |
| Auditoria: saldo calculado × saldo gravado | `[39.6]`, Teste 6 |
| Resultado vazio **é** resposta | `[39.7]` |
| `HAVING` com apelido é extensão do MySQL | `[39.7]` |
| `COUNT(DISTINCT ...)` dentro de grupos | `[39.8]`, `[39.9]` |
| `MIN`/`MAX` em datas | `[39.8]` |
| `?` serve em `HAVING` e `LIMIT`, mas não em `ORDER BY` | Passo 2 |
| Quando **não** paginar | Passo 4 |

---

## ➡️ Próximo passo

Os JOINs estão dominados. Vamos usá-los para fechar os relatórios de estoque que o negócio pede.

**[Aula 40 — Relatórios de estoque](40-relatorios-de-estoque.md)**
