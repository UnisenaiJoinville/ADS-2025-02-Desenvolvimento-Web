# Aula 26 — O service: bcrypt e o token JWT

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática (código JavaScript)

---

## Objetivo

Escrever o **coração** do módulo de autenticação:

- `src/shared/auth/token.js` — emite e confere o crachá
- `src/modules/auth/auth-service.js` — as regras de cadastro e login

É a aula mais densa deste bloco. Vá com calma.

---

## Antes de começar

- [x] [Aula 25](25-auth-validator-repository.md) concluída
- [x] `user-validator.js` e `user-repository.js` criados
- [x] Você rodou `docker compose up -d --build api` na [Aula 24](24-tabela-usuarios.md)

---

## 1. Por que o token fica em `shared/` e não em `modules/auth/`

Pense em quem vai usar cada coisa:

```text
   src/shared/auth/token.js
        ^                    ^
        |                    |
   auth-service          ensureAuthenticated
   (emite o token)       (confere o token, em TODAS as rotas)
```

O `auth-service` **emite**. O middleware — que na próxima aula vai proteger produtos, categorias, movimentações e dashboard — **confere**.

Como dois lados diferentes do sistema precisam dele, ele não pertence a nenhum módulo em particular. Vai para `shared/`, junto de `errors/` e `http/`.

> 📌 **Regra prática:** se dois módulos precisam do mesmo código, ele sobe para `shared/`. Se só um precisa, fica dentro do módulo.

---

## Passo 1 — O arquivo do token

Crie a pasta `src/shared/auth/` e dentro dela `token.js`:

```javascript
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/app-error.js";

// Gera o cracha do usuario.
// O token NAO e secreto: qualquer um consegue ler o conteudo.
// O que ninguem consegue e FALSIFICAR, porque nao tem o JWT_SECRET.
export function generateToken(user) {
  return jwt.sign(
    // "payload": os dados publicos que viajam dentro do token.
    // Nunca coloque senha ou hash aqui.
    { name: user.name, email: user.email },
    env.auth.jwtSecret,
    {
      // "sub" (subject) e o campo padrao para o dono do token.
      subject: String(user.id),
      expiresIn: env.auth.jwtExpiresIn,
    }
  );
}

// Confere a assinatura e a validade. Se algo estiver errado, recusa.
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.auth.jwtSecret);

    return {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Sessao expirada. Faca login novamente");
    }

    throw new UnauthorizedError("Token invalido");
  }
}
```

Salve.

---

## 2. Dissecando o `token.js`

### 2.1 O payload: o que vai dentro do crachá

```javascript
return jwt.sign(
  // "payload": os dados publicos que viajam dentro do token.
  // Nunca coloque senha ou hash aqui.
  { name: user.name, email: user.email },
  env.auth.jwtSecret,
  {
    subject: String(user.id),
    expiresIn: env.auth.jwtExpiresIn,
  }
);
```

Três argumentos:

| Posição | O que é | Nosso caso |
|---|---|---|
| 1º | O **payload** — o conteúdo | nome e e-mail |
| 2º | O **segredo** que assina | `JWT_SECRET` do `.env` |
| 3º | As **opções** | quem é o dono e por quanto tempo vale |

> ⚠️ Lembre da [Aula 23](23-autenticacao-conceitos.md): o payload é **legível por qualquer um**. Nome e e-mail já são conhecidos pelo próprio usuário, então tudo bem. Senha, hash, CPF ou cartão: jamais.

### 2.2 `subject` e o campo `sub`

```javascript
subject: String(user.id),
```

O JWT tem campos padronizados, com nomes de três letras:

| Campo | Nome completo | O que guarda |
|---|---|---|
| `sub` | *subject* | quem é o dono do token |
| `iat` | *issued at* | quando foi emitido |
| `exp` | *expiration* | quando vence |

Passando `subject` nas opções, a biblioteca preenche o `sub` para nós. O `iat` e o `exp` ela preenche sozinha.

> 🔍 **Por que `String(user.id)`?** A especificação do JWT exige que `sub` seja uma **string**. Se você passar o número `2`, a biblioteca reclama. Por isso, na volta, fazemos `Number(payload.sub)`.

### 2.3 O token pronto, por dentro

