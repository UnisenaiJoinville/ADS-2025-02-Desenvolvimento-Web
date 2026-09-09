# Aula 06 — Banco de dados

⏱️ **Tempo estimado:** 30 minutos
📋 **Tipo:** prática (VS Code) + teoria de modelagem

---

## Objetivo

Criar o arquivo `database/init.sql` com as três tabelas do sistema e alguns dados de exemplo, entendendo cada decisão de modelagem.

---

## Antes de começar

- [ ] Aula 05 concluída (`docker-compose.yml` criado)

---

## O que vamos modelar

Três tabelas:

```text
 categories                 products                    stock_movements
 ----------                 --------                    ---------------
 id         <-------------- category_id                 id
 name                       id           <------------- product_id
 created_at                 name                        type ('IN' ou 'OUT')
                            sku                         quantity
                            cost_price                  note
                            sale_price                  created_at
                            quantity
                            minimum_stock
                            active
                            created_at
                            updated_at
```

Leia as setas assim:

- `products.category_id` **aponta para** `categories.id` → um produto pertence a uma categoria
- `stock_movements.product_id` **aponta para** `products.id` → uma movimentação pertence a um produto

---

## Passo 1 — Criar o arquivo

No VS Code, dentro da pasta `database`, crie o arquivo `init.sql`.

> 💡 Para criar dentro de uma pasta: clique com o botão direito **sobre a pasta `database`** → **New File**.

---

## Passo 2 — O cabeçalho e a tabela `categories`

Digite:

```sql
-- ============================================================
-- Estoque Facil - estrutura inicial do banco
-- Este arquivo roda automaticamente na PRIMEIRA vez que o
-- container do MySQL e criado (pasta docker-entrypoint-initdb.d).
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

> **Comentários em SQL** começam com dois traços `--`.

### Entendendo cada coluna

| Coluna | Tipo | O que significa |
|---|---|---|
| `id` | `INT AUTO_INCREMENT PRIMARY KEY` | Número que se gera sozinho: 1, 2, 3... É a identidade da linha |
| `name` | `VARCHAR(80) NOT NULL UNIQUE` | Texto de até 80 caracteres, obrigatório e sem repetição |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Data e hora, preenchida automaticamente na inserção |

### As palavras-chave

| Palavra | O que faz |
|---|---|
| `CREATE TABLE IF NOT EXISTS` | Cria a tabela; se já existir, não dá erro |
| `PRIMARY KEY` | Identificador único da linha |
| `AUTO_INCREMENT` | O banco gera o próximo número sozinho |
| `NOT NULL` | Campo obrigatório |
| `UNIQUE` | Não pode haver dois valores iguais |
| `DEFAULT` | Valor usado quando nada é informado |

> 📌 Repare que `UNIQUE` em `name` faz **o banco** garantir que não existam duas categorias "Bebidas". Mesmo que a aplicação tenha um bug, o banco recusa. É uma segunda linha de defesa.

---

## Passo 3 — A tabela `products`

Continue no mesmo arquivo:

```sql
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(40) NOT NULL UNIQUE,
  category_id INT NULL,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE SET NULL
);
```

### As colunas explicadas

| Coluna | Para que serve |
|---|---|
| `sku` | Código único do produto (ex.: `BEB-001`). *Stock Keeping Unit* |
| `category_id` | Aponta para a categoria. Aceita `NULL` (produto sem categoria) |
| `cost_price` | Quanto pagamos ao fornecedor |
| `sale_price` | Quanto cobramos do cliente |
| `quantity` | **Saldo atual** em estoque |
| `minimum_stock` | Abaixo disso, o dashboard alerta |
| `active` | Produto ativo ou desativado |
| `updated_at` | Atualiza sozinha a cada alteração (`ON UPDATE`) |

### 💰 Decisão importante: `DECIMAL`, nunca `FLOAT`

```sql
cost_price DECIMAL(10, 2)
```

`DECIMAL(10, 2)` significa: até 10 dígitos no total, sendo 2 depois da vírgula. Ou seja, até `99.999.999,99`.

**Por que não usar `FLOAT` ou `DOUBLE`?** Porque eles são **aproximados**. Teste isso em qualquer linguagem:

```javascript
0.1 + 0.2 === 0.3   // false !!
0.1 + 0.2           // 0.30000000000000004
```

Em um sistema financeiro, esse errinho vira diferença de centavos que não fecha no balanço. `DECIMAL` guarda o valor **exato**.

> 📌 **Regra:** dinheiro é sempre `DECIMAL`. Sem exceção.

### 🔗 A chave estrangeira

```sql
CONSTRAINT fk_products_category
  FOREIGN KEY (category_id) REFERENCES categories (id)
  ON DELETE SET NULL
