# Aula 09 — Servidor Express

⏱️ **Tempo estimado:** 25 minutos
📋 **Tipo:** prática (código JavaScript)

---

## Objetivo

Criar os três arquivos que montam e ligam o servidor:

- `src/routes/index.js` — a lista de rotas
- `src/app.js` — a configuração do Express
- `src/server.js` — quem liga tudo

Ao final desta aula o código estará **completo o suficiente para rodar**. Na próxima aula, subimos.

---

## Antes de começar

- [ ] Aula 08 concluída (os 4 arquivos de erro criados)

---

## Passo 1 — `src/routes/index.js`

Na pasta `src/routes`, crie `index.js`:

```javascript
import { Router } from "express";

export const routes = Router();

routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

Salve.

### Entendendo

Por enquanto temos **uma rota só**, mas ela é muito útil.

**O que é um `Router`?** É um "mini-aplicativo" do Express que agrupa rotas. Em vez de registrar tudo no arquivo principal, criamos grupos organizados e os encaixamos depois.

**O que é uma rota de health?** É uma rota que responde apenas *"estou vivo"*. Serve para:

- você testar rapidamente se a API subiu;
- ferramentas de monitoramento verificarem o serviço;
- o balanceador de carga saber se pode mandar tráfego.

> 📌 Praticamente toda API profissional tem uma rota assim. É a primeira coisa que se testa quando algo dá errado.

Vamos voltar a este arquivo nas aulas 11 a 14 para adicionar os módulos.

---

## Passo 2 — `src/app.js`

Na pasta `src`, crie `app.js`:

```javascript
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "..", "public");

export const app = express();

// Interpreta o corpo das requisicoes em JSON
app.use(express.json());

// Log simples de cada requisicao (util em sala de aula)
app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
});

// Front-end estatico (HTML + Tailwind + JS)
app.use(express.static(publicDir));

// Todas as rotas da API ficam sob /api
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
```

Salve.

---

## Entendendo o `app.js`

### Os imports com `node:`

```javascript
import path from "node:path";
import { fileURLToPath } from "node:url";
```

O prefixo `node:` deixa explícito que o módulo é **nativo do Node**, não uma biblioteca baixada.

> 💡 Além de ser mais claro para quem lê, isso evita que alguém instale um pacote malicioso chamado `path` no npm e sequestre seu import. Essa é uma técnica de ataque real, chamada *dependency confusion*.

### `__dirname` não existe em ES Modules

```javascript
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "..", "public");
```

Este trecho confunde bastante. Vamos por partes:

| Passo | Resultado |
|---|---|
| `import.meta.url` | `file:///app/src/app.js` (uma URL!) |
| `fileURLToPath(...)` | `/app/src/app.js` (caminho de arquivo) |
| `path.dirname(...)` | `/app/src` (só a pasta) |
| `path.resolve(currentDir, "..", "public")` | `/app/public` (sobe um nível e entra em `public`) |

**Por que tudo isso?** No padrão antigo (CommonJS) existia a variável mágica `__dirname`. Em ES Modules ela não existe, e esta é a forma oficial de obter o mesmo resultado.

> ⚠️ **Por que não escrever `"./public"` direto?** Porque caminhos relativos dependem de **onde o comando foi executado**, não de onde o arquivo está. Se alguém rodasse a aplicação de outra pasta, quebraria. O `path.resolve` gera um caminho absoluto e confiável.

### 🔑 A ordem dos middlewares é tudo

Esta é a parte mais importante da aula. O Express executa os `app.use` **na ordem exata em que foram escritos**.

```text
   Requisição chega
         |
         v
   1. express.json()          <- transforma o corpo em objeto
         |
         v
   2. log da requisição       <- imprime no console
         |
         v
   3. express.static()        <- é um arquivo? (html, css, js)
         |                        SIM -> responde e para aqui
         v
   4. /api + routes           <- é uma rota da API?
         |                        SIM -> responde e para aqui
         v
   5. notFoundHandler         <- ninguém respondeu: 404
         |
         v
   6. errorHandler            <- só recebe se houve erro
```

### `express.json()`

```javascript
app.use(express.json());
```

Transforma o corpo da requisição (que chega como texto) em objeto JavaScript.

| Sem ele | Com ele |
|---|---|
| `request.body` é `undefined` | `request.body` é `{ name: "Café" }` |

> ⚠️ **Erro clássico:** colocar `express.json()` **depois** das rotas. O sintoma é `request.body` chegar `undefined` em todos os POSTs. Se isso acontecer com você, confira a ordem aqui.

### O middleware de log

```javascript
app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
});
```

Este é um middleware escrito **por nós**, e ele mostra a anatomia de qualquer middleware:

| Parâmetro | Papel |
|---|---|
| `request` | O que chegou |
| `response` | O que vamos devolver |
| `next` | A função que passa a bola para o próximo |

> ⚠️ **Se esquecer o `next()`**, a requisição **para aqui** e o navegador fica girando para sempre. Todo middleware que não responde precisa chamar `next()`.

Em aula, isso é ótimo: você vê no terminal cada clique que os alunos dão.

```text
GET /api/products
POST /api/movements
GET /api/dashboard
```

### `express.static(publicDir)`

```javascript
app.use(express.static(publicDir));
```

Serve os arquivos da pasta `public` diretamente:

| URL pedida | Arquivo entregue |
|---|---|
| `/` | `public/index.html` |
| `/produtos.html` | `public/produtos.html` |
| `/js/api.js` | `public/js/api.js` |

