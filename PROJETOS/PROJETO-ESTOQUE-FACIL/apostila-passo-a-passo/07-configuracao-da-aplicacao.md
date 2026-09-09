# Aula 07 — Configuração da aplicação

⏱️ **Tempo estimado:** 25 minutos
📋 **Tipo:** prática (código JavaScript)

---

## Objetivo

Escrever os dois primeiros arquivos JavaScript do projeto:

- `src/config/env.js` — lê e **valida** as variáveis de ambiente
- `src/config/database.js` — cria o **pool de conexões** com o MySQL

---

## Antes de começar

- [ ] Aula 06 concluída (`database/init.sql` criado)

---

## Passo 1 — Criar o `src/config/env.js`

Na pasta `src/config`, crie o arquivo `env.js`:

```javascript
// Le e VALIDA as variaveis de ambiente uma unica vez.
// Lembre-se: tudo que vem de process.env chega como string.

function requireEnv(key) {
  const value = process.env[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }

  return value.trim();
}

function requirePort(key, fallback) {
  const port = Number(process.env[key] ?? fallback);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Variavel de ambiente ${key} invalida: ${process.env[key]}`);
  }

  return port;
}

export const env = {
  port: requirePort("PORT", 3000),
  database: {
    host: requireEnv("DB_HOST"),
    port: requirePort("DB_PORT", 3306),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    name: requireEnv("DB_NAME"),
  },
};
```

Salve.

---

## Entendendo o `env.js`

### O problema que ele resolve

No Módulo 1 vimos este código problemático:

```javascript
var porta = process.env.PORT || 3000;
```

Dois defeitos:

1. **`process.env` sempre devolve string.** Se `PORT=3000`, o valor é `"3000"` (texto), não `3000` (número).
2. **Se a variável estiver errada**, o erro só aparece muito depois, em algum lugar inesperado.

### A solução: validar na partida

```javascript
function requireEnv(key) {
  const value = process.env[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }

  return value.trim();
}
```

Se faltar `DB_HOST`, a aplicação **não sobe** e mostra exatamente qual variável falta.

Isso se chama **fail fast** (falhar rápido): é melhor não subir do que subir quebrado e falhar na frente do usuário.

### A conversão de porta

```javascript
function requirePort(key, fallback) {
  const port = Number(process.env[key] ?? fallback);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Variavel de ambiente ${key} invalida: ${process.env[key]}`);
  }

  return port;
}
```

Três verificações em sequência:

| Verificação | Rejeita |
|---|---|
| `Number.isInteger(port)` | `"abc"` (vira `NaN`), `3000.5` |
| `port <= 0` | `0`, `-1` |
| `port > 65535` | `99999` (não existe porta acima disso) |

### `??` — o operador de coalescência nula

```javascript
process.env[key] ?? fallback
```

Devolve o valor da esquerda **a menos que** ele seja `null` ou `undefined`.

> ⚠️ **Diferença importante para o `||`:**
>
> ```javascript
> 0 || 3000    // 3000  (o zero foi considerado "falso")
> 0 ?? 3000    // 0     (o zero é um valor válido!)
> ```
>
> O `??` só troca em caso de ausência de valor. Para configuração, é o operador correto.

### O objeto exportado

```javascript
export const env = {
  port: requirePort("PORT", 3000),
  database: { ... },
};
```

Agrupamos tudo em um objeto organizado. Do resto do projeto, usaremos assim:

```javascript
import { env } from "./config/env.js";

env.port              // 3000 (número!)
env.database.host     // "db"
```

> 📌 **Vantagem:** o `process.env` aparece **em um único arquivo** do projeto inteiro. Se um dia mudarmos a forma de configurar, mexemos só aqui.

---

## Passo 2 — Criar o `src/config/database.js`

Na mesma pasta `src/config`, crie `database.js`:

```javascript
import mysql from "mysql2/promise";

import { env } from "./env.js";

// Um POOL mantem varias conexoes prontas e as reaproveita.
// E a forma recomendada em aplicacoes web.
export const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  // DECIMAL volta como string por padrao (para nao perder precisao).
  // Como nossos valores sao pequenos, convertemos para Number.
  decimalNumbers: true,
});

// O container do MySQL demora alguns segundos para aceitar conexoes.
// Tentamos algumas vezes antes de desistir.
export async function connectWithRetry(attempts = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      connection.release();

      console.log("Conexao com o MySQL estabelecida");
      return;
    } catch (error) {
      console.warn(
        `Tentativa ${attempt}/${attempts} de conectar ao MySQL falhou: ${error.message}`
      );

      if (attempt === attempts) {
        throw new Error("Nao foi possivel conectar ao MySQL");
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
```

Salve.

---

## Entendendo o `database.js`

### Por que `mysql2/promise` e não só `mysql2`?

Repare no `/promise` do import:

```javascript
import mysql from "mysql2/promise";
```

Isso muda **completamente** como escrevemos o código:

```javascript
// COM /promise — é o que vamos usar
const [rows] = await pool.query("SELECT * FROM products");
console.log(rows);

// SEM /promise — callbacks aninhados
pool.query("SELECT * FROM products", (error, rows) => {
  if (error) { ... }
  console.log(rows);
});
```

> ⚠️ **Esquecer o `/promise` é um erro comum.** O sintoma é que `await pool.query(...)` devolve algo estranho em vez dos dados.

### O que é um pool de conexões?

Abrir uma conexão com banco é **caro**: leva tempo, gasta memória dos dois lados e há um limite de conexões simultâneas.

| Sem pool | Com pool |
|---|---|
| Cada requisição abre uma conexão | 10 conexões ficam prontas |
| Usa | A requisição **pega emprestada** |
| Fecha | Usa e **devolve** |
| Lento e limitado | Rápido e controlado |

```text
     +---------------------- POOL ----------------------+
     |  [conexão 1] [conexão 2] ... [conexão 10]        |
     +--------------------------------------------------+
        ^         |
        |         v
   devolve    empresta
        |         |
     +--------------------+
     |   sua requisição   |
     +--------------------+
```

### As opções do pool

| Opção | Valor | O que faz |
|---|---|---|
| `waitForConnections` | `true` | Se todas as 10 estiverem ocupadas, espera em vez de dar erro |
| `connectionLimit` | `10` | Máximo de conexões simultâneas |
| `queueLimit` | `0` | Tamanho ilimitado para a fila de espera |
| `dateStrings` | `true` | Datas vêm como texto (`"2026-09-09 00:03:42"`) em vez de objeto `Date` |
| `decimalNumbers` | `true` | `DECIMAL` vem como número em vez de string |

### 💡 Por que `decimalNumbers: true`?

Por padrão, o driver devolve `DECIMAL` como **string**, para não perder precisão em valores gigantes:

```javascript
// Sem a opção:
{ costPrice: "28.00" }    // string!
"28.00" + 10              // "28.0010"  ← concatenou!

// Com a opção:
{ costPrice: 28 }         // número
28 + 10                   // 38  ✅
```

Como nossos valores são pequenos (preços de loja), a conversão é segura e evita bugs de soma.

> 📌 Em um sistema bancário, com valores enormes, você manteria como string e usaria uma biblioteca de precisão decimal.

### A função `connectWithRetry`

```javascript
export async function connectWithRetry(attempts = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      console.log("Conexao com o MySQL estabelecida");
      return;
    } catch (error) {
      ...
    }
  }
}
```

**Por que precisamos disso, se o Compose já tem healthcheck?**

Porque é uma **segunda camada de proteção**. O healthcheck cobre a subida normal; o retry cobre casos como:

- o banco reiniciar sozinho enquanto a API está no ar;
- a máquina do aluno estar muito lenta;
- alguém rodar a API fora do Compose.

**Como funciona:** tenta pegar uma conexão. Se falhar, avisa no console, **espera 3 segundos** e tenta de novo, até 10 vezes. Só então desiste.

### O truque do `sleep` em JavaScript

```javascript
await new Promise((resolve) => setTimeout(resolve, delayMs));
```

JavaScript não tem uma função `sleep()` pronta. Esta linha cria uma Promise que se resolve depois de `delayMs` milissegundos — e o `await` espera por ela.

Leia assim: *"crie uma promessa que só se cumpre daqui a 3 segundos, e espere ela"*.

### `connection.release()` — devolvendo ao pool

```javascript
const connection = await pool.getConnection();
connection.release();
```

Pegamos uma conexão só para testar e **devolvemos imediatamente**.

> ⚠️ **Regra de ouro do pool:** toda conexão pega com `getConnection()` **precisa** ser devolvida com `release()`. Se você esquecer, ela fica presa para sempre. Depois de 10 esquecimentos, a aplicação trava por completo.
>
> Vamos ver esse cuidado de novo, com o `finally`, na Aula 13.

---

## ✅ Confira se deu certo

```bash
ls src/config
```

Deve mostrar:

```text
database.js  env.js
```

Marque:

- [ ] `src/config/env.js` existe e exporta `env`
- [ ] `src/config/database.js` existe e exporta `pool` e `connectWithRetry`
- [ ] O import é `mysql2/promise` (com `/promise`)
- [ ] Todos os imports terminam com `.js` (ex.: `"./env.js"`)
- [ ] O VS Code não mostra erros vermelhos

> ⚠️ **Ainda não dá para testar.** Estes arquivos não fazem nada sozinhos — são bibliotecas. Vamos usá-los na Aula 09.

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| `Cannot find module './env'` | Faltou a extensão | Em ES Modules o `.js` é **obrigatório**: `"./env.js"` |
| `Cannot use import statement` | Faltou `"type": "module"` | Confira o `package.json` da Aula 02 |
| VS Code sublinha `mysql2` | A dependência não está instalada localmente | **É normal!** Ela será instalada dentro do container |
| `env is not defined` | Erro de digitação no import | Use `import { env } from "./env.js";` com chaves |

> 💡 **Sobre o sublinhado do `mysql2`:** como não rodamos `npm install` na sua máquina, o VS Code não encontra a biblioteca e reclama. Isso **não** é um erro do seu código — dentro do container ela existe.

---

## ➡️ Próximo passo

Configuração pronta. Vamos criar a base de tratamento de erros.

**[Aula 08 — Tratamento de erros](08-tratamento-de-erros.md)**
