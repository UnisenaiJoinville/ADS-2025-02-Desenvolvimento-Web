# Aula 41 — Relatórios por período

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** laboratório SQL + código JavaScript

---

## O que vamos construir

O filtro mais pedido de qualquer sistema — e o que mais esconde bug:

```text
   GET /api/reports/movements?startDate=2026-05-01&endDate=2026-06-30
   GET /api/reports/movements-by-month
```

E os **totais do período**: quanto entrou, quanto saiu, qual o saldo.

### Por que precisamos disso

Nenhuma pergunta de gestão é sobre "sempre":

```text
   "quanto saiu este mês?"
   "como foi o movimento do trimestre?"
   "me dá o fechamento de setembro"
```

### O conceito

Data parece o filtro mais simples que existe. É o mais traiçoeiro — por um motivo só:

> **`created_at` não guarda uma data. Guarda um instante.**

```text
   o usuário pensa:    15/09/2026
   o banco guarda:     2026-09-15 13:30:00
```

Essa diferença de horas é a origem de um bug que aparece em produção, em silêncio, e some justamente no dia em que você vai depurar.

---

## Antes de começar

- [ ] [Aula 40](40-relatorios-de-estoque.md) concluída
- [ ] Terminal do MySQL aberto

---

## Arquivos desta aula

```text
ARQUIVOS ALTERADOS
└── src/modules/reports/
    ├── report-filters.js             (datas + ordenação completa)
    ├── movement-report-repository.js (período + relatório mensal)
    ├── report-service.js             (totais do período)
    ├── report-controller.js          (1 função nova)
    └── report-routes.js              (1 rota nova)
```

---

# PARTE 1 — SQL no terminal

## 1. O que temos para trabalhar

```sql
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       COUNT(*) AS movs,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;
```

```text
+---------+------+----------+--------+
| mes     | movs | entradas | saidas |
+---------+------+----------+--------+
| 2026-05 |    2 |       84 |      0 |
| 2026-06 |    3 |       70 |      5 |
| 2026-07 |    2 |        0 |     22 |
| 2026-08 |    2 |       20 |     16 |
| 2026-09 |    3 |        0 |     55 |
| 2026-10 |   12 |      213 |     67 |
+---------+------+----------+--------+
```

### 🔍 Por que o último mês tem muito mais

As 12 movimentações do mês atual são as **originais do `init.sql`**, que foram inseridas sem data explícita. A coluna tem `DEFAULT CURRENT_TIMESTAMP`, então todas ficaram com o instante da criação do banco.

As outras 12 são as que a [Aula 33](33-relatorios-mapa-do-banco.md) acrescentou, com datas escolhidas a dedo entre maio e setembro.

> 📌 **O seu mês atual será diferente do que está impresso aqui** — é a data em que você criou o banco. É exatamente o tipo de coisa que um relatório por período revela.

---

## 2. A armadilha

Existe uma movimentação em **2026-09-15 às 13:30**. Vamos tentar filtrá-la.

### A forma intuitiva

```sql
SELECT COUNT(*) AS encontradas
  FROM stock_movements
 WHERE created_at >= '2026-09-15'
   AND created_at <= '2026-09-15';
```

```text
+-------------+
| encontradas |
+-------------+
|           0 |
+-------------+
```

**Zero.** Mas a movimentação existe!

### 🔍 Por que zero

Quando você compara um `TIMESTAMP` com o texto `'2026-09-15'`, o MySQL completa a hora com zeros:

```text
   você escreveu:        created_at <= '2026-09-15'
   o banco entendeu:     created_at <= '2026-09-15 00:00:00'

   a movimentação está em:  2026-09-15 13:30:00

   13:30 é MAIOR que 00:00  ->  fica de fora
```

```text
   15/09
   │
   ├─ 00:00:00  ◄── até aqui o filtro pega
   │
   ├─ 13:30:00  ◄── a movimentação está AQUI (fora)
   │
   └─ 23:59:59
```

> ⚠️ **O filtro perde o dia final inteiro.** E o pior: ele *parece* funcionar. Num relatório de um mês, some um dia — e o total fecha quase certo.

### `BETWEEN` tem o mesmo problema

```sql
WHERE created_at BETWEEN '2026-09-01' AND '2026-09-15'
```

