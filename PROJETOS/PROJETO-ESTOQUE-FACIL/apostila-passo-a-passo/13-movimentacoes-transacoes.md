# Aula 13 — Movimentações e Transações ⭐

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática + conceito fundamental

---

## Objetivo

Fazer o estoque **somar** nas entradas e **subtrair** nas saídas, garantindo que o sistema **nunca** fique inconsistente.

> ⭐ **Esta é a aula mais importante do curso do ponto de vista de backend.** O conceito de transação aparece em qualquer sistema sério: banco, e-commerce, folha de pagamento.

---

## Antes de começar

- [ ] Aula 12 concluída (CRUD de produtos funcionando)

---

## O problema

Quando registramos uma saída de 5 unidades, precisamos fazer **duas** gravações:

```text
   1. INSERT em stock_movements   ->  "saíram 5 unidades hoje"
   2. UPDATE em products          ->  "agora o saldo é 25"
```

### E se algo falhar no meio?

```text
   1. INSERT em stock_movements   ✅ gravou
                                       |
                              💥 queda de energia
                              💥 conexão caiu
                              💥 erro no código
                                       |
   2. UPDATE em products          ❌ não gravou
```

**Resultado:** o histórico diz que saíram 5 unidades, mas o estoque continua cheio. O sistema passou a **mentir**.

E o pior: ninguém percebe na hora. O erro só aparece semanas depois, quando o inventário físico não bate com o sistema.

---

## A solução: transação

Uma **transação** agrupa várias operações em um bloco "tudo ou nada".

```text
   BEGIN TRANSACTION          <- abre o bloco
       INSERT movimentacao
       UPDATE produto
   COMMIT                     <- confirma TUDO de uma vez

              ...ou, se algo der errado:

   ROLLBACK                   <- desfaz TUDO, como se nada tivesse acontecido
```

| Comando | O que faz |
|---|---|
| `BEGIN` | "Vou fazer várias coisas, segure aí" |
| `COMMIT` | "Deu tudo certo, pode gravar de verdade" |
| `ROLLBACK` | "Deu errado, esqueça tudo o que eu fiz" |

> 💡 **Analogia:** é como o carrinho de compras. Você coloca vários itens, mas só na finalização a compra vale. Se desistir, nada foi comprado — nem os primeiros itens.

---

## Passo 1 — O validador

Crie `src/modules/movements/movement-validator.js`:

```javascript
import { AppError } from "../../shared/errors/app-error.js";

const VALID_TYPES = ["IN", "OUT"];

export function validateMovementInput(input) {
  const productId = Number(input?.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new AppError("Produto invalido");
  }

  const type = String(input?.type ?? "").trim().toUpperCase();

  if (!VALID_TYPES.includes(type)) {
    throw new AppError('O tipo deve ser "IN" (entrada) ou "OUT" (saida)');
  }

  const quantity = Number(input?.quantity);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError("A quantidade deve ser um numero inteiro maior que zero");
  }

  const note = String(input?.note ?? "").trim().replace(/\s+/g, " ");

  if (note.length > 180) {
    throw new AppError("A observacao deve ter no maximo 180 caracteres");
  }

  return {
    productId,
    type,
    quantity,
    note: note || null,
  };
}
```

Salve.

### 🔍 Detalhe importante: `quantity <= 0`

```javascript
if (!Number.isInteger(quantity) || quantity <= 0) {
```

Compare com o produto, onde aceitávamos `quantity >= 0`:

| Onde | Zero é válido? | Por quê |
|---|---|---|
| Produto | ✅ Sim | Produto esgotado tem 0 unidades |
| Movimentação | ❌ Não | Movimentar 0 unidades não significa nada |

> 📌 A mesma palavra (`quantity`) tem regras diferentes em contextos diferentes. Validação depende do **significado**, não do nome do campo.

### `note: note || null`

```javascript
note: note || null,
```

Se a observação for string vazia, mandamos `null` para o banco. É a diferença entre "o usuário não escreveu nada" (`NULL`) e "o usuário escreveu vazio" (`""`) — no banco, `NULL` é o correto para ausência.

---

## Passo 2 — O repositório (a estrela da aula)

Crie `src/modules/movements/movement-repository.js`:

```javascript
import { pool } from "../../config/database.js";

const SELECT_MOVEMENT = `
  SELECT m.id,
         m.product_id AS productId,
         p.name       AS productName,
         p.sku        AS productSku,
         m.type,
         m.quantity,
         m.note,
         m.created_at AS createdAt
    FROM stock_movements m
    INNER JOIN products p ON p.id = m.product_id
