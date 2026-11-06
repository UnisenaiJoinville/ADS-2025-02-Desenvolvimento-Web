# Aula 38 — Vários JOINs na mesma consulta

⏱️ **Tempo estimado:** 55 minutos
📋 **Tipo:** alteração de banco + laboratório SQL + código JavaScript

---

## O que vamos construir

O relatório de movimentações **completo**, atravessando quatro tabelas:

```text
   stock_movements  ──►  products  ──►  categories
          │
          └──────────►  users
```

```json
{
  "createdAt": "2026-09-15 13:30:00",
  "productName": "Cha verde 50 saches",
  "categoryName": "Bebidas",
  "type": "OUT",
  "quantity": 20,
  "userName": "Ana Paula Souza"
}
```

### Por que precisamos disso

Duas razões, uma de cada tipo.

**A de negócio:** um histórico de estoque que não diz **quem** mexeu é inútil para auditoria. "Saíram 20 unidades em 15/09" é metade da informação.

**A técnica:** com dois `JOIN`s você escolhe o tipo de cada um por intuição e quase sempre acerta. Com quatro tabelas, errar um `INNER` esconde linhas — e esta aula mostra isso acontecendo.

### ⚠️ Uma limitação que precisa ser resolvida antes

Rode no terminal:

```sql
DESCRIBE stock_movements;
```

```text
+------------+---------------------+------+-----+-------------------+
| Field      | Type                | Null | Key | Default           |
+------------+---------------------+------+-----+-------------------+
| id         | int                 | NO   | PRI | NULL              |
| product_id | int                 | NO   | MUL | NULL              |
| type       | enum('IN','OUT')    | NO   |     | NULL              |
| quantity   | int                 | NO   |     | NULL              |
| note       | varchar(180)        | YES  |     | NULL              |
| created_at | timestamp           | NO   | MUL | CURRENT_TIMESTAMP |
+------------+---------------------+------+-----+-------------------+
```

**Não existe `user_id`.**

Desde a [Aula 27](27-auth-rotas-e-middleware.md) a API sabe quem está falando (`request.user`). Mas essa informação se perdia: não havia onde gravá-la.

> 📌 **Não dá para relatar um dado que nunca foi gravado.** O primeiro passo desta aula é uma alteração de banco — e isso é o normal: relatório novo costuma revelar que falta um campo.

---

## Antes de começar

- [ ] [Aula 37](37-left-join.md) concluída
- [ ] Containers no ar

---

## Arquivos desta aula

```text
NOVOS ARQUIVOS
└── database/migrations/
    ├── 003-movimentacoes-por-usuario.sql
    └── 003-rollback.sql

ARQUIVOS ALTERADOS
├── database/init.sql
├── src/modules/movements/
│   ├── movement-repository.js
│   ├── movement-service.js
│   └── movement-controller.js
└── src/modules/reports/
    ├── movement-report-repository.js
    └── report-filters.js
```

---

# PARTE 1 — A alteração de banco

## Passo 1 — A migração

Crie `database/migrations/003-movimentacoes-por-usuario.sql`:

```sql
-- ============================================================
-- Migracao 003 - quem registrou cada movimentacao (Aula 38)
-- ------------------------------------------------------------
-- POR QUE ESTA MIGRACAO EXISTE
-- Desde a Aula 27 o sistema sabe QUEM esta usando a API
-- (request.user). Mas essa informacao se perdia: a tabela
-- stock_movements nao tinha onde guarda-la.
--
-- Sem esta coluna, o relatorio "movimentacoes por usuario"
-- simplesmente nao pode existir - nao da para relatar um dado
-- que nunca foi gravado.
--
-- O QUE ELA FAZ
--   1. acrescenta stock_movements.user_id
--   2. liga essa coluna a tabela users (chave estrangeira)
--   3. cria o indice que o JOIN vai usar
--   4. atribui as movimentacoes recentes a um usuario
--
-- As movimentacoes antigas ficam com user_id NULL de proposito:
-- elas foram registradas ANTES de existir login, e nao da para
-- inventar um responsavel. Esse NULL e o que torna a Aula 38
-- interessante - veja o que acontece com INNER JOIN e LEFT JOIN.
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/003-movimentacoes-por-usuario.sql
--
-- PARA DESFAZER: database/migrations/003-rollback.sql
-- ============================================================


-- ------------------------------------------------------------
-- 1. A coluna
-- ------------------------------------------------------------
-- NULL e permitido: o historico anterior nao tem dono.
-- Se fosse NOT NULL, o ALTER TABLE falharia nas linhas antigas.
ALTER TABLE stock_movements
  ADD COLUMN user_id INT NULL AFTER product_id;


-- ------------------------------------------------------------
-- 2. A chave estrangeira
-- ------------------------------------------------------------
-- ON DELETE SET NULL: se um usuario for excluido, a movimentacao
-- CONTINUA existindo - ela e um fato do estoque. Perde-se apenas
-- o responsavel.
--
-- Compare com a FK de product_id, que usa ON DELETE CASCADE:
-- movimentacao de um produto que nao existe mais nao faz sentido.
ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_user
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 3. O indice
-- ------------------------------------------------------------
-- Toda coluna usada em JOIN ou em WHERE merece um indice.
-- Sem ele, filtrar por usuario varre a tabela inteira.
CREATE INDEX idx_movements_user ON stock_movements (user_id);


-- ------------------------------------------------------------
-- 4. Atribuindo responsavel as movimentacoes recentes
-- ------------------------------------------------------------
-- Dividimos entre os dois usuarios para o relatorio ter o que
-- comparar. O criterio (dia par / dia impar) e arbitrario: serve
-- so para gerar dados de teste variados.
UPDATE stock_movements m
 INNER JOIN products p ON p.id = m.product_id
   SET m.user_id = (SELECT id FROM users WHERE email = 'professor@estoquefacil.com')
 WHERE p.sku IN ('DIV-001', 'LIM-002', 'BEB-003', 'PAP-003')
   AND DAY(m.created_at) % 2 = 0;

UPDATE stock_movements m
 INNER JOIN products p ON p.id = m.product_id
   SET m.user_id = (SELECT id FROM users WHERE email = 'ana@estoquefacil.com')
 WHERE p.sku IN ('DIV-001', 'LIM-002', 'BEB-003', 'PAP-003')
   AND DAY(m.created_at) % 2 = 1;


-- ------------------------------------------------------------
-- 5. Conferencia
-- ------------------------------------------------------------
SELECT COALESCE(u.name, '(sem responsavel)') AS responsavel,
       COUNT(*)                              AS movimentacoes
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 GROUP BY u.id, u.name
 ORDER BY movimentacoes DESC;
```

Salve.

---

## 1. Lendo a migração

### 1.1 Por que a coluna aceita `NULL`

```sql
ALTER TABLE stock_movements
  ADD COLUMN user_id INT NULL AFTER product_id;
```

Tente imaginar com `NOT NULL`:

```text
   ALTER TABLE ... ADD COLUMN user_id INT NOT NULL;

   O MySQL precisa preencher as 24 linhas que já existem.
   Com qual usuário? Não existe resposta.
```

Ele preencheria com `0` — um id que não existe — e a chave estrangeira recusaria. Ou você teria que inventar um responsável para movimentações que aconteceram **antes de existir login**.

> 📌 **`NULL` aqui não é preguiça: é a verdade.** Significa literalmente "não se sabe quem foi". E essa honestidade vai virar o exemplo mais interessante da aula.

### 1.2 `ON DELETE SET NULL` vs `ON DELETE CASCADE`

Compare as duas chaves estrangeiras da mesma tabela:

```sql
-- da Aula 06
FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE

-- agora
FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
```

| Se eu apagar... | O que acontece | Por quê |
|---|---|---|
| um **produto** | as movimentações dele somem junto | movimentação de produto inexistente não faz sentido |
| um **usuário** | as movimentações **ficam**, sem responsável | a movimentação é um fato do estoque; ela aconteceu |

> 💡 **A escolha conta uma história sobre o domínio.** `CASCADE` diz "este dado só existe por causa daquele". `SET NULL` diz "este dado existe por si; aquilo era só uma informação a mais".
>
> As outras opções são `RESTRICT` (proíbe apagar enquanto houver referência) e `NO ACTION` (equivalente a `RESTRICT` no MySQL).

### 1.3 O índice

```sql
CREATE INDEX idx_movements_user ON stock_movements (user_id);
```