```

| Parte | Significado |
|---|---|
| `CONSTRAINT fk_products_category` | Dá um nome à regra (facilita ler mensagens de erro) |
| `FOREIGN KEY (category_id)` | Esta coluna é uma referência |
| `REFERENCES categories (id)` | Aponta para o `id` da tabela `categories` |
| `ON DELETE SET NULL` | Se a categoria for apagada, os produtos ficam sem categoria |

**O que a chave estrangeira garante?** Que não existirá um produto com `category_id = 999` se não houver a categoria 999. O banco simplesmente recusa.

---

## Passo 4 — A tabela `stock_movements`

```sql
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('IN', 'OUT') NOT NULL,
  quantity INT NOT NULL,
  note VARCHAR(180) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
);
```

### 🎯 `ENUM` — o tipo que só aceita o que você permitiu

```sql
type ENUM('IN', 'OUT') NOT NULL
```

Esta coluna aceita **exatamente** dois valores: `'IN'` (entrada) ou `'OUT'` (saída). Qualquer outra coisa é rejeitada pelo banco.

Lembra do problema do Módulo 1?

```javascript
ativo: "sim"   // e se alguém escrever "Sim"? "S"? "yes"? "1"?
```

O `ENUM` acaba com essa bagunça na origem.

### ⚖️ `CASCADE` x `SET NULL` — a decisão de projeto

Repare que usamos comportamentos **diferentes** nas duas tabelas. Não é por acaso:

| Situação | Regra usada | Por quê |
|---|---|---|
| Apagar uma **categoria** | `ON DELETE SET NULL` | Perder a categoria não deve fazer você perder os produtos! Eles apenas ficam "sem categoria" |
| Apagar um **produto** | `ON DELETE CASCADE` | O histórico de um produto que não existe mais não serve para nada — some junto |

> 💭 **Pergunta para a turma:** e se quiséssemos manter o histórico mesmo após apagar o produto? Aí a solução seria não apagar o produto de verdade, e sim marcá-lo como `active = false`. Isso se chama *soft delete* e está nos exercícios da Aula 22.

---

## Passo 5 — Os índices

```sql
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_movements_product ON stock_movements (product_id);
CREATE INDEX idx_movements_created_at ON stock_movements (created_at);
```

### O que é um índice?

É como o índice remissivo no fim de um livro.

| Sem índice | Com índice |
|---|---|
| Para achar "Docker", você lê o livro inteiro | Você vai ao índice, vê "Docker: pág. 84" e abre direto |

No banco é igual: sem índice, ele lê **todas** as linhas da tabela para achar o que você pediu.

### Por que estas três colunas?

Criamos índices nas colunas que vamos usar em **filtros** e **junções**:

| Índice | Usado em |
|---|---|
| `products (category_id)` | Filtrar produtos por categoria e no `JOIN` com categorias |
| `stock_movements (product_id)` | Buscar as movimentações de um produto |
| `stock_movements (created_at)` | Ordenar por data e filtrar o mês atual (dashboard) |

> ⚠️ **Índice não é de graça.** Ele acelera a leitura, mas deixa a escrita um pouco mais lenta e ocupa disco. Por isso criamos só onde há ganho real, e não em toda coluna.

---

## Passo 6 — Os dados de exemplo

Sem dados, todas as telas nascem vazias e fica difícil testar. Vamos plantar uma "loja de mentira":

```sql
-- ------------------------------------------------------------
-- Dados de exemplo para a aula
-- ------------------------------------------------------------

INSERT INTO categories (name) VALUES
  ('Bebidas'),
  ('Limpeza'),
  ('Papelaria'),
  ('Informatica');

INSERT INTO products
  (name, sku, category_id, cost_price, sale_price, quantity, minimum_stock)
VALUES
  ('Cafe em graos 1kg',      'BEB-001', 1, 28.00,  45.90, 40, 10),
  ('Agua mineral 500ml',     'BEB-002', 1,  0.90,   2.50, 8,  20),
  ('Detergente neutro 500ml','LIM-001', 2,  1.80,   3.90, 60, 15),
  ('Papel A4 500 folhas',    'PAP-001', 3, 22.00,  34.90, 12, 10),
  ('Caneta esferografica',   'PAP-002', 3,  0.70,   2.00, 5,  25),
  ('Mouse sem fio',          'INF-001', 4, 39.00,  79.90, 18,  5),
  ('Teclado mecanico',       'INF-002', 4, 180.00, 299.00, 3,  4);

