# Aula 34 — SELECT, filtros e ordenação

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** laboratório SQL + código JavaScript

---

## O que vamos construir

O **primeiro relatório do sistema**: uma lista de produtos que o usuário pode buscar, filtrar, ordenar e paginar.

```text
   GET /api/reports/products?search=cafe&sort=quantity&direction=desc&page=1
```

E, com ele, o esqueleto do módulo `reports` inteiro.

### Por que começar por aqui

Porque é o relatório mais simples que existe: **uma tabela só**. Sem `JOIN`, sem agrupamento.

Isso nos deixa concentrar em quatro coisas que valem para *todos* os relatórios seguintes:

| Peça | Problema que resolve |
|---|---|
| `WHERE` montado dinamicamente | o usuário escolhe quais filtros usar |
| `ORDER BY` seguro | ordenar sem abrir uma porta de invasão |
| `LIMIT` / `OFFSET` | não despejar 10.000 linhas na tela |
| envelope de resposta | o front sempre recebe o mesmo formato |

---

## Antes de começar

- [ ] [Aula 33](33-relatorios-mapa-do-banco.md) concluída (dados de teste carregados)
- [ ] `database/queries/relatorios-lab.sql` criado
- [ ] Terminal do MySQL aberto:

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db
```

---

## Arquivos desta aula

```text
NOVOS ARQUIVOS
└── src/modules/reports/
    ├── report-filters.js
    ├── product-report-repository.js
    ├── report-service.js
    ├── report-controller.js
    └── report-routes.js

ARQUIVOS ALTERADOS
└── src/routes/index.js
```

---

# PARTE 1 — SQL no terminal

Antes de escrever uma linha de JavaScript, vamos entender cada peça. Rode as consultas do laboratório uma a uma.

## 1. `SELECT`: escolher as colunas

### `[34.1]` O jeito preguiçoso

```sql
SELECT * FROM products;
```

Funciona, mas tem três problemas:

| Problema | Por quê |
|---|---|
| Traz dados que ninguém vai usar | tráfego e memória desperdiçados |
| Quebra quando a tabela muda | coluna nova aparece sozinha na resposta |
| **Vaza dados** | lembra do `password_hash` da [Aula 25](25-auth-validator-repository.md)? |

### `[34.2]` O jeito certo

```sql
SELECT name, sku, quantity FROM products;
```

> 📌 **Regra do projeto:** nunca `SELECT *` em código. No terminal, explorando, pode.

### `[34.3]` Apelidos com `AS`

```sql
SELECT name     AS produto,
       sku      AS codigo,
       quantity AS saldo
  FROM products;
```

```text
+---------------------------+---------+-------+
| produto                   | codigo  | saldo |
+---------------------------+---------+-------+
| Cafe em graos 1kg         | BEB-001 |    40 |
...
```

O `AS` **não** muda a tabela: muda só o nome da coluna **na resposta**.

É assim que o nosso repositório traduz `snake_case` do banco para `camelCase` do JavaScript:

```sql
minimum_stock AS minimumStock
```

### `[34.4]` Colunas que não existem

```sql
SELECT name,
       quantity,
       cost_price,
       quantity * cost_price AS valor_em_estoque
  FROM products;
```

`valor_em_estoque` **não existe na tabela**. Ela é calculada na hora, linha a linha.

```text
   quantity  ×  cost_price  =  valor_em_estoque
      40     ×     28.00    =    1120.00
      45     ×      8.90    =     400.50
```

> 💡 **Por que calcular no banco e não no JavaScript?** Porque o banco já tem os dois números na mão. Trazer as duas colunas para multiplicar em JavaScript seria tráfego a mais para o mesmo resultado. E, como vamos ver na Aula 35, isso permite **somar** o total sem trazer linha nenhuma.

---

## 2. `WHERE`: escolher as linhas

### `[34.5]` e `[34.6]` O básico

```sql
SELECT name, quantity FROM products WHERE active = TRUE;
```

```sql
SELECT name, quantity, minimum_stock
  FROM products
 WHERE active = TRUE
   AND quantity <= minimum_stock;