Toda coluna usada em `JOIN` ou em `WHERE` merece um índice. Sem ele, filtrar por usuário percorre a tabela inteira, linha a linha.

> 🔍 **Por que `product_id` não precisou de `CREATE INDEX`?** Porque o MySQL cria um índice automaticamente para toda chave estrangeira. O `user_id` também ganharia um — este `CREATE INDEX` explícito é, na prática, redundante no MySQL. Mantemos porque documenta a intenção e porque em outros bancos (PostgreSQL, por exemplo) **não** é automático.

### 1.4 `UPDATE` com `JOIN`

```sql
UPDATE stock_movements m
 INNER JOIN products p ON p.id = m.product_id
   SET m.user_id = (SELECT id FROM users WHERE email = 'professor@estoquefacil.com')
 WHERE p.sku IN ('DIV-001', 'LIM-002', 'BEB-003', 'PAP-003')
   AND DAY(m.created_at) % 2 = 0;
```

Novidade: `JOIN` não é só de `SELECT`. Aqui ele serve para **escolher quais linhas atualizar** usando uma coluna de outra tabela (`p.sku`).

E a subconsulta `(SELECT id FROM users WHERE email = ...)` descobre o id do usuário pelo e-mail — o mesmo truque da [Aula 33](33-relatorios-mapa-do-banco.md).

> 🔍 **`DAY(...) % 2 = 0` é arbitrário de propósito.** Serve só para dividir as movimentações entre os dois usuários e dar o que comparar no relatório. Em produção, quem preenche `user_id` é a aplicação, no momento do registro.

---

## Passo 2 — Rodar e conferir

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < database/migrations/003-movimentacoes-por-usuario.sql
```

```text
responsavel          movimentacoes
(sem responsavel)    12
Professor Demo        7
Ana Paula Souza       5
```

> 📌 **Guarde esses três números.** A divisão 12 / 7 / 5 é o que torna a próxima seção visível.

### Confira a estrutura

```sql
DESCRIBE stock_movements;
```

Agora existe `user_id`, logo depois de `product_id`.

---

## Passo 3 — O rollback

Crie `database/migrations/003-rollback.sql`:

```sql
-- ============================================================
-- Rollback da migracao 003 (Aula 38)
-- ------------------------------------------------------------
-- A ORDEM IMPORTA e e o contrario da ida:
--   1. a chave estrangeira (ela depende da coluna)
--   2. o indice
--   3. a coluna
--
-- Tentar apagar a coluna antes da FK da erro:
--   "Cannot drop column 'user_id': needed in a foreign key constraint"
--
-- COMO RODAR:
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/003-rollback.sql
--
-- ATENCAO: isto apaga para sempre a informacao de quem registrou
-- cada movimentacao. Nao existe como recuperar depois.
-- ============================================================

ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_user;

DROP INDEX idx_movements_user ON stock_movements;

ALTER TABLE stock_movements DROP COLUMN user_id;

DESCRIBE stock_movements;
```

Salve.

### 🔍 A ordem inversa, e por quê

```text
   IDA                           VOLTA
   ---                           -----
   1. coluna                     1. chave estrangeira
   2. chave estrangeira          2. índice
   3. índice                     3. coluna
```

Tentar apagar a coluna com a FK ainda existindo dá:

```text
ERROR 1828 (HY000): Cannot drop column 'user_id':
needed in a foreign key constraint 'fk_movements_user'
```

> ⚠️ **Este rollback destrói informação.** Diferente do rollback da Aula 33, que só apagava dados de teste, aqui você perde para sempre quem registrou cada movimentação. Rollback nem sempre é reversível — vale saber disso antes de rodar um em produção.

---

## Passo 4 — Replicar no `init.sql`

Quem instalar o projeto do zero precisa da coluna. Acrescente **no final** de `database/init.sql`:

```sql
-- ============================================================
-- Quem registrou cada movimentacao (Aula 38)
-- ------------------------------------------------------------
-- Entra como ALTER, e nao dentro do CREATE TABLE la em cima,
-- por um motivo de ordem: stock_movements e criada ANTES de
-- users neste arquivo, e uma chave estrangeira so pode apontar
-- para uma tabela que ja existe.
-- ============================================================
```

E, abaixo, **as seções 1 a 4** da migração (tudo menos a conferência final).

> 🔍 **Por que não mudar o `CREATE TABLE` lá em cima?** Porque no `init.sql` a tabela `stock_movements` é criada na Aula 06 e `users` só na Aula 24. Uma chave estrangeira precisa que a tabela de destino **já exista**. O `ALTER` no final resolve sem bagunçar a ordem que as aulas anteriores construíram.

---

# PARTE 2 — SQL no terminal

## 2. Três tabelas

### `[38.1]`

```sql
SELECT m.created_at AS data,
       p.name       AS produto,
       c.name       AS categoria,
       m.type       AS tipo,
       m.quantity   AS qtd
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
 INNER JOIN categories c ON c.id = p.category_id
 ORDER BY m.created_at DESC
 LIMIT 10;