`BETWEEN` é só um atalho para `>= AND <=`. A [Aula 34](34-select-filtros-ordenacao.md) avisou que o "inclusive" dele teria uma pegadinha com datas. É esta.

---

## 3. As três soluções

### Solução A — `DATE()` em volta da coluna

```sql
WHERE DATE(created_at) BETWEEN '2026-09-01' AND '2026-09-15'
```

Funciona. **E é a pior das três.**

```text
   DATE(created_at)  ->  o banco precisa CALCULAR a coluna de cada linha
                     ->  o índice de created_at fica INÚTIL
                     ->  varredura da tabela inteira
```

> 📌 **Regra geral de banco de dados:** não aplique função na **coluna** do `WHERE`. Aplique no valor que você está comparando. Coluna "limpa" usa índice; coluna dentro de função, não.
>
> ```sql
> WHERE DATE(created_at) = '2026-09-15'        -- ❌ não usa índice
> WHERE created_at >= '2026-09-15 00:00:00'    -- ✅ usa índice
>   AND created_at <  '2026-09-16 00:00:00'
> ```

### Solução B — acrescentar a hora na mão

```sql
WHERE created_at >= '2026-09-01 00:00:00'
  AND created_at <= '2026-09-15 23:59:59'
```

Usa índice. Mas tem um furo: e um registro às `23:59:59.500`? O `TIMESTAMP` do MySQL aceita frações de segundo.

### Solução C — menor que o dia seguinte ✅

```sql
WHERE created_at >= '2026-09-15'
  AND created_at < DATE_ADD('2026-09-15', INTERVAL 1 DAY);
```

```text
+-------------+
| encontradas |
+-------------+
|           1 |
+-------------+
```

🎉 **Achou.**

```text
   >= 15/09 00:00:00   ──┐
                         ├── todo o dia 15, do primeiro ao último instante
   <  16/09 00:00:00   ──┘
```

| | Solução A | Solução B | Solução C |
|---|---|---|---|
| Acha o dia inteiro | ✅ | quase | ✅ |
| Usa índice | ❌ | ✅ | ✅ |
| À prova de frações de segundo | ✅ | ❌ | ✅ |

> 📌 **Decore o padrão:** o início do intervalo é `>=` do dia; o fim é `<` do **dia seguinte**. Nunca `<=` do dia final.

### Conferindo o intervalo

```sql
SELECT COUNT(*) AS movs,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas
  FROM stock_movements
 WHERE created_at >= '2026-05-01 00:00:00'
   AND created_at <  DATE_ADD('2026-06-30', INTERVAL 1 DAY);
```

```text
+------+----------+--------+
| movs | entradas | saidas |
+------+----------+--------+
|    5 |      154 |      5 |
+------+----------+--------+
```

Confere com a tabela da seção 1: maio (2) + junho (3) = 5 movimentações, 84 + 70 = 154 entradas.

---

# PARTE 2 — O código

## Passo 1 — Validar as datas

Abra `src/modules/reports/report-filters.js`.

Acrescente a constante, junto das outras:

```javascript
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
```

E as duas funções, junto dos outros `parse...`:

```javascript
function parseOptionalDate(value, field) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = String(value).trim();

  if (!DATE_PATTERN.test(date)) {
    throw new AppError(`O filtro ${field} deve estar no formato AAAA-MM-DD`);
  }

  // Number.isNaN(...) pega datas com cara certa mas inexistentes,
  // como 2026-02-31.
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(date)) {
    throw new AppError(`O filtro ${field} nao e uma data valida: ${date}`);
  }

  return date;
}
```

```javascript
function ensureDateOrder(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    throw new AppError("A data inicial nao pode ser maior que a data final");
  }
}
```

Salve.

### 🔍 Três camadas de validação

```javascript
if (!DATE_PATTERN.test(date)) { ... }          // 1. o formato
const parsed = new Date(`${date}T00:00:00Z`);
if (Number.isNaN(parsed.getTime()) || ...) { } // 2. a data existe?
```

| Camada | Pega |
|---|---|
| A expressão regular | `31/05/2026`, `ontem`, `2026-5-1` |
| `Number.isNaN` | datas impossíveis |
| A comparação final | o caso traiçoeiro abaixo |

### 🔍 O caso traiçoeiro

```javascript
if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(date))
```

Por que não basta o `isNaN`? Porque o JavaScript **conserta** datas inválidas em silêncio:

```javascript
new Date("2026-02-31T00:00:00Z").toISOString()
// "2026-03-03T00:00:00.000Z"   ← virou 3 de março!
```

Ele não reclama: ele "ajuda". Então comparamos o resultado com o que foi digitado. Se não começa igual, a data foi corrigida — ou seja, não existia.

```text
   digitado:   2026-02-31
   resultado:  2026-03-03
   começa com "2026-02-31"?  NÃO  ->  recusa
```

> 💡 **Esse é um bug clássico de formulário.** Sem essa checagem, o usuário pede o relatório de 31 de fevereiro e recebe, sem aviso, o de 3 de março.

### 🔍 Por que `T00:00:00Z`

```javascript
new Date(`${date}T00:00:00Z`)
```

O `Z` força **UTC**. Sem ele, o JavaScript interpreta no fuso do servidor, e `new Date("2026-09-15")` pode virar 14/09 às 21:00 em São Paulo.

> ⚠️ **Fuso horário é a segunda maior fonte de bug com datas**, perdendo só para a hora do `TIMESTAMP`. Aqui usamos a data só para validar o formato, então fixar UTC resolve. Num sistema que atende vários fusos, isso vira um capítulo inteiro.

### 🔍 Comparar datas como texto

```javascript
if (startDate && endDate && startDate > endDate) {
```

`"2026-09-01" > "2026-05-01"` funciona **porque o formato `AAAA-MM-DD` ordena alfabeticamente igual a cronologicamente**.

```text
   AAAA-MM-DD   "2026-05-01" < "2026-09-01"   ✅
   DD/MM/AAAA   "01/09/2026" < "01/05/2026"?  ❌ (compara o dia primeiro)
```

É mais um motivo para usar o formato ISO internamente.

---

## Passo 2 — Os filtros completos

**Substitua** a `MOVEMENT_SORT_COLUMNS`:

```javascript
const MOVEMENT_SORT_COLUMNS = {
  date: "m.created_at",
  product: "p.name",
  category: "categoryName",
  user: "userName",
  type: "m.type",
  quantity: "m.quantity",
};
```

E **substitua** o `parseMovementReportFilters`:

```javascript
export function parseMovementReportFilters(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);

  const startDate = parseOptionalDate(query.startDate, "startDate");
  const endDate = parseOptionalDate(query.endDate, "endDate");

  ensureDateOrder(startDate, endDate);

  return {
    productId: parseOptionalId(query.productId, "productId"),
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
    userId: parseOptionalId(query.userId, "userId"),
    type: parseChoice(query.type, {
      field: "type",
      allowed: MOVEMENT_TYPES,
      fallback: null,
    }),
    startDate,
    endDate,
    sort: parseSort(query.sort, { columns: MOVEMENT_SORT_COLUMNS, fallback: "date" }),
    direction: parseDirection(query.direction ?? "desc"),
    page,
    pageSize,
    offset,
  };
}
```

Salve.

### 🔍 O filtro `type` reaproveita o `parseChoice`

```javascript
type: parseChoice(query.type, {
  field: "type",
  allowed: MOVEMENT_TYPES,
  fallback: null,
}),
```

A função que a [Aula 40](40-relatorios-de-estoque.md) escreveu para situação de estoque serve aqui sem uma linha de mudança.

### 🔍 As duas colunas novas de ordenação

```javascript
  category: "categoryName",
  user: "userName",
```

São apelidos criados pelo `MOVEMENT_COLUMNS` da [Aula 38](38-multiplos-joins.md). Ordenar por eles só funciona porque os `JOIN`s com `categories` e `users` estão lá.

---

## Passo 3 — As condições de período

Abra `src/modules/reports/movement-report-repository.js` e **substitua** o `buildMovementWhere`:

```javascript
function buildMovementWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.productId) {
    conditions.push("m.product_id = ?");
    params.push(filters.productId);
  }

  if (filters.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.userId) {
    conditions.push("m.user_id = ?");
    params.push(filters.userId);
  }

  if (filters.type) {
    conditions.push("m.type = ?");
    params.push(filters.type);
  }

  // A ARMADILHA DA DATA COM HORA
  // created_at e TIMESTAMP: guarda data E hora.
  // "created_at <= '2026-09-15'" significa "<= 2026-09-15 00:00:00",
  // ou seja, perde o dia 15 inteiro.
  // Por isso o fim do intervalo e "< dia seguinte", e nao "<= dia".
  if (filters.startDate) {
    conditions.push("m.created_at >= ?");
    params.push(`${filters.startDate} 00:00:00`);
  }

  if (filters.endDate) {
    conditions.push("m.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(filters.endDate);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}
```

