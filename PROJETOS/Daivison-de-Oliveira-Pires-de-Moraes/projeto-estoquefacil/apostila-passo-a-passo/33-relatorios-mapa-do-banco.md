# Aula 33 — Módulo de relatórios: o mapa do banco

⏱️ **Tempo estimado:** 40 minutos
📋 **Tipo:** teórica + laboratório SQL (nenhum código JavaScript ainda)

---

## Objetivo

Abrir um bloco novo do curso. Até aqui o sistema **guardava** dados; a partir de agora ele vai **responder perguntas** sobre eles.

Nesta aula você vai:

- entender o que é um módulo de relatórios e por que ele é diferente de um CRUD;
- aprender a **ler o banco** que você mesmo construiu, usando o próprio SQL;
- preparar dados de teste que tornam visíveis as diferenças entre os tipos de `JOIN`;
- montar o laboratório SQL que vamos usar nas aulas 34 a 39.

---

## Antes de começar

- [ ] Aulas 00 a 32 concluídas (sistema completo, com login funcionando)
- [ ] Containers no ar: `docker compose ps` mostra os dois `Up`
- [ ] Você consegue entrar em `http://localhost:3000/login.html`

---

## 1. O que é um módulo de relatórios

Pare um instante e compare duas frases:

| | O que o usuário quer |
|---|---|
| **CRUD** (aulas 11 a 13) | "cadastre este produto", "apague esta categoria" |
| **Relatório** | "**quanto** dinheiro eu tenho parado em estoque?" |

A diferença não é de tela, é de natureza:

```text
   CRUD                          RELATÓRIO
   ----                          ---------
   muda o banco                  só lê o banco
   uma linha por vez             muitas linhas de uma vez
   uma tabela por vez            várias tabelas juntas
   a resposta é "ok, gravei"     a resposta é um número ou uma lista
```

### Por que isso importa para o nosso código

Um relatório **não tem `INSERT`, `UPDATE` nem `DELETE`**. Ele é só `SELECT`.

Isso parece uma limitação e é exatamente o contrário: como ele não muda nada, podemos fazer consultas pesadas, cruzar tabelas e experimentar à vontade, sem medo de quebrar dado nenhum.

> 💡 **Esse é o espírito desta etapa.** Nas próximas 6 aulas você vai escrever muito SQL direto no terminal, errar bastante e não estragar nada.

### Onde isso já apareceu

Você já construiu um relatório sem saber: o **dashboard** da [Aula 14](14-dashboard-api.md). Ele soma, agrupa e cruza tabelas.

A diferença é que lá nós **usamos** os recursos sem explicá-los. Agora vamos entender cada um — e você vai poder voltar ao `dashboard-repository.js` e ler cada linha com outros olhos.

---

## 2. O mapa do banco

Antes de consultar, é preciso saber o que existe. Este é o desenho que vamos usar o bloco inteiro:

```text
        categories                        users
        ----------                        -----
        id (PK)                           id (PK)
        name                              name
        created_at                        email
             ^                            password_hash
             |                            active
             | category_id                     ^
             |                                 |
        products                               | user_id
        --------                               |
        id (PK)                                |
        name                                   |
        sku  (único)                           |
        category_id (FK) ---------┘            |
        cost_price                             |
        sale_price                             |
        quantity        <- saldo atual         |
        minimum_stock                          |
        active                                 |
             ^                                 |
             | product_id                      |
             |                                 |
        stock_movements                        |
        ---------------                        |
        id (PK)                                |
        product_id (FK) ----------┘            |
        user_id (FK) -------------------------─┘   (vamos criar na Aula 38)
        type ('IN' ou 'OUT')
        quantity
        note
        created_at
```

### Como ler este desenho

A regra é sempre a mesma:

> **Quem tem a chave estrangeira é quem aponta.**

| Frase em português | Como aparece no banco |
|---|---|
| Um produto **pertence a** uma categoria | `products.category_id` → `categories.id` |
| Uma categoria **tem vários** produtos | (nada na tabela `categories`) |
| Uma movimentação **pertence a** um produto | `stock_movements.product_id` → `products.id` |

Repare que a tabela `categories` **não tem** nenhuma coluna apontando para produtos. O relacionamento mora **só de um lado** — o lado "muitos".

```text
      UM                         MUITOS
   categoria   ------------<   produtos
                            ^
                            a chave estrangeira fica aqui
```

> 📌 **Essa assimetria é a origem de quase toda confusão com JOIN.** Guarde-a: para ir de produto para categoria o caminho é direto (`p.category_id`); para ir de categoria para produtos, você precisa procurar quem aponta de volta.

---

## 3. O terminal SQL é o nosso laboratório

Daqui até a Aula 41 vamos escrever SQL **primeiro no terminal** e só depois no JavaScript.

### Por quê nessa ordem

```text
   SQL no terminal           SQL dentro do Node
   ---------------           ------------------
   erro aparece na hora      erro vira log do container
   resultado em tabela       resultado em JSON cru
   testa em 2 segundos       precisa reiniciar o servidor
```

