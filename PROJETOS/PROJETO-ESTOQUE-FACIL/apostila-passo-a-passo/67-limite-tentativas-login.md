# Aula 67 — Limite de tentativas no login

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** prática (back-end + configuração)

---

## Objetivo

Impedir que um robô tente milhares de senhas em `POST /api/auth/login`:

- instalar o pacote **`express-rate-limit`**;
- limitar o login a **5 tentativas erradas a cada 15 minutos** por IP;
- limitar também o **cadastro**;
- responder com o status certo (`429`) e no formato de erro do projeto;
- entender o `trust proxy`, sem o qual o limite **não funciona** atrás do Caddy.

> 🔍 Esta aula resolve o **desafio 9** da [Aula 59](59-teste-final-hospedagem.md).

---

## Antes de começar

- [ ] [Aula 66](66-carregamento-acessibilidade.md) concluída
- [ ] Node instalado **no seu computador** (Aula 01): `node -v`

---

## Arquivos desta aula

```text
NOVO ARQUIVO
└── src/shared/http/rate-limit.js

ARQUIVOS ALTERADOS
├── package.json  e  package-lock.json   (nova dependencia)
├── src/config/env.js                    (TRUST_PROXY)
├── src/app.js                           (trust proxy)
├── src/modules/auth/auth-routes.js      (os limitadores)
├── .env.example  e  .env.production.example
```

---

## 1. O ataque de força bruta

Na [Aula 26](26-auth-service.md), o `bcrypt` deixou **cada** verificação de senha lenta de propósito (~100 ms). Isso dificulta quebrar um hash **roubado**. Mas não impede alguém de **perguntar** à API:

```text
   robo:  POST /login  { "email": "professor@...", "password": "123456" }   -> 401
          POST /login  { "email": "professor@...", "password": "senha123" } -> 401
          POST /login  { "email": "professor@...", "password": "admin" }    -> 401
          ... 10.000 senhas da lista das mais comuns ...
          POST /login  { "email": "professor@...", "password": "estoque1" } -> 200  🔓
```

Sem limite, é questão de tempo. E cada tentativa custa **CPU do seu servidor** (o bcrypt é caro também para você).

### As defesas que já temos e a que falta

| Camada | Protege | Aula |
|---|---|---|
| Fail2ban | o **SSH** do servidor | [52](52-firewall-fail2ban-atualizacoes.md) |
| bcrypt lento | o hash, se o banco vazar | [26](26-auth-service.md) |
| Mensagem genérica ("E-mail ou senha invalidos") | não revela quais e-mails existem | [26](26-auth-service.md) |
| **Limite de tentativas** | **o login da API** | **esta aula** |

### Como funciona um *rate limiter*

```text
   IP 189.40.1.7          janela de 15 minutos
   ─────────────          ──────────────────────────────────────────►
   tentativa errada 1     ●
   tentativa errada 2       ●
   tentativa errada 3          ●
   tentativa errada 4            ●
   tentativa errada 5               ●
   tentativa 6                        ✋ 429 Too Many Requests
   ...                                   (bloqueado ate a janela acabar)
```

O limitador guarda um **contador por IP**. Passou do limite dentro da janela, a requisição é recusada **antes** de chegar ao controller (e ao bcrypt).

---

## Passo 1 — Instalar o pacote

No terminal, **na pasta do projeto** (no seu computador, não no container):

```bash
npm install express-rate-limit@7.5.0
```

Esse comando faz duas coisas:

1. acrescenta `"express-rate-limit": "^7.5.0"` no `package.json`;
2. **atualiza o `package-lock.json`**, que o `npm ci` da produção ([Aula 47](47-preparando-arquivos-producao.md)) exige.