Depois de rodar a próxima aula, um token nosso fica assim (quebrado em linhas para caber):

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJuYW1lIjoiUHJvZmVzc29yIERlbW8iLCJlbWFpbCI6InByb2Zlc3NvckBlc3RvcXVlZmFjaWwuY29tIiwiaWF0IjoxNzkwMTE1MjkxLCJleHAiOjE3OTAyMDE2OTEsInN1YiI6IjEifQ
.PorPhLZZff5seKhz95uYOt3OUMwsCH1FeD6D29COwEo
```

O pedaço do meio, decodificado, é:

```json
{
  "name": "Professor Demo",
  "email": "professor@estoquefacil.com",
  "iat": 1790115291,
  "exp": 1790201691,
  "sub": "1"
}
```

Repare que `exp − iat = 86400` segundos = 24 horas = o nosso `JWT_EXPIRES_IN=1d`.

### 2.4 O `verifyToken` e o `try/catch`

```javascript
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.auth.jwtSecret);

    return {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Sessao expirada. Faca login novamente");
    }

    throw new UnauthorizedError("Token invalido");
  }
}
```

O `jwt.verify` faz **duas** checagens de uma vez:

1. A assinatura bate com o `JWT_SECRET`?
2. O `exp` já passou?

Se qualquer uma falhar, ele **lança**. Nós capturamos e traduzimos para o nosso `UnauthorizedError`, que o `error-handler` já sabe virar `401`.

Por que separar o caso do token expirado? Porque a ação do usuário é diferente:

| Erro | O que o usuário pensa | O que deve fazer |
|---|---|---|
| "Sessão expirada" | "ah, fiquei fora muito tempo" | fazer login de novo, tranquilo |
| "Token inválido" | "algo está errado" | idem, mas há algo suspeito |

> 🔍 **Por que traduzir o erro?** Se deixássemos o erro da biblioteca subir, o usuário veria `JsonWebTokenError: invalid signature` — uma mensagem que só faz sentido para quem escreveu a biblioteca. Traduzir erros técnicos em erros de negócio é trabalho do nosso código.

---

## Passo 2 — O service

Crie `src/modules/auth/auth-service.js`:

```javascript
import bcrypt from "bcryptjs";

import { env } from "../../config/env.js";
import { generateToken } from "../../shared/auth/token.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/errors/app-error.js";

import * as repository from "./user-repository.js";
import {
  validateLoginInput,
  validateRegisterInput,
} from "./user-validator.js";

// Monta na mao o que pode sair para o cliente.
// Escolher o que INCLUIR e mais seguro do que lembrar de remover.
function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser(input) {
  const data = validateRegisterInput(input);

  const existing = await repository.findByEmail(data.email);

  if (existing) {
    throw new ConflictError("Ja existe uma conta com esse e-mail");
  }

  // A senha em texto puro morre aqui. Do banco para baixo,
  // so existe o hash - e dele nao se volta para a senha.
  const passwordHash = await bcrypt.hash(data.password, env.auth.saltRounds);

  const created = await repository.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const user = toPublicUser(created);

  return { user, token: generateToken(user) };
}

export async function loginUser(input) {
  const data = validateLoginInput(input);

  const found = await repository.findByEmailWithPassword(data.email);

  // Mensagem unica de proposito: se dissessemos "e-mail nao cadastrado",
  // estariamos confirmando quais e-mails existem no sistema.
  const invalidCredentials = new UnauthorizedError("E-mail ou senha invalidos");

  if (!found) {
    throw invalidCredentials;
  }

  const passwordMatches = await bcrypt.compare(data.password, found.passwordHash);

  if (!passwordMatches) {
    throw invalidCredentials;
  }

  // So depois de provar a senha e que dizemos algo sobre a conta.
  if (!found.active) {
    throw new UnauthorizedError("Esta conta esta desativada");
  }

  const user = toPublicUser(found);

  return { user, token: generateToken(user) };
}

export async function getProfile(id) {
  const user = await repository.findById(id);

  if (!user) {
    throw new NotFoundError("Usuario nao encontrado");
  }

  return user;
}
```

Salve.

---

## 3. Dissecando o cadastro

```javascript
export async function registerUser(input) {
  const data = validateRegisterInput(input);

  const existing = await repository.findByEmail(data.email);

  if (existing) {
    throw new ConflictError("Ja existe uma conta com esse e-mail");
  }

  const passwordHash = await bcrypt.hash(data.password, env.auth.saltRounds);

  const created = await repository.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const user = toPublicUser(created);

  return { user, token: generateToken(user) };
}
```

A sequência é sempre a mesma dos outros services do projeto:

```text
   1. valida      ->  dado limpo e confiável
   2. checa regra ->  e-mail já existe?
   3. transforma  ->  senha vira hash
   4. grava       ->  repositório
   5. devolve     ->  user + token
```

### 3.1 A linha onde a senha morre

```javascript
const passwordHash = await bcrypt.hash(data.password, env.auth.saltRounds);
```

Esta é **a linha mais importante das dez aulas**.

A partir daqui, `data.password` não é usado em lugar nenhum. Ele existe na memória por alguns milissegundos e some com a função. O que segue viagem é o hash.

```text
   "senha123"  ──bcrypt.hash──►  "$2b$10$xkAjZ..MHKd..."
       │                                    │
       └── morre aqui                       └── vai para o banco