```

Repare: `quantity <= minimum_stock` compara **duas colunas da mesma linha**. Não é preciso saber o valor: a comparação é feita linha a linha.

### `[34.7]` e `[34.8]` `LIKE`: busca por pedaço de texto

```sql
SELECT name, sku FROM products WHERE name LIKE '%cafe%';
```

| Padrão | Encontra |
|---|---|
| `'cafe%'` | começa com "cafe" |
| `'%cafe'` | termina com "cafe" |
| `'%cafe%'` | contém "cafe" em qualquer lugar |
| `'c_fe'` | `_` = exatamente **um** caractere qualquer |

> 🔍 **Maiúsculas importam?** No MySQL com a configuração padrão, **não**: `LIKE '%cafe%'` acha "Cafe em graos". Isso depende do *collation* da coluna — em outros bancos (PostgreSQL, por exemplo) importa, e você precisaria de `ILIKE` ou `LOWER()`.

> ⚠️ **O custo escondido do `%` na frente.** `LIKE 'cafe%'` consegue usar um índice; `LIKE '%cafe%'` **não consegue** — o banco é obrigado a ler todas as linhas. Com 14 produtos é instantâneo; com 2 milhões, não. Sistemas grandes resolvem isso com índices *full-text* ou ferramentas de busca.

```sql
SELECT name, sku
  FROM products
 WHERE name LIKE '%pap%' OR sku LIKE '%PAP%';
```

Esse `OR` é exatamente o que vamos precisar: o usuário digita um texto e queremos procurar **no nome ou no código**.

> ⚠️ **Guarde para a Parte 2:** quando houver outros filtros junto, esse `OR` **precisa de parênteses**. Vamos ver por quê.

### `[34.9]` e `[34.10]` `IN` e `BETWEEN`

```sql
SELECT name, sku FROM products WHERE sku IN ('BEB-001', 'BEB-003', 'INF-003');
```

`IN` é um atalho para muitos `OR`:

```sql
-- isto...
WHERE sku IN ('A', 'B', 'C')
-- ...é o mesmo que isto
WHERE sku = 'A' OR sku = 'B' OR sku = 'C'
```

```sql
SELECT name, sale_price
  FROM products
 WHERE sale_price BETWEEN 5.00 AND 50.00
 ORDER BY sale_price;
```

`BETWEEN` **inclui as duas pontas**: `>= 5.00 AND <= 50.00`.

> ⚠️ **Guarde esta informação.** Na [Aula 41](41-relatorios-por-periodo.md) ela vai causar um bug clássico com datas. O "inclusive" do `BETWEEN` tem uma pegadinha quando o valor tem hora.

### `[34.11]` a `[34.13]` `NULL`: o valor que não é valor

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

Agora rode a `[34.13]`:

```sql
SELECT name FROM products WHERE category_id = NULL;
```

```text
Empty set (0.00 sec)
```

**Zero linhas.** Mas nós *acabamos* de ver que existe um produto com `category_id` nulo!

### 🔍 Por que `= NULL` nunca funciona

`NULL` não significa "vazio". Significa **"desconhecido"**.

```text
   NULL = NULL   ->  desconhecido ( não é verdadeiro! )
   NULL <> NULL  ->  desconhecido
   NULL > 5      ->  desconhecido
```

Pense assim: duas caixas fechadas. Elas têm o mesmo conteúdo? **Não dá para saber.** A resposta não é "sim" nem "não": é "desconhecido".

E o `WHERE` só deixa passar o que é **verdadeiro**. "Desconhecido" não passa.

| Para perguntar | Use |
|---|---|
| "é nulo?" | `IS NULL` |
| "não é nulo?" | `IS NOT NULL` |

> 📌 **Este é o erro de SQL mais comum que existe**, e o pior tipo: não dá erro, só devolve vazio. Se uma consulta sua volta sem nada e você jura que deveria ter linhas, procure um `= NULL` escondido.

---

## 3. `ORDER BY`: colocar em ordem

### `[34.14]` a `[34.16]`

```sql
SELECT name, quantity FROM products ORDER BY quantity DESC;
```

```sql
SELECT name, quantity FROM products ORDER BY quantity DESC, name ASC;
```

A segunda coluna é o **critério de desempate**. Sem ela, dois produtos com saldo 5 saem em ordem imprevisível — e pior: podem sair em ordem **diferente** a cada execução.

> ⚠️ **Isso quebra paginação.** Se a ordem muda entre uma requisição e outra, um registro pode aparecer na página 1 e na página 2, e outro em nenhuma. Por isso o nosso repositório sempre termina com `, p.id`: o `id` é único, então o desempate é definitivo.

```sql
SELECT name,
       quantity * cost_price AS valor_em_estoque
  FROM products
 WHERE active = TRUE
 ORDER BY valor_em_estoque DESC;