Debugar SQL dentro do JavaScript é lento e confuso. A consulta vai para o código **depois** de já estar funcionando.

### Abrindo o terminal

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db
```

Você deve ver:

```text
Welcome to the MySQL monitor.  Commands end with ; or \g.
...
mysql>
```

> ⚠️ **Não esqueça o `;`** no final de cada comando. Sem ele, o MySQL fica esperando e mostra `->`, achando que você vai continuar digitando. Se isso acontecer, digite `;` e dê Enter.

| Comando | O que faz |
|---|---|
| `exit` ou `\q` | sai do terminal |
| `\c` | cancela o comando que você está digitando |
| `comando\G` | mostra o resultado em lista, não em tabela |

---

## Passo 1 — Conhecendo o banco pelo próprio SQL

Com o terminal aberto, rode um de cada vez:

```sql
SHOW TABLES;
```

```text
+----------------------+
| Tables_in_estoque_db |
+----------------------+
| categories           |
| products             |
| stock_movements      |
| users                |
+----------------------+
```

```sql
DESCRIBE products;
```

```text
+---------------+---------------+------+-----+-------------------+
| Field         | Type          | Null | Key | Default           |
+---------------+---------------+------+-----+-------------------+
| id            | int           | NO   | PRI | NULL              |
| name          | varchar(120)  | NO   |     | NULL              |
| sku           | varchar(40)   | NO   | UNI | NULL              |
| category_id   | int           | YES  | MUL | NULL              |
| cost_price    | decimal(10,2) | NO   |     | 0.00              |
...
```

### 🔍 A coluna `Key` conta a história das chaves

| Valor | Significa |
|---|---|
| `PRI` | chave **primária** — identifica a linha |
| `UNI` | **único** — não pode repetir |
| `MUL` | pode repetir; é o começo de um índice (aqui, a chave estrangeira) |

E a coluna `Null` em `category_id` diz `YES`: **um produto pode não ter categoria**. Guarde essa informação — ela é o motivo de metade das aulas 36 e 37.

### O mapa das chaves estrangeiras, direto do banco

O MySQL guarda a descrição dele mesmo numa base chamada `information_schema`. Dá para perguntar a ela quem aponta para quem:

```sql
SELECT TABLE_NAME        AS tabela,
       COLUMN_NAME       AS coluna,
       REFERENCED_TABLE_NAME  AS aponta_para,
       REFERENCED_COLUMN_NAME AS coluna_destino
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = 'estoque_db'
   AND REFERENCED_TABLE_NAME IS NOT NULL
 ORDER BY tabela, coluna;
```

```text
+-----------------+-------------+-------------+----------------+
| tabela          | coluna      | aponta_para | coluna_destino |
+-----------------+-------------+-------------+----------------+
| products        | category_id | categories  | id             |
| stock_movements | product_id  | products    | id             |
+-----------------+-------------+-------------+----------------+
```

🎉 **É o nosso desenho, gerado pelo próprio banco.** Essa consulta funciona em qualquer projeto MySQL — guarde-a para quando você pegar um banco que não conhece.

> 📌 Repare que `stock_movements` ainda **não** aponta para `users`. Vamos criar essa ligação na [Aula 38](38-multiplos-joins.md), quando precisarmos dela de verdade.

---

## 4. O problema dos dados "bem comportados demais"

Rode isto:

```sql
SELECT 'produtos sem categoria'    AS situacao, COUNT(*) AS total
  FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'categorias sem produto', COUNT(*)
  FROM categories c
 WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
UNION ALL
SELECT 'produtos sem movimentacao', COUNT(*)
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);
```

Se o seu banco é o original das aulas anteriores, o resultado é **zero em tudo**.

E isso é um problema — **didático**, não técnico.

### Por que zero é um problema

Existem dois tipos de `JOIN` que vamos estudar:

| | O que faz |
|---|---|
| `INNER JOIN` | só traz o que tem par dos **dois** lados |
| `LEFT JOIN` | traz tudo da esquerda, **mesmo sem par** à direita |

Agora repare: se **todo** produto tem categoria, os dois devolvem exatamente o mesmo resultado.

```text
   dados sem exceções          dados com exceções
   ------------------          ------------------
   INNER = 12 linhas           INNER = 11 linhas
   LEFT  = 12 linhas           LEFT  = 12 linhas
         ^                            ^
   diferença invisível          a diferença aparece
