# Etapa 27 — Controller, rotas e o middleware que protege a API

**Tipo:** prática (código JavaScript + testes com `curl`)

**Tempo estimado:** 45 minutos

---

## Objetivo

Fechar o back-end da autenticação:

- `auth-controller.js` e `auth-routes.js` — as portas de entrada
- `ensure-authenticated.js` — o porteiro
- `routes/index.js` — **trancar** produtos, categorias, movimentações e dashboard

Ao final desta etapa a API inteira estará protegida e testada por linha de comando. O front vem depois.

---

## Antes de começar

- [ ] [Etapa 26](26-auth-service.md) concluída (`auth-service.js` e `token.js` criados)
- [ ] Servidor no ar sem erros no log

---

## Passo 1 — O controller

Crie `src/modules/auth/auth-controller.js`:

```javascript
import * as service from "./auth-service.js";

export async function register(request, response) {
  const result = await service.registerUser(request.body);

  // 201 Created: um recurso novo passou a existir.
  response.status(201).json(result);
}

export async function login(request, response) {
  const result = await service.loginUser(request.body);

  response.json(result);
}

// request.user foi preenchido pelo middleware ensureAuthenticated.
export async function profile(request, response) {
  const user = await service.getProfile(request.user.id);

  response.json(user);
}
```

Salve.

### Repare como ele é pequeno

Três funções, três linhas cada. É assim que um controller deve ser.

Ele faz **só** o trabalho de tradução:

```text
   request  ──►  service  ──►  response
   (HTTP)        (regras)      (HTTP)
```

O que ele **não** faz: validar, decidir, consultar banco, gerar token. Tudo isso é do service.

### Os status escolhidos

```javascript
// 201 Created: um recurso novo passou a existir.
response.status(201).json(result);   // register

response.json(result);               // login  -> 200 (padrão)
```

O cadastro **cria** algo no banco: `201`. O login não cria nada — só verifica e devolve um token: `200`.

> Pense assim: se você repetir o `POST /auth/register` dez vezes, dez usuários deveriam existir (o e-mail único impede, mas a intenção é essa). Se repetir o `POST /auth/login` dez vezes, nada muda no banco.

### De onde vem `request.user`

```javascript
// request.user foi preenchido pelo middleware ensureAuthenticated.
export async function profile(request, response) {
  const user = await service.getProfile(request.user.id);
  ...
}
```

`request.user` não existe no Express. **Nós** vamos criá-lo no middleware, daqui a dois passos. Este é o contrato entre as duas peças.

---

## Passo 2 — O middleware

Crie `src/shared/auth/ensure-authenticated.js`:

```javascript
import { UnauthorizedError } from "../errors/app-error.js";

import { verifyToken } from "./token.js";

// Middleware: roda ANTES do controller e so deixa passar quem
// apresentar um token valido no cabecalho Authorization.
//
//   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
//                  |____| |_______________________|
//                  esquema         token
export function ensureAuthenticated(request, response, next) {
  const header = request.headers.authorization;

  if (!header) {
    throw new UnauthorizedError("Token nao informado");
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Formato do token invalido");
  }

  // Se o token nao prestar, verifyToken lanca UnauthorizedError
  // e o middleware de erro devolve 401 para o cliente.
  request.user = verifyToken(token);

  next();
}
```

Salve.

---

## 3. Dissecando o porteiro

### 3.1 A assinatura de um middleware

```javascript
export function ensureAuthenticated(request, response, next) {
```

Três parâmetros — é isso que faz o Express reconhecer a função como middleware:

| Parâmetro | Papel |
|---|---|
| `request` | o pedido que chegou |
| `response` | a resposta (aqui nem usamos) |
| `next` | **a função que deixa passar** |

Sem chamar `next()`, a requisição para ali e o navegador fica esperando para sempre.

