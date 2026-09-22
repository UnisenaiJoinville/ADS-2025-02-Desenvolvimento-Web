# Aula 32 — Teste final, problemas comuns e exercícios

⏱️ **Tempo estimado:** 45 minutos de teste + exercícios
📋 **Tipo:** prática e avaliação

---

## Objetivo

- Testar a autenticação **do zero**, como um usuário novo faria.
- Ter à mão um dicionário dos erros desta etapa.
- Fixar com exercícios em três níveis e uma atividade de diagnóstico.

---

## Antes de começar

- [ ] Aulas 23 a 31 concluídas
- [ ] Containers no ar

---

## Parte 1 — Teste do zero

### Passo 1 — Zerar o ambiente

```bash
docker compose down -v
docker compose up -d --build
```

> ⚠️ O `-v` **apaga o volume do banco**. Tudo que você cadastrou some, e o `init.sql` roda de novo do início — inclusive a tabela `users` e o usuário de demonstração.

Acompanhe a subida:

```bash
docker compose logs -f api
```

```text
estoque-api  | Conexao com o MySQL estabelecida
estoque-api  | Servidor rodando em http://localhost:3000
```

(`Ctrl + C` sai do acompanhamento; os containers continuam rodando.)

### Passo 2 — Conferir o banco

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db \
  -e "SHOW TABLES; SELECT id, name, email FROM users;"
```

Você deve ver 4 tabelas (`categories`, `products`, `stock_movements`, `users`) e o `Professor Demo`.

### Passo 3 — O roteiro de 20 testes

Marque um a um. A coluna "onde" ajuda a achar o culpado quando algo falha.

#### API (terminal)

| # | Teste | Esperado | Onde mora |
|---|---|---|---|
| 1 | `curl localhost:3000/api/health` | `200` + `{"status":"ok"}` | `routes/index.js` |
| 2 | `curl -i localhost:3000/api/products` | `401` "Token nao informado" | `ensure-authenticated.js` |
| 3 | Login demo (`123456`) | `200` + `user` e `token` | `auth-service.js` |
| 4 | `GET /api/products` com o token | `200` + lista | middleware |
| 5 | `GET /api/auth/me` com o token | `200` + seus dados | `auth-controller.js` |
| 6 | Login com senha errada | `401` "E-mail ou senha invalidos" | `auth-service.js` |
| 7 | Login com e-mail inexistente | `401` **mesma** mensagem | `auth-service.js` |
| 8 | Token com uma letra trocada | `401` "Token invalido" | `token.js` |
| 9 | `Authorization: <token>` sem `Bearer` | `401` "Formato do token invalido" | middleware |
| 10 | Cadastro válido | `201` + `user` e `token` | `auth-service.js` |
| 11 | Cadastro com o mesmo e-mail | `409` | `auth-service.js` |
| 12 | Cadastro com senha de 3 letras | `400` | `user-validator.js` |

#### Navegador

| # | Teste | Esperado | Onde mora |
|---|---|---|---|
| 13 | Abrir `/index.html` sem sessão | vai para `/login.html` | `auth.js` + `dashboard.js` |
| 14 | Criar conta pela tela | vai para o login com faixa verde | `cadastro.js` |
| 15 | Entrar com senha errada | faixa vermelha, **sem** recarregar | `login.js` + `api.js` |
| 16 | Entrar com a senha certa | dashboard carregado | `login.js` |
| 17 | Ver o menu | iniciais, nome, e-mail, "Sair" | `layout.js` |
| 18 | F5 em qualquer tela | continua logado | `localStorage` |
| 19 | Clicar em "Sair" | volta ao login, chaves apagadas | `auth.js` |
| 20 | Adulterar o token e recarregar | expulso para o login | middleware + `api.js` |

### Passo 4 — Conferência final no banco

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db \
  -e "SELECT id, name, email, LEFT(password_hash,7) AS prefixo, CHAR_LENGTH(password_hash) AS tam FROM users;"
```

```text
id  name              email                        prefixo  tam
1   Professor Demo    professor@estoquefacil.com   $2b$10$  60
2   Maria Silva       maria@teste.com              $2b$10$  60
```

