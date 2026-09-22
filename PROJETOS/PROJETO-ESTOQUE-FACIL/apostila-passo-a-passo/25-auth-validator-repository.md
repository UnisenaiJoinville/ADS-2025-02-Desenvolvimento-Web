# Etapa 25 — O módulo `auth`: validador e repositório

**Tipo:** prática (código JavaScript)

**Tempo estimado:** 45 minutos

---

## Objetivo

Criar as **duas camadas de baixo** do módulo de autenticação, seguindo exatamente o mesmo padrão dos outros três módulos:

- `user-validator.js` — limpa e valida o que chega de fora
- `user-repository.js` — conversa com a tabela `users`

E, de quebra, acrescentar dois erros novos ao projeto.

---

## Antes de começar

- [ ] [Etapa 24](24-tabela-usuarios.md) concluída (tabela `users` criada, bibliotecas instaladas)
- [ ] `docker compose logs api --tail 5` mostra o servidor rodando

---

## A ordem em que vamos criar os arquivos

Igual à [Etapa 11](11-crud-categorias.md): **de baixo para cima**.

```text
   5. auth-routes.js       (Etapa 27)
            ^
   4. auth-controller.js   (Etapa 27)
            ^
   3. auth-service.js      (Etapa 26)
            ^
   2. user-repository.js   <- HOJE
            ^
   1. user-validator.js    <- HOJE
```

> **Por que os arquivos começam com `user-` e não com `auth-`?** Porque eles tratam da **entidade** usuário (validar um usuário, gravar um usuário). Os arquivos `auth-` tratam do **caso de uso** autenticação. É uma distinção que aparece em projetos maiores: uma coisa é o que o dado *é*, outra é o que se *faz* com ele.

Todos os arquivos ficam em `src/modules/auth/`.

---

## Passo 1 — Os erros novos

Antes do módulo, precisamos de dois tipos de erro que ainda não existem.

Abra `src/shared/errors/app-error.js` e acrescente **no final**:

```javascript
// 401: "eu nao sei quem voce e" - falta token, token invalido ou senha errada.
export class UnauthorizedError extends AppError {
  constructor(message = "Nao autenticado") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

// 403: "eu sei quem voce e, mas voce nao pode fazer isso".
export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}
```

Salve.

### Por que isso já funciona sozinho

Reveja o `error-handler.js` da [Etapa 08](08-tratamento-de-erros.md):

```javascript
if (error instanceof AppError) {
  return response.status(error.statusCode).json({ error: error.message });
}
```

Ele não conhece `UnauthorizedError` — e nem precisa. Como a nova classe **estende** `AppError`, o `instanceof` continua verdadeiro e o `statusCode` sai certo.

> Isso é herança sendo útil de verdade: você acrescenta comportamento novo **sem editar** o código que já funcionava. Repare que não mexemos em uma linha sequer do `error-handler.js`.

O `ForbiddenError` não será usado nestas etapas — ele fica pronto para o exercício de perfis de usuário da [Etapa 32](32-teste-final-autenticacao.md).

---

## Passo 2 — O validador

Crie a pasta `src/modules/auth/` e, dentro dela, o arquivo `user-validator.js`:

```javascript
import { AppError } from "../../shared/errors/app-error.js";

// Regra simples e suficiente para a aula: algo@algo.algo,
// sem espacos. Validacao de e-mail perfeita nao existe -
// a prova real e mandar uma mensagem para o endereco.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 6;

function parseName(value) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");

  if (!name) {
    throw new AppError("O nome e obrigatorio");
  }

  if (name.length < 3) {
    throw new AppError("O nome deve ter pelo menos 3 caracteres");
  }

  if (name.length > 120) {
    throw new AppError("O nome deve ter no maximo 120 caracteres");
  }

  return name;
}

function parseEmail(value) {
  // E-mail sempre em minusculas: "Ana@x.com" e "ana@x.com"
  // sao a MESMA pessoa. Normalizar aqui evita conta duplicada.
  const email = String(value ?? "").trim().toLowerCase();

  if (!email) {
    throw new AppError("O e-mail e obrigatorio");
  }

  if (email.length > 160) {
    throw new AppError("O e-mail deve ter no maximo 160 caracteres");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Informe um e-mail valido");
  }

  return email;
}

function parsePassword(value) {
  // Senha NAO leva trim: espaco no inicio ou no fim pode ser
  // proposital. Quem digita a senha decide como ela e.
  const password = String(value ?? "");

  if (!password) {
    throw new AppError("A senha e obrigatoria");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
    );
  }

  if (password.length > 72) {
    // Limite do proprio algoritmo bcrypt: ele ignora o que passa disso.
    throw new AppError("A senha deve ter no maximo 72 caracteres");
  }

  return password;
}

export function validateRegisterInput(input) {
  const name = parseName(input?.name);
  const email = parseEmail(input?.email);
  const password = parsePassword(input?.password);

  const passwordConfirmation = String(input?.passwordConfirmation ?? "");

  if (password !== passwordConfirmation) {
    throw new AppError("A confirmacao de senha nao confere");
  }

  return { name, email, password };
}

export function validateLoginInput(input) {
  const email = String(input?.email ?? "").trim().toLowerCase();
  const password = String(input?.password ?? "");

  // No login nao detalhamos o que faltou por seguranca:
  // a mensagem e sempre a mesma, para nao entregar pistas.
  if (!email || !password) {
    throw new AppError("Informe e-mail e senha");
  }

  return { email, password };
}
```

Salve.

---

## 3. Dissecando o validador

Este arquivo é curto, mas cada decisão tem motivo. Vamos por partes.

### 3.1 A expressão regular do e-mail

```javascript
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

Lendo em voz alta:

| Trecho | Significa |
|---|---|
| `^` | começo do texto |
| `[^\s@]+` | um ou mais caracteres que **não** sejam espaço nem `@` |
| `@` | um arroba literal |
| `[^\s@]+` | de novo, um ou mais que não sejam espaço nem `@` |
| `\.` | um ponto literal (com `\` porque `.` sozinho significa "qualquer caractere") |
| `[^\s@]+` | e mais um pedaço |
| `$` | fim do texto |

Ou seja: **algo@algo.algo**, sem espaços.

> **Isso valida e-mail de verdade?** Não, e nem tenta. A regra oficial de e-mail (RFC 5322) tem centenas de linhas e ainda assim aceita endereços que não existem. A única validação real é mandar uma mensagem e ver se chega. O que fazemos aqui é pegar erro de digitação, não garantir existência.

### 3.2 Nome: por que `replace(/\s+/g, " ")`

```javascript
const name = String(value ?? "").trim().replace(/\s+/g, " ");
```

É a mesma linha do `category-validator.js` da [Etapa 11](11-crud-categorias.md). Ela transforma:

```text
"   Ana      Paula   Souza  "   ->   "Ana Paula Souza"
```

### 3.3 Senha: por que **não** tem `trim()`

Aqui está a diferença mais importante:

```javascript
// Senha NAO leva trim: espaco no inicio ou no fim pode ser
// proposital. Quem digita a senha decide como ela e.
const password = String(value ?? "");
```

| Campo | Leva `trim()`? | Por quê |
|---|---|---|
| `name` | Sim | Espaço nas pontas é sempre erro de digitação |
| `email` | Sim | Idem — e e-mail não tem espaço |
| `password` | **Não** | `" senha "` pode ser exatamente a senha que a pessoa escolheu |

Se você aplicasse `trim()` na senha, o cadastro gravaria o hash de `"senha"` e o login também faria `trim()` — funcionaria. Mas no dia em que alguém esquecesse o `trim()` de um lado só, o usuário ficaria trancado para fora sem entender por quê.

> **Regra:** senha se usa **exatamente** como foi digitada. Nada de normalizar.

### 3.4 E-mail sempre em minúsculas

```javascript
const email = String(value ?? "").trim().toLowerCase();
```

Para uma pessoa, `Ana@Empresa.com` e `ana@empresa.com` são o mesmo endereço. Se não normalizássemos, a mesma pessoa criaria duas contas sem perceber — e o `UNIQUE` do banco não impediria, porque para o MySQL são textos diferentes.

Normalizamos **no cadastro e no login**, sempre no mesmo lugar: aqui.

### 3.5 O limite de 72 caracteres

```javascript
if (password.length > 72) {
  // Limite do proprio algoritmo bcrypt: ele ignora o que passa disso.
  throw new AppError("A senha deve ter no maximo 72 caracteres");
}
```

Curiosidade real: o bcrypt trunca a senha em 72 bytes. Uma senha de 100 caracteres e outra de 200 que comecem igual teriam o **mesmo hash**.

Em vez de deixar o usuário achar que tem uma senha gigante e segura, avisamos.

### 3.6 Duas funções de validação, não uma

```javascript
export function validateRegisterInput(input) { ... }
export function validateLoginInput(input) { ... }
```

Cadastro e login recebem coisas parecidas, mas as regras são **opostas**:

| | Cadastro | Login |
|---|---|---|
| Nome | obrigatório | não existe |
| Confirmação de senha | obrigatória | não existe |
| Senha curta | recusa com mensagem clara | **não checa** |
| Mensagem de erro | específica | genérica |

Por que o login não checa o tamanho da senha? Porque a resposta "a senha deve ter 6 caracteres" conta ao invasor que a senha daquela conta **não tem** 6 caracteres. Informação de graça para quem está tentando invadir.

```javascript
// No login nao detalhamos o que faltou por seguranca:
// a mensagem e sempre a mesma, para nao entregar pistas.
if (!email || !password) {
  throw new AppError("Informe e-mail e senha");
}
```

> **Princípio:** mensagens de erro de login são vagas de propósito. Mensagens de erro de cadastro são detalhadas de propósito. São públicos diferentes.

---

## Passo 3 — O repositório

Crie `src/modules/auth/user-repository.js`:

```javascript
import { pool } from "../../config/database.js";

