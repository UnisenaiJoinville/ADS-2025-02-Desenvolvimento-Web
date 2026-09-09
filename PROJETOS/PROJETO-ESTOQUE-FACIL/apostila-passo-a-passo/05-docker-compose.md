# Aula 05 — Docker Compose

⏱️ **Tempo estimado:** 30 minutos
📋 **Tipo:** prática (VS Code)

---

## Objetivo

Escrever o `docker-compose.yml`, o arquivo que faz **dois containers** (API e banco) subirem juntos, se enxergarem e iniciarem na ordem certa.

---

## Antes de começar

- [ ] Aula 04 concluída (`Dockerfile` criado)

---

## Por que precisamos do Compose?

Nossa aplicação precisa de **duas coisas rodando ao mesmo tempo**:

```text
   +-------------------+          +-------------------+
   |   container API   |  ----->  |   container DB    |
   |   Node + Express  |          |     MySQL 8       |
   |   porta 3000      |          |     porta 3306    |
   +-------------------+          +-------------------+
```

Sem o Compose, você teria que digitar dois comandos gigantes, criar a rede na mão, lembrar da ordem... A cada vez.

Com o Compose, você escreve tudo **uma vez** em um arquivo e depois digita apenas:

```bash
docker compose up
```

---

## Passo 1 — Criar o `docker-compose.yml`

Crie na raiz do projeto o arquivo `docker-compose.yml`.

> ⚠️ **YAML é sensível a indentação!** Ele usa **espaços** para marcar hierarquia — nunca Tab. Copie com atenção. Se o VS Code reclamar, quase sempre é espaço a mais ou a menos.

```yaml
services:
  db:
    image: mysql:8.0
    container_name: estoque-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      # host:container - usamos 3308 no host para nao conflitar
      # com um MySQL ja instalado na maquina do aluno
      - "${DB_HOST_PORT:-3308}:3306"
    volumes:
      - estoque-db-data:/var/lib/mysql
      # Todo arquivo .sql colocado aqui roda na PRIMEIRA criacao do banco
      - ./database:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-p${DB_ROOT_PASSWORD}"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s

  api:
    build: .
    container_name: estoque-api
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3000:3000"
    volumes:
      # Bind mounts: o codigo do host aparece dentro do container.
      # Com "node --watch" o servidor reinicia sozinho ao salvar um arquivo.
      - ./src:/app/src
      - ./public:/app/public
    depends_on:
      db:
        condition: service_healthy

volumes:
  estoque-db-data:
```

Salve com `Ctrl` + `S`.

---

## Entendendo a estrutura geral

O arquivo tem duas seções principais:

```yaml
services:        # os containers que vão subir
  db:            #   serviço 1: o banco
  api:           #   serviço 2: a nossa aplicação

volumes:         # os espaços de disco permanentes
  estoque-db-data:
```

> 📌 O nome de cada serviço (`db`, `api`) vira o **nome de host** dele dentro da rede do Docker. Lembra do `DB_HOST=db` da Aula 03? É por causa desta linha.

---

## O serviço `db`, linha por linha

### `image: mysql:8.0`

```yaml
image: mysql:8.0
```

Usa uma imagem **pronta**, baixada do Docker Hub. Não precisamos escrever Dockerfile para o MySQL — a comunidade já fez isso.

> Compare com o serviço `api`, que usa `build: .` porque a imagem é **nossa** e precisa ser construída.

### `container_name: estoque-db`

Dá um nome fixo ao container. Sem isso, o Docker geraria um nome automático como `projeto-docker-nodejs-db-1`.

Com nome fixo, os comandos ficam mais legíveis:

```bash
docker logs estoque-db
```

### `restart: unless-stopped`

Se o container cair sozinho (por erro ou porque você reiniciou o computador), o Docker o sobe de novo. Só não sobe se **você** o parou de propósito.

### `environment`

```yaml
environment:
  MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
  MYSQL_DATABASE: ${DB_NAME}
  MYSQL_USER: ${DB_USER}
  MYSQL_PASSWORD: ${DB_PASSWORD}
```

Estas quatro variáveis são **especiais**: a imagem oficial do MySQL as lê na primeira inicialização e faz o trabalho pesado por você:

| Variável | O que a imagem faz |
|---|---|
| `MYSQL_ROOT_PASSWORD` | Define a senha do administrador |
| `MYSQL_DATABASE` | **Cria** o banco `estoque_db` |
| `MYSQL_USER` | **Cria** o usuário `estoque` |
| `MYSQL_PASSWORD` | Define a senha desse usuário |

> 💡 Perceba o ganho: sem Docker, você faria isso manualmente com comandos `CREATE DATABASE`, `CREATE USER`, `GRANT`... Aqui, quatro linhas resolvem.

**E o `${DB_ROOT_PASSWORD}`?** Essa sintaxe lê o valor do arquivo `.env`. Assim, a senha continua fora do arquivo que vai para o Git.

### `ports`

```yaml
ports:
  - "${DB_HOST_PORT:-3308}:3306"
```

A regra é sempre **`porta_do_host : porta_do_container`**:

```text
   Sua máquina                     Container
   localhost:3308     ------->     mysql:3306
```

Você acessa pela **esquerda**; o programa escuta na **direita**.

**E o `:-3308`?** É um valor padrão: "use `DB_HOST_PORT` do `.env`; se não existir, use 3308".

> ⚠️ Se a porta 3308 estiver ocupada na sua máquina, o Docker vai recusar com `Ports are not available`. A correção é trocar `DB_HOST_PORT` no `.env` para 3309 e subir de novo.

### `volumes` — os dois tipos

Esta parte é a mais importante do serviço `db`:

```yaml
volumes:
  - estoque-db-data:/var/lib/mysql
  - ./database:/docker-entrypoint-initdb.d
```

São **dois tipos diferentes** de volume:

#### 1. Volume nomeado (persistência)

```yaml
- estoque-db-data:/var/lib/mysql
```

`/var/lib/mysql` é onde o MySQL grava os dados. Ligamos essa pasta a um volume gerenciado pelo Docker.

**Sem esta linha**, apagar o container apagaria o banco inteiro. Com ela, você pode destruir e recriar o container quantas vezes quiser: os dados continuam lá.

#### 2. Bind mount (entrega de arquivos)

```yaml
- ./database:/docker-entrypoint-initdb.d
```

Liga a pasta `database` do seu projeto a uma pasta **especial** da imagem do MySQL.

> 🪄 **A mágica:** todo arquivo `.sql` colocado em `/docker-entrypoint-initdb.d` é executado **automaticamente** na primeira criação do banco. É assim que nossas tabelas vão nascer prontas na Aula 06.

⚠️ **Repare no "primeira":** se o volume já existir com dados, o script **não** roda de novo. Isso explica um erro clássico que veremos na Aula 10.

### `healthcheck`

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-p${DB_ROOT_PASSWORD}"]
  interval: 5s
  timeout: 5s
  retries: 20
  start_period: 30s
```

O MySQL demora alguns segundos entre "container iniciado" e "banco pronto para receber conexões". O healthcheck testa isso repetidamente.

| Opção | Significado |
|---|---|
| `test` | O comando que testa a saúde (`mysqladmin ping`) |
| `interval: 5s` | Testa a cada 5 segundos |
| `timeout: 5s` | Se o teste demorar mais que isso, conta como falha |
| `retries: 20` | Depois de 20 falhas seguidas, marca como *unhealthy* |
| `start_period: 30s` | Nos primeiros 30s, falhas não são contadas (é normal ainda estar subindo) |

Você vai ver o resultado disso quando rodar `docker compose ps`: aparece `(healthy)` ao lado do banco.

---

## O serviço `api`, linha por linha

### `build: .`

```yaml
build: .
```

"Construa a imagem usando o `Dockerfile` da pasta atual".

### `env_file`

```yaml
env_file:
  - .env
```

Entrega **todas** as variáveis do `.env` para dentro do container. É assim que o `src/config/env.js` (Aula 07) vai encontrá-las em `process.env`.

### `ports: "3000:3000"`

Publica a API. É por isso que você vai digitar `http://localhost:3000` no navegador.

### `volumes` — o segredo do desenvolvimento ágil

```yaml
volumes:
  - ./src:/app/src
  - ./public:/app/public
```

Estes **bind mounts** ligam as pastas do seu projeto às pastas de dentro do container.

**Por que isso é tão importante?**