Salve.

### 🔍 O comentário que vale mais que o código

```javascript
// A ARMADILHA DA DATA COM HORA
// created_at e TIMESTAMP: guarda data E hora.
// "created_at <= '2026-09-15'" significa "<= 2026-09-15 00:00:00",
// ou seja, perde o dia 15 inteiro.
// Por isso o fim do intervalo e "< dia seguinte", e nao "<= dia".
```

Daqui a um ano, alguém vai olhar `< DATE_ADD(?, INTERVAL 1 DAY)` e pensar "que complicação, isso devia ser `<=`". O comentário é o que impede essa pessoa de reintroduzir o bug.

### 🔍 O `DATE_ADD` fica no SQL, o parâmetro é só a data

```javascript
conditions.push("m.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
params.push(filters.endDate);
```

Repare: a função está na parte **fixa** do SQL; o `?` recebe só o valor `'2026-06-30'`.

Daria para somar o dia em JavaScript e mandar `'2026-07-01'` pronto. Deixamos no SQL por dois motivos: a intenção fica visível na consulta, e o banco cuida de meses com 28, 30 ou 31 dias e de anos bissextos sem nenhuma conta nossa.

### 🔍 `'${filters.startDate} 00:00:00'` — por que explicitar

```javascript
conditions.push("m.created_at >= ?");
params.push(`${filters.startDate} 00:00:00`);
```

Sem a hora, o MySQL completaria com `00:00:00` de qualquer forma. Escrevemos para **documentar**: quem lê o código vê que o início do dia é intencional, não acidente.

---

## Passo 4 — Os totais do período

Acrescente ao repositório:

```javascript
// Totais da selecao inteira (nao da pagina).
export async function sumMovements(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0) AS unitsOut
     ${FROM_MOVEMENT}
     ${where}`,
    params
  );

  return rows[0];
}
```

E **substitua** o `getMovementReport` no `report-service.js`:

```javascript
export async function getMovementReport(filters) {
  const [rows, total, totals] = await Promise.all([
    movementRepository.findMovements(filters),
    movementRepository.countMovements(filters),
    movementRepository.sumMovements(filters),
  ]);

  const unitsIn = Number(totals.unitsIn);
  const unitsOut = Number(totals.unitsOut);

  return {
    pagination: buildPagination(filters, total),
    totals: { unitsIn, unitsOut, balance: unitsIn - unitsOut },
    sort: { key: filters.sort.key, direction: filters.direction.toLowerCase() },
    rows,
  };
}
```

Salve.

### 🔍 `balance`: a pergunta que o usuário realmente faz

```javascript
return {
  pagination: buildPagination(filters, total),
  totals: { unitsIn, unitsOut, balance: unitsIn - unitsOut },
  ...
};
```

"Entraram 154, saíram 5" é informação. **"O estoque cresceu 149 unidades no período"** é a resposta.

---

## Passo 5 — O relatório mensal

Acrescente ao repositório:

```javascript
// Agrupamento por mes. DATE_FORMAT transforma a data numa chave
// de texto ('2026-09'), e o GROUP BY junta tudo que cair nela.
export async function getMovementsByMonth(filters) {
  const { where, params } = buildMovementWhere(filters);

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(m.created_at, '%Y-%m') AS period,
            COUNT(*)                                                              AS movementCount,
            COALESCE(SUM(CASE WHEN m.type = 'IN'  THEN m.quantity ELSE 0 END), 0) AS unitsIn,
            COALESCE(SUM(CASE WHEN m.type = 'OUT' THEN m.quantity ELSE 0 END), 0) AS unitsOut,
            COUNT(DISTINCT m.product_id)                                          AS productCount
     ${FROM_MOVEMENT}
     ${where}
     GROUP BY period
     ORDER BY period`,
    params
  );

  return rows.map((row) => ({
    ...row,
    movementCount: Number(row.movementCount),
    unitsIn: Number(row.unitsIn),
    unitsOut: Number(row.unitsOut),
    productCount: Number(row.productCount),
    balance: Number(row.unitsIn) - Number(row.unitsOut),
  }));
}
```

No `report-service.js`:

```javascript
export async function getMovementsByMonth(filters) {
  return movementRepository.getMovementsByMonth(filters);
}
```

No `report-controller.js`:

```javascript
export async function movementsByMonth(request, response) {
  const filters = parseMovementReportFilters(request.query);
  const rows = await service.getMovementsByMonth(filters);

  response.json(rows);
}
```

E em `report-routes.js`:

```javascript
reportRoutes.get("/movements-by-month", asyncHandler(controller.movementsByMonth));
```

Salve tudo.

### 🔍 `GROUP BY period` usando o apelido

```sql
SELECT DATE_FORMAT(m.created_at, '%Y-%m') AS period,
       ...
 GROUP BY period
```

O MySQL aceita agrupar pelo apelido. Em SQL padrão você repetiria o `DATE_FORMAT` inteiro no `GROUP BY`.

### 🔍 Por que `'%Y-%m'` e não um nome de mês

Já vimos na [Aula 35](35-agregacao-group-by.md): `2026-09` ordena corretamente como texto. A tradução para "set/2026" é trabalho do front-end.

> 💡 **A regra geral:** a API devolve dados em formato **de máquina**; a tela traduz para formato **de gente**. Isso mantém a API útil para o CSV, para outro sistema e para um gráfico, não só para a nossa tela.

### 🔍 A normalização fica no repositório, desta vez

```javascript
return rows.map((row) => ({
  ...row,
  movementCount: Number(row.movementCount),
  ...
  balance: Number(row.unitsIn) - Number(row.unitsOut),
}));
```

Nos outros relatórios quem converte é o service. Aqui está no repositório, e o service só repassa.

> 🔍 **Isso é uma inconsistência pequena do nosso código**, e vale apontá-la em vez de esconder: o ideal seria escolher um lugar e manter. Fica como exercício da [Aula 45](45-subqueries-e-relatorios-avancados.md): mover essa conversão para o service, como nas outras.

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

### Teste 1 — A armadilha, provada pela API

```bash
curl -s "http://localhost:3000/api/reports/movements?startDate=2026-09-15&endDate=2026-09-15" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
```

```text
"total":1
```

🎉 **Um dia só, e ele encontrou a movimentação das 13:30.**

> 🔍 **Prove ao contrário:** troque `< DATE_ADD(?, INTERVAL 1 DAY)` por `<= ?` no repositório, reinicie e rode de novo. O total vira **0**. Depois desfaça.
>
> Esse é o bug que chega ao cliente: o relatório do dia volta vazio e ninguém sabe por quê.

### Teste 2 — Um intervalo

```bash
curl -s "http://localhost:3000/api/reports/movements?startDate=2026-05-01&endDate=2026-06-30" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"totals":{[^}]*}'
```

```json
"totals":{"unitsIn":154,"unitsOut":5,"balance":149}
```

Confere com o SQL da seção 3.

### Teste 3 — O relatório mensal

```bash
curl -s "http://localhost:3000/api/reports/movements-by-month" -H "Authorization: Bearer $TOKEN"
```

```json
[
  { "period": "2026-05", "movementCount": 2, "unitsIn": 84,  "unitsOut": 0,  "productCount": 2, "balance": 84 },
  { "period": "2026-06", "movementCount": 3, "unitsIn": 70,  "unitsOut": 5,  "productCount": 3, "balance": 65 },
  { "period": "2026-07", "movementCount": 2, "unitsIn": 0,   "unitsOut": 22, "productCount": 2, "balance": -22 },
  { "period": "2026-08", "movementCount": 2, "unitsIn": 20,  "unitsOut": 16, "productCount": 2, "balance": 4 },
  { "period": "2026-09", "movementCount": 3, "unitsIn": 0,   "unitsOut": 55, "productCount": 3, "balance": -55 },
  { "period": "2026-10", "movementCount": 12, "unitsIn": 213, "unitsOut": 67, "productCount": 7, "balance": 146 }
]
```

### Teste 4 — Período + outros filtros

```bash
# só as saídas do período
curl -s "http://localhost:3000/api/reports/movements?startDate=2026-07-01&endDate=2026-09-30&type=OUT" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"totals":{[^}]*}'

# o mensal também respeita o período
curl -s "http://localhost:3000/api/reports/movements-by-month?startDate=2026-06-01&endDate=2026-08-31" \
  -H "Authorization: Bearer $TOKEN"

# e por usuário
curl -s "http://localhost:3000/api/reports/movements-by-user?startDate=2026-05-01&endDate=2026-07-31" \
  -H "Authorization: Bearer $TOKEN"
```

> 🔍 **Repare:** os três usam o **mesmo** `buildMovementWhere`. O filtro de período apareceu de graça em todos os relatórios de movimentação. É o retorno de ter centralizado a construção do `WHERE` lá na Aula 36.

### Teste 5 — Os erros

```bash
curl -i -s "http://localhost:3000/api/reports/movements?startDate=31/05/2026" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/movements?startDate=2026-02-31" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/movements?startDate=2026-09-01&endDate=2026-05-01" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/movements?startDate=ontem" -H "Authorization: Bearer $TOKEN"
```

| Esperado | |
|---|---|
| `400` | "O filtro startDate deve estar no formato AAAA-MM-DD" |
| `400` | "O filtro startDate nao e uma data valida: 2026-02-31" |
| `400` | "A data inicial nao pode ser maior que a data final" |
| `400` | formato inválido |

### Teste 6 — Só uma ponta

```bash
# tudo a partir de setembro
curl -s "http://localhost:3000/api/reports/movements?startDate=2026-09-01&pageSize=1" -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'

# tudo até agosto
curl -s "http://localhost:3000/api/reports/movements?endDate=2026-08-31&pageSize=1" -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
```

Os dois precisam funcionar: o `buildMovementWhere` trata as pontas de forma independente.

---

## ✅ Confira se deu certo

- [ ] `?startDate=2026-09-15&endDate=2026-09-15` traz **1** movimentação
- [ ] Você **viu** o total virar 0 ao trocar por `<= ?` — e desfez
- [ ] `?startDate=2026-05-01&endDate=2026-06-30` dá `unitsIn: 154`
- [ ] `/api/reports/movements-by-month` lista os meses em ordem
- [ ] O período funciona também em `movements-by-user` e `top-products`
- [ ] Só `startDate` funciona; só `endDate` também
- [ ] `31/05/2026` devolve `400`
- [ ] `2026-02-31` devolve `400`
- [ ] Data inicial maior que a final devolve `400`

---

## 🔧 Erros comuns

### O relatório de um dia volta vazio

A armadilha. Use `< DATE_ADD(?, INTERVAL 1 DAY)`, nunca `<= ?`.

### O relatório do mês perde o último dia

A mesma armadilha, mais difícil de notar: só falta um dia em trinta.

### `2026-02-31` passa e o relatório sai de março

Faltou a terceira checagem do `parseOptionalDate`. Veja o Passo 1.

### A consulta ficou lenta

Procure `DATE(created_at)` ou `YEAR(created_at)` no `WHERE`. Função na coluna inutiliza o índice.

> 💡 Para confirmar: ponha `EXPLAIN` na frente da consulta. Se a coluna `key` vier `NULL`, nenhum índice foi usado.

### `Incorrect DATETIME value: 'ontem'`

Faltou validar o formato antes de mandar para o banco.

### O filtro de data funciona em um relatório e não em outro

Algum relatório não está usando o `buildMovementWhere`. Confira.

### Os meses vêm fora de ordem

Faltou o `ORDER BY period`, ou o formato não é `'%Y-%m'`.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| `TIMESTAMP` guarda **instante**, não data | seção 2 |
| `<= 'data'` significa `<= 'data 00:00:00'` | seção 2 |
| `BETWEEN` herda o mesmo problema | seção 2 |
| **Função na coluna inutiliza o índice** | seção 3 |
| O padrão `>= dia` e `< dia seguinte` | seção 3 |
| `DATE_ADD(?, INTERVAL 1 DAY)` | Passo 3 |
| O JavaScript "conserta" datas inválidas em silêncio | Passo 1 |
| `T00:00:00Z` para fixar o fuso | Passo 1 |
| `AAAA-MM-DD` ordena como texto e como data | Passo 1 |
| API em formato de máquina, tela em formato de gente | Passo 5 |
| Um `buildWhere` central = filtro novo em todos os relatórios | Teste 4 |

---

## ➡️ Próximo passo

O back-end dos relatórios está completo. Hora de dar uma cara a ele.

**[Aula 42 — A tela de relatórios em Vue](42-tela-relatorios-vue.md)**