```

O `ORDER BY` **pode** usar o apelido de uma expressão. O `WHERE` **não pode** — e a razão vem a seguir.

### 🔍 A ordem em que o banco executa

Esta é uma das coisas mais úteis desta aula inteira. Você **escreve** numa ordem; o banco **executa** em outra:

```text
   VOCÊ ESCREVE            O BANCO EXECUTA
   ------------            ---------------
   SELECT      ─────┐      1. FROM / JOIN     (de onde vêm as linhas)
   FROM        ─────┼───►  2. WHERE           (joga linhas fora)
   WHERE       ─────┤      3. GROUP BY        (junta em grupos)
   GROUP BY    ─────┤      4. HAVING          (joga grupos fora)
   HAVING      ─────┤      5. SELECT          (calcula as colunas)
   ORDER BY    ─────┤      6. ORDER BY        (ordena)
   LIMIT       ─────┘      7. LIMIT / OFFSET  (corta o pedaço)
```

Agora tudo se explica:

| Pergunta | Resposta |
|---|---|
| Por que `ORDER BY` enxerga o apelido? | ele roda **depois** do `SELECT`, que criou o apelido |
| Por que `WHERE` **não** enxerga? | ele roda **antes** do `SELECT`; o apelido ainda não existe |
| Por que `LIMIT` não atrapalha a ordem? | ele é o **último**: ordena tudo, depois corta |

> 💡 **Cole essa tabela no caderno.** Ela vai responder 80% das dúvidas de SQL do curso inteiro.

---

## 4. `LIMIT` e `OFFSET`: paginação

### `[34.17]` e `[34.18]`

```sql
SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5;
```

```sql
SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5 OFFSET 5;
```

```text
   OFFSET 0,  LIMIT 5  ->  página 1  (registros 1 a 5)
   OFFSET 5,  LIMIT 5  ->  página 2  (registros 6 a 10)
   OFFSET 10, LIMIT 5  ->  página 3  (registros 11 a 15)

   offset = (página − 1) × tamanho_da_página
```

> ⚠️ **`LIMIT` sem `ORDER BY` não tem sentido.** "Me dê 5 linhas" sem dizer quais 5 é um pedido vago, e o banco pode devolver qualquer coisa — inclusive diferente a cada vez.

---

## 5. `DISTINCT` e `CASE`

### `[34.19]` e `[34.20]`

```sql
SELECT DISTINCT type FROM stock_movements;
```

```text
+------+
| type |
+------+
| IN   |
| OUT  |
+------+
```

Com duas colunas, `DISTINCT` traz as **combinações** únicas, não cada coluna separadamente.

### `[34.21]` `CASE`: regra de negócio virando coluna

```sql
SELECT name,
       quantity,
       minimum_stock,
       CASE
         WHEN quantity = 0                THEN 'ZERADO'
         WHEN quantity <= minimum_stock   THEN 'ABAIXO DO MINIMO'
         ELSE 'OK'
       END AS situacao
  FROM products
 WHERE active = TRUE
 ORDER BY quantity;
```

```text
+---------------------------+----------+---------------+------------------+
| name                      | quantity | minimum_stock | situacao         |
+---------------------------+----------+---------------+------------------+
| Alcool em gel 500ml       |        0 |            12 | ZERADO           |
| Teclado mecanico          |        3 |             4 | ABAIXO DO MINIMO |
| Caneta esferografica      |        5 |            25 | ABAIXO DO MINIMO |
| Cha verde 50 saches       |       45 |            15 | OK               |
...
```

`CASE` é o `if/else` do SQL. A ordem das condições **importa**: ele para na primeira que der verdadeiro.

> 🔍 **Inverta as duas primeiras linhas** e veja: um produto zerado passaria a ser classificado como "ABAIXO DO MINIMO", porque `0 <= 12` também é verdade. O caso mais específico vem sempre primeiro.

---

# PARTE 2 — Do SQL para a API

Agora que você sabe consultar, vamos levar isso para o sistema.

## 6. O caminho que a requisição vai fazer

```text
   NAVEGADOR
      │  GET /api/reports/products?search=cafe&sort=quantity&page=2
      ▼
   report-routes.js        "essa URL é minha"
      │
      ▼
   report-controller.js    lê request.query
      │
      ▼
   report-filters.js       transforma texto em filtros CONFIÁVEIS
      │
      ▼
   report-service.js       orquestra as consultas
      │
      ▼
   product-report-repository.js   monta e executa o SQL
      │
      ▼
   MySQL