```

### 3.2 Por que `await`

O `bcrypt.hash` é lento **de propósito** (lembra do custo 10 da [Aula 23](23-autenticacao-conceitos.md)?). São cerca de 100 milissegundos.

Se fosse síncrono, o Node ficaria 100 ms **inteiramente parado**, sem atender mais ninguém — porque, como vimos no Módulo 1, o Node tem uma única *thread* principal.

Com `await`, o trabalho pesado acontece fora dela e o servidor continua respondendo.

> ⚠️ O `bcryptjs` também oferece `hashSync` e `compareSync`. **Não use** em servidor. Eles travam o processo inteiro.

### 3.3 A checagem de e-mail duplicado

```javascript
const existing = await repository.findByEmail(data.email);

if (existing) {
  throw new ConflictError("Ja existe uma conta com esse e-mail");
}
```

O banco já tem `UNIQUE` em `email`. Então por que checar aqui?

| Sem a checagem | Com a checagem |
|---|---|
| O MySQL lança `ER_DUP_ENTRY` | Erro de negócio limpo |
| Vira erro 500 (falha inesperada) | Vira 409 (Conflict) |
| Usuário vê "Erro interno do servidor" | Usuário vê "Já existe uma conta com esse e-mail" |

O `UNIQUE` continua sendo essencial — ele é a **garantia**. A checagem aqui é a **boa mensagem**.

> 🔍 **Curiosidade honesta:** entre o `findByEmail` e o `create` existe uma janela de milissegundos em que duas requisições simultâneas poderiam passar as duas. Nesse caso raríssimo, o `UNIQUE` do banco barra a segunda e ela vira erro 500. Feio, mas **correto**: nunca vão existir dois usuários com o mesmo e-mail. É exatamente por isso que a garantia fica no banco, e não só no código.

### 3.4 `toPublicUser`: escolher o que sai

```javascript
// Monta na mao o que pode sair para o cliente.
// Escolher o que INCLUIR e mais seguro do que lembrar de remover.
function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
```

Existem duas formas de evitar vazar dados:

```javascript
// Lista negra: "tire o que não pode"
const { passwordHash, ...user } = found;      // ❌ frágil

// Lista branca: "pegue só o que pode"
const user = { id: found.id, name: found.name, email: found.email };  // ✅
```

A primeira depende de você **lembrar** de acrescentar cada campo novo perigoso. A segunda é segura por padrão: campo novo não sai até alguém escrever que ele sai.

---

## 4. Dissecando o login

```javascript
export async function loginUser(input) {
  const data = validateLoginInput(input);

  const found = await repository.findByEmailWithPassword(data.email);

  const invalidCredentials = new UnauthorizedError("E-mail ou senha invalidos");

  if (!found) {
    throw invalidCredentials;
  }

  const passwordMatches = await bcrypt.compare(data.password, found.passwordHash);

  if (!passwordMatches) {
    throw invalidCredentials;
  }

  if (!found.active) {
    throw new UnauthorizedError("Esta conta esta desativada");
  }

  const user = toPublicUser(found);

  return { user, token: generateToken(user) };
}
```

### 4.1 `bcrypt.compare`: a mágica que não é mágica

```javascript
const passwordMatches = await bcrypt.compare(data.password, found.passwordHash);
```

O que acontece aqui dentro:

```text
   1. Lê o salt que está DENTRO do hash guardado
   2. Aplica o hash na senha digitada, usando aquele mesmo salt
   3. Compara os dois resultados
   4. Devolve true ou false
```

Repare: nada foi descriptografado. O hash continua sendo de mão única. Nós só refizemos o mesmo caminho de ida.

É por isso que o salt precisa ficar **dentro** do hash: sem ele, seria impossível refazer o cálculo.

### 4.2 A mesma mensagem para dois erros diferentes

```javascript
const invalidCredentials = new UnauthorizedError("E-mail ou senha invalidos");
```

Criamos **um** objeto de erro e o lançamos nos dois casos: e-mail inexistente e senha errada.

Por quê? Veja o que aconteceria com mensagens específicas:

```text
   Invasor testa: ana@empresa.com
   Resposta: "senha incorreta"     -> "ótimo, a Ana TEM conta aqui"

   Invasor testa: bruno@empresa.com
   Resposta: "e-mail não cadastrado" -> "ok, o Bruno não tem"
```

Em poucos minutos ele monta a lista de todos os clientes da empresa — sem descobrir uma senha sequer. Isso se chama **enumeração de usuários**.

> 📌 Você vai reparar nisso em qualquer site sério: a mensagem é sempre "e-mail ou senha inválidos", nunca uma das duas.

### 4.3 A ordem das checagens é uma decisão de segurança

Olhe com atenção a ordem:

```text
   1. o usuário existe?     -> se não, erro genérico
   2. a senha bate?         -> se não, erro genérico
   3. a conta está ativa?   -> se não, erro ESPECÍFICO