```

### 🔍 Como ler uma cadeia de `JOIN`s

Leia **de cima para baixo**, como uma viagem:

```text
   FROM stock_movements m          "estou nas movimentações"
        │
        │ m.product_id = p.id
        ▼
   INNER JOIN products p           "pulo para o produto de cada uma"
        │
        │ p.category_id = c.id
        ▼
   INNER JOIN categories c         "e daí pulo para a categoria dele"
```

Repare que o segundo `JOIN` **não menciona** `stock_movements`. Ele liga `products` a `categories`, porque é por `products` que se chega em `categories`.

> 📌 **Cada `JOIN` se conecta ao que já está na consulta**, não necessariamente à primeira tabela. A cadeia segue o caminho das chaves estrangeiras.

---

## 3. O segundo `INNER` esconde linhas

### `[38.2]` e `[38.3]`

```sql
SELECT COUNT(*) AS com_dois_inner
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
 INNER JOIN categories c ON c.id = p.category_id;
```

```text
22
```

```sql
SELECT COUNT(*) AS total_de_movimentacoes FROM stock_movements;
```

```text
24
```

### 🔍 Duas movimentações sumiram

```text
   total de movimentações:              24
   com dois INNER JOIN:                 22
                                        ──
   perdidas:                             2
```

Quais? As da **Fita adesiva** — o produto sem categoria.

```text
   stock_movements  ──INNER──►  products   ✓ passou (todo mov. tem produto)
                                   │
                                   └──INNER──►  categories   ✗ a Fita parou aqui
```

O primeiro `INNER` é seguro (vimos na Aula 36: `product_id` é `NOT NULL` + FK). O **segundo** não é: `category_id` aceita `NULL`.

> ⚠️ **E repare no efeito colateral:** o problema não está na tabela `categories` que você queria consultar — está nas **movimentações**, que nem eram o assunto do segundo `JOIN`. Um `JOIN` lá no fim da cadeia derruba linhas do começo dela.
>
> Esse é o perigo real dos `JOIN`s encadeados: **o dano acontece longe de onde o erro foi escrito.**

### `[38.4]` A versão correta

```sql
SELECT m.created_at AS data,
       p.name       AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria,
       m.type       AS tipo,
       m.quantity   AS qtd
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
 ORDER BY m.created_at DESC
 LIMIT 10;
```

Uma palavra mudou. Agora são 24.

---

## 4. Quatro tabelas

### `[38.5]`

```sql
SELECT m.created_at AS data,
       p.name       AS produto,
       COALESCE(c.name, 'Sem categoria') AS categoria,
       m.type       AS tipo,
       m.quantity   AS qtd,
       COALESCE(u.name, 'Nao informado') AS responsavel
  FROM stock_movements m
 INNER JOIN products   p ON p.id = m.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN users      u ON u.id = m.user_id
 ORDER BY m.created_at DESC
 LIMIT 15;
