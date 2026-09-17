# Etapa 08 — Tratamento de erros

📋 **Tipo:** prática (código JavaScript)

---

## Objetivo

Criar os quatro arquivos que formam a **base de tratamento de erros** do projeto. Depois desta etapa, qualquer erro em qualquer parte do sistema vai virar uma resposta HTTP correta e clara.

---

## Antes de começar

- [ ] Etapa 07 concluída (`config/env.js` e `config/database.js` criados)

---

## O problema que vamos resolver

Um código problemático faria assim:

```javascript
if (a == undefined || a == "") {
  console.log("erro");    // 😱
  return;
}
```

Três defeitos graves:

| Defeito | Consequência |
|---|---|
| Mensagem genérica | Ninguém sabe **qual** campo falhou |
| `console.log` | O usuário nunca vê; fica só no terminal do servidor |
| `return` vazio | Quem chamou a função não sabe que deu errado |

Em uma API, precisamos de mais: cada erro precisa virar uma **resposta HTTP** com o **status certo** e uma **mensagem útil**.

---

## Passo 1 — `src/shared/errors/app-error.js`

Na pasta `src/shared/errors`, crie `app-error.js`:

```javascript
// Erro de NEGOCIO: sabemos o que aconteceu e qual status HTTP devolver.
// Qualquer outro erro sera tratado como 500 (falha inesperada).
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Registro nao encontrado") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Registro ja existente") {
    super(message, 409);
    this.name = "ConflictError";
  }
}
```

Salve.

### Entendendo

**`extends Error`** significa "esta classe é um tipo especial de `Error`". Ela herda tudo que um erro normal tem (`message`, `stack`) e **acrescenta** o que precisamos: `statusCode`.

```javascript
throw new AppError("O nome e obrigatorio");        // status 400
throw new NotFoundError("Produto nao encontrado"); // status 404
throw new ConflictError("SKU ja existe");          // status 409
```

**`super(message)`** chama o construtor da classe pai (`Error`), que guarda a mensagem.

### Os três status HTTP que usamos

| Classe | Status | Quando usar |
|---|---|---|
| `AppError` | **400** Bad Request | O cliente mandou dado inválido |
| `NotFoundError` | **404** Not Found | O registro pedido não existe |
| `ConflictError` | **409** Conflict | Já existe algo com esse valor único |

> 📌 O valor `400` é o **padrão** do `AppError`. Se você não passar status, ele assume 400 — que é o caso mais comum (erro de validação).

---

## Passo 2 — `src/shared/http/async-handler.js`

Na pasta `src/shared/http`, crie `async-handler.js`:

```javascript
// O Express 4 nao captura erros de funcoes async automaticamente.
// Este wrapper encaminha qualquer rejeicao para o middleware de erro.
export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
```

Salve.

### Por que este arquivo existe?

Este é um **problema real e traiçoeiro** do Express 4.

Veja o que acontece **sem** o wrapper:

```javascript
// PERIGOSO
router.get("/:id", async (request, response) => {
  const product = await service.getProduct(999);  // lança NotFoundError
  response.json(product);
});
```

O erro é lançado dentro de uma função `async`, o que gera uma **Promise rejeitada**. O Express 4 não sabe disso e simplesmente... não faz nada.

**Resultado:** o navegador fica girando até dar timeout. Nenhuma resposta, nenhuma mensagem, nada no log. É um dos bugs mais difíceis de diagnosticar para quem está começando.

### Como o wrapper resolve

```javascript
Promise.resolve(handler(...)).catch(next);
```

| Parte | O que faz |
|---|---|
| `handler(...)` | Executa sua função |
| `Promise.resolve(...)` | Garante que o resultado seja uma Promise |
| `.catch(next)` | Se rejeitar, chama `next(erro)` |

E `next(erro)` é justamente como se avisa o Express: *"deu erro, manda para o middleware de tratamento"*.

Usaremos assim, em todas as rotas:

```javascript
router.get("/:id", asyncHandler(controller.show));
```

> 💡 **Curiosidade:** o Express 5 (ainda em adoção) faz isso nativamente. Como a versão 4 ainda é a mais usada no mercado, é importante conhecer esse padrão.

---

## Passo 3 — `src/shared/http/error-handler.js`

Ainda em `src/shared/http`, crie `error-handler.js`:

```javascript
import { AppError } from "../errors/app-error.js";

export function notFoundHandler(request, response) {
  response.status(404).json({
    error: `Rota nao encontrada: ${request.method} ${request.originalUrl}`,
  });
}

// Middleware de erro do Express: precisa dos 4 parametros.
export function errorHandler(error, request, response, next) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  console.error("Erro inesperado:", error);

  return response.status(500).json({ error: "Erro interno do servidor" });
}
```

Salve.

### 🎯 Este é o coração do tratamento de erros

Toda a aplicação passa por aqui. Repare que ele trata **dois casos diferentes**:

#### Caso 1 — Erro que nós previmos

```javascript
if (error instanceof AppError) {
  return response.status(error.statusCode).json({ error: error.message });
}
```

Se o erro é um `AppError`, nós **sabemos** o que aconteceu. Devolvemos o status e a mensagem reais:

```json
{ "error": "O preco de venda nao pode ser menor que o preco de custo" }
```

#### Caso 2 — Erro inesperado

```javascript
console.error("Erro inesperado:", error);
return response.status(500).json({ error: "Erro interno do servidor" });
```

Se for qualquer outra coisa (bug no código, banco fora do ar), fazemos duas coisas **diferentes**:

| Para quem | O que recebe |
|---|---|
| **Desenvolvedor** (log do servidor) | O erro **completo**, com stack trace |
| **Usuário** (resposta HTTP) | Mensagem **genérica** |

### ⚠️ Por que esconder o erro real do usuário?

Porque a mensagem crua pode entregar informação valiosa para um atacante:

```text
Error: ER_NO_SUCH_TABLE: Table 'estoque_db.usuarios_admin' doesn't exist
    at /app/src/modules/products/product-repository.js:42
```

Isso revelou: o nome do banco, o nome de uma tabela, a estrutura de pastas e a tecnologia usada. Tudo de graça.

> 📌 **Regra de segurança:** log detalhado para dentro, mensagem genérica para fora.

### A assinatura de 4 parâmetros

```javascript
export function errorHandler(error, request, response, next) {
```

Este detalhe é **obrigatório**. O Express identifica um middleware de erro **contando os parâmetros**:

| Parâmetros | O Express entende como |
|---|---|
| 3 (`req, res, next`) | Middleware normal |
| **4** (`err, req, res, next`) | **Middleware de erro** |

> ⚠️ Se você remover o `next` (mesmo sem usá-lo), o Express deixa de reconhecer a função como tratadora de erros e ela **nunca é chamada**. Deixe os quatro.

### O `notFoundHandler`

```javascript
export function notFoundHandler(request, response) {
  response.status(404).json({
    error: `Rota nao encontrada: ${request.method} ${request.originalUrl}`,
  });
}
```

Se ninguém respondeu a requisição até aqui, é porque a rota não existe. Devolvemos 404 com uma mensagem útil:

```json
{ "error": "Rota nao encontrada: GET /api/naoexiste" }
```

Sem isso, o Express devolveria uma página HTML de erro — péssimo para uma API que promete sempre responder JSON.

---

## Passo 4 — `src/shared/http/parse-id.js`

Ainda em `src/shared/http`, crie `parse-id.js`:

```javascript
import { AppError } from "../errors/app-error.js";

// Parametros de rota chegam SEMPRE como string.
// Convertemos e validamos antes de usar.
export function parseId(value, label = "id") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Parametro ${label} invalido: ${value}`);
  }

  return id;
}
```

Salve.

### Por que precisamos disso?

Quando alguém acessa `/api/products/5`, o Express entrega:

```javascript
request.params.id    // "5"  ← STRING, não número!
```

Se você usasse direto:

```javascript
// Alguém acessa /api/products/abc
const id = request.params.id;    // "abc"
// vai parar numa consulta SQL sem sentido
```

Com o `parseId`, o erro é detectado na porta de entrada:

```json
{ "error": "Parametro id invalido: abc" }
```

> 📌 Este é o princípio de **validar nas fronteiras**: todo dado que vem de fora (URL, corpo, query string) é suspeito até prova em contrário.

---

## O fluxo completo de um erro

Vamos acompanhar o caminho de um erro do começo ao fim:

```text
 1. O usuário tenta criar um produto sem nome
              |
              v
 2. product-validator.js:
    throw new AppError("O campo nome e obrigatorio")
              |
              v
 3. A Promise do controller é rejeitada
              |
              v
 4. asyncHandler captura e chama next(erro)
              |
              v
 5. errorHandler recebe:
    - é um AppError? SIM
    - status = 400, mensagem = "O campo nome e obrigatorio"
              |
              v
 6. O navegador recebe:
    HTTP 400
    { "error": "O campo nome e obrigatorio" }
              |
              v
 7. O front-end mostra a mensagem em vermelho na tela
```

Repare: **em nenhum momento** escrevemos `try/catch` no controller. A infraestrutura cuida disso.

---

## ✅ Confira se deu certo

```bash
ls src/shared/errors src/shared/http
```

Deve mostrar:

```text
src/shared/errors:
app-error.js

src/shared/http:
async-handler.js  error-handler.js  parse-id.js
```

Marque:

- [ ] `app-error.js` exporta 3 classes
- [ ] `async-handler.js` exporta `asyncHandler`
- [ ] `error-handler.js` exporta `notFoundHandler` e `errorHandler`
- [ ] O `errorHandler` tem **4 parâmetros**
- [ ] `parse-id.js` exporta `parseId`
- [ ] Os imports usam `../errors/app-error.js` (dois pontos para subir uma pasta)

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| `Cannot find module '../errors/app-error.js'` | Caminho errado | De `shared/http`, para chegar em `shared/errors` use `../errors/` |
| `AppError is not a constructor` | Import sem chaves | `import { AppError } from ...` (com chaves) |
| O `errorHandler` nunca é chamado | Faltou o 4º parâmetro | Mantenha `(error, request, response, next)` |

---

## ➡️ Próximo passo

Base de erros pronta. Vamos montar o servidor web.

**[Etapa 09 — Servidor Express](09-servidor-express.md)**
