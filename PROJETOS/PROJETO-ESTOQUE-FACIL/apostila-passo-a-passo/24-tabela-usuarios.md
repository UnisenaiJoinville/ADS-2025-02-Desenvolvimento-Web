# Aula 24 — A tabela de usuários e as novas bibliotecas

⏱️ **Tempo estimado:** 35 minutos
📋 **Tipo:** prática (SQL, `package.json` e `.env`)

---

## Objetivo

Preparar o terreno para o código da próxima aula:

- criar a tabela `users` **sem perder** os dados que você já tem;
- instalar `bcryptjs` e `jsonwebtoken`;
- acrescentar o `JWT_SECRET` ao `.env` e ensinar o `env.js` a exigi-lo.

---

## Antes de começar

- [ ] [Aula 23](23-autenticacao-conceitos.md) lida (você entende hash e token)
- [ ] Containers no ar (`docker compose ps` mostra os dois `Up`)

---

## 1. Como a tabela vai ficar

```text
 users
 -----
 id             INT, chave primária
 name           VARCHAR(120)
 email          VARCHAR(160), ÚNICO   <- é o "login"
 password_hash  VARCHAR(255)          <- o hash, nunca a senha
 active         BOOLEAN               <- permite bloquear sem excluir
 created_at     TIMESTAMP
 updated_at     TIMESTAMP
```

Três decisões que valem discussão:

| Decisão | Motivo |
|---|---|
| A coluna se chama `password_hash`, não `password` | O nome documenta o conteúdo. Quem ler o `SELECT` não tem dúvida do que está ali |
| `VARCHAR(255)` para o hash | O bcrypt gera 60 caracteres, mas algoritmos futuros são maiores. Sobra espaço |
| `email` é `UNIQUE` | Garantia do **banco**, não só do código. É a última linha de defesa contra conta duplicada |

> 💡 **Por que `active` em vez de apagar o usuário?** Porque um `DELETE` levaria junto o histórico. Desativar é reversível; excluir não é. Esse padrão se chama *soft delete* — você já viu ele em `products.active`, na [Aula 12](12-crud-produtos.md).

---

## Passo 1 — Acrescentar a tabela ao `init.sql`

Abra `database/init.sql` e acrescente **no final do arquivo**:

```sql
-- ============================================================
-- Modulo de autenticacao (Aula 24)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Usuario de demonstracao para testar o login antes de existir a tela.
-- A senha em texto puro e "123456" - o que esta gravado abaixo e o HASH.
-- NUNCA deixe um usuario com senha conhecida em um sistema real.
INSERT INTO users (name, email, password_hash) VALUES
  ('Professor Demo',
   'professor@estoquefacil.com',
   '$2b$10$xkAjZ..MHKdp.7cnXFMvVON.XZmd/foxiswJJS61thFcP/WLquT6m');
```

Salve.

### 🔍 Repare no que NÃO tem aqui

Não existe índice extra em `email`. Muita gente escreveria:

```sql
CREATE INDEX idx_users_email ON users (email);   -- desnecessário!
```

Mas `UNIQUE` **já cria um índice**. Colocar outro seria manter duas estruturas para a mesma coisa: mais lento para gravar, sem nenhum ganho para consultar.

### 🔍 E aquele hash gigante?

É o resultado de `bcrypt.hash("123456", 10)`. Veja como ele se lê:

```text
$2b$10$xkAjZ..MHKdp.7cnXFMvVON.XZmd/foxiswJJS61thFcP/WLquT6m
 │   │  └────── salt ──────┘└──────────── hash ────────────┘
 │   └── custo 10
 └────── algoritmo bcrypt, versão 2b
```

---

## 2. ⚠️ O problema que ninguém vê chegando

Você acabou de editar o `init.sql`. Vai funcionar?

**Não.** E o motivo é importante.

Lembre da [Aula 05](05-docker-compose.md):

```yaml
volumes:
  - ./database:/docker-entrypoint-initdb.d
```

O MySQL só executa os arquivos dessa pasta **na primeira vez que o banco é criado**, quando o volume ainda está vazio. Como você já subiu o projeto nas aulas anteriores, o banco existe — e o `init.sql` vai ser simplesmente ignorado.

Existem dois caminhos:

| Caminho | Comando | Consequência |
|---|---|---|
| **A) Recriar do zero** | `docker compose down -v` | Simples, mas **apaga tudo** que você cadastrou |
| **B) Rodar só o que falta** | uma *migração* | Preserva os dados. É o que se faz na vida real |

Vamos pelo caminho **B**, porque é o que acontece em qualquer sistema em produção: você nunca derruba o banco do cliente para acrescentar uma coluna.

---

## Passo 2 — Criar o arquivo de migração

Crie a pasta `database/migrations/` e dentro dela o arquivo `001-create-users.sql`:

```sql
-- ============================================================
-- Migracao 001 - tabela de usuarios (Aula 24)
-- ------------------------------------------------------------
-- QUANDO USAR ESTE ARQUIVO
-- O arquivo database/init.sql so roda na PRIMEIRA vez que o
-- volume do MySQL e criado. Se voce ja subiu o projeto nas aulas
-- anteriores, o banco existe e o init.sql NAO vai rodar de novo.
-- Este arquivo cria a tabela sem apagar nada do que voce ja tem.
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/001-create-users.sql
--
-- Este script pode ser executado mais de uma vez sem causar erro.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- INSERT IGNORE: se o e-mail ja existir, o MySQL apenas pula a linha
-- em vez de parar com erro de chave duplicada.
INSERT IGNORE INTO users (name, email, password_hash) VALUES
  ('Professor Demo',
   'professor@estoquefacil.com',
   '$2b$10$xkAjZ..MHKdp.7cnXFMvVON.XZmd/foxiswJJS61thFcP/WLquT6m');

SELECT id, name, email, active, created_at FROM users;
```

Salve.

### 🔍 Por que uma subpasta?

Porque o MySQL **não entra em subpastas** de `docker-entrypoint-initdb.d`. Ele lê `database/init.sql`, vê a pasta `database/migrations` e a ignora.

É exatamente o que queremos: a migração roda **só quando você mandar**, na mão.

### 🔍 `INSERT IGNORE`

```sql
INSERT IGNORE INTO users (name, email, password_hash) VALUES ...
```

Sem o `IGNORE`, rodar o script duas vezes daria erro de chave duplicada. Com ele, o MySQL pula a linha em silêncio.

Junto com o `CREATE TABLE IF NOT EXISTS`, isso torna o script **idempotente**: rodar uma ou dez vezes dá no mesmo resultado.

> 📌 **Idempotente** é uma palavra que vale aprender. Ela descreve uma operação que pode ser repetida sem efeito colateral. Apertar o botão do elevador é idempotente; apertar o gatilho não é.

---

## Passo 3 — Rodar a migração

No terminal, na raiz do projeto:

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < database/migrations/001-create-users.sql
```

### O que você deve ver

```text
mysql: [Warning] Using a password on the command line interface can be insecure.
id      name             email                        active  created_at
1       Professor Demo   professor@estoquefacil.com   1       2026-09-22 22:14:15
```

O aviso sobre a senha é normal (e correto: em produção não se passa senha assim).

### 🔍 Dissecando o comando

| Parte | O que faz |
|---|---|
| `docker compose exec` | Executa algo **dentro** de um container que já está rodando |
| `-T` | Desliga o terminal interativo — obrigatório para poder usar `<` |
| `db` | O nome do serviço no `docker-compose.yml` |
| `mysql -uestoque -pestoque123 estoque_db` | O cliente do MySQL, já apontando para o nosso banco |
| `< arquivo.sql` | Joga o conteúdo do arquivo na entrada do comando |

> ⚠️ **No `-p` não tem espaço.** É `-pestoque123`, colado. Com espaço, o MySQL acha que `estoque123` é o nome do banco.

### Confira no banco

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db -e "DESCRIBE users;"
```

---

## Passo 4 — Instalar as bibliotecas

Abra o `package.json` e acrescente as duas dependências (em ordem alfabética, como as outras):

```json
{
  "name": "estoque-facil",
  "version": "1.0.0",
  "description": "Sistema de gestao de estoque - Node.js, Express, MySQL e Docker",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "engines": {
    "node": ">=20.6.0"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.3",
    "mysql2": "^3.11.5"
  }
}
```

Salve.

### As duas bibliotecas

| Pacote | Para que serve |
|---|---|
| `bcryptjs` | Gerar e conferir o hash da senha |
| `jsonwebtoken` | Assinar e verificar o token JWT |

> 💡 **Por que `bcryptjs` e não `bcrypt`?** O pacote `bcrypt` é escrito em C e precisa ser **compilado** na instalação — o que exige Python e compilador dentro da imagem Alpine. O `bcryptjs` é JavaScript puro: instala em qualquer lugar, sem dor de cabeça. Ele é um pouco mais lento, o que para uma aula (e para a maioria dos sistemas) não faz diferença.

### Agora reconstrua a imagem

Editar o `package.json` **não basta**. As dependências foram instaladas *dentro da imagem* pelo `RUN npm install` do [Dockerfile](04-dockerfile.md). Precisamos refazer a imagem:

```bash
docker compose up -d --build api
```

> ⚠️ **Este é o erro nº 1 desta aula.** Se você pular o `--build`, a próxima aula vai falhar com `Cannot find package 'bcryptjs'`. Guarde a regra: **mexeu no `package.json` ou no `Dockerfile`, reconstrua a imagem.**

---

## Passo 5 — O segredo do token no `.env`

Abra o `.env` e acrescente no final:

```bash
# ---------------------------------------------------------
# Autenticacao (Aula 24)
# ---------------------------------------------------------
# Segredo usado para ASSINAR os tokens JWT.
# Em producao: string longa, aleatoria e fora do controle de versao.
JWT_SECRET=troque-este-segredo-em-producao-estoque-facil-2026

# Por quanto tempo o token vale: 15m, 2h, 1d, 7d...
JWT_EXPIRES_IN=1d
```