```

A aula ficaria assim: "existem dois tipos de JOIN, confie em mim que são diferentes". Péssimo.

### A solução: criar as exceções de propósito

Vamos acrescentar ao banco, **de propósito**, os casos que faltam:

| Exceção | Qual registro | Para que serve |
|---|---|---|
| categoria **sem** produto | `Ferramentas` | `LEFT JOIN` a partir de categorias |
| produto **sem** categoria | `DIV-001` Fita adesiva | diferença entre `INNER` e `LEFT` |
| produto **sem** movimentação | `INF-003` Cabo HDMI | `LEFT JOIN ... IS NULL` |
| produto com estoque **zerado** | `LIM-002` Álcool em gel | relatório de situação de estoque |
| produto **abaixo do mínimo** | `PAP-003` Bloco de notas | idem |
| histórico em **5 meses** | maio a setembro | relatórios por período |
| um **segundo usuário** | Ana Paula Souza | movimentações por responsável |

> 📌 **Essa é uma habilidade real, não um truque de aula.** Testar software com dados perfeitos esconde bugs. Os dados que quebram o sistema são os de borda: o nulo, o zero, o vazio, o repetido.

---

## Passo 2 — Criar o arquivo de dados de teste

Crie `database/migrations/002-dados-relatorios.sql`:

```sql
-- ============================================================
-- Migracao 002 - dados de apoio para o modulo de relatorios
--                (Aula 33)
-- ------------------------------------------------------------
-- POR QUE ESTA MIGRACAO EXISTE
-- Os dados que o projeto ja tinha sao "bem comportados demais":
-- todo produto tem categoria, toda categoria tem produto e todo
-- produto tem movimentacao. Com dados assim, INNER JOIN e
-- LEFT JOIN devolvem SEMPRE o mesmo resultado - e a diferenca
-- entre os dois, que e o coracao das aulas 36 e 37, fica invisivel.
--
-- Entao acrescentamos, de proposito, as excecoes:
--   1. uma categoria SEM nenhum produto  -> 'Ferramentas'
--   2. um produto SEM categoria          -> 'DIV-001' (category_id NULL)
--   3. um produto SEM movimentacao       -> 'INF-003'
--   4. um produto com estoque ZERADO     -> 'LIM-002'
--   5. um produto ABAIXO do minimo       -> 'PAP-003'
--   6. historico espalhado por 5 meses   -> relatorios por periodo
--   7. um segundo usuario                -> relatorios por usuario
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/002-dados-relatorios.sql
--
-- Pode ser executado mais de uma vez sem duplicar nada.
--
-- PARA DESFAZER: veja database/migrations/002-rollback.sql
-- ============================================================


-- ------------------------------------------------------------
-- 1. Categoria sem nenhum produto
-- ------------------------------------------------------------
-- O name e UNIQUE, entao INSERT IGNORE basta para nao duplicar.
INSERT IGNORE INTO categories (name) VALUES ('Ferramentas');


-- ------------------------------------------------------------
-- 2. Produtos novos
-- ------------------------------------------------------------
-- O sku e UNIQUE, entao INSERT IGNORE tambem resolve aqui.

-- Produto SEM categoria: category_id fica NULL de proposito.
INSERT IGNORE INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
VALUES
  ('Fita adesiva transparente', 'DIV-001', NULL, 2.50, 6.90, 24, 10, TRUE);

-- Os demais precisam do id da categoria, que descobrimos pelo nome.
INSERT IGNORE INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock, active)
SELECT d.name, d.sku, c.id, d.cost_price, d.sale_price, d.quantity, d.minimum_stock, TRUE
  FROM (
          SELECT 'Cabo HDMI 2m'              AS name, 'INF-003' AS sku, 'Informatica' AS category,
                 12.00 AS cost_price, 29.90 AS sale_price, 15 AS quantity,  5 AS minimum_stock
    UNION SELECT 'Alcool em gel 500ml',            'LIM-002',       'Limpeza',
                  4.20,        9.90,       0,        12
    UNION SELECT 'Cha verde 50 saches',            'BEB-003',       'Bebidas',
                  8.90,       19.90,      45,        15
    UNION SELECT 'Bloco de notas adesivas',        'PAP-003',       'Papelaria',
                  3.40,        8.50,       7,        20
       ) d
  INNER JOIN categories c ON c.name = d.category;