// Colunas que podem sair daqui para o resto do sistema.
// password_hash NUNCA entra nesta lista.
const PUBLIC_COLUMNS = `id,
       name,
       email,
       active,
       created_at AS createdAt`;

// O MySQL devolve BOOLEAN como 0/1. Normalizamos para true/false.
function toUser(row) {
  if (!row) return undefined;

  return { ...row, active: Boolean(row.active) };
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`,
    [id]
  );

  return toUser(rows[0]);
}

// A UNICA funcao que devolve o hash - e ela existe so para o login.
export async function findByEmailWithPassword(email) {
  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash AS passwordHash, active
       FROM users
      WHERE email = ?`,
    [email]
  );

  return toUser(rows[0]);
}

export async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ?`,
    [email]
  );

  return toUser(rows[0]);
}

export async function create({ name, email, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  );

  return findById(result.insertId);
}
```

Salve.

---

## 4. Dissecando o repositório

### 4.1 A lista de colunas públicas

```javascript
const PUBLIC_COLUMNS = `id,
       name,
       email,
       active,
       created_at AS createdAt`;
```

Repare no que **não** está aí: `password_hash`.

Esta constante existe justamente para isso. Se amanhã alguém acrescentar uma função `findAll()` e usar `PUBLIC_COLUMNS`, o hash não vaza por descuido.

> **Nunca escreva `SELECT *` numa tabela de usuários.** Com `*`, qualquer coluna nova (o hash, um token de recuperação, um CPF) passa a ser devolvida automaticamente para quem chamar. Liste as colunas.

### 4.2 A única função que devolve o hash

```javascript
// A UNICA funcao que devolve o hash - e ela existe so para o login.
export async function findByEmailWithPassword(email) {
```

O nome é longo e feio **de propósito**. Quem escrever `findByEmailWithPassword` num controller vai perceber sozinho que está fazendo algo errado.

Compare as duas funções que buscam por e-mail:

| Função | Devolve o hash? | Usada em |
|---|---|---|
| `findByEmail` | não | cadastro ("esse e-mail já existe?") |
| `findByEmailWithPassword` | sim | login, e **só** no login |

### 4.3 O `?` de sempre

```javascript
`SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ?`,
[email]
```

Reveja a [Etapa 11](11-crud-categorias.md): o `?` é **prepared statement**. O valor viaja separado do comando SQL, então não existe jeito de o conteúdo virar comando.