> Lembre do `error-handler.js` da [Etapa 08](08-tratamento-de-erros.md): ele tem **quatro** parâmetros. É a contagem de parâmetros que o Express usa para diferenciar um middleware normal de um middleware de erro.

### 3.2 Quebrando o cabeçalho

```javascript
const header = request.headers.authorization;

if (!header) {
  throw new UnauthorizedError("Token nao informado");
}

const [scheme, token] = header.split(" ");

if (scheme !== "Bearer" || !token) {
  throw new UnauthorizedError("Formato do token invalido");
}
```

O cabeçalho chega assim:

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
               └────┘ └───────────────────┘
               scheme         token
```

O `split(" ")` corta no espaço e a **desestruturação** distribui as duas partes em duas variáveis — o mesmo recurso que você usou no Módulo 1.

Três situações diferentes, três respostas:

| O cliente mandou | Resultado |
|---|---|
| nada | `Token nao informado` |
| `Authorization: abc123` | `Formato do token invalido` (sem "Bearer") |
| `Authorization: Bearer abc123` | passa para o `verifyToken`, que recusa: `Token invalido` |

> **`request.headers.authorization` em minúsculas?** Sim. Cabeçalhos HTTP não diferenciam maiúsculas, e o Node normaliza todos para minúsculas. Se você escrever `request.headers.Authorization`, vai receber `undefined` — e é um erro difícil de achar.

### 3.3 A linha que liga tudo

```javascript
// Se o token nao prestar, verifyToken lanca UnauthorizedError
// e o middleware de erro devolve 401 para o cliente.
request.user = verifyToken(token);

next();
```

Duas coisas acontecem aqui:

1. **Se o token for inválido**, `verifyToken` lança e `next()` nunca é chamado. A requisição morre com `401`.
2. **Se for válido**, o objeto `{ id, name, email }` é pendurado em `request.user` e a requisição segue.

A partir deste ponto, **qualquer** controller do sistema pode escrever `request.user.id` e saber quem está falando.

```text
   requisição chega
        │
        ▼
   ensureAuthenticated ──── token ruim ───► 401, fim
        │
        │ token bom: request.user = { id, name, email }
        ▼
   controller ──► service ──► repository
```

> **Por que pendurar no `request` e não numa variável global?** Porque o servidor atende várias pessoas ao mesmo tempo. Uma variável global seria compartilhada entre todas as requisições e você entregaria os dados da Ana para o Bruno. Cada `request` é um objeto isolado, por requisição.

### 3.4 Por que não precisa de `asyncHandler`

Repare que este middleware **não é `async`**. Ele é síncrono do começo ao fim — `jwt.verify` não devolve promessa.

O Express 4 captura erros lançados de forma síncrona automaticamente. O `asyncHandler` da [Etapa 08](08-tratamento-de-erros.md) só é necessário para funções `async`.

---

## Passo 3 — As rotas do módulo

Crie `src/modules/auth/auth-routes.js`:

```javascript
import { Router } from "express";

import { ensureAuthenticated } from "../../shared/auth/ensure-authenticated.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./auth-controller.js";

export const authRoutes = Router();

// Rotas PUBLICAS: quem ainda nao tem conta precisa poder chegar aqui.
authRoutes.post("/register", asyncHandler(controller.register));
authRoutes.post("/login", asyncHandler(controller.login));

// Rota PROTEGIDA: serve para o front perguntar "meu token ainda vale?".
authRoutes.get("/me", ensureAuthenticated, asyncHandler(controller.profile));
```

Salve.

### A linha que resume a etapa

```javascript
authRoutes.get("/me", ensureAuthenticated, asyncHandler(controller.profile));
                      └─────────┬───────┘
                       roda ANTES do controller