-- ------------------------------------------------------------
-- 3. Historico de movimentacoes espalhado por varios meses
-- ------------------------------------------------------------
-- Repare que o produto INF-003 (Cabo HDMI) NAO aparece aqui:
-- ele foi cadastrado com saldo inicial 15 e nunca foi movimentado.
-- E justamente ele que vai sumir do INNER JOIN na Aula 37.
--
-- As quantidades fecham com o saldo de cada produto:
--   DIV-001:  +40 -16              = 24
--   LIM-002:  +24 -24              =  0
--   BEB-003:  +60 -5 -10 +20 -20   = 45
--   PAP-003:  +30 -12 -11          =  7
--
-- O NOT EXISTS no final garante que rodar o script duas vezes
-- nao duplique as linhas: (produto + data) ja identifica a linha.
INSERT INTO stock_movements (product_id, type, quantity, note, created_at)
SELECT p.id, d.type, d.quantity, d.note, d.created_at
  FROM (
          SELECT 'DIV-001' AS sku, 'IN'  AS type, 40 AS quantity,
                 'Compra trimestral'      AS note, '2026-06-10 09:15:00' AS created_at
    UNION SELECT 'DIV-001',        'OUT', 16, 'Venda balcao',        '2026-08-14 15:40:00'

    UNION SELECT 'LIM-002',        'IN',  24, 'Compra inicial',      '2026-05-20 08:30:00'
    UNION SELECT 'LIM-002',        'OUT', 24, 'Consumo interno',     '2026-09-02 11:05:00'

    UNION SELECT 'BEB-003',        'IN',  60, 'Compra inicial',      '2026-05-08 10:00:00'
    UNION SELECT 'BEB-003',        'OUT',  5, 'Venda balcao',        '2026-06-19 14:20:00'
    UNION SELECT 'BEB-003',        'OUT', 10, 'Venda balcao',        '2026-07-23 16:45:00'
    UNION SELECT 'BEB-003',        'IN',  20, 'Reposicao',           '2026-08-11 09:50:00'
    UNION SELECT 'BEB-003',        'OUT', 20, 'Venda corporativa',   '2026-09-15 13:30:00'

    UNION SELECT 'PAP-003',        'IN',  30, 'Compra inicial',      '2026-06-02 08:10:00'
    UNION SELECT 'PAP-003',        'OUT', 12, 'Uso interno',         '2026-07-18 10:25:00'
    UNION SELECT 'PAP-003',        'OUT', 11, 'Uso interno',         '2026-09-09 17:00:00'
       ) d
  INNER JOIN products p ON p.sku = d.sku
 WHERE NOT EXISTS (
         SELECT 1
           FROM stock_movements m
          WHERE m.product_id = p.id
            AND m.created_at = d.created_at
       );


-- ------------------------------------------------------------
-- 4. Um segundo usuario
-- ------------------------------------------------------------
-- Senha em texto puro: "123456" (o que esta gravado e o HASH).
-- Serve para os relatorios de movimentacoes por usuario (Aula 38).
INSERT IGNORE INTO users (name, email, password_hash) VALUES
  ('Ana Paula Souza',
   'ana@estoquefacil.com',
   '$2b$10$iQHvaAxA22NsuZUXJGsXwO5JIjSkDwbJpKm.h7s32PwLIiUrd6TJq');


-- ------------------------------------------------------------
-- 5. Conferencia
-- ------------------------------------------------------------
SELECT 'categorias'                AS indicador, COUNT(*) AS total FROM categories
UNION ALL
SELECT 'produtos',                  COUNT(*) FROM products
UNION ALL
SELECT 'movimentacoes',             COUNT(*) FROM stock_movements
UNION ALL
SELECT 'usuarios',                  COUNT(*) FROM users
UNION ALL
SELECT 'produtos sem categoria',    COUNT(*) FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'categorias sem produto',    COUNT(*) FROM categories c
 WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
UNION ALL
SELECT 'produtos sem movimentacao', COUNT(*) FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);
```

Salve.

---

## 5. Lendo o arquivo de dados

Três técnicas aparecem aqui. Nenhuma é óbvia.

### 5.1 `INSERT IGNORE` e a idempotência

```sql
INSERT IGNORE INTO categories (name) VALUES ('Ferramentas');
```

`name` é `UNIQUE`. Sem o `IGNORE`, rodar o script duas vezes daria erro de chave duplicada. Com ele, o MySQL pula a linha em silêncio.

Lembra da [Aula 24](24-tabela-usuarios.md)? Isso torna o script **idempotente**: rodar uma ou dez vezes dá no mesmo.

### 5.2 Descobrir o id pelo nome

Os produtos precisam do `id` da categoria — e nós não sabemos qual é, porque é `AUTO_INCREMENT`.

```sql
INSERT IGNORE INTO products (name, sku, category_id, ...)
SELECT d.name, d.sku, c.id, ...
  FROM ( SELECT 'Cabo HDMI 2m' AS name, 'INF-003' AS sku, 'Informatica' AS category, ...
         UNION SELECT ... ) d
  INNER JOIN categories c ON c.name = d.category;
```

Em vez de `INSERT ... VALUES`, usamos `INSERT ... SELECT`: os valores **vêm de uma consulta**.

E essa consulta já usa um `INNER JOIN` — exatamente o que vamos estudar na Aula 36. Por ora, leia assim: "para cada linha da minha lista, ache a categoria com aquele nome e use o id dela".

> 🔍 **Não se preocupe em entender tudo agora.** Este arquivo você roda, não digita de cabeça. Na Aula 39 volte aqui e releia: vai estar transparente.

### 5.3 O `NOT EXISTS` que evita duplicar movimentações

`stock_movements` não tem nenhuma coluna única — nada impede duas linhas idênticas. Então `INSERT IGNORE` não ajuda.

```sql
 WHERE NOT EXISTS (
         SELECT 1
           FROM stock_movements m
          WHERE m.product_id = p.id
            AND m.created_at = d.created_at
       );
