# Aula 03 — Variáveis de ambiente

⏱️ **Tempo estimado:** 15 minutos
📋 **Tipo:** prática (VS Code)

---

## Objetivo

Criar os arquivos `.env.example`, `.env` e `.gitignore`, entendendo por que **senha nunca fica dentro do código**.

---

## Antes de começar

- [ ] Aula 02 concluída (pastas criadas e `package.json` salvo)

---

## O problema que vamos resolver

Imagine que escrevêssemos assim:

```javascript
// NUNCA FAÇA ISSO
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "minhaSenha123",
  database: "estoque_db",
});
```

Quatro problemas graves:

| Problema | Consequência |
|---|---|
| A senha está no código | Quem vir o repositório vê a senha |
| O endereço está fixo | Na sua máquina é `localhost`, no servidor é outro |
| Mudar exige alterar código | Uma configuração vira uma alteração de programa |
| Vai para o Git | A senha fica no histórico **para sempre** |

A solução é guardar esses valores **fora do código**, em variáveis de ambiente.

---

## Passo 1 — Criar o `.env.example`

Este é o **modelo** do arquivo de configuração. Ele **vai** para o Git e serve para mostrar ao próximo desenvolvedor quais variáveis existem.

Crie na raiz do projeto o arquivo `.env.example`:

> 💡 O nome começa com **ponto**. No VS Code isso é normal; no explorador do Windows esses arquivos ficam ocultos.

```bash
# Porta em que a API responde dentro do container
PORT=3000

# Conexao com o MySQL
# Dentro do Docker o host e o NOME DO SERVICO do compose (db)
DB_HOST=db
DB_PORT=3306
DB_USER=estoque
DB_PASSWORD=estoque123
DB_NAME=estoque_db

# Senha do usuario root do MySQL (usada apenas pelo container do banco)
DB_ROOT_PASSWORD=root123

# Porta do MySQL exposta no HOST (mude se a 3308 ja estiver ocupada)
DB_HOST_PORT=3308
```

Salve com `Ctrl` + `S`.

### Regras do formato `.env`

| Regra | Certo | Errado |
|---|---|---|
| Sem espaços ao redor do `=` | `PORT=3000` | `PORT = 3000` |
| Sem aspas (em geral) | `DB_USER=estoque` | `DB_USER="estoque"` |
| Sem ponto e vírgula no fim | `DB_PORT=3306` | `DB_PORT=3306;` |
| Comentário com `#` | `# comentário` | `// comentário` |
| Maiúsculas por convenção | `DB_HOST` | `db_host` |

---

## Passo 2 — Criar o `.env` de verdade

Agora copie o modelo para o arquivo que será realmente usado:

```bash
cp .env.example .env
```

> **O que é `cp`?** *copy* — copia um arquivo. A sintaxe é `cp origem destino`.

Confirme que os dois existem:

```bash
ls -a
```

O `-a` mostra também os arquivos ocultos (que começam com ponto). Deve aparecer `.env` e `.env.example`.

---

## Passo 3 — Criar o `.gitignore`

Crie o arquivo `.gitignore` na raiz:

```bash
node_modules
.env
```

Salve.

Este arquivo diz ao Git: "**nunca** envie estes itens para o repositório".

| Item ignorado | Por quê |
|---|---|
| `node_modules` | São milhares de arquivos que podem ser reinstalados com um comando |
| `.env` | **Contém senhas** |

---

## Entendendo o que fizemos

### Por que dois arquivos quase iguais?

| Arquivo | Vai para o Git? | Conteúdo |
|---|---|---|
| `.env.example` | ✅ **Sim** | A **lista** das variáveis, com valores de exemplo |
| `.env` | ❌ **Não** | Os valores **reais**, incluindo senhas |

Quando um colega clona o projeto, ele não recebe o `.env` (que tem senhas), mas recebe o `.env.example`. Aí ele sabe exatamente o que precisa configurar: basta rodar `cp .env.example .env` e ajustar.

> 📌 É por isso que a primeira instrução de quase todo README de projeto profissional é: *"copie o `.env.example` para `.env`"*.

### A variável mais importante: `DB_HOST=db`