INSERT INTO stock_movements (product_id, type, quantity, note) VALUES
  (1, 'IN',  50, 'Compra inicial'),
  (1, 'OUT', 10, 'Venda balcao'),
  (2, 'IN',  30, 'Compra inicial'),
  (2, 'OUT', 22, 'Venda balcao'),
  (3, 'IN',  60, 'Compra inicial'),
  (4, 'IN',  20, 'Compra inicial'),
  (4, 'OUT',  8, 'Uso interno'),
  (5, 'IN',  30, 'Compra inicial'),
  (5, 'OUT', 25, 'Venda balcao'),
  (6, 'IN',  18, 'Compra inicial'),
  (7, 'IN',   5, 'Compra inicial'),
  (7, 'OUT',  2, 'Venda balcao');
```

Salve o arquivo com `Ctrl` + `S`.

### Repare no capricho dos dados

Os números não são aleatórios — foram escolhidos para produzir situações interessantes no dashboard:

| Produto | Quantidade | Mínimo | Situação |
|---|---|---|---|
| Cafe em graos | 40 | 10 | ✅ Tranquilo |
| Agua mineral | 8 | 20 | 🔴 **Estoque baixo** |
| Caneta esferografica | 5 | 25 | 🔴 **Estoque baixo** |
| Teclado mecanico | 3 | 4 | 🔴 **Estoque baixo** |

Assim, o card de alerta do dashboard já nasce mostrando 3 produtos — e a tela fica interessante desde o primeiro dia.

> ⚠️ **Sem acentos nos dados!** Escrevemos "Cafe" e "Informatica" de propósito. Isso evita qualquer problema de codificação de caracteres entre o arquivo, o container e o navegador. Em um projeto real, você configuraria `utf8mb4` com cuidado; em sala, simplificamos.

---

## Como esse arquivo será executado

Lembra desta linha do `docker-compose.yml`?

```yaml
- ./database:/docker-entrypoint-initdb.d
```

Ela entrega nosso `init.sql` para uma pasta especial da imagem do MySQL. Quando o container do banco é criado **pela primeira vez**, ele:

1. Cria o banco `estoque_db` (por causa do `MYSQL_DATABASE`)
2. Cria o usuário `estoque` (por causa do `MYSQL_USER`)
3. **Executa todos os `.sql` da pasta**, em ordem alfabética
4. Só então libera as conexões

```text
   database/init.sql   ---->   /docker-entrypoint-initdb.d/init.sql
     (sua máquina)                    (container do MySQL)
                                              |
                                              v
                                     executado uma vez,
                                    na criação do volume
```

### ⚠️ O detalhe que confunde todo mundo

**O `init.sql` roda apenas quando o volume é criado do zero.**

Se você editar o `init.sql` depois de o banco já existir e rodar `docker compose restart`, **nada acontece**. O MySQL vê que já tem dados e pula a inicialização.

Para reprocessar o arquivo, é preciso apagar o volume:

```bash
docker compose down -v
docker compose up -d
```

> Guarde esse comando. Você vai precisar dele na Aula 10 se algo sair errado.

---

## ✅ Confira se deu certo

```bash
cat database/init.sql
```

Marque:

- [ ] O arquivo está em `database/init.sql` (dentro da pasta, não na raiz)
- [ ] Tem 3 comandos `CREATE TABLE`
- [ ] Tem 3 comandos `CREATE INDEX`
- [ ] Tem 3 comandos `INSERT INTO`
- [ ] Todo comando termina com ponto e vírgula `;`
- [ ] Os preços usam **ponto** decimal (`28.00`), não vírgula
- [ ] Não há acentos nos dados

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| Criei o arquivo na raiz | Clicou fora da pasta | Arraste para dentro de `database` no VS Code |
| Usei vírgula no preço (`28,00`) | Formato brasileiro | Em SQL o separador decimal é **ponto** |
| Esqueci o `;` no final de um comando | — | Cada comando precisa terminar com `;` |
| O nome ficou `init.sql.txt` | Extensão oculta do Windows | Renomeie no VS Code |

> 💡 Erros neste arquivo só aparecem na Aula 10, quando o banco subir. Se lá as tabelas não existirem, volte aqui e confira com calma.

---

## ➡️ Próximo passo

Banco modelado. Vamos escrever o código que lê o `.env` e conecta no MySQL.

**[Aula 07 — Configuração da aplicação](07-configuracao-da-aplicacao.md)**