```

Lê-se: "insira **só se** ainda não existir uma movimentação deste produto nesta data e hora".

A dupla (produto + data/hora) é única o bastante para servir de identificador.

### 5.4 Por que as contas fecham

```sql
--   DIV-001:  +40 -16              = 24
--   LIM-002:  +24 -24              =  0
--   BEB-003:  +60 -5 -10 +20 -20   = 45
--   PAP-003:  +30 -12 -11          =  7
```

Lembra da [Aula 13](13-movimentacoes-transacoes.md)? `products.quantity` e o histórico de `stock_movements` precisam **sempre bater**.

Se eu inventasse movimentações sem fazer a conta, o banco passaria a mentir — e todo relatório construído em cima dele mentiria junto.

### 5.5 A exceção que parece erro e não é

O produto `INF-003` (Cabo HDMI) tem **saldo 15 e nenhuma movimentação**. Isso não contradiz o parágrafo acima?

Não. Olhe o formulário de produtos da [Aula 17](17-front-produtos.md): ele tem um campo **quantidade**. Cadastrar um produto já com saldo inicial é um caminho legítimo do sistema.

> 💡 Então o Cabo HDMI conta uma história real: "entrou no cadastro com 15 unidades e nunca mais ninguém mexeu nele". É exatamente o tipo de produto que um relatório de "estoque parado" precisa encontrar.

---

## Passo 3 — Rodar a migração

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < database/migrations/002-dados-relatorios.sql
```

### ✅ O que você deve ver

```text
indicador                   total
categorias                  5
produtos                    12
movimentacoes               24
usuarios                    2
produtos sem categoria      1
categorias sem produto      1
produtos sem movimentacao   1
```

> 📌 **Seus números podem ser maiores.** Se você cadastrou produtos de teste nas aulas anteriores, eles continuam lá — e devem continuar. O que importa é que as **três últimas linhas sejam no mínimo 1**.
>
> Os números que esta apostila mostra daqui em diante são de um banco recém-criado. Use-os como referência, não como gabarito exato.

### Rode de novo, para provar

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < database/migrations/002-dados-relatorios.sql
```

Os números são **os mesmos**. Nada duplicou. É a idempotência funcionando.

---

## Passo 4 — O arquivo de rollback

Toda alteração de banco precisa ter volta. Crie `database/migrations/002-rollback.sql`:

```sql
-- ============================================================
-- Rollback da migracao 002 (Aula 33)
-- ------------------------------------------------------------
-- Desfaz exatamente o que o 002-dados-relatorios.sql criou,
-- sem tocar em nenhum dado das aulas anteriores.
--
-- COMO RODAR:
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/002-rollback.sql
--
-- A ORDEM IMPORTA: apagamos primeiro quem APONTA para alguem.
--   movimentacoes -> produtos -> categorias
-- Tentar apagar um produto que ainda tem movimentacoes daria erro
-- de chave estrangeira... na verdade nao, porque a FK de
-- stock_movements foi criada com ON DELETE CASCADE: o MySQL
-- apagaria as movimentacoes junto. Fazemos na mao mesmo assim,
-- para a intencao ficar explicita.
-- ============================================================

DELETE m
  FROM stock_movements m
 INNER JOIN products p ON p.id = m.product_id
 WHERE p.sku IN ('DIV-001', 'INF-003', 'LIM-002', 'BEB-003', 'PAP-003');

DELETE FROM products
 WHERE sku IN ('DIV-001', 'INF-003', 'LIM-002', 'BEB-003', 'PAP-003');

-- So apaga a categoria se ela realmente estiver vazia.
DELETE FROM categories
 WHERE name = 'Ferramentas'
   AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = categories.id);

DELETE FROM users WHERE email = 'ana@estoquefacil.com';