> ⚠️ **Por que no seu computador?** O container de desenvolvimento só enxerga as pastas `src` e `public` ([Aula 05](05-docker-compose.md)); o `package.json` dele é uma **cópia** feita na hora do build. Instalar dentro do container não mudaria os arquivos do projeto. A pasta `node_modules` que aparece na sua máquina não atrapalha: o `.dockerignore` (Aula 04) a deixa de fora da imagem.

Agora reconstrua a imagem, como na [Aula 24](24-tabela-usuarios.md):

```bash
docker compose up -d --build api
```

> 📌 **A regra continua:** mexeu no `package.json`, reconstrua a imagem.

---

## Passo 2 — Os limitadores

Crie `src/shared/http/rate-limit.js`:

```javascript
import rateLimit from "express-rate-limit";

// Responde no MESMO formato de todos os erros da API: { "error": "..." }.
// Assim o api.js do front mostra a mensagem sem precisar de nada novo.
function tooManyRequests(message) {
  return (request, response, next, options) => {
    response.status(options.statusCode).json({ error: message });
  };
}

// Login: 5 tentativas ERRADAS a cada 15 minutos, por IP (Aula 67).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  // Login que deu certo nao gasta tentativa: so os erros contam.
  skipSuccessfulRequests: true,
  // Cabecalhos "RateLimit" padronizados, que dizem quantas restam.
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests(
    "Muitas tentativas de login. Aguarde 15 minutos e tente de novo"
  ),
});

// Cadastro: 10 contas por hora, por IP. Impede encher o banco de contas falsas.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests(
    "Muitos cadastros a partir deste endereco. Tente novamente mais tarde"
  ),
});
```

Salve.

### 🔍 As opções

| Opção | Valor | Significado |
|---|---|---|
| `windowMs` | `15 * 60 * 1000` | a janela, em **milissegundos** (15 min) |
| `limit` | `5` | quantas requisições cabem na janela |
| `skipSuccessfulRequests` | `true` | respostas abaixo de 400 (login certo) **não** contam |
| `standardHeaders` | `"draft-7"` | manda o cabeçalho `RateLimit: limit=5, remaining=2, reset=840` |
| `legacyHeaders` | `false` | não manda os antigos `X-RateLimit-*` (duplicados) |
| `handler` | função | o que responder quando estourar |

### 🔍 Por que `skipSuccessfulRequests`

Sem ele, quem faz login certo 5 vezes numa manhã (abriu em vários computadores, a sessão venceu...) seria **bloqueado**. O que queremos frear são os **erros** em sequência. Quem acerta a senha não é suspeito.

No cadastro **não** usamos essa opção: um robô criando contas falsas **acerta** todas (201), e é justamente isso que queremos limitar.

### 🔍 `15 * 60 * 1000` em vez de `900000`

O resultado é o mesmo, mas `15 * 60 * 1000` **se lê** como "15 minutos". O número mágico `900000` obriga quem lê a fazer a conta.

### 🔍 O `handler` e o formato `{ error }`

Por padrão, o `express-rate-limit` responde com um texto simples. O nosso front espera `{ "error": "..." }` desde a [Aula 08](08-tratamento-de-erros.md), e o `toAppError` do `api.js` ([Aula 61](61-axios-no-lugar-do-fetch.md)) lê `error.response.data.error`. Com o `handler`, a mensagem aparece na tela de login **sem mudar uma linha do front**.

### 🔍 Por que `429`?

`429 Too Many Requests` é o status HTTP feito exatamente para isto. Ele diz ao cliente: "o pedido está certo, mas você pediu vezes demais; espere". O `options.statusCode` já vale `429`.

---

## Passo 3 — Ligar nas rotas

Abra `src/modules/auth/auth-routes.js`:

```javascript
import { Router } from "express";

import { ensureAuthenticated } from "../../shared/auth/ensure-authenticated.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { loginLimiter, registerLimiter } from "../../shared/http/rate-limit.js";

import * as controller from "./auth-controller.js";

export const authRoutes = Router();

// Rotas PUBLICAS: quem ainda nao tem conta precisa poder chegar aqui.
// Por serem publicas, sao as que mais precisam de limite (Aula 67).
authRoutes.post("/register", registerLimiter, asyncHandler(controller.register));
authRoutes.post("/login", loginLimiter, asyncHandler(controller.login));

// Rota PROTEGIDA: serve para o front perguntar "meu token ainda vale?".
authRoutes.get("/me", ensureAuthenticated, asyncHandler(controller.profile));
```

Salve.

### 🔍 O middleware no meio da rota

É o mesmo desenho do `ensureAuthenticated` da [Aula 27](27-auth-rotas-e-middleware.md):

```text
   POST /api/auth/login
          |
          v
   loginLimiter ──── estourou? ───► 429, fim (o bcrypt nem roda)
          | ok
          v
   controller.login ──► bcrypt ──► 200 ou 401
          |
          v
   o limitador olha o status: 401 conta, 200 nao conta
```

> 🔍 **Por que não limitar a API inteira?** Poderíamos (`app.use(limiter)`), com um limite alto, contra abuso geral. Mas a tela de Produtos com busca ao vivo faz várias requisições por minuto, legítimas. O risco que motivou a aula é **o login**: limite apertado onde dói, nada onde não precisa. (Um limite geral é um bom exercício.)

---

## Passo 4 — Testar em desenvolvimento

O `node --watch` reinicia a API ao salvar. Em dúvida: `docker compose restart api`.

### 4.1 Cinco erros e o bloqueio (Git Bash)

```bash
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "tentativa $i: %{http_code}\n" \
    -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"professor@estoquefacil.com","password":"errada"}'
done
```

✅ **Esperado:**

```text
tentativa 1: 401
tentativa 2: 401
tentativa 3: 401
tentativa 4: 401
tentativa 5: 401
tentativa 6: 429
```

### 4.2 Agora com a senha **certa**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"123456"}'
```

✅ **Esperado:**

```json
{"error":"Muitas tentativas de login. Aguarde 15 minutos e tente de novo"}
```

> 🔍 **Até a senha certa é recusada.** Parece ruim, mas é o ponto: se a senha certa passasse, o robô saberia que **acertou** (200 em vez de 429) e o bloqueio não protegeria nada. Durante o bloqueio, **nenhuma** tentativa daquele IP é avaliada.

### 4.3 Os cabeçalhos

```bash
curl -s -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@estoquefacil.com","password":"errada"}' | head -15
```

Procure:

```text
HTTP/1.1 429 Too Many Requests
RateLimit-Policy: 5;w=900
RateLimit: limit=5, remaining=0, reset=812
```

| Cabeçalho | Diz |
|---|---|
| `RateLimit-Policy: 5;w=900` | "a regra é 5 por janela de 900 segundos" |
| `remaining=0` | "você não tem mais tentativas" |
| `reset=812` | "faltam 812 segundos para liberar" |

### 4.4 Na tela

Abra `/login.html` (saia antes, se estiver logado) e tente entrar.

✅ **Esperado:** a faixa vermelha mostra "Muitas tentativas de login. Aguarde 15 minutos e tente de novo". Nenhuma linha do `login.js` mudou.

### 4.5 Como desbloquear durante a aula

O contador fica **na memória** da API. Reiniciar zera tudo:

```bash
docker compose restart api
```

> ⚠️ **Isso também vale em produção:** a cada `dc up -d --build` (deploy), os contadores zeram. E, se um dia a API rodar em **várias** cópias, cada uma terá o seu contador. Para esses casos, o `express-rate-limit` aceita guardar os contadores num banco compartilhado (Redis, por exemplo). Para um servidor só, a memória basta.

---

## 2. O problema do proxy: `trust proxy`

Até aqui, tudo funciona **no seu computador**. Em produção, há um detalhe que quebra o limitador.

### Quem a API enxerga como "cliente"

```text
   DESENVOLVIMENTO                      PRODUÇÃO (Aula 56)

   navegador ──────► API                 navegador ──► Caddy ──► API
   IP: 172.18.0.1                        IP real:      IP que a API vê:
                                         189.40.1.7    172.20.0.4  (o Caddy!)