```

```text
+-------+-------------------------+------------+------+-----+----------------+
| data  | produto                 | categoria  | tipo | qtd | responsavel    |
+-------+-------------------------+------------+------+-----+----------------+
| 01/10 | Cafe em graos 1kg       | Bebidas    | IN   |  50 | Nao informado  |
| 01/10 | Cafe em graos 1kg       | Bebidas    | OUT  |  10 | Nao informado  |
| 01/10 | Agua mineral 500ml      | Bebidas    | IN   |  30 | Nao informado  |
| 01/10 | Agua mineral 500ml      | Bebidas    | OUT  |  22 | Nao informado  |
| 01/10 | Detergente neutro 500ml | Limpeza    | IN   |  60 | Nao informado  |
| 01/10 | Papel A4 500 folhas     | Papelaria  | IN   |  20 | Nao informado  |
...
```

### 🔍 O desenho da consulta

```text
                    ┌──────────────┐
                    │  categories  │  LEFT  (produto pode não ter)
                    └──────▲───────┘
                           │ p.category_id
                    ┌──────┴───────┐
                    │   products   │  INNER (movimentação sempre tem)
                    └──────▲───────┘
                           │ m.product_id
                    ┌──────┴───────┐
                    │stock_movements│  ◄── a tabela principal
                    └──────┬───────┘
                           │ m.user_id
                    ┌──────▼───────┐
                    │    users     │  LEFT  (histórico antigo não tem)
                    └──────────────┘
```

**Três `JOIN`s, três decisões diferentes.** Nenhuma por acaso.

### A tabela de decisão

| `JOIN` | Tipo | Por quê |
|---|---|---|
| `products` | `INNER` | `product_id` é `NOT NULL` + FK → sempre tem par |
| `categories` | `LEFT` | `category_id` aceita `NULL` → produto órfão existe |
| `users` | `LEFT` | `user_id` aceita `NULL` → 12 movimentações antigas |

> 📌 **A regra, de uma vez:**
>
> Olhe a coluna do lado "muitos" no `ON`. Se ela é `NOT NULL` **e** tem chave estrangeira, `INNER JOIN` é seguro. Se ela aceita `NULL`, use `LEFT JOIN` — ou você vai perder linhas.
>
> Em dúvida: `DESCRIBE` na tabela e olhe a coluna `Null`.

---

## 5. O custo de errar o `JOIN` em `users`

### `[38.6]` e `[38.7]`

```sql
SELECT COUNT(*) AS sem_responsavel
  FROM stock_movements m
  LEFT JOIN users u ON u.id = m.user_id
 WHERE u.id IS NULL;
```

```text
12
```

```sql
SELECT COUNT(*) AS com_inner_em_users
  FROM stock_movements m
 INNER JOIN users u ON u.id = m.user_id;
```

```text
12
```

### 🔍 Metade do histórico, apagada do relatório

```text
   total de movimentações:      24
   com INNER JOIN em users:     12   ← METADE desapareceria
   sem responsável:             12