SELECT 'produtos'      AS tabela, COUNT(*) AS total FROM products
UNION ALL
SELECT 'movimentacoes',           COUNT(*) FROM stock_movements
UNION ALL
SELECT 'categorias',              COUNT(*) FROM categories
UNION ALL
SELECT 'usuarios',                COUNT(*) FROM users;
```

Salve.

### 🔍 Por que a ordem importa

```sql
DELETE m FROM stock_movements m INNER JOIN products p ... -- 1. movimentações
DELETE FROM products WHERE sku IN (...)                   -- 2. produtos
DELETE FROM categories WHERE name = 'Ferramentas'         -- 3. categorias
```

Apagamos de **quem aponta** para **quem é apontado**. É a ordem inversa da criação.

> 🔍 **Teste em sala:** rode o rollback, confira que os produtos sumiram, e rode a migração de novo. Esse é o ciclo que um time de verdade usa toda semana.

---

## Passo 5 — Replicar no `init.sql`

A migração resolve **o seu** banco. Mas quem clonar o projeto amanhã e rodar `docker compose up` pela primeira vez não tem esses dados.

Abra `database/init.sql` e acrescente **no final**:

```sql
-- ============================================================
-- Dados de apoio do modulo de relatorios (Aula 33)
-- ------------------------------------------------------------
-- As excecoes que tornam INNER JOIN e LEFT JOIN visivelmente
-- diferentes: categoria sem produto, produto sem categoria,
-- produto sem movimentacao, estoque zerado e historico de
-- varios meses. O mesmo conteudo esta em
-- database/migrations/002-dados-relatorios.sql, para quem ja
-- tinha o banco criado.
-- ============================================================
```

E, logo abaixo, **copie os blocos 1 a 4** do arquivo `002-dados-relatorios.sql` (tudo, menos a seção 5, que é só conferência).

> 💡 **Por que a duplicação?** Porque os dois arquivos respondem a perguntas diferentes:
>
> | Arquivo | Pergunta |
> |---|---|
> | `init.sql` | "como o banco **nasce**?" |
> | `migrations/002-...` | "como levo um banco **que já existe** até lá?" |
>
> Em projetos grandes existem ferramentas que geram um a partir do outro. Aqui, manter os dois na mão deixa a diferença visível.

---

## Passo 6 — O caderno de laboratório

Crie `database/queries/relatorios-lab.sql`. Ele vai nos acompanhar até a Aula 35:

```sql
-- ============================================================
-- Estoque Facil - laboratorio de SQL dos relatorios
-- Aulas 33 a 35
-- ------------------------------------------------------------
-- Este arquivo NAO roda sozinho. E um caderno: voce copia uma
-- consulta por vez e cola no terminal do MySQL.
--
-- Para abrir o terminal:
--   docker compose exec db mysql -uestoque -pestoque123 estoque_db
--
-- Dica: termine com \G em vez de ; para ver o resultado em
-- formato de lista, uma coluna por linha. Ajuda quando a
-- consulta tem muitas colunas.
-- ============================================================


-- ############################################################
-- AULA 33 - CONHECENDO O BANCO
-- ############################################################

-- [33.1] Quais tabelas existem
SHOW TABLES;

-- [33.2] Como e a tabela products
DESCRIBE products;

-- [33.3] O SQL que criou a tabela, com chaves e indices
SHOW CREATE TABLE products\G

-- [33.4] Quem aponta para quem (o mapa das chaves estrangeiras)
SELECT TABLE_NAME        AS tabela,
       COLUMN_NAME       AS coluna,
       REFERENCED_TABLE_NAME  AS aponta_para,
       REFERENCED_COLUMN_NAME AS coluna_destino
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = 'estoque_db'
   AND REFERENCED_TABLE_NAME IS NOT NULL
 ORDER BY tabela, coluna;

-- [33.5] Quantas linhas tem cada tabela
SELECT 'categories' AS tabela, COUNT(*) AS linhas FROM categories
UNION ALL SELECT 'products',       COUNT(*) FROM products
UNION ALL SELECT 'stock_movements',COUNT(*) FROM stock_movements
UNION ALL SELECT 'users',          COUNT(*) FROM users;

-- [33.6] As excecoes que os dados de teste criaram
SELECT 'produtos sem categoria'    AS situacao, COUNT(*) AS total
  FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'categorias sem produto', COUNT(*)
  FROM categories c
 WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)
UNION ALL
SELECT 'produtos sem movimentacao', COUNT(*)
  FROM products p
 WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);


-- ############################################################
-- AULA 34 - SELECT, WHERE E ORDER BY
-- ############################################################

-- [34.1] Tudo de todo mundo (nunca use isto num sistema real)
SELECT * FROM products;

-- [34.2] So as colunas que interessam
SELECT name, sku, quantity FROM products;

-- [34.3] Apelidos (AS) dao nome de saida as colunas
SELECT name     AS produto,
       sku      AS codigo,
       quantity AS saldo
  FROM products;

-- [34.4] Expressao calculada: a coluna que nao existe na tabela
SELECT name,
       quantity,
       cost_price,
       quantity * cost_price AS valor_em_estoque
  FROM products;

-- [34.5] WHERE: so os produtos ativos
SELECT name, quantity FROM products WHERE active = TRUE;

-- [34.6] Varias condicoes com AND
SELECT name, quantity, minimum_stock
  FROM products
 WHERE active = TRUE
   AND quantity <= minimum_stock;

-- [34.7] LIKE: busca por pedaco de texto ( % = qualquer coisa )
SELECT name, sku FROM products WHERE name LIKE '%cafe%';

-- [34.8] LIKE em duas colunas, com OR entre elas
SELECT name, sku
  FROM products
 WHERE name LIKE '%pap%' OR sku LIKE '%PAP%';

-- [34.9] IN: pertence a esta lista?
SELECT name, sku FROM products WHERE sku IN ('BEB-001', 'BEB-003', 'INF-003');

-- [34.10] BETWEEN: dentro deste intervalo (inclusive nas duas pontas)
SELECT name, sale_price
  FROM products
 WHERE sale_price BETWEEN 5.00 AND 50.00
 ORDER BY sale_price;

-- [34.11] IS NULL: o produto sem categoria
SELECT name, sku, category_id FROM products WHERE category_id IS NULL;

-- [34.12] IS NOT NULL: o contrario
SELECT COUNT(*) AS com_categoria FROM products WHERE category_id IS NOT NULL;