```

Em produção, **todas** as requisições chegam à API vindas do **Caddy**. Para o limitador, existe **um único cliente** no mundo inteiro. Consequência:

```text
   robô erra 5 senhas  ──►  o IP do CADDY é bloqueado  ──►  NINGUÉM consegue fazer login
```

Um único atacante tiraria o login do ar para todos os usuários. O limitador viraria uma **arma** contra o próprio sistema.

### O IP real está num cabeçalho

O Caddy, ao repassar a requisição, acrescenta um cabeçalho com o IP original:

```text
X-Forwarded-For: 189.40.1.7
```

Mas o Express **não confia** nesse cabeçalho por padrão, e com razão: qualquer um pode mandá-lo.

```bash
# Sem proxy na frente, qualquer pessoa "inventa" o proprio IP:
curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:3000/api/auth/login ...
```

Se a API confiasse cegamente, o robô trocaria o IP falso a cada tentativa e **nunca** seria bloqueado.

### A regra

| Ambiente | Tem proxy na frente? | `trust proxy` | O IP vem de |
|---|---|---|---|
| Desenvolvimento | não | **desligado** | a conexão (não dá para falsificar) |
| Produção | sim, **um** (Caddy) | **`1`** | o `X-Forwarded-For` escrito **pelo Caddy** |

O `1` significa "confie em **um** salto de proxy": o Express pega o IP que o **Caddy** anotou, e ignora qualquer coisa que o cliente tenha tentado inventar antes dele.

> 📌 **Configuração de segurança que depende do ambiente vai para o `.env`**, como o `JWT_SECRET`. O mesmo código roda certo nos dois lugares.

---

## Passo 5 — O `TRUST_PROXY` no `env.js`

Abra `src/config/env.js` e acrescente a propriedade no objeto `env` (no fim dele, antes do `};`):

```javascript
  // "true" somente quando ha um proxy (Caddy) na frente da API (Aula 67).
  // Em desenvolvimento fica desligado: sem proxy, o cabecalho
  // X-Forwarded-For poderia ser inventado por qualquer um.
  trustProxy: process.env.TRUST_PROXY === "true",
```

Salve.

> 🔍 **`=== "true"`**, e não `Boolean(...)`: lembra da armadilha da [Aula 12](12-crud-produtos.md)? `Boolean("false")` é `true`. Variável de ambiente é **sempre texto**.

## Passo 6 — O `app.js`

Abra `src/app.js`.

Acrescente o import do `env`, junto dos outros:

```javascript
import express from "express";

import { env } from "./config/env.js";
import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler.js";
```

E, logo depois de `export const app = express();`:

```javascript
export const app = express();

// Atras do Caddy (producao), o IP real do cliente vem no cabecalho
// X-Forwarded-For. "1" = confie em UM proxy: o Caddy (Aula 67).
// Sem isto, o limite de login bloquearia todo mundo junto.
if (env.trustProxy) {
  app.set("trust proxy", 1);
}
```

Salve.

## Passo 7 — Os arquivos de variáveis

No `.env.example` (desenvolvimento), acrescente no final:

```bash
# ---------------------------------------------------------
# Proxy (Aula 67)
# ---------------------------------------------------------
# "true" SOMENTE quando houver um proxy (Caddy) na frente da API.
# Em desenvolvimento, deixe false.
TRUST_PROXY=false
```

Faça o mesmo no seu `.env`.

No `.env.production.example` (Aula 47), acrescente:

```bash
# A API fica atras do Caddy: o IP real vem no X-Forwarded-For (Aula 67)
TRUST_PROXY=true
```

> ⚠️ **No servidor**, o `.env` de produção **não** é enviado pelo `tar` (Aula 55). Acrescente `TRUST_PROXY=true` à mão no `.env` que está no servidor, antes do próximo deploy.

---

## Passo 8 — Testar o comportamento de produção (opcional)

Se você tem o ensaio local da [Aula 47](47-preparando-arquivos-producao.md) (Caddy na porta 8080):

1. Coloque `TRUST_PROXY=true` no `.env` usado pelo ensaio
2. Suba com `docker compose -f docker-compose.prod.yml up -d --build`
3. Rode o laço do Passo 4.1 contra `http://localhost:8080/api/auth/login`

