# Aula 21 — Solução de problemas

📋 **Tipo:** material de consulta (não é uma aula sequencial)

---

## Como usar esta página

Não leia do começo ao fim. Use o índice abaixo para achar seu problema rapidamente.

| Onde está o problema | Vá para |
|---|---|
| Docker não sobe, portas, containers | [1. Docker](#1-problemas-de-docker) |
| Banco sem tabelas, acesso negado | [2. Banco de dados](#2-problemas-de-banco-de-dados) |
| API não responde, reinicia, erro 500 | [3. Backend](#3-problemas-de-backend) |
| Tela em branco, botão não funciona | [4. Front-end](#4-problemas-de-front-end) |
| Não sei nem por onde começar | [5. Diagnóstico](#5-como-diagnosticar-do-zero) |

---

## 1. Problemas de Docker

### `Cannot connect to the Docker daemon`

**Significa:** o Docker Desktop não está aberto.

**Solução:** abra o Docker Desktop e espere o ícone da baleia parar de se mexer.

> Este é, de longe, o erro mais comum em sala de aula.

---

### `Ports are not available: ... 3308`

```text
Error response from daemon: Ports are not available: exposing port
TCP 0.0.0.0:3308 -> bind: address already in use
```

**Significa:** já existe algo usando a porta 3308 na sua máquina.

**Solução:** abra o `.env` e mude a porta:

```bash
DB_HOST_PORT=3309
```

Depois:

```bash
docker compose up -d
```

**Para descobrir quem está usando a porta:**

```bash
# Windows
netstat -ano | findstr :3308

# Mac / Linux
lsof -i :3308
```

---

### `port is already allocated` (porta 3000)

**Significa:** outra aplicação está na porta 3000 (outro projeto Node, por exemplo).

**Solução:** no `docker-compose.yml`, serviço `api`:

```yaml
ports:
  - "3001:3000"
```

E acesse por `http://localhost:3001`.

---

### O container fica reiniciando sem parar

**Significa:** a aplicação está morrendo logo ao subir.

**Diagnóstico:**

```bash
docker compose logs api --tail 40
```

O log aponta o motivo. Os mais comuns:

| Mensagem | Causa |
|---|---|
| `SyntaxError` | Erro de digitação no código |
| `Cannot find module` | Import com caminho errado |
| `Variavel de ambiente obrigatoria ausente` | Falta algo no `.env` |
| `Nao foi possivel conectar ao MySQL` | Banco não subiu |

---

### Instalei uma dependência nova e a API não acha

**Significa:** o `npm install` roda na **construção da imagem**. Alterar o `package.json` não basta.

**Solução:**

```bash
docker compose up -d --build
```

---

### Alterei o código e nada mudou

**Verifique nesta ordem:**

1. O arquivo está em `src/` ou `public/`? (só essas pastas têm bind mount)
2. Você salvou? (`Ctrl` + `S`)
3. O log mostra `Restarting`?

```bash
docker compose logs api --tail 10
```

4. Se nada funcionar:

```bash
docker compose restart api
```

---

## 2. Problemas de banco de dados

### `Table 'estoque_db.products' doesn't exist`

**Significa:** o `init.sql` não foi executado.

**Causa mais comum:** o volume já existia de uma tentativa anterior. Lembre-se: **o `init.sql` só roda na criação do volume**.

**Solução:**

```bash
docker compose down -v
docker compose up -d
```

**Para confirmar que rodou:**

```bash
docker compose logs db | grep -i "init"
```

---

### `ER_ACCESS_DENIED_ERROR: Access denied for user 'estoque'`

**Significa:** as credenciais do `.env` não batem com as do banco.

**Causa:** você mudou o `.env` **depois** que o banco já tinha sido criado. Usuário e senha só são aplicados na primeira criação.

**Solução:**

```bash
docker compose down -v
docker compose up -d
```

---

### `ECONNREFUSED` ou `connect ETIMEDOUT`

**Significa:** a API não conseguiu falar com o banco.

**Verifique:**

1. `DB_HOST` está como `db` no `.env`? (**não** `localhost`)
2. O banco está saudável?

```bash
docker compose ps
```

Deve mostrar `(healthy)`.

3. Aguarde: o `connectWithRetry` tenta 10 vezes, a cada 3 segundos.

---

### Como olhar os dados diretamente

```bash
docker compose exec db mysql -u estoque -pestoque123 estoque_db
```

Comandos úteis dentro do MySQL:

```sql
SHOW TABLES;
DESCRIBE products;
SELECT * FROM products;
SELECT COUNT(*) FROM stock_movements;
EXIT;
```

Ou em uma linha só, sem entrar no prompt:

```bash
docker compose exec db mysql -u estoque -pestoque123 estoque_db \
  -e "SELECT id, name, quantity FROM products;"
```

---

### Erro de SQL ao inserir

| Erro | Causa | Solução |
|---|---|---|
| `Column count doesn't match value count` | Número de `?` diferente do número de valores | Conte colunas, `?` e itens do array |
| `Data truncated for column 'type'` | Valor fora do `ENUM` | Só `IN` ou `OUT` |
| `Duplicate entry for key 'sku'` | SKU repetido | É a restrição `UNIQUE` funcionando |
| `Cannot add or update a child row` | Chave estrangeira inválida | A categoria informada não existe |
| `Lock wait timeout exceeded` | Transação travada | Faltou `rollback` em algum caminho; `docker compose restart api` |

---

## 3. Problemas de backend

### `Cannot use import statement outside a module`

**Significa:** faltou habilitar ES Modules.

**Solução:** confira o `package.json`:

```json
"type": "module",
```

---

### `Cannot find module './algum-arquivo'`

**Significa:** caminho ou extensão errados.

**Duas causas comuns:**

1. **Faltou o `.js`** — em ES Modules a extensão é obrigatória:

```javascript
import { env } from "./env";       // ❌
import { env } from "./env.js";    // ✅
```

2. **Número errado de `../`** — conte os níveis:

```text
de src/modules/products/  para  src/shared/
     └── ../../shared/                    ✅ (dois níveis)
```

| De | Para `src/shared/` |
|---|---|
| `src/app.js` | `./shared/` |
| `src/routes/index.js` | `../shared/` |
| `src/modules/products/x.js` | `../../shared/` |

---

### `request.body` é `undefined`

**Duas causas possíveis:**

1. **Faltou o `express.json()` ou está na ordem errada** — ele precisa vir **antes** das rotas em `app.js`:

```javascript
app.use(express.json());        // primeiro
app.use("/api", routes);        // depois
```

2. **Faltou o header no `curl`:**

```bash
curl -X POST ... -H "Content-Type: application/json" -d '{...}'
```

---

### A requisição fica travada, sem resposta

**Significa:** um erro foi lançado dentro de uma função `async` e ninguém capturou.

**Solução:** confira se a rota está envolvida no `asyncHandler`:

```javascript
productRoutes.get("/", asyncHandler(controller.index));    // ✅
productRoutes.get("/", controller.index);                  // ❌
```

---

### O `errorHandler` nunca é chamado

**Significa:** o Express não reconheceu a função como middleware de erro.

**Solução:** ela **precisa** ter exatamente 4 parâmetros, mesmo sem usar o último:

```javascript
export function errorHandler(error, request, response, next) {
```

E precisa ser o **último** `app.use` do arquivo.

---

### Todas as rotas devolvem 404

**Verifique:**

1. O módulo foi registrado em `src/routes/index.js`?

```javascript
routes.use("/products", productRoutes);
```

2. O `notFoundHandler` está **depois** das rotas em `app.js`?

3. Você está usando o prefixo `/api`?

```text
/products         ❌
/api/products     ✅
```

---

### Valores monetários vêm como texto

```json
{ "costPrice": "28.00" }
```

**Solução:** confira o `decimalNumbers: true` em `src/config/database.js`.

---

## 4. Problemas de front-end

> 📌 **Regra número 1 do front-end:** aperte `F12` e leia o **Console**. Erros de JavaScript não aparecem no terminal.

### A página está totalmente em branco

**Solução:** `F12` → aba **Console** → leia a mensagem vermelha.

---

### `Cannot use import statement outside a module`

**Solução:** no HTML, o script precisa do `type="module"`:

```html
<script type="module" src="/js/dashboard.js"></script>
```

---

### `404` ao carregar `/js/api.js`

**Significa:** o arquivo não está onde o Express procura.

**Verifique:** os arquivos do front ficam em `public/js/`, **não** em `src/`.

```bash
ls public/js
```

---

### `Cannot read properties of null (reading 'innerHTML')`

**Significa:** o `querySelector` não encontrou o elemento.

**Causas comuns:**

1. Grafia diferente entre o HTML e o JS:

```html
<tbody data-rows></tbody>
```

```javascript
document.querySelector("[data-rows]")     // ✅
document.querySelector("[data-row]")      // ❌ faltou o "s"
```

2. O script rodou antes do HTML existir — mas isso **não** acontece com `type="module"`, que já espera o documento carregar.

---

### A página recarrega ao enviar o formulário

**Solução:** faltou impedir o comportamento padrão:

```javascript
form.addEventListener("submit", async (event) => {
  event.preventDefault();      // <- esta linha
  ...
});
```

---

### Botões criados dinamicamente não funcionam

**Significa:** você registrou o listener nos botões, que ainda não existiam.

**Solução:** use **delegação de eventos** no container:

```javascript
// ❌ não funciona para linhas criadas depois
document.querySelectorAll("[data-edit]").forEach(...);

// ✅ funciona sempre
rowsContainer.addEventListener("click", (event) => {
  const id = event.target.dataset.edit;
  if (id) { ... }
});
```

---

### Vírgulas aparecendo entre os itens na tela

**Significa:** faltou o `.join("")` depois do `.map()`.

```javascript
rows.map((r) => `<tr>...</tr>`).join("")
//                               ^^^^^^^^
```

---

### Aparece `R$ NaN` ou `undefined`

**Duas causas:**

1. O backend mandou string em vez de número → confira os `Number()` no `dashboard-service.js`
2. O nome do campo está errado → veja no `F12` → aba **Network** → clique na requisição → **Response**

---

### As mudanças no JS não aparecem

**Solução:** cache do navegador. Recarregue forçado:

- Windows/Linux: `Ctrl` + `Shift` + `R`
- Mac: `Cmd` + `Shift` + `R`

---

### O layout está sem estilo nenhum

**Significa:** o Tailwind não carregou.

**Verifique:**

1. A tag está no `<head>`?

```html
<script src="https://cdn.tailwindcss.com"></script>
```

2. Você tem internet? (o CDN precisa baixar)
3. `F12` → aba **Network** → procure por erro no carregamento

---

## 5. Como diagnosticar do zero

Quando não souber por onde começar, siga esta ordem. Ela vai do mais baixo nível para o mais alto.

### Passo 1 — Os containers estão de pé?

```bash
docker compose ps
```

Ambos devem estar `Up`, e o banco `(healthy)`.

❌ Não estão? → veja a [seção 1](#1-problemas-de-docker)

### Passo 2 — A API subiu?

```bash
docker compose logs api --tail 20
```

Deve terminar com:

```text
Conexao com o MySQL estabelecida
Servidor rodando em http://localhost:3000
```

❌ Não subiu? → o log diz o motivo, veja a [seção 3](#3-problemas-de-backend)

### Passo 3 — A API responde?

```bash
curl http://localhost:3000/api/health
```

❌ Não responde? → problema de porta ou de inicialização

### Passo 4 — O banco tem dados?

```bash
curl http://localhost:3000/api/products
```

❌ Erro de tabela? → veja a [seção 2](#2-problemas-de-banco-de-dados)

### Passo 5 — O front carrega?

```bash
curl -I http://localhost:3000/
```

Deve responder `200`.

❌ Erro 404? → confira se os arquivos estão em `public/`

### Passo 6 — O JavaScript roda?

`F12` → **Console** → leia os erros.

---

## 🆘 O botão de pânico

Quando nada mais resolver:

```bash
docker compose down -v
docker compose up -d --build
```

Isso:

- para e remove os containers;
- apaga o volume (e os dados);
- reconstrói a imagem do zero;
- recria o banco com o `init.sql`.

> ⚠️ Você perde os dados cadastrados em aula, mas os 7 produtos de exemplo voltam.

---

## 📋 Comandos de diagnóstico — cola rápida

```bash
# Status
docker compose ps

# Logs
docker compose logs api --tail 50
docker compose logs db --tail 50
docker compose logs -f api               # acompanhar ao vivo

# Entrar nos containers
docker compose exec api sh               # terminal dentro da API
docker compose exec db mysql -u estoque -pestoque123 estoque_db

# Testar a API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products

# Reiniciar
docker compose restart api

# Recomeçar do zero
docker compose down -v && docker compose up -d --build

# Ver o compose já com as variáveis substituídas
docker compose config

# Verificar arquivos
ls -a
find src -name "*.js" | sort
```

---

## ➡️ Próximo passo

**[Aula 22 — Exercícios e checklist](22-exercicios-e-checklist.md)**