```

O Express aceita quantas funções você quiser entre o caminho e o final. Elas rodam **em ordem**, e cada uma decide se chama `next()`.

Compare com as duas rotas de cima:

| Rota | Protegida? | Por quê |
|---|---|---|
| `POST /auth/register` | não | quem não tem conta não tem token |
| `POST /auth/login` | não | pedir token para fazer login seria um paradoxo |
| `GET /auth/me` | **sim** | só faz sentido para quem já entrou |

> Pense no paradoxo do ovo e da galinha: se o login exigisse token, ninguém nunca conseguiria o primeiro token. É por isso que **toda** aplicação tem pelo menos duas portas abertas.

---

## Passo 4 — Trancar o resto da API

Agora a mudança mais importante. Abra `src/routes/index.js` e deixe assim:

```javascript
import { Router } from "express";

import { authRoutes } from "../modules/auth/auth-routes.js";
import { categoryRoutes } from "../modules/categories/category-routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard-routes.js";
import { movementRoutes } from "../modules/movements/movement-routes.js";
import { productRoutes } from "../modules/products/product-routes.js";
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
```

Salve.

---

## 4. Dissecando o arquivo de rotas

### 4.1 A ordem das linhas é a regra de segurança

```javascript
routes.use(ensureAuthenticated);
```

Esta linha sozinha protege **tudo** que vier depois dela.

```text
   routes.get("/health", ...)      ─┐
   routes.use("/auth", authRoutes) ─┤── PÚBLICAS (antes da linha)
                                    ─┘
   routes.use(ensureAuthenticated); ◄── A LINHA

   routes.use("/categories", ...)  ─┐
   routes.use("/products", ...)    ─┤── PROTEGIDAS (depois da linha)
   routes.use("/movements", ...)   ─┤
   routes.use("/dashboard", ...)   ─┘
```

> **Mover uma linha neste arquivo muda quem pode entrar no sistema.** Se alguém colocar `routes.use("/products", productRoutes)` acima do `ensureAuthenticated`, os produtos ficam abertos para o mundo — e nada no código vai reclamar. É por isso que o comentário no arquivo diz isso em voz alta.

### 4.2 Por que `/health` fica de fora

```javascript
routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

Essa rota existe para **monitoramento**: o Docker, um balanceador de carga ou uma ferramenta de alerta perguntam "você está vivo?" a cada poucos segundos.

Nenhuma dessas ferramentas tem usuário nem senha. E a resposta não revela nada sigiloso.

### 4.3 A alternativa que não usamos

Poderíamos proteger rota por rota:

```javascript
// Funciona, mas é frágil
productRoutes.get("/", ensureAuthenticated, asyncHandler(controller.index));
productRoutes.get("/:id", ensureAuthenticated, asyncHandler(controller.show));
productRoutes.post("/", ensureAuthenticated, asyncHandler(controller.store));
// ... e assim por diante, em 4 módulos
```

| | Uma linha central | Rota por rota |
|---|---|---|
| Esquecer uma rota | impossível | muito fácil |
| Rota nova criada amanhã | já nasce protegida | nasce **desprotegida** |
| Ler o arquivo e saber o que é público | sim | precisa abrir 4 arquivos |

O padrão que escolhemos é **seguro por padrão**: para abrir uma rota é preciso um ato consciente (movê-la para cima), e não um esquecimento.

---

## Passo 5 — Reiniciar

```bash
docker compose restart api
docker compose logs api --tail 10
```

```text
estoque-api  | Conexao com o MySQL estabelecida
estoque-api  | Servidor rodando em http://localhost:3000
```

---

## 5. Testando tudo pelo terminal

Agora vem a parte divertida. **Não abra o navegador ainda** — as telas ainda não sabem mandar token, então elas vão parecer quebradas. É esperado.

> Se preferir uma interface gráfica, pode usar o Thunder Client (extensão do VS Code), Insomnia ou Postman. Os campos são os mesmos.

### Teste 1 — A rota pública continua aberta

```bash
curl http://localhost:3000/api/health
```

```json
{"status":"ok","timestamp":"2026-09-22T22:14:51.333Z"}
```