```

Por que "conta desativada" vem **depois** da senha, e não antes?

Se viesse antes, bastaria digitar qualquer senha para descobrir quais contas existem e estão bloqueadas. Só dizemos algo específico **depois** que a pessoa provou que é ela mesma.

```javascript
// So depois de provar a senha e que dizemos algo sobre a conta.
if (!found.active) {
  throw new UnauthorizedError("Esta conta esta desativada");
}
```

> 💡 Troque as duas checagens de lugar mentalmente e veja como uma linha fora de ordem vira um problema de segurança. É por isso que segurança se revisa lendo o código, não só testando a tela.

### 4.4 O que o service devolve

```javascript
return { user, token: generateToken(user) };
```

Sempre a mesma dupla, no cadastro e no login:

```json
{
  "user": { "id": 1, "name": "Professor Demo", "email": "professor@estoquefacil.com" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Parte | Para que o front usa |
|---|---|
| `user` | mostrar o nome no menu, sem precisar decodificar o token |
| `token` | mandar em toda requisição seguinte |

### 4.5 Por que o cadastro já devolve token

Poderíamos devolver só o usuário e obrigar um login em seguida. Devolvemos o token porque:

- quem acabou de provar que sabe a senha **está autenticado**, por definição;
- permite a experiência "cadastrou, já entrou", comum em apps.

Nas nossas telas, ainda assim vamos mandar a pessoa para o login depois do cadastro — é mais claro em aula, e reforça que são dois passos. Fazer o cadastro entrar direto é um exercício da [Aula 32](32-teste-final-autenticacao.md).

---

## 5. O `getProfile`

```javascript
export async function getProfile(id) {
  const user = await repository.findById(id);

  if (!user) {
    throw new NotFoundError("Usuario nao encontrado");
  }

  return user;
}
```

Serve para a rota `GET /api/auth/me`, que o front usa para perguntar "meu token ainda vale?".

> 🔍 **Como o usuário pode não existir se o token é válido?** O token vale 1 dia. Se a conta for excluída do banco nesse meio tempo, o token continua criptograficamente válido mas aponta para ninguém. Buscar no banco em vez de confiar cegamente no token cobre esse caso.

---

## 6. Nenhuma camada sabe demais

Vale parar e olhar o que cada arquivo conhece:

| Arquivo | Conhece HTTP? | Conhece SQL? | Conhece bcrypt? |
|---|---|---|---|
| `user-validator.js` | não | não | não |
| `user-repository.js` | não | **sim** | não |
| `auth-service.js` | não | não | **sim** |
| `token.js` | não | não | não |

O service não sabe o que é `request` nem `response`. O repositório não sabe o que é hash — para ele, `passwordHash` é um texto qualquer que vai para uma coluna.

É a regra de ouro da [Aula 00](00-visao-geral.md) valendo também aqui.

---

## ✅ Confira se deu certo

Ainda não há rota: ninguém chama o service. Confira que o servidor continua subindo:

```bash
docker compose logs api --tail 10
```

```text
estoque-api  | Conexao com o MySQL estabelecida
estoque-api  | Servidor rodando em http://localhost:3000
```

- [ ] `src/shared/auth/token.js` existe
- [ ] `src/modules/auth/auth-service.js` existe
- [ ] O log não mostra erro
- [ ] `curl http://localhost:3000/api/health` responde

---

## 🔧 Se deu erro

### `Cannot find package 'bcryptjs'` ou `'jsonwebtoken'`

A imagem não foi reconstruída depois que você editou o `package.json`:

```bash
docker compose up -d --build api
```

### `secretOrPrivateKey must have a value`

O `JWT_SECRET` chegou vazio ao container:

```bash
docker compose up -d api
docker compose exec api printenv JWT_SECRET
```

### `"expiresIn" should be a number of seconds or string representing a timespan`

O `JWT_EXPIRES_IN` está com formato inválido. Valores aceitos: `60`, `"15m"`, `"2h"`, `"1d"`, `"7d"`. Não vale `"1 dia"` nem `"24"` entre aspas com espaço.

### `Error: Invalid salt version` ao comparar

O valor em `password_hash` não é um hash bcrypt válido — provavelmente alguém gravou a senha em texto puro direto no banco. Confira:

```sql
SELECT email, LEFT(password_hash, 4), CHAR_LENGTH(password_hash) FROM users;
```

Deve mostrar `$2b$` e `60`.

---

## ➡️ Próximo passo

O cérebro está pronto. Falta abrir as portas — e trancar as que já existiam.

**[Aula 27 — Controller, rotas e o middleware que protege a API](27-auth-rotas-e-middleware.md)**