**Tudo `$2b$10$` e tudo com 60 caracteres.** Se alguma linha tiver tamanho diferente, a senha foi gravada em texto puro.

---

## Parte 2 — Dicionário de erros da autenticação

Complementa a [Aula 21](21-solucao-de-problemas.md), só com o que aparece nestas dez aulas.

### Back-end

| Mensagem | Causa provável | Solução |
|---|---|---|
| `Cannot find package 'bcryptjs'` | imagem não reconstruída | `docker compose up -d --build api` |
| `Cannot find package 'jsonwebtoken'` | idem | idem |
| `Variavel de ambiente obrigatoria ausente: JWT_SECRET` | container não releu o `.env` | `docker compose up -d api` |
| `JWT_SECRET deve ter pelo menos 32 caracteres` | segredo curto (proposital!) | use um segredo mais longo |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` vazio dentro do container | `docker compose exec api printenv JWT_SECRET` |
| `"expiresIn" should be a number of seconds...` | `JWT_EXPIRES_IN` mal formatado | use `15m`, `2h`, `1d`, `7d` |
| `Table 'estoque_db.users' doesn't exist` | migração não rodou | Passo 3 da [Aula 24](24-tabela-usuarios.md) |
| `Error: Invalid salt version` | `password_hash` não é bcrypt | confira com `LEFT(password_hash, 4)` |
| `ER_DUP_ENTRY ... for key 'users.email'` | duas requisições simultâneas | é o `UNIQUE` funcionando |
| `ER_DATA_TOO_LONG for column 'password_hash'` | coluna criada pequena demais | precisa ser `VARCHAR(255)` |
| `Rota nao encontrada: POST /api/auth/login` | falta `routes.use("/auth", authRoutes)` | [Aula 27](27-auth-rotas-e-middleware.md) |
| `/api/products` responde sem token | `ensureAuthenticated` está **depois** das rotas | ordem no `routes/index.js` |

### Front-end

| Sintoma | Causa provável | Solução |
|---|---|---|
| Aparece `{{ form.email }}` na tela | Vue não montou | veja o console (F12) |
| `Vue is not defined` | falta o `<script>` do CDN, ou está depois | ordem dos scripts |
| `Failed to resolve module specifier` | falta `type="module"` no `<script>` | acrescente |
| A página recarrega ao enviar | falta `.prevent` no `@submit` | `@submit.prevent="..."` |
| "Mostrar" tenta fazer login | falta `type="button"` | acrescente ao botão |
| Entro e volto para o login na hora | token não foi salvo | confira o `saveSession` |
| Dashboard vazio com erro `401` | token não está sendo enviado | reveja o `api.js` |
| Senha errada recarrega a tela | falta `&& token` no `if` do `api.js` | [Aula 29](29-tela-cadastro-vue.md) |
| Laço infinito de redirecionamento | `login.js` usa `requireAuth()` | deve ser `redirectIfAuthenticated()` |
| `Cannot read properties of null` | elemento não existe ainda | use `?.`, e monte o HTML antes |
| As alterações não aparecem | cache do navegador | **Ctrl + Shift + R** |
| Vue não atualiza a tela | você mudou uma variável solta | mude `this.algo`, do `data()` |

### Comandos de diagnóstico

```bash
# O servidor subiu?
docker compose logs api --tail 30

# As variáveis chegaram ao container?
docker compose exec api printenv | grep -E "JWT|DB_"

# O banco tem a tabela e os usuários?
docker compose exec db mysql -uestoque -pestoque123 estoque_db -e "SELECT id,email,active FROM users;"

# A API responde?
curl -i http://localhost:3000/api/health

# A API está protegida?
curl -i http://localhost:3000/api/products
```

> 📎 Mais consultas prontas em `database/queries/auth-queries.sql`.

---

## Parte 3 — Exercícios

### Nível 1 — Ajustes guiados

**1.1 — Token de 1 minuto**

Mude `JWT_EXPIRES_IN` para `1m`, reinicie a API (`docker compose up -d api`), faça login e espere um minuto. Navegue.