-- [34.13] A armadilha: isto NUNCA devolve nada
SELECT name FROM products WHERE category_id = NULL;

-- [34.14] ORDER BY: do maior saldo para o menor
SELECT name, quantity FROM products ORDER BY quantity DESC;

-- [34.15] ORDER BY com desempate
SELECT name, quantity FROM products ORDER BY quantity DESC, name ASC;

-- [34.16] ORDER BY usando o apelido de uma expressao
SELECT name,
       quantity * cost_price AS valor_em_estoque
  FROM products
 WHERE active = TRUE
 ORDER BY valor_em_estoque DESC;

-- [34.17] LIMIT: so os 5 primeiros
SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5;

-- [34.18] LIMIT + OFFSET: a "pagina 2", pulando os 5 primeiros
SELECT name, quantity FROM products ORDER BY quantity DESC LIMIT 5 OFFSET 5;

-- [34.19] DISTINCT: valores sem repeticao
SELECT DISTINCT type FROM stock_movements;

-- [34.20] DISTINCT em duas colunas = combinacoes unicas
SELECT DISTINCT category_id, active FROM products ORDER BY category_id;

-- [34.21] CASE: traduzir uma regra de negocio em coluna
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


-- ############################################################
-- AULA 35 - AGREGACAO, GROUP BY E HAVING
-- ############################################################

-- [35.1] COUNT(*): quantas linhas
SELECT COUNT(*) AS total_de_produtos FROM products;

-- [35.2] COUNT(coluna) ignora NULL - compare os tres numeros
SELECT COUNT(*)           AS linhas,
       COUNT(category_id) AS com_categoria,
       COUNT(*) - COUNT(category_id) AS sem_categoria
  FROM products;

-- [35.3] COUNT(DISTINCT ...): quantos valores diferentes
SELECT COUNT(DISTINCT category_id) AS categorias_em_uso FROM products;

-- [35.4] SUM: somar
SELECT SUM(quantity) AS unidades_em_estoque FROM products WHERE active = TRUE;

-- [35.5] SUM de uma expressao: o dinheiro parado no estoque
SELECT SUM(quantity * cost_price) AS valor_de_custo,
       SUM(quantity * sale_price) AS valor_de_venda
  FROM products
 WHERE active = TRUE;

-- [35.6] AVG, MIN e MAX
SELECT AVG(sale_price) AS preco_medio,
       MIN(sale_price) AS mais_barato,
       MAX(sale_price) AS mais_caro
  FROM products
 WHERE active = TRUE;

-- [35.7] ROUND: AVG devolve casas decimais demais
SELECT ROUND(AVG(sale_price), 2) AS preco_medio FROM products WHERE active = TRUE;

-- [35.8] Tudo junto: o cartao de resumo do estoque
SELECT COUNT(*)                            AS produtos,
       SUM(quantity)                       AS unidades,
       ROUND(SUM(quantity * cost_price), 2) AS valor_custo,
       ROUND(AVG(cost_price), 2)           AS custo_medio,
       MIN(sale_price)                     AS menor_preco,
       MAX(sale_price)                     AS maior_preco
  FROM products
 WHERE active = TRUE;

-- [35.9] GROUP BY: de uma linha so para uma linha POR GRUPO
SELECT category_id,
       COUNT(*)      AS produtos,
       SUM(quantity) AS unidades
  FROM products
 WHERE active = TRUE
 GROUP BY category_id;

-- [35.10] GROUP BY com ORDER BY no resultado agregado
SELECT category_id,
       COUNT(*)                            AS produtos,
       ROUND(SUM(quantity * cost_price), 2) AS valor_custo
  FROM products
 WHERE active = TRUE
 GROUP BY category_id
 ORDER BY valor_custo DESC;

-- [35.11] GROUP BY no tipo da movimentacao
SELECT type,
       COUNT(*)      AS lancamentos,
       SUM(quantity) AS unidades
  FROM stock_movements
 GROUP BY type;

-- [35.12] HAVING: filtrar DEPOIS de agrupar
SELECT category_id,
       COUNT(*) AS produtos
  FROM products
 WHERE active = TRUE
 GROUP BY category_id
HAVING COUNT(*) >= 3;

-- [35.13] A diferenca entre WHERE e HAVING, lado a lado
--   WHERE  joga fora LINHAS antes de agrupar
--   HAVING joga fora GRUPOS depois de agrupar
SELECT category_id,
       COUNT(*)      AS produtos,
       SUM(quantity) AS unidades
  FROM products
 WHERE active = TRUE          -- linha por linha
 GROUP BY category_id
HAVING SUM(quantity) > 20     -- grupo por grupo
 ORDER BY unidades DESC;

-- [35.14] Isto da ERRO: funcao de agregacao nao cabe no WHERE
SELECT category_id FROM products WHERE SUM(quantity) > 20 GROUP BY category_id;

-- [35.15] GROUP BY por mes, usando DATE_FORMAT
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       COUNT(*)      AS movimentacoes,
       SUM(quantity) AS unidades
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;