`;

export async function findAll({ productId = null, type = null, limit = 100 } = {}) {
  const conditions = [];
  const params = [];

  if (productId) {
    conditions.push("m.product_id = ?");
    params.push(productId);
  }

  if (type) {
    conditions.push("m.type = ?");
    params.push(type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${SELECT_MOVEMENT} ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
    [...params, limit]
  );

  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(`${SELECT_MOVEMENT} WHERE m.id = ?`, [id]);

  return rows[0];
}

/**
 * Registra a movimentacao E atualiza a quantidade do produto.
 *
 * As duas operacoes precisam acontecer JUNTAS: ou as duas dao certo,
 * ou nenhuma acontece. Isso e uma TRANSACAO.
 */
export async function createWithStockUpdate({ productId, type, quantity, note }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // FOR UPDATE trava a linha do produto ate o fim da transacao,
    // evitando que duas requisicoes simultaneas leiam o mesmo saldo.
    const [productRows] = await connection.query(
      "SELECT id, name, quantity FROM products WHERE id = ? FOR UPDATE",
      [productId]
    );

    const product = productRows[0];

    if (!product) {
      await connection.rollback();
      return { status: "PRODUCT_NOT_FOUND" };
    }

    const delta = type === "IN" ? quantity : -quantity;
    const newQuantity = product.quantity + delta;

    if (newQuantity < 0) {
      await connection.rollback();
      return {
        status: "INSUFFICIENT_STOCK",
        available: product.quantity,
      };
    }

    const [result] = await connection.query(
      "INSERT INTO stock_movements (product_id, type, quantity, note) VALUES (?, ?, ?, ?)",
      [productId, type, quantity, note]
    );

    await connection.query(
      "UPDATE products SET quantity = ? WHERE id = ?",
      [newQuantity, productId]
    );

    await connection.commit();

    return {
      status: "CREATED",
      movementId: result.insertId,
      newQuantity,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    // SEMPRE devolve a conexao para o pool.
    connection.release();
  }
}
```

Salve.

---

## 🔬 Dissecando a transação

Vamos por partes. Esta função tem 5 conceitos importantes.

### 1️⃣ Conexão dedicada (não `pool.query`)

```javascript
const connection = await pool.getConnection();
```

Repare que **não** usamos `pool.query()` aqui, e sim `connection.query()`.

**Por quê?** Uma transação precisa acontecer **toda na mesma conexão**.

```text
   ❌ Com pool.query() — cada comando pode sair por uma conexão diferente

   BEGIN     -> conexão 3
   INSERT    -> conexão 7   😱 não sabe do BEGIN!
   COMMIT    -> conexão 2   😱 não tem nada para confirmar!


   ✅ Com getConnection() — tudo na mesma linha

   BEGIN, INSERT, UPDATE, COMMIT  -> conexão 3
```

### 2️⃣ `FOR UPDATE` — a trava que evita vender o que não existe

```sql
SELECT id, name, quantity FROM products WHERE id = ? FOR UPDATE
```

Este é o conceito mais sofisticado da aula. Vamos com um exemplo concreto.

**Cenário:** o produto tem **10 unidades**. Dois vendedores clicam "vender 8" ao mesmo tempo.

#### ❌ Sem `FOR UPDATE`

```text
   Vendedor A                    Vendedor B
   ----------                    ----------
   lê quantidade = 10
                                 lê quantidade = 10      ← leu o mesmo!
   10 - 8 = 2, tudo bem
                                 10 - 8 = 2, tudo bem
   grava 2
                                 grava 2

   RESULTADO: vendeu 16 unidades tendo apenas 10 😱
              e o estoque diz que sobrou 2
```

#### ✅ Com `FOR UPDATE`

```text
   Vendedor A                    Vendedor B
   ----------                    ----------
   lê 10 e TRAVA a linha 🔒
                                 tenta ler... ESPERA ⏳
   10 - 8 = 2, grava
   COMMIT (destrava) 🔓
                                 agora lê: quantidade = 2
                                 2 - 8 = -6 → REJEITA ✅

   RESULTADO: uma venda aprovada, uma recusada. Correto!
```

Esse problema se chama **race condition** (condição de corrida): duas operações "correndo" pelo mesmo recurso.

> 📌 `FOR UPDATE` diz ao banco: *"vou alterar esta linha; segure qualquer outro que tentar mexer nela até eu terminar"*.

### 3️⃣ O `delta` — somar ou subtrair em uma linha

```javascript
const delta = type === "IN" ? quantity : -quantity;
const newQuantity = product.quantity + delta;
```

O operador ternário decide o sinal:

| Tipo | `delta` | Efeito |
|---|---|---|
| `IN` (entrada) | `+quantity` | **soma** |
| `OUT` (saída) | `-quantity` | **subtrai** |

Depois, uma única linha faz a conta. Sem `if/else` duplicado:

```javascript
// ❌ Jeito repetitivo
if (type === "IN") {
  newQuantity = product.quantity + quantity;
} else {
  newQuantity = product.quantity - quantity;
}
```

### 4️⃣ Os dois `rollback` preventivos

```javascript
if (!product) {
  await connection.rollback();
  return { status: "PRODUCT_NOT_FOUND" };
}

if (newQuantity < 0) {
  await connection.rollback();
  return { status: "INSUFFICIENT_STOCK", available: product.quantity };
}
```

Mesmo sem ter gravado nada ainda, precisamos do `rollback` para **encerrar a transação** e liberar a trava do `FOR UPDATE`.

> ⚠️ Sem esses rollbacks, a linha ficaria travada até a conexão morrer — e outras requisições ficariam esperando para sempre.

### 5️⃣ O `finally` com `release()`

```javascript
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

O `finally` executa **sempre**: em caso de sucesso, de erro ou de `return` antecipado.

**Por que isso é vital?**

```text
   Sem o finally:
   erro 1  -> conexão perdida  (restam 9)
   erro 2  -> conexão perdida  (restam 8)
   ...
   erro 10 -> conexão perdida  (restam 0)
             💀 aplicação totalmente travada
```

O pool tem 10 conexões. Cada uma não devolvida é perdida para sempre. Depois de 10 erros, nenhuma requisição funciona — e o servidor não dá nem mensagem de erro clara, só fica parado.

> 📌 **Regra:** `getConnection()` sem `release()` no `finally` é bug garantido.

### 💭 Por que o repository devolve `status` em vez de lançar erro?

```javascript
return { status: "INSUFFICIENT_STOCK", available: product.quantity };
```

"Estoque insuficiente" é uma **regra de negócio**, e regras pertencem ao **service**.

O repository apenas **relata o que encontrou**. Quem decide a mensagem e o status HTTP é a camada de cima. Assim, o repository continua sendo só "o cara que fala com o banco".

---

## Passo 3 — O service

Crie `src/modules/movements/movement-service.js`:

```javascript
import { AppError, NotFoundError } from "../../shared/errors/app-error.js";

import * as repository from "./movement-repository.js";
import { validateMovementInput } from "./movement-validator.js";

export async function listMovements(filters) {
  return repository.findAll(filters);
}