> O que observar: a tela expulsa você sozinha. Onde exatamente isso acontece? Siga o caminho `token.js → error-handler → api.js`.

Depois volte para `1d`.

**1.2 — Senha mais exigente**

No `user-validator.js`, exija 8 caracteres em vez de 6. Ajuste também o `cadastro.js` e o texto do `placeholder`.

> Pergunta: por que **três** lugares? E o que acontece se você mudar só o do front?

**1.3 — Limite de nome**

Faça o sistema recusar nomes com mais de 60 caracteres. Teste por `curl` **e** pela tela.

**1.4 — Sem conta de demonstração**

Remova o bloco de demonstração do `login.html` e o método `fillDemo` do `login.js`. Garanta que nada quebrou.

---

### Nível 2 — Funcionalidades novas

**2.1 — Entrar direto após o cadastro**

Hoje o cadastro manda para o login. Mas a API **já devolve um token** no `register`.

Altere o `cadastro.js` para chamar `saveSession` e ir direto ao dashboard.

<details>
<summary>Dica</summary>

```javascript
const { user, token } = await api.register({ ... });

saveSession({ user, token });
window.location.replace(HOME_PAGE);
```

Não esqueça de importar `saveSession` e `HOME_PAGE` do `auth.js`.
</details>

**2.2 — Último acesso**

```sql
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL AFTER active;
```

Grave a data a cada login e mostre no menu ("Último acesso: 22/09 às 19h").

> Em qual camada vai o `UPDATE`? E quem manda fazê-lo?

**2.3 — Editar o próprio perfil**

Crie `PUT /api/auth/me` para o usuário mudar o próprio nome. Use `request.user.id` — **nunca** um id vindo do corpo da requisição.

> Pergunta obrigatória: por que aceitar o id do corpo seria uma falha grave de segurança?

**2.4 — Trocar a senha**

`PUT /api/auth/password`, recebendo `currentPassword` e `newPassword`.

Regras: conferir a senha atual com `bcrypt.compare` antes de trocar; recusar se a nova for igual à atual.

**2.5 — Quem movimentou o estoque**

```sql
ALTER TABLE stock_movements ADD COLUMN user_id INT NULL AFTER product_id;
ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_user
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
```

Grave o `request.user.id` em cada movimentação e mostre o nome na tabela da tela.

> Cuidado: o `movement-service.js` da [Aula 13](13-movimentacoes-transacoes.md) usa **transação**. O `user_id` entra no mesmo `INSERT`.

---

### Nível 3 — Desafios

**3.1 — Perfis de usuário (autorização)**

```sql
ALTER TABLE users ADD COLUMN role ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR' AFTER password_hash;
```

Crie um middleware `ensureRole("ADMIN")` e use o `ForbiddenError` que já está no projeto desde a Aula 25.

Regra: só `ADMIN` exclui produtos e categorias.

> Onde o `role` precisa estar para o middleware funcionar sem ir ao banco?
> Que problema isso cria quando um usuário é promovido?

**3.2 — Refresh token**

Dois tokens: um de acesso curto (15 min) e um de renovação longo (7 dias). Uma rota `POST /api/auth/refresh` troca o segundo por um novo primeiro.

> Qual problema real isso resolve, comparado a simplesmente usar um token de 7 dias?

**3.3 — Proteger contra força bruta**

Bloqueie o login por 15 minutos após 5 tentativas erradas do mesmo e-mail.

> Guardar em memória ou no banco? O que acontece com a contagem quando o container reinicia?
> E se o ataque vier de muitos e-mails diferentes?

**3.4 — Reset de senha**

O fluxo completo: pedir por e-mail → gerar um token de uso único com validade curta → tela para definir a nova senha.

Sem servidor de e-mail, imprima o link no console do servidor.

> Por que o token de reset precisa ser de **uso único**? O que impedir de reutilizá-lo?

**3.5 — Comparar com cookie `httpOnly`**

Pesquise e escreva meia página comparando `localStorage` com cookie `httpOnly`: o que cada um resolve, o que cada um deixa em aberto (XSS, CSRF), e por que o segundo é mais trabalhoso.