### Teste 2 — A porta está trancada

```bash
curl -i http://localhost:3000/api/products
```

```text
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8

{"error":"Token nao informado"}
```

**Este é o momento da aula.** A API que estava aberta para o mundo inteiro acabou de fechar.

> O `-i` do `curl` mostra os cabeçalhos junto com o corpo. Use sempre que quiser ver o status.

### Teste 3 — Login com o usuário de demonstração

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}'
```

```json
{"user":{"id":1,"name":"Professor Demo","email":"professor@estoquefacil.com"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiUHJvZmVzc29yIERlbW8iLCJlbWFpbCI6InByb2Zlc3NvckBlc3RvcXVlZmFjaWwuY29tIiwiaWF0IjoxNzkwMTE1MjkxLCJleHAiOjE3OTAyMDE2OTEsInN1YiI6IjEifQ.PorPhLZZff5seKhz95uYOt3OUMwsCH1FeD6D29COwEo"}
```

> **Momento jwt.io:** copie esse token, cole em https://jwt.io e mostre para a turma que o conteúdo é legível. Depois troque uma letra do payload e veja a assinatura ficar vermelha. É a aula de segurança mais visual que existe.

### Teste 4 — Guardar o token numa variável

Digitar aquele token gigante em toda requisição é inviável. No **Git Bash / Linux / Mac**:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')

echo $TOKEN
```

No **PowerShell**:

```powershell
$body = '{"email":"professor@estoquefacil.com","password":"123456"}'
$resposta = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body $body -ContentType "application/json"
$TOKEN = $resposta.token
$TOKEN
```

### Teste 5 — Entrar com o crachá

```bash
curl http://localhost:3000/api/products -H "Authorization: Bearer $TOKEN"
```

```json
[{"id":2,"name":"Agua mineral 500ml","sku":"BEB-002","categoryId":1,...}]
```

A mesma rota que respondia `401` agora responde os produtos. **Só o cabeçalho mudou.**

### Teste 6 — Quem sou eu

```bash
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

```json
{"id":1,"name":"Professor Demo","email":"professor@estoquefacil.com","active":true,"createdAt":"2026-09-22 22:14:15"}
```

### Teste 7 — Criar uma conta

```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Paula Souza","email":"  ANA@Teste.com  ","password":"senha123","passwordConfirmation":"senha123"}'
```

```text
HTTP/1.1 201 Created

{"user":{"id":2,"name":"Ana Paula Souza","email":"ana@teste.com"},"token":"eyJhbGciOiJ..."}
```

> Repare: mandamos `"  ANA@Teste.com  "` e voltou `"ana@teste.com"`. O validador da [Etapa 25](25-auth-validator-repository.md) aparou os espaços e baixou as maiúsculas. Isso é o "validar nas fronteiras" funcionando.

---

## 6. Testando o que dá errado

Um sistema se prova nos casos ruins. Rode todos:

| # | Comando | Esperado |
|---|---|---|
| 1 | mesmo e-mail duas vezes | `409` — "Ja existe uma conta com esse e-mail" |
| 2 | senha com 3 caracteres | `400` — "A senha deve ter pelo menos 6 caracteres" |
| 3 | confirmação diferente | `400` — "A confirmacao de senha nao confere" |
| 4 | e-mail sem `@` | `400` — "Informe um e-mail valido" |
| 5 | corpo vazio `{}` | `400` — "O nome e obrigatorio" |
| 6 | senha errada no login | `401` — "E-mail ou senha invalidos" |
| 7 | e-mail que não existe | `401` — **a mesma** mensagem |
| 8 | token com uma letra trocada | `401` — "Token invalido" |
| 9 | `Authorization: <token>` sem "Bearer" | `401` — "Formato do token invalido" |

Os comandos:

```bash
# 1
curl -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Ana 2","email":"ana@teste.com","password":"senha123","passwordConfirmation":"senha123"}'

# 2
curl -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Bia Santos","email":"bia@teste.com","password":"123","passwordConfirmation":"123"}'

# 3
curl -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Bia Santos","email":"bia@teste.com","password":"123456","passwordConfirmation":"654321"}'

# 4
curl -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Bia Santos","email":"bia-arroba-teste","password":"123456","passwordConfirmation":"123456"}'

# 5
curl -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{}'

# 6
curl -i -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"errada"}'

# 7
curl -i -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ninguem@existe.com","password":"123456"}'

# 8
curl -i http://localhost:3000/api/products -H "Authorization: Bearer ${TOKEN}xx"

# 9
curl -i http://localhost:3000/api/products -H "Authorization: $TOKEN"
```

### Compare os testes 6 e 7 lado a lado

```json
{"error":"E-mail ou senha invalidos"}
{"error":"E-mail ou senha invalidos"}
```

Idênticos. É exatamente o que a [Etapa 26](26-auth-service.md) explicou: o invasor não descobre quais e-mails existem.

### Teste extra: uma conta desativada

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db \
  -e "UPDATE users SET active = FALSE WHERE email='ana@teste.com';"

curl -i -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@teste.com","password":"senha123"}'
```

```text
HTTP/1.1 401 Unauthorized
{"error":"Esta conta esta desativada"}
```

Repare que essa mensagem **é** específica — porque só chegamos nela depois que a senha foi conferida.

### Limpando os usuários de teste

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db \
  -e "DELETE FROM users WHERE email <> 'professor@estoquefacil.com'; SELECT id,name,email FROM users;"
```

> Esses e outros comandos estão prontos em `database/queries/auth-queries.sql`.

---

## Confira se deu certo

- [ ] `src/modules/auth/` tem os 5 arquivos (validator, repository, service, controller, routes)
- [ ] `src/shared/auth/` tem `token.js` e `ensure-authenticated.js`
- [ ] `GET /api/health` responde sem token
- [ ] `GET /api/products` **sem** token devolve `401`
- [ ] `POST /api/auth/login` com o usuário demo devolve um token
- [ ] `GET /api/products` **com** token devolve a lista
- [ ] `POST /api/auth/register` cria conta e devolve `201`
- [ ] Os 9 testes de erro deram os status esperados

---

## Se deu erro

### `{"error":"Rota nao encontrada: POST /api/auth/login"}`

O `routes/index.js` não tem a linha `routes.use("/auth", authRoutes);`, ou ela está **depois** do `ensureAuthenticated` (aí o 404 viraria 401).

### `/api/products` continua respondendo sem token

A linha `routes.use(ensureAuthenticated);` está abaixo das rotas, ou você esqueceu de reiniciar o container:

```bash
docker compose restart api
```

### `{"error":"Token nao informado"}` mesmo mandando o cabeçalho

No Git Bash, `$TOKEN` pode ter vindo vazio. Confira com `echo $TOKEN`. Se estiver vazio, repita o Teste 4.

Outra causa: aspas erradas. Precisa ser `-H "Authorization: Bearer $TOKEN"` com **aspas duplas** — com aspas simples a variável não é substituída.

### Erro 500 em vez de 401

Olhe o log: `docker compose logs api --tail 30`. Erro 500 significa que algo escapou do `AppError`. O suspeito mais comum é `verifyToken` sem o `try/catch`, deixando o erro cru da biblioteca subir.

### A tela do navegador parou de funcionar

**É esperado nesta etapa.** As telas de produtos, dashboard etc. ainda não mandam token. A partir da [Etapa 31](31-protegendo-o-front.md) elas voltam a funcionar.

---

## Próximo passo

O back-end está pronto e protegido. Agora vamos construir as telas — e, para isso, conhecer uma ferramenta nova.

**[Etapa 28 — Primeiros passos com Vue.js](28-vue-primeiros-passos.md)**