É por isso que nosso front-end e nossa API rodam no **mesmo endereço** — o que, de quebra, elimina qualquer problema de CORS.

### `app.use("/api", routes)`

```javascript
app.use("/api", routes);
```

Encaixa todas as rotas sob o prefixo `/api`. A rota `/health` que escrevemos vira, na prática, `/api/health`.

**Por que separar com `/api`?** Para não confundir com as páginas:

| Endereço | Devolve |
|---|---|
| `/produtos.html` | A **página** |
| `/api/products` | Os **dados** em JSON |

### Os dois últimos, sempre no fim

```javascript
app.use(notFoundHandler);
app.use(errorHandler);
```

Eles **precisam** ser os últimos. Se estivessem antes das rotas, toda requisição receberia 404 antes de chegar ao destino.

---

## Passo 3 — `src/server.js`

Na pasta `src`, crie `server.js`:

```javascript
import { app } from "./app.js";
import { connectWithRetry, pool } from "./config/database.js";
import { env } from "./config/env.js";

async function start() {
  await connectWithRetry();

  const server = app.listen(env.port, () => {
    console.log(`Servidor rodando em http://localhost:${env.port}`);
  });

  // Encerramento gracioso: fecha o servidor e o pool de conexoes.
  const shutdown = async (signal) => {
    console.log(`\nRecebido ${signal}. Encerrando...`);

    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("Falha ao iniciar a aplicacao:", error.message);
  process.exit(1);
});
```

Salve.

---

## Entendendo o `server.js`

### Por que separar `app.js` de `server.js`?

Esta separação parece burocracia, mas tem um motivo forte:

| Arquivo | Responsabilidade |
|---|---|
| `app.js` | **Monta** a aplicação (rotas, middlewares). Não abre porta nenhuma |
| `server.js` | **Conecta** no banco e **abre** a porta de rede |

**Qual a vantagem?** Testes automatizados. Com essa divisão, um teste pode importar o `app` e disparar requisições **sem** ocupar uma porta de rede real:

```javascript
import request from "supertest";
import { app } from "./app.js";

test("lista produtos", async () => {
  const response = await request(app).get("/api/products");
  expect(response.status).toBe(200);
});
```

Se tudo estivesse em um arquivo só, cada teste tentaria abrir a porta 3000 — e daria conflito.

### A ordem da inicialização

```javascript
await connectWithRetry();          // 1. o banco responde?
const server = app.listen(...)     // 2. só então abrimos a porta
```

Conectamos no banco **antes** de aceitar requisições. Assim, evitamos o cenário ruim de o usuário fazer um pedido e receber erro porque o banco ainda não estava pronto.

### O encerramento gracioso

```javascript
const shutdown = async (signal) => {
  console.log(`\nRecebido ${signal}. Encerrando...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

**O que são esses sinais?**

| Sinal | Quem envia |
|---|---|
| `SIGTERM` | O Docker, ao rodar `docker compose down` |
| `SIGINT` | Você, ao apertar `Ctrl` + `C` |

**O que acontece sem isso?** O processo é morto na hora, possivelmente no meio de uma consulta ou de uma transação.

**Com isso**, a sequência é ordenada:

```text
   1. Recebe o sinal
   2. server.close()  -> para de aceitar NOVAS requisições
   3. termina as requisições que já estavam em andamento
   4. pool.end()      -> fecha as conexões com o banco
   5. process.exit(0) -> sai com código de sucesso
```

> 📌 `exit(0)` significa "terminei bem". `exit(1)` significa "terminei com erro". É assim que scripts e orquestradores sabem o que aconteceu.

### O `catch` final

```javascript
start().catch((error) => {
  console.error("Falha ao iniciar a aplicacao:", error.message);
  process.exit(1);
});
```

Se algo falhar na inicialização (banco inacessível, variável faltando), mostramos a mensagem e saímos com código de erro.

> ⚠️ **Por que não deixar o processo vivo?** Porque um servidor que subiu sem banco é pior que um servidor que não subiu: ele aceita requisições e falha em todas. Melhor morrer e deixar o Docker reiniciar (lembra do `restart: unless-stopped`?).

---

## ✅ Confira se deu certo

```bash
ls src src/routes
```

Deve mostrar:

```text
src:
app.js  config  modules  routes  server.js  shared

src/routes:
index.js
```

Marque:

- [ ] `src/routes/index.js` existe com a rota `/health`
- [ ] `src/app.js` existe com os 6 `app.use` na ordem correta
- [ ] `src/server.js` existe e chama `connectWithRetry()` antes de `app.listen()`
- [ ] Em `app.js`, `express.json()` vem **antes** de `app.use("/api", routes)`
- [ ] Em `app.js`, `errorHandler` é o **último**

### Contagem de arquivos

Neste ponto, você deve ter **9 arquivos** de código:

```bash
find src -name "*.js" | wc -l
```

Deve responder `9`.

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| `Cannot find module './routes/index.js'` | Caminho ou nome errado | O arquivo é `src/routes/index.js` |
| `app is not defined` | Faltou `export` | Use `export const app = express();` |
| `Cannot find module 'express'` | Dependência não instalada localmente | **Normal!** Ela existe dentro do container |
| Erro de digitação em `fileURLToPath` | Maiúsculas/minúsculas | É `fileURLToPath`, com `URL` maiúsculo |

---

## ➡️ Próximo passo

O código está pronto para rodar. Vamos subir tudo pela primeira vez!

**[Aula 10 — Primeira execução](10-primeira-execucao.md)** 🚀