---

## Parte 4 — Atividade de diagnóstico de código

> 📋 **Formato:** individual ou em duplas · 40 minutos
> **Enunciado:** o arquivo abaixo é um `auth-service.js` alternativo, escrito por outro "aluno". Ele **roda sem erro** e o login até funciona. Mas contém **10 problemas**, entre falhas de segurança, bugs e violações das camadas do projeto.
>
> Encontre todos, indique a **linha**, classifique (`segurança`, `bug` ou `arquitetura`) e escreva a correção.

```javascript
 1  import bcrypt from "bcryptjs";
 2  import jwt from "jsonwebtoken";
 3  import { pool } from "../../config/database.js";
 4
 5  export async function login(request, response) {
 6    const email = request.body.email;
 7    const password = request.body.password;
 8
 9    const [rows] = await pool.query(
10      "SELECT * FROM users WHERE email = '" + email + "'"
11    );
12
13    if (rows.length === 0) {
14      return response.status(404).json({ error: "E-mail nao cadastrado" });
15    }
16
17    const user = rows[0];
18
19    if (password !== user.password_hash) {
20      return response.status(401).json({ error: "Senha incorreta" });
21    }
22
23    const token = jwt.sign(
24      { id: user.id, email: user.email, password_hash: user.password_hash },
25      "segredo123"
26    );
27
28    return response.json({ user: user, token: token });
29  }
30
31  export async function register(request, response) {
32    const { name, email, password } = request.body;
33
34    const hash = bcrypt.hashSync(password, 10);
35
36    await pool.query(
37      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
38      [name, email, hash]
39    );
40
41    return response.status(200).json({ message: "Usuario criado" });
42  }
```

### Ficha de resposta

| # | Linha(s) | Tipo | Problema | Correção |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| ... | | | | |

<details>
<summary>🔑 Gabarito (só depois de tentar!)</summary>

| # | Linha | Tipo | Problema | Correção |
|---|---|---|---|---|
| 1 | 5, 31 | **arquitetura** | O service recebe `request` e `response`. Ele não pode conhecer HTTP | Receber um objeto de dados e devolver dados; quem fala HTTP é o controller |
| 2 | 9–11 | **segurança** | **SQL injection**: o e-mail é concatenado no SQL. Digitar `' OR '1'='1` derruba o login | Usar `?` e passar `[email]` como parâmetro |
| 3 | 10 | segurança | `SELECT *` traz o `password_hash` — e ele acaba indo para a resposta na linha 28 | Listar as colunas necessárias |
| 4 | 14 | **segurança** | "E-mail nao cadastrado" permite **enumerar usuários** | Mensagem única: "E-mail ou senha invalidos", com status `401` |
| 5 | 19 | **segurança grave** | Compara a senha digitada **diretamente** com o hash. Nunca dá `true` com hash correto — e daria se a senha estivesse em texto puro no banco | `await bcrypt.compare(password, user.password_hash)` |
| 6 | 24 | **segurança** | O `password_hash` vai **dentro do token**, que é legível por qualquer um | Payload só com dados públicos (`name`, `email`) e `subject: String(user.id)` |
| 7 | 25 | **segurança** | Segredo fixo no código, curto e versionado no Git | `env.auth.jwtSecret`, vindo do `.env` |
| 8 | 23–26 | segurança | Token **sem expiração**: vale para sempre | `{ expiresIn: env.auth.jwtExpiresIn }` |
| 9 | 28 | **segurança** | Devolve o objeto `user` inteiro do banco — com o hash junto | Montar `{ id, name, email }` (lista branca) |
| 10 | 34 | **bug de desempenho** | `hashSync` **trava a thread** do Node por ~100 ms, parando o servidor inteiro | `await bcrypt.hash(password, env.auth.saltRounds)` |

**Problemas extras (ponto bônus para quem achar):**