Lembre-se: o `Dockerfile` faz `COPY . .`, ou seja, copia o código para dentro da imagem. Se ficasse só nisso, toda alteração exigiria reconstruir a imagem inteira.

Com o bind mount, os arquivos são **compartilhados**:

```text
   Você salva src/app.js no VS Code
              |
              v
   O arquivo muda DENTRO do container
              |
              v
   node --watch percebe e reinicia o servidor
              |
              v
   Em 1 segundo sua mudança está no ar
```

> 📌 É a combinação `bind mount` + `node --watch` que dá o "salvou, atualizou". Uma peça sem a outra não funciona.

⚠️ **Cuidado:** isso vale só para `src` e `public`. Se você instalar uma **dependência nova** no `package.json`, aí sim precisa reconstruir: `docker compose up -d --build`.

### `depends_on` com `condition`

```yaml
depends_on:
  db:
    condition: service_healthy
```

Esta é a linha que resolve o erro mais frustrante de quem começa com Docker.

| Forma | O que garante |
|---|---|
| `depends_on: [db]` (simples) | Só que o container do banco **iniciou** |
| `condition: service_healthy` | Que o banco está **respondendo consultas** |

Sem a condição, a API subiria em 1 segundo, tentaria conectar em um MySQL que ainda está inicializando e morreria com `ECONNREFUSED`.

Com ela, o Compose **segura** a API até o healthcheck aprovar o banco.

---

## A seção `volumes` do final

```yaml
volumes:
  estoque-db-data:
```

Declara formalmente o volume nomeado que usamos no serviço `db`. Sem esta declaração, o Compose acusaria erro.

Depois de subir o projeto, você poderá vê-lo com:

```bash
docker volume ls
```

---

## Resumo visual do que montamos

```text
 +------------------------------------------------------------+
 |                    Rede interna do Docker                   |
 |                                                             |
 |   +--------------------+          +--------------------+    |
 |   |  api               |  "db"    |  db                |    |
 |   |  build: .          | -------> |  mysql:8.0         |    |
 |   |  porta 3000        |          |  porta 3306        |    |
 |   |                    |          |                    |    |
 |   |  bind mounts:      |          |  volume:           |    |
 |   |   ./src            |          |   estoque-db-data  |    |
 |   |   ./public         |          |  init:             |    |
 |   |                    |          |   ./database       |    |
 |   +--------------------+          +--------------------+    |
 |            |                               |                |
 +------------|-------------------------------|----------------+
              |                               |
        localhost:3000                  localhost:3308
              |                               |
          NAVEGADOR                    CLIENTE MYSQL
```

---

## ✅ Confira se deu certo

```bash
docker compose config
```

Este comando **valida** o arquivo e mostra como o Docker o interpretou, já com as variáveis do `.env` substituídas.

Se aparecer o conteúdo do arquivo com `estoque123` e `3308` no lugar das variáveis, está tudo certo.

Marque:

- [ ] O arquivo se chama `docker-compose.yml`
- [ ] Tem dois serviços: `db` e `api`
- [ ] Tem a seção `volumes:` no final
- [ ] `docker compose config` não mostrou erro
- [ ] As variáveis apareceram substituídas pelos valores reais

> ⚠️ **Ainda não rode `docker compose up`!** Falta criar o `init.sql` (Aula 06) e o código da aplicação (Aulas 07-09). Subir agora daria erro.

---

## 🔧 Se deu erro

| Erro | Causa | Solução |
|---|---|---|
| `yaml: line X: did not find expected key` | Indentação errada | Confira os espaços; **nunca use Tab** |
| `mapping values are not allowed` | Faltou espaço depois dos dois-pontos | Use `image: mysql:8.0`, não `image:mysql:8.0` |
| `variable is not set` | Variável faltando no `.env` | Confira se o `.env` existe e tem as 8 variáveis |
| `services must be a mapping` | Estrutura quebrada | Compare a indentação com o modelo desta aula |
| `no configuration file provided` | Nome errado do arquivo | Deve ser `docker-compose.yml`, na raiz |

> 💡 **Dica para YAML:** instale a extensão **YAML** (da Red Hat) no VS Code. Ela sublinha erros de indentação enquanto você digita.

---

## ➡️ Próximo passo

Containers orquestrados. Vamos modelar as tabelas do banco.

**[Aula 06 — Banco de dados](06-banco-de-dados.md)**
