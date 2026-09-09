# Aula 10 — Primeira execução 🚀

⏱️ **Tempo estimado:** 30 minutos
📋 **Tipo:** prática (terminal)

---

## Objetivo

**Subir a aplicação pela primeira vez.** Ao final desta aula, a API estará respondendo no navegador e o banco estará com as tabelas criadas.

> 🎉 Esta é a aula mais empolgante do curso. Tudo que fizemos até agora ganha vida aqui.

---

## Antes de começar

Confira a lista completa. Você deve ter **14 arquivos**:

```bash
ls -a
```

- [ ] `.dockerignore`
- [ ] `.env`
- [ ] `.env.example`
- [ ] `.gitignore`
- [ ] `Dockerfile`
- [ ] `docker-compose.yml`
- [ ] `package.json`
- [ ] `database/init.sql`
- [ ] `src/app.js`
- [ ] `src/server.js`
- [ ] `src/config/env.js`
- [ ] `src/config/database.js`
- [ ] `src/routes/index.js`
- [ ] `src/shared/errors/app-error.js`
- [ ] `src/shared/http/async-handler.js`
- [ ] `src/shared/http/error-handler.js`
- [ ] `src/shared/http/parse-id.js`

E, muito importante:

- [ ] 🐳 **O Docker Desktop está aberto** (baleia parada na barra de tarefas)

---

## Passo 1 — O comando mágico

Na raiz do projeto, digite:

```bash
docker compose up --build
```

E agora **observe o terminal**. Vamos acompanhar o que está acontecendo.

### O que você vai ver, em ordem

**Fase 1 — Baixando o MySQL** (só na primeira vez, pode demorar 2-5 minutos)

```text
db Pulling
 a1b2c3d4 Downloading  [=====>          ]  12.4MB/98.3MB
```

**Fase 2 — Construindo a nossa imagem**

```text
 => [api 2/5] WORKDIR /app
 => [api 3/5] COPY package*.json ./
 => [api 4/5] RUN npm install
 => [api 5/5] COPY . .
 => exporting to image
```

> 👀 Repare: aqui você está vendo o `Dockerfile` da Aula 04 sendo executado, linha por linha.

**Fase 3 — Criando rede e volumes**

```text
 Network projeto-docker-nodejs_default  Created
 Volume "projeto-docker-nodejs_estoque-db-data"  Created
 Container estoque-db  Created
 Container estoque-api  Created
```

**Fase 4 — O banco inicializando** (aqui o `init.sql` roda!)

```text
estoque-db  | [Entrypoint] Creating database estoque_db
estoque-db  | [Entrypoint] Creating user estoque
estoque-db  | [Entrypoint] running /docker-entrypoint-initdb.d/init.sql
estoque-db  | [Entrypoint] MySQL init process done. Ready for start up.
```

> 🪄 A linha `running /docker-entrypoint-initdb.d/init.sql` é a mágica da Aula 06 acontecendo.

**Fase 5 — A API subindo**

```text
estoque-api  | > estoque-facil@1.0.0 dev
estoque-api  | > node --watch src/server.js
estoque-api  |
estoque-api  | Conexao com o MySQL estabelecida
estoque-api  | Servidor rodando em http://localhost:3000
```

### 🎉 Se você viu essas duas últimas linhas, deu certo!

```text
Conexao com o MySQL estabelecida
Servidor rodando em http://localhost:3000
```

> ⏳ **Paciência na primeira vez.** Entre a Fase 1 e a Fase 5 podem passar 3 a 6 minutos. Nas próximas vezes, leva segundos.

---

## Passo 2 — Testar no navegador

Abra o navegador e acesse:

```text
http://localhost:3000/api/health
```

Você deve ver:

```json
{"status":"ok","timestamp":"2026-09-09T00:04:21.592Z"}
```

**Essa é a sua API respondendo.** 🎊

> 💡 Instale a extensão **JSON Formatter** no navegador para ver o JSON organizado, com cores e indentação.

---

## Passo 3 — Testar pelo terminal

O terminal atual está ocupado mostrando os logs. **Abra um segundo terminal**:

- No VS Code: clique no `+` do painel de terminal
- Ou abra outra janela do Git Bash e faça `cd` até a pasta do projeto

Agora teste com `curl`:

```bash
curl http://localhost:3000/api/health
```

```json
{"status":"ok","timestamp":"2026-09-09T00:04:21.592Z"}
```

Teste também uma rota que **não existe**:

```bash
curl http://localhost:3000/api/naoexiste
```

```json
{"error":"Rota nao encontrada: GET /api/naoexiste"}
```

> ✅ Isso confirma que o `notFoundHandler` da Aula 08 está funcionando.

### 👀 Olhe o outro terminal

Cada requisição que você faz aparece no log:

```text
estoque-api  | GET /api/health
estoque-api  | GET /api/naoexiste
```

É o middleware de log da Aula 09 trabalhando.

---

## Passo 4 — Conferir o banco de dados

Vamos entrar no MySQL que está rodando dentro do container:

```bash
docker compose exec db mysql -u estoque -pestoque123 estoque_db
```

### Entendendo o comando

| Parte | Significado |
|---|---|
| `docker compose exec db` | Execute algo **dentro** do container `db` |
| `mysql` | O programa cliente do MySQL |
| `-u estoque` | Usuário |
| `-pestoque123` | Senha (**sem espaço** depois do `-p`!) |
| `estoque_db` | Banco a ser usado |

Você vai ver o prompt do MySQL:

```text
mysql>
```

Agora digite (cada comando termina com `;`):

```sql
SHOW TABLES;
```

```text
+---------------------+
| Tables_in_estoque_db|
+---------------------+
| categories          |
| products            |
| stock_movements     |
+---------------------+
```

> ✅ As três tabelas da Aula 06 estão lá!

```sql
SELECT id, name, sku, quantity FROM products;
```

```text
+----+--------------------------+---------+----------+
| id | name                     | sku     | quantity |
+----+--------------------------+---------+----------+
|  1 | Cafe em graos 1kg        | BEB-001 |       40 |
|  2 | Agua mineral 500ml       | BEB-002 |        8 |
...
```

Experimente também:

```sql
SELECT COUNT(*) FROM stock_movements;
```

```sql
DESCRIBE products;
```

Para sair:

```sql
EXIT;
```

---

## Passo 5 — Rodar em segundo plano

Ter um terminal preso nos logs é chato. Vamos melhorar.

No terminal que está mostrando os logs, aperte:

```text
Ctrl + C
```

Você verá o encerramento gracioso da Aula 09 acontecendo:

```text
estoque-api  | Recebido SIGTERM. Encerrando...
```

Agora suba em **modo desanexado** (*detached*):

```bash
docker compose up -d
```

```text
 Container estoque-db   Running
 Container estoque-api  Started
```

O terminal volta a ficar livre. Para ver os logs quando quiser:

```bash
docker compose logs -f api
```

(`-f` significa *follow*: fica acompanhando. Saia com `Ctrl` + `C` — isso para o log, **não** o container.)

---

## Comandos que você vai usar todo dia

Anote estes. São os mais importantes do curso:

```bash
docker compose up -d          # sobe em segundo plano
docker compose ps             # mostra o status dos containers
docker compose logs -f api    # acompanha os logs da API
docker compose logs -f db     # acompanha os logs do banco
docker compose restart api    # reinicia só a API
docker compose down           # para e remove os containers (MANTÉM os dados)
docker compose down -v        # para, remove E APAGA o banco
```

### Conferindo o status

```bash
docker compose ps
```

```text
NAME          STATUS                    PORTS
estoque-api   Up 2 minutes              0.0.0.0:3000->3000/tcp
estoque-db    Up 2 minutes (healthy)    0.0.0.0:3308->3306/tcp
```

> 👀 Repare no `(healthy)` no banco. É o `healthcheck` da Aula 05 aprovando o MySQL.

### ⚠️ Cuidado com o `-v`

| Comando | O que acontece com os dados |
|---|---|
| `docker compose down` | ✅ Preservados no volume |
| `docker compose down -v` | ❌ **APAGADOS** |

Use o `-v` **de propósito**, quando quiser recomeçar do zero e reprocessar o `init.sql`.

---

## Passo 6 — Teste do hot reload

Vamos confirmar que o bind mount da Aula 05 está funcionando.

1. Abra `src/routes/index.js`
2. Mude a mensagem de status:

```javascript
routes.get("/health", (request, response) => {
  response.json({ status: "tudo certo!", timestamp: new Date().toISOString() });
});
```

3. **Salve** (`Ctrl` + `S`)
4. Olhe os logs (`docker compose logs -f api`):

```text
estoque-api  | Restarting 'src/server.js'
estoque-api  | Conexao com o MySQL estabelecida
estoque-api  | Servidor rodando em http://localhost:3000
```

5. Teste de novo:

```bash
curl http://localhost:3000/api/health
```

```json
{"status":"tudo certo!","timestamp":"..."}
```

> 🎉 **Isso é o `bind mount` + `node --watch` trabalhando juntos.** Você editou na sua máquina e o container reagiu na hora, sem reconstruir nada.

**Agora desfaça a alteração** (volte para `"ok"`) e salve.

---

## 🔧 Se deu erro

Esta é a aula com mais chance de problemas. Procure sua mensagem na tabela:

### `Ports are not available: ... 3308`

```text
Error response from daemon: Ports are not available:
exposing port TCP 0.0.0.0:3308 -> ... bind: address already in use
```

**Causa:** já existe algo usando a porta 3308 na sua máquina.

**Solução:** abra o `.env` e mude a porta:

```bash
DB_HOST_PORT=3309
```

Depois:

```bash
docker compose up -d
```

### `port is already allocated` (3000)

**Causa:** outra aplicação está usando a porta 3000.

**Solução:** no `docker-compose.yml`, no serviço `api`, mude:

```yaml
ports:
  - "3001:3000"
```

E acesse por `http://localhost:3001`.

### `Cannot connect to the Docker daemon`

**Causa:** Docker Desktop fechado.

**Solução:** abra o Docker Desktop, espere a baleia parar, tente de novo.

### As tabelas não existem

```text
Table 'estoque_db.products' doesn't exist
```

**Causa:** o `init.sql` não rodou (talvez o volume já existisse de uma tentativa anterior, ou o arquivo tem erro de SQL).

**Solução:**

```bash
docker compose down -v
docker compose up -d --build
```

E acompanhe os logs do banco procurando erros:

```bash
docker compose logs db | grep -i error
```

### `ER_ACCESS_DENIED_ERROR`

```text
Access denied for user 'estoque'@'...'
```

**Causa:** você mudou o `.env` **depois** que o banco já tinha sido criado. As credenciais só são aplicadas na criação.

**Solução:**

```bash
docker compose down -v
docker compose up -d
```

### A API reinicia sem parar

**Causa:** erro de sintaxe no seu código JavaScript.

**Solução:** leia o log, que aponta arquivo e linha:

```bash
docker compose logs api --tail 30
```

```text
estoque-api | SyntaxError: Unexpected token '}'
estoque-api |     at file:///app/src/app.js:24
```

### `ECONNREFUSED` na subida

**Causa:** o banco ainda estava iniciando.

**Solução:** normalmente se resolve sozinho — o `connectWithRetry` tenta 10 vezes. Aguarde 30 segundos e veja os logs.

---

## 🆘 O botão de pânico

Quando nada mais funcionar e você quiser recomeçar do zero:

```bash
docker compose down -v
docker compose up -d --build
```

Isso apaga os containers, o volume e reconstrói tudo. Os dados de exemplo voltam ao estado original do `init.sql`.

> 📌 Guarde esses dois comandos. Eles resolvem a maioria dos problemas em sala de aula.

---

## ✅ Confira se deu certo

- [ ] `docker compose ps` mostra os **dois** containers como `Up`
- [ ] O banco aparece como `(healthy)`
- [ ] `http://localhost:3000/api/health` responde JSON no navegador
- [ ] `curl http://localhost:3000/api/naoexiste` devolve o erro 404 em JSON
- [ ] `SHOW TABLES;` no MySQL lista as 3 tabelas
- [ ] `SELECT * FROM products;` mostra 7 produtos
- [ ] Ao salvar um arquivo `.js`, o log mostra `Restarting`

**Se os 7 itens estão marcados, sua infraestrutura está pronta.** A partir daqui é só JavaScript.

---

## ➡️ Próximo passo

Infraestrutura no ar. Vamos construir nosso primeiro CRUD completo.

**[Aula 11 — CRUD de Categorias](11-crud-categorias.md)**