| # | Linha | Problema |
|---|---|---|
| 11 | 32 | **Nenhuma validação**: aceita nome vazio, e-mail sem `@`, senha de 1 caractere |
| 12 | 32 | O e-mail não é normalizado para minúsculas — permite conta duplicada |
| 13 | 36–39 | Não checa se o e-mail já existe: o erro do MySQL vira um 500 feio |
| 14 | 41 | Status `200` para um recurso criado; deveria ser `201` |
| 15 | 41 | Não devolve o usuário criado nem o token |
| 16 | geral | Nenhum `try/catch`: qualquer falha do banco derruba a requisição sem tratamento |

</details>

---

## Parte 5 — Checklist de avaliação

Para o professor conferir a entrega, ou para você se autoavaliar.

### Banco de dados

- [ ] Tabela `users` com as 7 colunas
- [ ] `email` é `UNIQUE`
- [ ] `password_hash` é `VARCHAR(255)`
- [ ] Nenhuma senha em texto puro no banco
- [ ] Existe arquivo de migração para quem já tinha o banco

### Back-end

- [ ] `src/modules/auth/` com os 5 arquivos do padrão
- [ ] `src/shared/auth/` com `token.js` e `ensure-authenticated.js`
- [ ] O service não conhece `request` nem `response`
- [ ] O repositório não conhece bcrypt
- [ ] Nenhum `SELECT *` na tabela `users`
- [ ] Todas as consultas usam `?`
- [ ] `bcrypt.hash` e `bcrypt.compare` com `await` (nunca `Sync`)
- [ ] Mensagem única para e-mail inexistente e senha errada
- [ ] Token sem dados sensíveis, com `expiresIn`
- [ ] `JWT_SECRET` no `.env`, validado no `env.js`
- [ ] `/api/health`, `/register` e `/login` públicos; o resto protegido

### Front-end

- [ ] `login.html` e `cadastro.html` em Vue, funcionando
- [ ] Todo `localStorage` passa pelo `auth.js`
- [ ] O `api.js` anexa o `Authorization` sozinho
- [ ] `401` com token limpa a sessão; `401` sem token, não
- [ ] As 4 telas internas têm `requireAuth()`
- [ ] O menu mostra o usuário e o botão "Sair"
- [ ] `escapeHtml` em tudo que é montado com template string
- [ ] Console limpo em todas as telas

### Entendimento (perguntas orais)

1. Por que não guardamos a senha?
2. O que acontece se dois usuários tiverem a mesma senha?
3. Por que o bcrypt é lento de propósito?
4. O que tem dentro de um JWT e por que ele não pode ser falsificado?
5. Por que a mensagem de erro do login é genérica?
6. Por que `ensureAuthenticated` é uma linha só no `routes/index.js`?
7. Se eu apagar o `requireAuth()` do dashboard, o que um usuário sem login consegue ver?
8. Por que validamos nos dois lados se só o servidor importa?
9. O que o botão "Sair" faz no servidor?
10. Qual a diferença entre `computed` e `methods` no Vue?

---

## 🎓 O que você sabe fazer agora

Some aos objetivos da [Aula 22](22-exercicios-e-checklist.md):

- [x] Guardar senhas com segurança, usando hash e salt
- [x] Emitir e validar tokens JWT
- [x] Escrever um middleware do Express
- [x] Proteger uma API inteira com uma linha, na ordem certa
- [x] Escrever mensagens de erro que não entregam informação ao invasor
- [x] Montar uma tela reativa com Vue.js, sem build
- [x] Guardar uma sessão no navegador e entender os riscos dessa escolha
- [x] Explicar por que validação no cliente nunca substitui a do servidor

---

## 🚀 Para onde seguir

| Tema | Por quê |
|---|---|
| **Testes automatizados** | 20 testes na mão a cada mudança não escala. Veja `node:test` ou Vitest |
| **Cookies `httpOnly` + CSRF** | O próximo passo em segurança de sessão |
| **Vue com build (Vite)** | Componentes em arquivos `.vue`, rotas no front, estado compartilhado |
| **Deploy** | Colocar tudo isso no ar, com HTTPS de verdade |
| **Logs e monitoramento** | Saber quem entrou, quando, e quando alguém tentou entrar e não conseguiu |

---

**[⬅️ Voltar ao índice](README.md)**