Numa tela de login isso é ainda mais crítico. A injeção de SQL clássica da internet é exatamente esta:

```text
e-mail digitado:  ' OR '1'='1
```

Com concatenação de string, o SQL viraria `WHERE email = '' OR '1'='1'` — verdadeiro para todo mundo, e o invasor entra como o primeiro usuário da tabela. Com `?`, o MySQL procura literalmente por alguém cujo e-mail seja `' OR '1'='1` e não acha nada.

> Repare que `${PUBLIC_COLUMNS}` é interpolado, mas `email` não. A diferença: `PUBLIC_COLUMNS` é uma constante escrita por nós, que o usuário nunca controla. O `?` é para **dado que vem de fora**.

### 4.4 O `toUser` e o 0/1 do MySQL

```javascript
// O MySQL devolve BOOLEAN como 0/1. Normalizamos para true/false.
function toUser(row) {
  if (!row) return undefined;

  return { ...row, active: Boolean(row.active) };
}
```

É o mesmo `toProduct` do `product-repository.js` da [Etapa 12](12-crud-produtos.md). O MySQL não tem um tipo booleano de verdade: `BOOLEAN` é apelido para `TINYINT(1)`, e volta como `0` ou `1`.

Sem essa conversão, o JSON da API sairia assim:

```json
{ "active": 1 }
```

E o front-end precisaria lembrar que `1` significa `true` — um detalhe do banco vazando para a tela. Normalizamos na fronteira.

O `if (!row) return undefined;` cobre o caso "não achei ninguém": sem ele, `{ ...undefined }` daria `{}`, e um objeto vazio é **truthy**. O service acharia que encontrou um usuário.

### 4.5 `create` devolve o registro completo

```javascript
export async function create({ name, email, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  );

  return findById(result.insertId);
}
```

O `INSERT` não devolve a linha gravada — só o `insertId`. Fazemos um `findById` em seguida para ter o registro **como ele ficou no banco**, com `id`, `active` e `created_at` preenchidos pelo próprio MySQL.

É o mesmo padrão do `category-repository.js`.

### 4.6 `passwordHash` ≠ `password_hash`

Repare na tradução que acontece aqui:

```text
   BANCO (snake_case)          JAVASCRIPT (camelCase)
   ------------------          ----------------------
   password_hash        <--->  passwordHash
   created_at           <--->  createdAt
```

No `SELECT` usamos `AS` para renomear; no `INSERT`, a ordem dos `?` faz a ligação. O repositório é a **fronteira de tradução** entre as duas convenções — nenhuma outra camada precisa saber que o banco escreve com `_`.

---

## Confira se deu certo

Nada muda na tela ainda — ninguém chama esses arquivos. O que conferimos é que o servidor **continua subindo**, ou seja, não há erro de sintaxe:

```bash
docker compose logs api --tail 10
```

```text
estoque-api  | Conexao com o MySQL estabelecida
estoque-api  | Servidor rodando em http://localhost:3000
```

- [ ] A pasta `src/modules/auth/` existe
- [ ] Ela tem `user-validator.js` e `user-repository.js`
- [ ] `app-error.js` tem `UnauthorizedError` e `ForbiddenError`
- [ ] O servidor está no ar sem erros no log

---

## Se deu erro

### `SyntaxError: Unexpected token`

Erro de digitação. A mensagem traz o arquivo e a linha — comece por lá. Os suspeitos de sempre: crase (`` ` ``) trocada por aspas, chave ou parêntese faltando.

### `The requested module ... does not provide an export named 'UnauthorizedError'`

Faltou o `export` na frente da classe, ou você salvou o arquivo errado.

### O servidor não reiniciou sozinho

O `node --watch` às vezes não percebe alterações através do *bind mount* do Docker no Windows. Force:

```bash
docker compose restart api
```

> Guarde este comando: ele vai ser útil várias vezes até a Etapa 32.

---

## Próximo passo

As duas camadas de baixo estão prontas. Agora vem o coração do módulo: onde a senha vira hash e onde nasce o token.

**[Etapa 26 — O service: bcrypt e o token JWT](26-auth-service.md)**