export async function createMovement(input) {
  const data = validateMovementInput(input);

  const result = await repository.createWithStockUpdate(data);

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

Salve.

Aqui o `status` técnico vira **mensagem para o usuário**:

| `status` do repository | Erro lançado | Status HTTP |
|---|---|---|
| `PRODUCT_NOT_FOUND` | `NotFoundError` | 404 |
| `INSUFFICIENT_STOCK` | `AppError` com o saldo | 400 |
| `CREATED` | (nenhum) | 201 |

> 💡 Repare que a mensagem inclui o saldo disponível: *"Estoque insuficiente. Disponivel: 35 unidade(s)"*. Erro bom não diz só "deu errado" — diz o que fazer a respeito.

---

## Passo 4 — O controller

Crie `src/modules/movements/movement-controller.js`:

```javascript
import { AppError } from "../../shared/errors/app-error.js";
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./movement-service.js";

export async function index(request, response) {
  const { productId, type, limit } = request.query;

  const parsedLimit = limit ? Number(limit) : 100;

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
    throw new AppError("O parametro limit deve ser um inteiro entre 1 e 500");
  }

  const movements = await service.listMovements({
    productId: productId ? parseId(productId, "productId") : null,
    type: type ? String(type).toUpperCase() : null,
    limit: parsedLimit,
  });

  response.json(movements);
}

export async function store(request, response) {
  const movement = await service.createMovement(request.body);

  response.status(201).json(movement);
}
```

Salve.

### 🛡️ Por que limitar o `limit` a 500?

```javascript
if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
```

Sem teto, alguém poderia pedir:

```text
GET /api/movements?limit=99999999
```

E o servidor tentaria carregar milhões de linhas na memória — derrubando a aplicação para **todos** os usuários.

> 📌 Isso se chama proteger os **limites** da API. Toda listagem pública precisa de um teto.

---

## Passo 5 — As rotas

Crie `src/modules/movements/movement-routes.js`:

```javascript
import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./movement-controller.js";

export const movementRoutes = Router();

movementRoutes.get("/", asyncHandler(controller.index));
movementRoutes.post("/", asyncHandler(controller.store));
```

Salve.

### 👀 Repare no que NÃO existe aqui

Não há `PUT` nem `DELETE`. E isso é **de propósito**.

**Movimentação é registro histórico.** Não se apaga o passado.

Se alguém registrou uma saída errada, a correção é registrar uma **entrada compensatória** — deixando as duas visíveis no histórico.

> 📌 É assim que a contabilidade funciona há séculos: erro não se apaga, se estorna. Isso mantém a **trilha de auditoria**.

---

## Passo 6 — Registrar o módulo

Em `src/routes/index.js`, acrescente:

```javascript
import { movementRoutes } from "../modules/movements/movement-routes.js";
```

E, junto às outras:

```javascript
routes.use("/movements", movementRoutes);
```

---

## Passo 7 — 🧪 O experimento da aula

Agora vem a parte divertida. **Faça este roteiro passo a passo** e observe cada resultado.

### 1. Veja o estoque inicial do produto 1

```bash
curl http://localhost:3000/api/products/1
```

Anote a `quantity`. Deve ser **40**.

### 2. Registre uma ENTRADA de 15

```bash
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"type":"IN","quantity":15,"note":"Compra fornecedor"}'
```

### 3. Confira: o estoque SOMOU

```bash
curl http://localhost:3000/api/products/1
```

Agora deve estar em **55**. ✅ `40 + 15 = 55`

### 4. Registre uma SAÍDA de 5

```bash
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"type":"OUT","quantity":5,"note":"Venda"}'
```

### 5. Confira: o estoque SUBTRAIU

```bash
curl http://localhost:3000/api/products/1
```

Agora **50**. ✅ `55 - 5 = 50`

### 6. 🎯 Tente uma saída impossível

```bash
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"type":"OUT","quantity":9999}'
```

```json
{"error":"Estoque insuficiente. Disponivel: 50 unidade(s)"}
```

### 7. ⭐ Confira que NADA mudou

```bash
curl http://localhost:3000/api/products/1
```

Continua **50**. O `ROLLBACK` funcionou!

### 8. Confirme que não sobrou registro órfão

```bash
curl "http://localhost:3000/api/movements?productId=1"
```

Conte as movimentações: você deve ver apenas as **legítimas**. A tentativa recusada **não deixou rastro** na tabela.

> 🎉 **É isto que uma transação garante:** ou as duas gravações acontecem, ou nenhuma acontece. Nunca meio caminho.

### 9. Teste as validações

```bash
# Produto que não existe
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -d '{"productId":999,"type":"IN","quantity":1}'

# Tipo inválido
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -d '{"productId":1,"type":"TALVEZ","quantity":1}'

# Quantidade zero
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -d '{"productId":1,"type":"IN","quantity":0}'

# Quantidade fracionada
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -d '{"productId":1,"type":"IN","quantity":1.5}'
```

Todas devem devolver mensagens claras.

### 10. Veja direto no banco

```bash
docker compose exec db mysql -u estoque -pestoque123 estoque_db \
  -e "SELECT id, product_id, type, quantity, note FROM stock_movements WHERE product_id = 1;"
```

Compare com a `quantity` do produto. Os números batem — e vão continuar batendo sempre.

---

## ✅ Confira se deu certo

- [ ] Os 5 arquivos existem em `src/modules/movements`
- [ ] `src/routes/index.js` registra `/movements`
- [ ] Entrada **aumenta** a quantidade do produto
- [ ] Saída **diminui** a quantidade do produto
- [ ] Saída maior que o estoque é **recusada** com o saldo disponível
- [ ] Após a recusa, a quantidade **não mudou**
- [ ] Após a recusa, **nenhuma** movimentação foi gravada
- [ ] Tipo diferente de `IN`/`OUT` é rejeitado
- [ ] Quantidade zero ou fracionada é rejeitada

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| A quantidade não muda | Faltou o `UPDATE` ou o `commit` | Confira se há `connection.commit()` antes do return |
| `Lock wait timeout exceeded` | Uma transação ficou aberta | Faltou `rollback` em algum caminho; reinicie: `docker compose restart api` |
| A aplicação trava depois de alguns testes | Conexões vazando | Confira se o `finally` tem `connection.release()` |
| `Data truncated for column 'type'` | Valor fora do `ENUM` | Só `IN` ou `OUT` são aceitos pelo banco |
| Gravou a movimentação mas não atualizou | Usou `pool.query` no meio | Dentro da transação é **sempre** `connection.query` |

---

## 🎓 O que você aprendeu aqui

Este é o conteúdo que separa um CRUD de brinquedo de um sistema real:

| Conceito | Onde mais aparece |
|---|---|
| **Transação** | Transferência bancária, reserva de passagem, checkout |
| **Rollback** | Qualquer operação de múltiplos passos |
| **`FOR UPDATE`** | Venda de ingressos, reserva de vagas, leilão |
| **Race condition** | Todo sistema com usuários simultâneos |
| **Trilha de auditoria** | Contabilidade, saúde, jurídico |

---

## ➡️ Próximo passo

Estoque garantido. Agora vamos fazer o banco calcular os totais do dashboard.

**[Aula 14 — Dashboard (API)](14-dashboard-api.md)**