```

Imagine o relatório financeiro: "saíram 117 unidades este mês". Com o `INNER JOIN` errado, apareceria um número menor — e **nada na tela indicaria** que faltava alguma coisa.

> ⚠️ **É por isso que esta aula existe.** `INNER` e `LEFT` não são questão de estilo. A diferença, aqui, é metade dos dados.

---

# PARTE 3 — O código

## Passo 5 — Gravar o usuário nas novas movimentações

De nada adianta a coluna se ninguém a preencher. Três arquivos, três alterações pequenas.

### 5.1 `src/modules/movements/movement-repository.js`

**Substitua** a constante `SELECT_MOVEMENT`:

```javascript
const SELECT_MOVEMENT = `
  SELECT m.id,
         m.product_id AS productId,
         p.name       AS productName,
         p.sku        AS productSku,
         m.type,
         m.quantity,
         m.note,
         m.created_at AS createdAt,
         m.user_id    AS userId,
         COALESCE(u.name, 'Nao informado') AS userName
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
    LEFT  JOIN users    u ON u.id = m.user_id
`;
```

Na função `createWithStockUpdate`, acrescente `userId` aos parâmetros desestruturados:

```javascript
export async function createWithStockUpdate({ productId, userId, type, quantity, note }) {
```

E, dentro dela, inclua a coluna no `INSERT`:

```javascript
    const [result] = await connection.query(
      "INSERT INTO stock_movements (product_id, user_id, type, quantity, note) VALUES (?, ?, ?, ?, ?)",
      [productId, userId, type, quantity, note]
    );
```

> ⚠️ **Conte:** cinco colunas, cinco `?`, cinco valores. É o erro da Aula 34 esperando para acontecer.

### 5.2 `src/modules/movements/movement-service.js`

```javascript
// userId vem do token (request.user.id), nunca do corpo da requisicao:
// quem registrou a movimentacao e quem esta logado, e ponto.
export async function createMovement(input, userId = null) {
  const data = validateMovementInput(input);

  const result = await repository.createWithStockUpdate({ ...data, userId });

  if (result.status === "PRODUCT_NOT_FOUND") {
    throw new NotFoundError("Produto nao encontrado");
  }

  if (result.status === "INSUFFICIENT_STOCK") {
    throw new AppError(
      `Estoque insuficiente. Disponivel: ${result.available} unidade(s)`
    );
  }

  return repository.findById(result.movementId);
}
```

### 5.3 `src/modules/movements/movement-controller.js`

```javascript
export async function store(request, response) {
  // request.user foi preenchido pelo ensureAuthenticated (Aula 27).
  const movement = await service.createMovement(request.body, request.user.id);

  response.status(201).json(movement);
}
```

Salve os três.

### 🔍 Por que o `userId` NÃO vem do corpo da requisição

```javascript
// userId vem do token (request.user.id), nunca do corpo da requisicao:
// quem registrou a movimentacao e quem esta logado, e ponto.
```

Suponha que o controller fizesse:

```javascript
const movement = await service.createMovement(request.body);  // ❌ com userId dentro
```

Qualquer um poderia mandar:

```json
{ "productId": 1, "type": "OUT", "quantity": 500, "userId": 2 }
```

E a movimentação ficaria registrada no nome de **outra pessoa**. Auditoria que se forja não é auditoria.

> 📌 **Regra geral de segurança:** identidade vem **sempre** do token, nunca do corpo. É o mesmo princípio do `request.user.id` da [Aula 27](27-auth-rotas-e-middleware.md).

### 🔍 E por que `userId = null` como padrão

```javascript
export async function createMovement(input, userId = null) {
```

Para o service continuar funcionando se alguém o chamar de fora de uma requisição HTTP — por exemplo, de um script de importação. O valor padrão documenta que o campo é opcional.

---

## Passo 6 — O relatório com as quatro tabelas

Abra `src/modules/reports/movement-report-repository.js`.

**Substitua** `MOVEMENT_COLUMNS`:

```javascript
const MOVEMENT_COLUMNS = `
         m.id,
         m.type,
         m.quantity,
         m.note,
         m.created_at                      AS createdAt,
         p.id                              AS productId,
         p.name                            AS productName,
         p.sku                             AS productSku,
         c.id                              AS categoryId,
         COALESCE(c.name, 'Sem categoria') AS categoryName,
         u.id                              AS userId,
         COALESCE(u.name, 'Nao informado') AS userName,
         (CASE WHEN m.type = 'IN' THEN m.quantity ELSE -m.quantity END) AS signedQuantity
`;
```

**Substitua** `FROM_MOVEMENT`:

```javascript
// Tres JOINs, e cada um com o tipo certo pelo seu proprio motivo:
//
//   products    INNER - toda movimentacao TEM produto (NOT NULL + FK).
//                       Um INNER aqui nao descarta nada.
//   categories  LEFT  - o produto pode nao ter categoria.
//   users       LEFT  - o historico anterior a Aula 27 nao tem dono.
//
// Trocar qualquer um dos LEFT por INNER faria linhas sumirem
// silenciosamente do relatorio. Veja a Aula 38.
const FROM_MOVEMENT = `
    FROM stock_movements m
    INNER JOIN products   p ON p.id = m.product_id
    LEFT  JOIN categories c ON c.id = p.category_id
    LEFT  JOIN users      u ON u.id = m.user_id
`;
```

Salve.

### 🔍 O comentário é parte do código

```javascript
// Tres JOINs, e cada um com o tipo certo pelo seu proprio motivo:
//
//   products    INNER - toda movimentacao TEM produto (NOT NULL + FK).
//                       Um INNER aqui nao descarta nada.
//   categories  LEFT  - o produto pode nao ter categoria.
//   users       LEFT  - o historico anterior a Aula 27 nao tem dono.
//
// Trocar qualquer um dos LEFT por INNER faria linhas sumirem
// silenciosamente do relatorio. Veja a Aula 38.
```

Daqui a seis meses, alguém vai olhar `LEFT JOIN users` e pensar "isso devia ser INNER, toda movimentação tem usuário". O comentário é o que impede essa pessoa de apagar metade do relatório.

> 💡 **Comente o *porquê*, não o *o quê*.** `// faz um LEFT JOIN em users` é inútil — isso o código já diz. `// senão perdemos as 12 movimentações anteriores ao login` é o que salva.

### 🔍 O alinhamento também comunica

```sql
    INNER JOIN products   p ON p.id = m.product_id
    LEFT  JOIN categories c ON c.id = p.category_id
    LEFT  JOIN users      u ON u.id = m.user_id
```

`LEFT` com dois espaços para alinhar com `INNER`, e os apelidos em coluna. Assim a diferença entre os tipos salta aos olhos em vez de se esconder no meio do texto.

---

## Passo 7 — Os filtros novos

Em `src/modules/reports/report-filters.js`, acrescente à `MOVEMENT_SORT_COLUMNS`:

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

E, no `parseMovementReportFilters`, acrescente os dois filtros novos:

```javascript
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
    userId: parseOptionalId(query.userId, "userId"),
```

No `buildMovementWhere` do `movement-report-repository.js`, acrescente as condições:

```javascript
  if (filters.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.userId) {
    conditions.push("m.user_id = ?");
    params.push(filters.userId);
  }
```

Salve.

### 🔍 `p.category_id`, e não `c.id`

```javascript
conditions.push("p.category_id = ?");
```

As duas funcionariam. Usamos `p.category_id` porque ela está **na tabela que já temos**, sem depender do `LEFT JOIN` ter encontrado par.

> 🔍 E tem um detalhe: `c.id = ?` no `WHERE` descartaria as linhas sem categoria — a armadilha da Aula 37 de novo. Como estamos filtrando *por* uma categoria específica, o efeito seria o mesmo; mas `p.category_id` é mais direto e não depende do `JOIN`.

---

## Passo 8 — Testar

```bash
docker compose restart api
```

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')
```

### Teste 1 — As quatro tabelas

```bash
curl -s "http://localhost:3000/api/reports/movements?pageSize=1" -H "Authorization: Bearer $TOKEN"
```

Cada linha agora tem `productName`, `categoryName` **e** `userName`.

### Teste 2 — O total NÃO pode ter mudado

```bash
curl -s "http://localhost:3000/api/reports/movements?pageSize=1" -H "Authorization: Bearer $TOKEN" | grep -o '"total":[0-9]*'
```

```sql
SELECT COUNT(*) FROM stock_movements;
```

**Os dois precisam bater.** Se o relatório ficou com menos, algum `LEFT` virou `INNER`.

> 📌 Era o teste prometido no fim da [Aula 36](36-inner-join.md). Agora ele tem três `JOIN`s para vigiar.

### Teste 3 — Prove a diferença

Abra `movement-report-repository.js`, troque `LEFT JOIN users` por `INNER JOIN users`, reinicie e rode o Teste 2 de novo.

```text
   antes:  "total":24
   depois: "total":12
```

🎉 **Metade do relatório desapareceu** — e nenhuma mensagem de erro apareceu.

**Agora desfaça.**

### Teste 4 — Uma movimentação nova grava o usuário

```bash
PID=$(curl -s "http://localhost:3000/api/products?search=Cha" -H "Authorization: Bearer $TOKEN" | sed -E 's/.*"id":([0-9]+).*/\1/' | head -1)

curl -s -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"productId\":$PID,\"type\":\"IN\",\"quantity\":3,\"note\":\"teste da aula 38\"}"
```

```json
{ "id": 25, "productName": "Cha verde 50 saches", "type": "IN", "quantity": 3,
  "note": "teste da aula 38", "userId": 1, "userName": "Professor Demo" }
```

🎉 **`userId: 1`.** A informação que antes se perdia agora fica gravada.

### Teste 5 — Tentar forjar o responsável

```bash
curl -s -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"productId\":$PID,\"type\":\"IN\",\"quantity\":1,\"userId\":999,\"note\":\"tentativa\"}"
```

O `userId` do corpo é **ignorado**: a resposta vem com `userId: 1`, o do token.

### Teste 6 — Os filtros novos

```bash
curl -s "http://localhost:3000/api/reports/movements?userId=1&pageSize=3" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/reports/movements?categoryId=1&pageSize=3" -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/reports/movements?sort=user&direction=asc&pageSize=3" -H "Authorization: Bearer $TOKEN"
```

### Limpando o teste

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
  -e "DELETE FROM stock_movements WHERE note LIKE 'teste da aula 38%' OR note = 'tentativa';"
```

> ⚠️ Isso remove a movimentação, mas **não** desfaz o saldo que ela somou ao produto. Em um sistema real, nunca se apaga movimentação: registra-se um estorno. Aqui, como é dado de teste, ajuste o saldo na mão se quiser:
>
> ```sql
> UPDATE products SET quantity = quantity - 4 WHERE sku = 'BEB-003';
> ```

---

## ✅ Confira se deu certo

- [ ] `DESCRIBE stock_movements` mostra `user_id`
- [ ] A migração mostrou a divisão 12 / 7 / 5
- [ ] `database/migrations/003-rollback.sql` existe
- [ ] O `init.sql` tem o bloco do `ALTER TABLE`
- [ ] `/api/reports/movements` traz `categoryName` e `userName`
- [ ] O `total` continua igual a `SELECT COUNT(*) FROM stock_movements`
- [ ] Você **viu** o total cair para 12 ao trocar `LEFT` por `INNER` — e desfez
- [ ] Movimentação nova grava `userId`
- [ ] Mandar `userId` no corpo não muda nada
- [ ] `?userId=` e `?categoryId=` filtram
- [ ] As telas de movimentações e dashboard continuam funcionando

---

## 🔧 Erros comuns

### `ERROR 1060 (42S21): Duplicate column name 'user_id'`

A migração já rodou. Confira com `DESCRIBE stock_movements;` — se a coluna existe, siga em frente.

### `ERROR 1826: Duplicate foreign key constraint name 'fk_movements_user'`

Idem: a FK já existe. O `ALTER TABLE ... ADD CONSTRAINT` não tem `IF NOT EXISTS`.

### `ERROR 1452: Cannot add or update a child row: a foreign key constraint fails`

Você tentou gravar um `user_id` que não existe em `users`. Confira: `SELECT id, email FROM users;`

### `ERROR 1828: Cannot drop column 'user_id': needed in a foreign key constraint`

No rollback, apague a chave estrangeira **antes** da coluna.

### `Column count doesn't match value count at row 1`

O `INSERT` do `createWithStockUpdate` tem cinco colunas e quatro `?` (ou o contrário). Conte.

### `userName` vem sempre `"Nao informado"`

Duas possibilidades: ou a migração não preencheu nada, ou o `LEFT JOIN users` está faltando no `FROM_MOVEMENT`. Confira:

```sql
SELECT COUNT(*) FROM stock_movements WHERE user_id IS NOT NULL;
```

### O total do relatório caiu

Algum `LEFT` virou `INNER`. Compare com `SELECT COUNT(*) FROM stock_movements`.

### `Unknown column 'u.name' in 'field list'`

O `SELECT` usa o apelido `u`, mas o `FROM_MOVEMENT` não tem o `LEFT JOIN users u`.

### A tela de movimentações quebrou

O `SELECT_MOVEMENT` do `movement-repository.js` (módulo `movements`, não `reports`) precisa do `LEFT JOIN users` para a coluna `userName` existir.

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde apareceu |
|---|---|
| Relatório novo pode exigir **campo novo** no banco | seção de abertura |
| Coluna nova em tabela com dados precisa aceitar `NULL` | Passo 1 |
| `ON DELETE CASCADE` × `ON DELETE SET NULL` | seção 1.2 |
| Índice em coluna de `JOIN` e de `WHERE` | seção 1.3 |
| `UPDATE` com `JOIN` e com subconsulta | seção 1.4 |
| Rollback nem sempre é reversível | Passo 3 |
| Cadeia de `JOIN`s: cada um liga ao que já está na consulta | seção 2 |
| **Um `INNER` no fim da cadeia derruba linhas do começo** | seção 3 |
| A regra para escolher o tipo: a coluna aceita `NULL`? | seção 4 |
| Errar o tipo custou **metade** do histórico | seção 5 |
| **Identidade vem do token, nunca do corpo** | Passo 5 |
| Comentar o *porquê* do tipo de cada `JOIN` | Passo 6 |

---

## ➡️ Próximo passo

Você sabe juntar e sabe agregar. Agora vamos usar os dois juntos — e aí nascem os relatórios que a gerência pede.

**[Aula 39 — JOIN com agrupamento e HAVING](39-join-agrupamento-having.md)**