-- [35.16] Entradas e saidas na MESMA linha, com SUM + CASE
SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS saidas,
       SUM(CASE WHEN type = 'IN'  THEN quantity ELSE -quantity END) AS saldo
  FROM stock_movements
 GROUP BY mes
 ORDER BY mes;
```

Salve.

> 💡 **Como usar:** não rode o arquivo inteiro. Ele é um caderno — você copia uma consulta por vez para o terminal. Os marcadores `[33.1]`, `[34.7]` etc. são as referências que as apostilas vão citar.

---

## Passo 7 — Testar o laboratório

Abra o terminal e rode a consulta `[33.5]`:

```sql
SELECT 'categories' AS tabela, COUNT(*) AS linhas FROM categories
UNION ALL SELECT 'products',       COUNT(*) FROM products
UNION ALL SELECT 'stock_movements',COUNT(*) FROM stock_movements
UNION ALL SELECT 'users',          COUNT(*) FROM users;
```

```text
+-----------------+--------+
| tabela          | linhas |
+-----------------+--------+
| categories      |      5 |
| products        |     12 |
| stock_movements |     24 |
| users           |      2 |
+-----------------+--------+
```

### 🔍 `UNION ALL`: empilhar resultados

Repare no que essa consulta faz: são **quatro** consultas diferentes, uma embaixo da outra.

```text
   UNION ALL cola resultados VERTICALMENTE (acrescenta linhas)
   JOIN      cola resultados HORIZONTALMENTE (acrescenta colunas)
```

Para empilhar, as consultas precisam ter o **mesmo número de colunas**, na mesma ordem e com tipos compatíveis. Os nomes das colunas vêm da primeira.

| | O que faz |
|---|---|
| `UNION` | empilha e **remove** as linhas repetidas (mais lento) |
| `UNION ALL` | empilha e mantém tudo |

> 📌 Use `UNION ALL` por padrão. Só troque para `UNION` quando você **precisar** eliminar repetições — vamos ver um caso na Aula 37.

---

## ✅ Confira se deu certo

- [ ] `SHOW TABLES;` lista as 4 tabelas
- [ ] A consulta do `information_schema` mostra as 2 chaves estrangeiras
- [ ] `database/migrations/002-dados-relatorios.sql` existe e rodou
- [ ] `database/migrations/002-rollback.sql` existe
- [ ] `database/queries/relatorios-lab.sql` existe
- [ ] "produtos sem categoria", "categorias sem produto" e "produtos sem movimentacao" são **todos ≥ 1**
- [ ] Rodar a migração duas vezes não muda os números
- [ ] O sistema continua funcionando em `http://localhost:3000`

---

## 🔧 Se deu erro

### `ERROR 1046 (3D000): No database selected`

Você abriu o MySQL sem dizer qual banco. Use:

```sql
USE estoque_db;
```

Ou abra já com o nome: `docker compose exec db mysql -uestoque -pestoque123 estoque_db`

### O prompt virou `->` e não sai disso

Falta o `;`. Digite `;` e Enter. Se travou de vez, `\c` cancela.

### `ERROR 1062 (23000): Duplicate entry ... for key 'products.sku'`

Você já tem um produto com esse SKU. Confira:

```sql
SELECT id, name, sku FROM products WHERE sku IN ('DIV-001','INF-003','LIM-002','BEB-003','PAP-003');
```

Se for um produto seu, renomeie o SKU dele ou ajuste o da migração.

### `The input device is not a TTY`

Faltou o `-T` no `docker compose exec`. Ele é obrigatório quando você usa `<`.

### "produtos sem movimentacao" deu 0

A migração inseriu o `INF-003`, mas alguém já o movimentou. Confira:

```sql
SELECT p.sku, COUNT(m.id) AS movs
  FROM products p LEFT JOIN stock_movements m ON m.product_id = p.id
 WHERE p.sku = 'INF-003' GROUP BY p.sku;
```

### Quero voltar tudo ao estado anterior

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < database/migrations/002-rollback.sql
```

---

## 📚 O que aprendemos nesta etapa

| Conceito | Onde usamos |
|---|---|
| Relatório é **só leitura** | a natureza do módulo novo |
| Ler o esquema com `DESCRIBE` e `SHOW CREATE TABLE` | Passo 1 |
| Descobrir relacionamentos pelo `information_schema` | Passo 1 |
| "Quem tem a FK é quem aponta" | o mapa do banco |
| `UNION ALL` empilha; `JOIN` alarga | Passo 7 |
| Migração **idempotente** com `INSERT IGNORE` e `NOT EXISTS` | Passo 2 |
| Toda migração precisa de **rollback** | Passo 4 |
| Dados de borda revelam o que dados perfeitos escondem | seção 4 |

---

## ➡️ Próximo passo

Com o mapa na mão e os dados prontos, vamos escrever a primeira consulta de verdade — e o primeiro endpoint do módulo.

**[Aula 34 — SELECT, filtros e ordenação](34-select-filtros-ordenacao.md)**