✅ **Esperado:** 5 × `401` e depois `429`.

Agora veja o log da API:

```bash
docker compose -f docker-compose.prod.yml logs api --tail 20
```

✅ Não deve haver nenhum aviso `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`. Esse aviso aparece quando o `express-rate-limit` recebe um `X-Forwarded-For` mas o `trust proxy` está desligado: é ele dizendo "parece que você esqueceu o `trust proxy`".

---

## ✅ Confira se deu certo

- [ ] `express-rate-limit` está no `package.json` **e** no `package-lock.json`
- [ ] A imagem foi reconstruída (`--build`)
- [ ] 5 senhas erradas dão `401`; a 6ª dá `429`
- [ ] Durante o bloqueio, até a senha certa recebe `429`
- [ ] Login certo **não** gasta tentativa
- [ ] A resposta `429` vem no formato `{ "error": "..." }`
- [ ] A tela de login mostra a mensagem sem nenhuma alteração no front
- [ ] O `trust proxy` só liga com `TRUST_PROXY=true`
- [ ] `.env.example` e `.env.production.example` documentam a variável

---

## 🔧 Se deu erro

### `Cannot find package 'express-rate-limit'`

A imagem não foi reconstruída. `docker compose up -d --build api`.

### Nunca chega no `429`

- Confira se o `loginLimiter` está **entre** o caminho e o `asyncHandler` na rota.
- Se você estiver testando com a **senha certa**, ela não conta (`skipSuccessfulRequests`). Use uma senha errada.

### O `429` chega como texto, e a tela mostra "Erro ao comunicar com o servidor"

Faltou o `handler: tooManyRequests(...)`. Sem ele, a resposta não tem o `{ error }`.

### Em produção, uma pessoa errou a senha e **ninguém** mais consegue entrar

O `trust proxy` está desligado: todos aparecem com o IP do Caddy. Confira `TRUST_PROXY=true` no `.env` **do servidor** e reinicie a API.

### Log com `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`

Mesmo caso: chegou um `X-Forwarded-For`, mas o `trust proxy` está desligado. Em produção, ligue. Em desenvolvimento, alguém está mandando esse cabeçalho de propósito (talvez você, testando).

### `npm ci` falha no servidor: `package.json and package-lock.json are not in sync`

Você editou o `package.json` à mão em vez de usar `npm install`. Rode `npm install` na pasta do projeto, no seu computador, e gere o pacote de novo.

---

## 💡 Para ir além

1. **Mostre quantas tentativas restam.** O cabeçalho `RateLimit` traz o `remaining`. No `api.js`, ele está em `error.response.headers["ratelimit"]`. Faça a tela de login mostrar "Restam 2 tentativas".
2. **Limite por e-mail também.** Um atacante com muitos IPs (uma *botnet*) contorna o limite por IP. Pesquise a opção `keyGenerator` e crie um segundo limitador que conte por e-mail.
3. **Limite geral.** Crie um limitador de, por exemplo, 300 requisições por minuto para `/api` inteira, contra abuso em geral.

---

## ➡️ Próximo passo

Segurança reforçada. Agora uma melhoria visual que todo dashboard merece: um gráfico.

**[Aula 68 — Gráfico de movimentações no dashboard](68-grafico-dashboard.md)**