```

É exatamente o mesmo desenho da [Aula 00](00-visao-geral.md), com **uma peça nova**: o `report-filters.js`.

### Por que um arquivo só para os filtros

Nos outros módulos, o validador cuidava do **corpo** da requisição (`request.body`). Aqui o que chega é a **query string** (`request.query`), e ela tem três características próprias:

| Característica | Consequência |
|---|---|
| É toda texto | `page=2` chega como `"2"`, não `2` |
| Tudo é opcional | cada filtro pode vir ou não vir |
| Parte dela vira **estrutura** do SQL | `sort` não é um valor: é um nome de coluna |

O terceiro item é o perigoso. Vamos tratá-lo com cuidado.

---

## Passo 1 — O arquivo de filtros

Crie a pasta `src/modules/reports/` e, dentro dela, `report-filters.js`.

> 📌 Esta é a **versão desta aula**. O arquivo vai crescer nas aulas 39, 40 e 41 — cada vez que um filtro novo aparecer.

```javascript
import { AppError } from "../../shared/errors/app-error.js";

// ------------------------------------------------------------------
// Peca central do modulo: transformar a query string (que e toda
// texto e vem de fora) em filtros limpos e confiaveis.
// Mesma ideia dos validators dos outros modulos.
// ------------------------------------------------------------------

const MAX_PAGE_SIZE = 200;

// LISTAS BRANCAS DE ORDENACAO
// O ? do prepared statement so funciona para VALORES.
// Nome de coluna entra no SQL por interpolacao - e interpolar
// texto do usuario e exatamente a porta da SQL injection.
// Por isso o cliente nao manda a coluna: ele manda uma CHAVE,
// e nos escolhemos o SQL correspondente.
const PRODUCT_SORT_COLUMNS = {
  name: "p.name",
  sku: "p.sku",
  quantity: "p.quantity",
  costPrice: "p.cost_price",
  salePrice: "p.sale_price",
  createdAt: "p.created_at",
};

function parseText(value, { field, maxLength = 80 }) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");

  if (text.length > maxLength) {
    throw new AppError(`O filtro ${field} deve ter no maximo ${maxLength} caracteres`);
  }

  return text;
}

function parseOptionalId(value, field) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`O filtro ${field} e invalido: ${value}`);
  }

  return id;
}

function parseSort(value, { columns, fallback }) {
  const key = String(value ?? "").trim() || fallback;

  if (!Object.hasOwn(columns, key)) {
    throw new AppError(
      `Ordenacao invalida: ${key}. Use um destes: ${Object.keys(columns).join(", ")}`
    );
  }

  // Devolve a CHAVE (para o cliente) e a COLUNA (para o SQL).
  return { key, column: columns[key] };
}

function parseDirection(value) {
  const direction = String(value ?? "asc").trim().toUpperCase();

  if (direction !== "ASC" && direction !== "DESC") {
    throw new AppError('A direcao da ordenacao deve ser "asc" ou "desc"');
  }

  return direction;
}