Esta linha confunde todo mundo na primeira vez.

```bash
DB_HOST=db
```

**Por que não `localhost`?**

Porque nossa aplicação vai rodar **dentro de um container**. E dentro do container, `localhost` significa "eu mesmo" — ou seja, o próprio container da API, onde **não existe** nenhum MySQL.

```text
   ERRADO: DB_HOST=localhost
   +------------------+          +------------------+
   | container "api"  |          | container "db"   |
   |                  |          |                  |
   | procura o MySQL  |          |   MySQL está      |
   | aqui dentro ✗    |          |   aqui  🗄️        |
   +------------------+          +------------------+


   CERTO: DB_HOST=db
   +------------------+          +------------------+
   | container "api"  | -------> | container "db"   |
   |                  |   "db"   |   MySQL 🗄️        |
   +------------------+          +------------------+
```

No Docker Compose, **cada serviço vira um nome de host** dentro da rede interna. Como vamos chamar nosso serviço de banco de `db` (na Aula 05), o endereço dele é literalmente `db`.

### As duas portas do banco

Repare que existem **duas** variáveis de porta para o MySQL:

| Variável | Valor | Significa |
|---|---|---|
| `DB_PORT` | `3306` | A porta **dentro** da rede do Docker |
| `DB_HOST_PORT` | `3308` | A porta na **sua máquina** |

**Por que 3308 e não 3306 na sua máquina?**

Muitos computadores já têm um MySQL instalado ocupando a porta 3306. Se tentássemos usar a mesma, daria conflito. Então expomos em uma porta livre.

> 💡 Se a 3308 também estiver ocupada na sua máquina, mude **só** o `DB_HOST_PORT` para `3309` no `.env`. Nada mais precisa ser alterado — é exatamente para isso que a variável existe.

### As duas senhas

| Variável | De quem é | Usada por |
|---|---|---|
| `DB_PASSWORD` | Usuário `estoque` | A **nossa aplicação** |
| `DB_ROOT_PASSWORD` | Usuário `root` | Só o **container do banco**, na criação |

O usuário `root` é o administrador total do MySQL. Nossa aplicação **não** usa ele — usa um usuário comum, com acesso só ao banco `estoque_db`.

> 📌 Isso se chama **princípio do menor privilégio**: dê a cada parte do sistema apenas o acesso que ela realmente precisa. Se a aplicação for invadida, o estrago é menor.

---

## ⚠️ Aviso importante sobre senhas

As senhas desta apostila (`estoque123`, `root123`) são **fracas de propósito**, para facilitar a aula.

Em um projeto real:

- use senhas longas e aleatórias;
- nunca as coloque em um arquivo que vá para o Git;
- em produção, use um cofre de segredos (AWS Secrets Manager, Azure Key Vault etc.).

---

## ✅ Confira se deu certo

```bash
ls -a
```

Deve conter: `.env`, `.env.example`, `.gitignore`, `package.json`, `database`, `public`, `src`.

Veja o conteúdo do `.env`:

```bash
cat .env
```

Marque:

- [ ] O arquivo `.env.example` existe e tem 8 variáveis
- [ ] O arquivo `.env` existe com o mesmo conteúdo
- [ ] O arquivo `.gitignore` existe e contém `.env`
- [ ] `DB_HOST` está como `db` (e **não** `localhost`)
- [ ] Não há espaços ao redor dos sinais de `=`

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `cp: cannot stat '.env.example'` | O arquivo não foi criado ou tem outro nome | `ls -a` e confira a grafia (com ponto na frente) |
| Não consigo criar arquivo com ponto no Windows | Explorador do Windows | Crie pelo **VS Code**, que aceita normalmente |
| Criei `env.example` sem o ponto | Faltou o ponto | Renomeie no VS Code (botão direito → Rename) |
| O VS Code não mostra o `.env` | Filtro de arquivos ocultos | Ele aparece normalmente; se não, confira se salvou na raiz |

---

## ➡️ Próximo passo

Configuração pronta. Vamos escrever a receita da imagem Docker.

**[Aula 04 — Dockerfile](04-dockerfile.md)**