Faça **o mesmo no `.env.example`**. Lembre da [Aula 03](03-variaveis-de-ambiente.md): o `.env` fica na sua máquina, o `.env.example` é o mapa que vai para o repositório.

### 🔍 Escolhendo o tempo de expiração

É sempre uma troca:

```text
    Token curto (15m)                    Token longo (30d)
  ┌───────────────────┐               ┌───────────────────┐
  │ + mais seguro     │               │ + mais cômodo     │
  │ - o usuário cai   │               │ - token roubado   │
  │   toda hora       │               │   vale um mês     │
  └───────────────────┘               └───────────────────┘
```

Bancos usam minutos. Redes sociais usam semanas. Para a aula, `1d` é confortável.

### 🔍 Como seria um segredo de verdade

Aquele texto `troque-este-segredo...` é didático: legível, para você entender de onde ele vem. Em produção, o segredo é gerado aleatoriamente:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

E nunca, jamais, vai para o Git.

---

## Passo 6 — Ensinar o `env.js` a exigir o segredo

Lembre do princípio de *fail fast* da [Aula 07](07-configuracao-da-aplicacao.md): a aplicação **não sobe** se faltar configuração.

Abra `src/config/env.js` e deixe assim:

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

const jwtSecret = requireEnv("JWT_SECRET");

// Fail fast: um segredo curto e o mesmo que nenhum segredo.
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres");
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
  auth: {
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "1d",
    // Custo do bcrypt: 2^10 = 1024 rodadas. Quanto maior, mais lento
    // para nos e para quem tentar quebrar a senha na forca bruta.
    saltRounds: 10,
  },
};
```

Salve.

### 🔍 O que mudou

```javascript
const jwtSecret = requireEnv("JWT_SECRET");

// Fail fast: um segredo curto e o mesmo que nenhum segredo.
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres");
}
```

Um segredo de 6 letras seria quebrado por força bruta em minutos, e aí todo o resto da segurança desaba. Então **recusamos subir**.

```javascript
jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "1d",
```

Este é opcional: se ninguém definir, vale `1d`.

> 🔍 **Por que `||` e não `??` aqui?** Com `??`, uma variável vazia (`JWT_EXPIRES_IN=`) passaria como string vazia e quebraria o `jsonwebtoken`. O `||` trata `""` como ausência, que é o que queremos neste caso. Os dois operadores existem porque servem para coisas diferentes — reveja a [Aula 07](07-configuracao-da-aplicacao.md).

```javascript
saltRounds: 10,
```

O custo do bcrypt. Fica aqui, junto das outras configurações, e não espalhado pelo código.

---

## Passo 7 — Reiniciar e conferir

```bash
docker compose restart api
docker compose logs api --tail 10
```

### ✅ O que você deve ver

```text
estoque-api  | Conexao com o MySQL estabelecida
estoque-api  | Servidor rodando em http://localhost:3000
```

E a API continua respondendo:

```bash
curl http://localhost:3000/api/health
```

```json
{"status":"ok","timestamp":"2026-09-22T22:14:51.333Z"}
```

---

## ✅ Confira se deu certo

- [ ] `database/init.sql` termina com a seção de autenticação
- [ ] O arquivo `database/migrations/001-create-users.sql` existe
- [ ] `DESCRIBE users;` mostra as 7 colunas
- [ ] `SELECT email FROM users;` traz `professor@estoquefacil.com`
- [ ] `package.json` lista `bcryptjs` e `jsonwebtoken`
- [ ] Você rodou `docker compose up -d --build api`
- [ ] `.env` e `.env.example` têm `JWT_SECRET` e `JWT_EXPIRES_IN`
- [ ] O log mostra "Servidor rodando em http://localhost:3000"

---

## 🔧 Se deu erro

### `Variavel de ambiente obrigatoria ausente: JWT_SECRET`

O container não enxergou o `.env`. Editar o `.env` **não** reinicia o container sozinho:

```bash
docker compose up -d api
```

(Com `up -d` o Compose relê o `env_file`; um `restart` simples às vezes não.)

### `JWT_SECRET deve ter pelo menos 32 caracteres`

Está funcionando como planejado. Coloque um segredo mais longo.

### `Cannot find package 'bcryptjs' imported from ...`

Você editou o `package.json` mas não reconstruiu a imagem:

```bash
docker compose up -d --build api
```

### `ERROR 1146 (42S02): Table 'estoque_db.users' doesn't exist`

A migração não rodou. Repita o Passo 3 e leia a saída com atenção.

### `The input device is not a TTY`

Faltou o `-T` no `docker compose exec`. Ele é obrigatório quando você usa `<`.

### Quero recomeçar o banco do zero

```bash
docker compose down -v
docker compose up -d --build
```

> ⚠️ O `-v` **apaga o volume**: todos os produtos, categorias e movimentações somem, e o `init.sql` roda de novo do começo.

---

## ➡️ Próximo passo

Banco pronto, bibliotecas instaladas. Agora começa o código.

**[Aula 25 — O módulo auth: validador e repositório](25-auth-validator-repository.md)**