function parsePagination(query) {
  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? 25);

  if (!Number.isInteger(page) || page <= 0) {
    throw new AppError("O parametro page deve ser um inteiro maior que zero");
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > MAX_PAGE_SIZE) {
    throw new AppError(
      `O parametro pageSize deve ser um inteiro entre 1 e ${MAX_PAGE_SIZE}`
    );
  }

  // OFFSET: quantas linhas pular antes de comecar a devolver.
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function parseProductReportFilters(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);

  return {
    search: parseText(query.search, { field: "search" }),
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
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

---

## 7. A lista branca de ordenação — a parte mais importante da aula

Leia de novo este trecho:

```javascript
// LISTAS BRANCAS DE ORDENACAO
// O ? do prepared statement so funciona para VALORES.
// Nome de coluna entra no SQL por interpolacao - e interpolar
// texto do usuario e exatamente a porta da SQL injection.
// Por isso o cliente nao manda a coluna: ele manda uma CHAVE,
// e nos escolhemos o SQL correspondente.
const PRODUCT_SORT_COLUMNS = {
```

### O problema

Desde a [Aula 11](11-crud-categorias.md) a regra é: **todo valor que vem de fora entra no SQL por `?`**.

```javascript
await pool.query("SELECT * FROM products WHERE sku = ?", [sku]);  // seguro
```

Mas agora precisamos disto:

```sql
ORDER BY <coluna> <direção>
```

E aqui o `?` **não funciona**. Experimente mentalmente:

```javascript
await pool.query("SELECT ... ORDER BY ?", ["p.name"]);
```

O banco receberia `ORDER BY 'p.name'` — ordenando por uma **string constante**, igual para todas as linhas. Ou seja: não ordena nada.

### Por que o `?` não serve aqui

Porque o prepared statement separa **o comando** dos **dados**:

```text
   comando:  SELECT ... WHERE sku = ?        <- a ESTRUTURA, fixa
   dados:    ['BEB-001']                     <- os VALORES, variáveis
```

O nome de uma coluna faz parte da **estrutura**, não dos dados. O banco precisa conhecê-lo para montar o plano de execução.

### A saída errada

```javascript
// NUNCA FAÇA ISSO
const sql = `SELECT ... ORDER BY ${request.query.sort}`;
```

Com isso, alguém pode mandar:

```text
?sort=(SELECT password_hash FROM users LIMIT 1)
```

E, com um pouco mais de criatividade, extrair o banco inteiro — uma linha por vez, observando a ordem do resultado. É um ataque real, com nome: *SQL injection via ORDER BY*.

### A saída certa: lista branca

```javascript
const PRODUCT_SORT_COLUMNS = {
  name: "p.name",          // ← chave pública  : coluna real
  quantity: "p.quantity",
  ...
};
```

```text
   O cliente manda:   sort=quantity
                           │
                           ▼
   Nós procuramos:   PRODUCT_SORT_COLUMNS["quantity"]
                           │
                           ▼
   Vai para o SQL:   p.quantity        <- texto NOSSO, não dele
```

Se a chave não existe no objeto, **recusamos com 400**. O texto do usuário nunca chega ao SQL: ele serve apenas para **escolher** entre opções que nós escrevemos.

> 📌 **O princípio, em uma frase:** quando não dá para escapar a entrada, não aceite entrada — aceite uma **escolha**.

> 🔍 **Por que `Object.hasOwn(columns, key)` e não `columns[key]`?** Porque `columns["toString"]` devolveria uma função herdada de `Object.prototype`, e o teste passaria. `Object.hasOwn` pergunta se a chave é **do próprio objeto**. É uma defesa contra *prototype pollution*.

---

## Passo 2 — O repositório

Crie `src/modules/reports/product-report-repository.js`.

> 📌 **Versão desta aula.** O `findProducts` vai ser melhorado na [Aula 37](37-left-join.md), quando aprendermos a trazer o nome da categoria.

```javascript
import { pool } from "../../config/database.js";

// ------------------------------------------------------------------
// Relatorios centrados em PRODUTOS, CATEGORIAS e ESTOQUE.
// Aqui mora todo o SQL deste lado do modulo - e so ele.
// ------------------------------------------------------------------

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
         (p.quantity * p.cost_price) AS stockCostValue,
         (p.quantity * p.sale_price) AS stockSaleValue
`;

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

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function findProducts(filters) {
  const { where, params } = buildProductWhere(filters);

  // filters.sort.column e filters.direction NAO vem do usuario:
  // vieram da lista branca do report-filters.js. Por isso podem
  // ser interpolados sem risco.
  const [rows] = await pool.query(
    `SELECT ${PRODUCT_COLUMNS}
       FROM products p
     ${where}
     ORDER BY ${filters.sort.column} ${filters.direction}, p.id
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, filters.offset]
  );

  return rows;
}
```

E, logo abaixo, a contagem — **esta já é a versão final**:

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

> 📌 Na versão final o `countProducts` tem um `${FROM_PRODUCT}` no lugar de `FROM products p`. Por enquanto escreva `FROM products p` mesmo; na [Aula 37](37-left-join.md) trocamos os dois juntos.

Salve.

---

## 8. Dissecando o `buildProductWhere`

Esta função é o padrão que vamos repetir o módulo inteiro. Vale entendê-la bem.

### 8.1 O problema do `WHERE` variável

O usuário escolhe quais filtros usar. Então o SQL precisa ser diferente a cada requisição:

```text
   sem filtro       ->  (nenhum WHERE)
   só busca         ->  WHERE (name LIKE ? OR sku LIKE ?)
   busca + categoria->  WHERE (name LIKE ? OR sku LIKE ?) AND category_id = ?
```

### 8.2 A técnica: duas listas que andam juntas

```javascript
const conditions = [];   // os pedaços de texto do SQL
const params = [];       // os valores, na MESMA ordem dos "?"
```

Cada `if` que acrescenta uma condição **também** acrescenta os valores dela:

```javascript
conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");   // 2 interrogações
params.push(`%${filters.search}%`, `%${filters.search}%`);  // 2 valores
```

> ⚠️ **O erro número 1 deste padrão** é desencontrar as duas listas: acrescentar uma condição com dois `?` e só um valor. O MySQL reclama com algo como `Incorrect arguments to mysqld_stmt_execute`. Quando vir esse erro, conte as interrogações e conte os valores.

### 8.3 Por que os parênteses são obrigatórios

```javascript
conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
//               ^                              ^
```

Sem eles, com dois filtros ativos o SQL ficaria:

```sql
WHERE p.active = TRUE AND p.name LIKE ? OR p.sku LIKE ?
```

`AND` tem precedência maior que `OR`, então o banco lê:

```sql
WHERE (p.active = TRUE AND p.name LIKE ?) OR (p.sku LIKE ?)
```

Resultado: produtos **inativos** começam a aparecer, desde que o SKU bata. Um bug silencioso e difícil de achar.

Com os parênteses:

```sql
WHERE p.active = TRUE AND (p.name LIKE ? OR p.sku LIKE ?)
```

> 📌 **Regra:** todo `OR` dentro de um `WHERE` montado dinamicamente vai entre parênteses. Sempre.

### 8.4 O `%` fica no JavaScript, não no SQL

```javascript
conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
params.push(`%${filters.search}%`, `%${filters.search}%`);
```

Repare: o SQL tem só `LIKE ?`. Os `%` fazem parte do **valor**.

Isso continua sendo seguro: o `?` escapa o conteúdo inteiro, `%` incluído. Se o usuário digitar `%`, ele vira parte da busca, não um comando.

### 8.5 `LIMIT ? OFFSET ?` com `?`

```javascript
LIMIT ? OFFSET ?
[...params, filters.pageSize, filters.offset]
```

Aqui o `?` **funciona**, porque `LIMIT` recebe **valores**, não estrutura. Note a ordem: os parâmetros do `WHERE` vêm primeiro, depois os da paginação — a mesma ordem em que os `?` aparecem no texto.

---

## Passo 3 — O service

Crie `src/modules/reports/report-service.js`:

```javascript
import * as productRepository from "./product-report-repository.js";

// ------------------------------------------------------------------
// O service dos relatorios tem duas tarefas:
//   1. orquestrar as consultas (varias delas rodam em paralelo);
//   2. montar o envelope que o front recebe, sempre no mesmo formato.
//
// Ele continua sem saber o que e request, response ou SQL.
// ------------------------------------------------------------------

// Todo relatorio paginado devolve o mesmo envelope. Padronizar isso
// aqui evita que cada tela do front invente um jeito de ler a resposta.
function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total,
    // Math.ceil: 26 registros de 25 em 25 sao 2 paginas, nao 1,04.
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductReport(filters) {
  // As duas consultas sao independentes: nenhuma precisa
  // do resultado da outra. Promise.all roda as duas ao mesmo tempo.
  const [rows, total] = await Promise.all([
    productRepository.findProducts(filters),
    productRepository.countProducts(filters),
  ]);

  return {
    pagination: buildPagination(filters, total),
    sort: { key: filters.sort.key, direction: filters.direction.toLowerCase() },
    rows,
  };
}
```

Salve.

### 🔍 Por que duas consultas e não uma

Para montar "página 2 de 7" o front precisa de **dois** números:

| Número | De onde vem |
|---|---|
| as 25 linhas da página | `findProducts` com `LIMIT 25 OFFSET 25` |
| o total de 168 registros | `countProducts` **sem** `LIMIT` |

Não dá para obter os dois na mesma consulta justamente porque o `LIMIT` cortou o resultado. Daí as duas chamadas — e o `Promise.all`, que as executa em paralelo (o mesmo recurso do `dashboard-service.js` da [Aula 14](14-dashboard-api.md)).

### 🔍 Por que um "envelope" e não a lista crua

Poderíamos devolver só o array de produtos. Mas aí o front não saberia quantas páginas existem.

```json
{
  "pagination": { "page": 1, "pageSize": 25, "total": 12, "totalPages": 1 },
  "sort": { "key": "name", "direction": "asc" },
  "rows": [ ... ]
}
```

> 📌 **Padronizar o envelope agora economiza muito trabalho depois.** Todo relatório paginado do módulo vai ter exatamente essas três chaves — então a tela aprende a lê-las uma vez só.

---

## Passo 4 — O controller

Crie `src/modules/reports/report-controller.js`:

```javascript
import { parseProductReportFilters } from "./report-filters.js";
import * as service from "./report-service.js";

// ------------------------------------------------------------------
// O controller dos relatorios faz o de sempre: le a requisicao,
// chama o service, escreve a resposta.
// ------------------------------------------------------------------

export async function products(request, response) {
  const filters = parseProductReportFilters(request.query);
  const report = await service.getProductReport(filters);

  response.json(report);
}
```

Salve.

### 🔍 `request.query`, não `request.body`

| Onde | O que é | Exemplo |
|---|---|---|
| `request.params` | pedaços da rota | `/products/:id` → `{ id: "7" }` |
| `request.query` | depois do `?` | `?search=cafe&page=2` → `{ search: "cafe", page: "2" }` |
| `request.body` | o corpo (POST/PUT) | `{ "name": "Café" }` |

Relatório é leitura: usa `GET`, e `GET` não tem corpo. Por isso tudo vem pela query string.

> ⚠️ Repare de novo: `page` chega como `"2"`, **texto**. É o `parsePagination` que o transforma em número — e recusa se não for.

---

## Passo 5 — As rotas

Crie `src/modules/reports/report-routes.js`:

```javascript
import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./report-controller.js";

export const reportRoutes = Router();

// Todas estas rotas ja estao protegidas: o ensureAuthenticated do
// routes/index.js roda antes de qualquer uma delas (Aula 27).

// --- Relatorios de produtos e estoque ---
reportRoutes.get("/products", asyncHandler(controller.products));
```

Salve.

---

## Passo 6 — Registrar o módulo

Abra `src/routes/index.js` e acrescente **duas linhas**:

```javascript
import { Router } from "express";

import { authRoutes } from "../modules/auth/auth-routes.js";
import { categoryRoutes } from "../modules/categories/category-routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard-routes.js";
import { movementRoutes } from "../modules/movements/movement-routes.js";
import { productRoutes } from "../modules/products/product-routes.js";
import { reportRoutes } from "../modules/reports/report-routes.js";
import { ensureAuthenticated } from "../shared/auth/ensure-authenticated.js";

export const routes = Router();

// --- Rotas publicas -------------------------------------------------
routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

routes.use("/auth", authRoutes);

// --- A partir daqui, tudo exige token -------------------------------
// Este middleware roda para TODA rota declarada abaixo dele.
// A ordem das linhas neste arquivo e a regra de seguranca do sistema.
routes.use(ensureAuthenticated);

routes.use("/categories", categoryRoutes);
routes.use("/products", productRoutes);
routes.use("/movements", movementRoutes);
routes.use("/dashboard", dashboardRoutes);
routes.use("/reports", reportRoutes);
```

Salve.

### ⚠️ Repare ONDE a linha foi colocada

```javascript
routes.use(ensureAuthenticated);   // <- a tranca da Aula 27

routes.use("/categories", categoryRoutes);
routes.use("/products", productRoutes);
routes.use("/movements", movementRoutes);
routes.use("/dashboard", dashboardRoutes);
routes.use("/reports", reportRoutes);   // <- DEPOIS da tranca
```

O módulo novo nasce protegido, sem precisar de nenhum código a mais. É o benefício daquela decisão da [Aula 27](27-auth-rotas-e-middleware.md).

> 🔍 **Faça o teste:** suba a linha dos relatórios para antes do `ensureAuthenticated` e veja o relatório responder sem token. Depois desfaça. Vale ver isso acontecer uma vez.

---

## Passo 7 — Testar

```bash
docker compose restart api
docker compose logs api --tail 5
```

### Pegar o token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')
```

### Teste 1 — Sem filtro nenhum

```bash
curl -s "http://localhost:3000/api/reports/products" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "pagination": { "page": 1, "pageSize": 25, "total": 12, "totalPages": 1 },
  "sort": { "key": "name", "direction": "asc" },
  "rows": [
    { "id": 2, "name": "Agua mineral 500ml", "sku": "BEB-002", "quantity": 8, ... }
  ]
}
```

### Teste 2 a 8 — Os filtros

| # | Comando | O que provar |
|---|---|---|
| 2 | `?search=cafe` | o `LIKE` funcionando |
| 3 | `?search=PAP` | busca pelo SKU, não só pelo nome |
| 4 | `?categoryId=1` | filtro por categoria |
| 5 | `?sort=quantity&direction=desc` | ordenação |
| 6 | `?pageSize=3&page=2` | paginação |
| 7 | `?onlyActive=false` | traz também os inativos |
| 8 | `?search=cafe&sort=quantity&direction=desc&pageSize=5` | tudo junto |

```bash
curl -s "http://localhost:3000/api/reports/products?search=cafe" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/reports/products?sort=quantity&direction=desc&pageSize=3" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/reports/products?pageSize=3&page=2" -H "Authorization: Bearer $TOKEN"
```

### Teste 9 — A segurança

Este é o teste que mostra para que serviu a lista branca:

```bash
curl -i -s "http://localhost:3000/api/reports/products?sort=senha" -H "Authorization: Bearer $TOKEN"
```

```text
HTTP/1.1 400 Bad Request
{"error":"Ordenacao invalida: senha. Use um destes: name, sku, quantity, costPrice, salePrice, createdAt"}
```

E a tentativa de injeção:

```bash
curl -i -s "http://localhost:3000/api/reports/products?sort=p.name;DROP%20TABLE%20users" -H "Authorization: Bearer $TOKEN"
```

```text
HTTP/1.1 400 Bad Request
{"error":"Ordenacao invalida: p.name;DROP TABLE users. ..."}
```

🎉 **A tabela `users` continua lá.** O texto do atacante nunca chegou perto do SQL.

### Teste 10 — Os outros erros

```bash
curl -i -s "http://localhost:3000/api/reports/products?pageSize=99999" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/products?page=0" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/products?direction=talvez" -H "Authorization: Bearer $TOKEN"
curl -i -s "http://localhost:3000/api/reports/products"   # sem token
```

| Esperado | |
|---|---|
| `400` | "pageSize deve ser um inteiro entre 1 e 200" |
| `400` | "page deve ser um inteiro maior que zero" |
| `400` | 'direcao da ordenacao deve ser "asc" ou "desc"' |
| `401` | "Token nao informado" |

---

## ✅ Confira se deu certo

- [ ] `src/modules/reports/` tem os 5 arquivos
- [ ] `/api/reports/products` responde com `pagination`, `sort` e `rows`
- [ ] `?search=` filtra por nome **e** por SKU
- [ ] `?sort=` e `?direction=` mudam a ordem
- [ ] `?page=` e `?pageSize=` paginam
- [ ] `?sort=qualquercoisa` devolve `400`
- [ ] Sem token devolve `401`
- [ ] O resto do sistema continua funcionando

---

## 🔧 Erros comuns

### `{"error":"Rota nao encontrada: GET /api/reports/products"}`

Faltou `routes.use("/reports", reportRoutes);` no `src/routes/index.js`, ou o import no topo.

### `Cannot find module '.../report-filters.js'`

Erro de caminho. De dentro de `src/modules/reports/`, o caminho para `shared` é `../../shared/...` (sobe dois níveis).

### `Incorrect arguments to mysqld_stmt_execute`

O número de `?` não bate com o número de valores. Conte os dois.

> 💡 Para ver o SQL que está sendo montado, coloque temporariamente um `console.log` antes do `pool.query` e olhe `docker compose logs api`.

### `Unknown column 'p.nome' in 'order clause'`

Alguma coluna da lista branca está escrita errada. Compare `PRODUCT_SORT_COLUMNS` com o `DESCRIBE products`.

### A ordenação não muda nada

Você passou `?` no `ORDER BY`. Precisa ser interpolação (`${...}`) — e, por isso, precisa da lista branca.

### Vem sempre a lista inteira, ignorando o `search`

O `buildProductWhere` não está sendo chamado, ou o `where` não foi colocado dentro da string do SQL. Confira se o template string tem `${where}`.

### `Empty set` numa consulta que deveria ter linhas

Procure um `= NULL` escondido. Veja a seção `[34.13]`.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| `SELECT` com colunas nomeadas e `AS` | `[34.2]`, `[34.3]` |
| Expressões calculadas (`quantity * cost_price`) | `[34.4]` |
| `WHERE`, `AND`, `OR`, `LIKE`, `IN`, `BETWEEN` | `[34.5]` a `[34.10]` |
| `IS NULL` — e por que `= NULL` nunca funciona | `[34.11]` a `[34.13]` |
| `ORDER BY` com desempate | `[34.14]`, `[34.15]` |
| **A ordem de execução do SQL** | seção 3 |
| `LIMIT` / `OFFSET` e a fórmula do offset | `[34.17]`, `[34.18]` |
| `DISTINCT` e `CASE` | `[34.19]` a `[34.21]` |
| `WHERE` montado dinamicamente, com duas listas | Passo 2 |
| Parênteses obrigatórios em volta do `OR` | seção 8.3 |
| **Lista branca para `ORDER BY`** (SQL injection) | seção 7 |
| Envelope padronizado de resposta | Passo 3 |

---

## ➡️ Próximo passo

Você sabe listar. Agora vamos **resumir**: contar, somar e agrupar.

**[Aula 35 — Agregação, GROUP BY e HAVING](35-agregacao-group-by.md)**
