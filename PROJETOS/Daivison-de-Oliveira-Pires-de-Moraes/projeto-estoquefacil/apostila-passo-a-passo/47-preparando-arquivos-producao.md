# Aula 47 — Preparando os arquivos para produção

⏱️ **Tempo estimado:** 60 minutos
📋 **Tipo:** prática (VS Code + terminal local)

---

## Objetivo

Criar, **no seu computador**, os arquivos que diferenciam o ambiente de **produção** do de aula, e fazer um **ensaio geral** local antes de encostar no servidor.

---

## Antes de começar

- [ ] Aula 46 concluída
- [ ] Projeto completo funcionando (`docker compose up -d` e http://localhost:3000 respondendo)
- [ ] Docker Desktop aberto

---

## Por que não usar o mesmo `docker-compose.yml`?

O arquivo de aula foi desenhado para **desenvolver**: abre portas para você testar, monta o código como volume para recarregar ao salvar, usa senhas fáceis. Em produção, cada uma dessas comodidades vira risco.

| | Aula (`docker-compose.yml`) | Produção (`docker-compose.prod.yml`) |
|---|---|---|
| Porta do MySQL | Publicada (`3308`) | **Nenhuma** |
| Porta da API | Publicada (`3000`) | **Nenhuma** (só o Caddy fala com ela) |
| Código | Volume: muda ao salvar | **Dentro da imagem** (não muda sozinho) |
| Comando | `npm run dev` (`--watch`) | `node src/server.js` |
| Usuário no container | `root` | `node` (sem privilégios) |
| Sistema de arquivos | Gravável | **Somente leitura** |
| Banco inicial | Dados de exemplo + usuários de demonstração | **Só as tabelas** |
| Senhas | `root123`, `estoque123` | **Geradas aleatoriamente** |
| HTTPS | Não | **Sim**, automático |

> 📌 **Regra de ouro:** o Dockerfile e o Compose de aula **continuam como estão**. Vamos criar arquivos **novos**, com sufixo `.prod`. Assim, aula e produção convivem sem se atrapalhar.

---

## O mapa dos arquivos novos

```text
projeto/
├── Dockerfile.prod              <- NOVO  imagem de produção da API
├── docker-compose.prod.yml      <- NOVO  API + MySQL + Caddy
├── .env.production.example      <- NOVO  modelo do .env do servidor
├── .dockerignore                <- ALTERADO
├── .gitignore                   <- ALTERADO
├── database/
│   └── producao/
│       └── 001-schema.sql       <- NOVO  só as tabelas, sem dados
└── deploy/
    ├── caddy/
    │   └── Caddyfile            <- NOVO  configuração do porteiro (HTTPS)
    └── backup.sh                <- NOVO  (Aula 57)
```

---

## Passo 1 — `Dockerfile.prod`

Crie na raiz o arquivo `Dockerfile.prod`:

```dockerfile
# Imagem de PRODUCAO da API (o Dockerfile da raiz continua sendo o de aula).
FROM node:22-alpine

# Faz o Express e as bibliotecas trabalharem em modo producao
ENV NODE_ENV=production

WORKDIR /app

# Dependencias primeiro (cache de camadas, como na Aula 04).
# "npm ci" instala EXATAMENTE o que esta no package-lock.json
# e "--omit=dev" deixa de fora o que so serve para desenvolver.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# So o que a aplicacao precisa para rodar: nada de .env, apostilas ou banco
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

# A imagem node ja traz o usuario "node", sem poderes de administrador.
# Se alguem invadir a aplicacao, nao entra como root.
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
```

Salve com `Ctrl` + `S`.

### O que mudou em relação ao Dockerfile da Aula 04

| Linha | Por que existe |
|---|---|
| `ENV NODE_ENV=production` | Faz o Express e as bibliotecas usarem o modo produção (mais rápido, menos detalhes de erro vazando) |
| `npm ci --omit=dev` | `ci` instala **exatamente** as versões do `package-lock.json` (mesma build, sempre). `--omit=dev` deixa de fora o que só serve para desenvolver |
| `npm cache clean --force` | Apaga o cache do npm, que só ocupa espaço na imagem |
| `COPY ... src` e `COPY ... public` | Copia **só** o que o programa usa. Nada de apostilas, `.env` ou SQL |
| `--chown=node:node` | Os arquivos pertencem ao usuário `node`, não ao `root` |
| `USER node` | O processo roda **sem poder de administrador** |
| `CMD ["node", "src/server.js"]` | Sem `--watch`: em produção o código não muda enquanto roda |

> 💡 **Princípio do menor privilégio.** Se alguém explorar uma falha da sua API, vai cair em um usuário que não pode instalar programas, mexer em configurações do sistema nem alterar o código da própria aplicação.

---

## Passo 2 — O banco de produção

Crie a pasta `database/producao` e dentro dela o arquivo `001-schema.sql`:

```sql
-- ============================================================
-- Estoque Facil - banco de PRODUCAO
-- Mesmas tabelas do database/init.sql, mas SEM dados de exemplo
-- e SEM os usuarios de demonstracao (senha conhecida = brecha).
-- Roda automaticamente na PRIMEIRA criacao do banco.
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(40) NOT NULL UNIQUE,
  category_id INT NULL,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NULL,
  type ENUM('IN', 'OUT') NOT NULL,
  quantity INT NOT NULL,
  note VARCHAR(180) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_movements_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
);

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_movements_product ON stock_movements (product_id);
CREATE INDEX idx_movements_created_at ON stock_movements (created_at);
CREATE INDEX idx_movements_user ON stock_movements (user_id);
```

### Por que um arquivo separado do `init.sql`?

Abra o `database/init.sql` e procure por `Professor Demo`. Ele cria usuários **com senha conhecida** (`123456`), que estão até no README. Em um servidor público isso é uma **porta aberta**: qualquer pessoa que leia o repositório entra no sistema.

O `001-schema.sql` tem exatamente as mesmas **tabelas, índices e chaves estrangeiras**, mas **nenhum dado** e **nenhum usuário**. O primeiro usuário será criado por você, com uma senha que só você conhece.

> ⚠️ Repare na ordem: aqui `users` vem **antes** de `stock_movements`, e a coluna `user_id` já nasce dentro do `CREATE TABLE`. No `init.sql` de aula ela entra por `ALTER` (Aula 38) por causa da ordem didática. O resultado final no banco é o mesmo.

---

## Passo 3 — `docker-compose.prod.yml`

Crie na raiz o arquivo `docker-compose.prod.yml`:

```yaml
# Compose de PRODUCAO. Uso:
#   docker compose -f docker-compose.prod.yml up -d --build
# Diferencas para o docker-compose.yml de aula:
#   - nenhum bind mount de codigo (o codigo vai DENTRO da imagem)
#   - o banco e a API NAO publicam porta no servidor
#   - so o Caddy (proxy reverso) fica exposto, nas portas 80 e 443
name: estoque-prod

services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    # Sem "ports": o MySQL so e alcancavel pelos outros containers
    volumes:
      - db-data:/var/lib/mysql
      # So o esquema (tabelas), sem usuarios nem dados de demonstracao
      - ./database/producao:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -p\"$$MYSQL_ROOT_PASSWORD\" --silent"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s

  api:
    build:
      context: .
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    env_file:
      - .env
    # Sem "ports": quem fala com a API e o Caddy, pela rede interna
    expose:
      - "3000"
    depends_on:
      db:
        condition: service_healthy
    # Endurecimento do container
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s

  caddy:
    image: caddy:2
    restart: unless-stopped
    environment:
      SITE_ADDRESS: ${SITE_ADDRESS}
    ports:
      # Em producao ficam 80 e 443. As variaveis so existem para o
      # "ensaio" no seu computador, onde essas portas podem estar ocupadas.
      - "${HTTP_PORT:-80}:80"
      - "${HTTPS_PORT:-443}:443"
      - "${HTTPS_PORT:-443}:443/udp"
    volumes:
      # A PASTA inteira (e nao so o arquivo), para o Caddy enxergar edicoes
      - ./deploy/caddy:/etc/caddy:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - api

volumes:
  db-data:
  caddy-data:
  caddy-config:
```

### Entendendo bloco por bloco

**`name: estoque-prod`**: nome do projeto Compose. Evita misturar com o ambiente de aula (cada um tem seus volumes e redes).

**Serviço `db`**

| Trecho | Significado |
|---|---|
| Sem `ports` | O MySQL **não existe** fora da rede do Docker. Nem o firewall precisa protegê-lo |
| `./database/producao:/docker-entrypoint-initdb.d:ro` | Roda o `001-schema.sql` na primeira criação. `:ro` = somente leitura |
| `CMD-SHELL ... $$MYSQL_ROOT_PASSWORD` | O `$$` entrega o `$` ao shell **do container**, que lê a senha do ambiente dele |

**Serviço `api`**

| Trecho | Significado |
|---|---|
| `build.dockerfile: Dockerfile.prod` | Usa a receita de produção |
| `expose: "3000"` | Documenta e libera a porta **só para a rede interna**. Diferente de `ports` |
| `read_only: true` | O sistema de arquivos do container é só leitura: um invasor não consegue gravar um programa malicioso |
| `cap_drop: ALL` | Remove todos os poderes especiais do Linux que o container teria |
| `no-new-privileges` | Nenhum processo dentro dele consegue ganhar mais privilégio |
| `healthcheck` | O Docker testa `/api/health` e marca o container como saudável ou não |

> 📌 **`expose` x `ports`** é a diferença central da aula. `ports: "3000:3000"` abre a porta para o **mundo**. `expose: "3000"` só deixa os **outros containers** enxergarem.

**Serviço `caddy`**

| Trecho | Significado |
|---|---|
| `ports: 80 e 443` | A **única** entrada do sistema. A `443/udp` é para HTTP/3 |
| `${HTTP_PORT:-80}` | Usa 80, a menos que a variável diga outra. Serve só para o ensaio local, onde 80 pode estar ocupada |
| `./deploy/caddy:/etc/caddy:ro` | Monta a **pasta** (e não só o arquivo), para o Caddy enxergar as edições |
| `caddy-data` | Guarda os **certificados**. Se perder, o Caddy pede tudo de novo e pode bater no limite de emissões |

---

## Passo 4 — O porteiro: `deploy/caddy/Caddyfile`

Crie as pastas `deploy` e `deploy/caddy` e, dentro desta, o arquivo `Caddyfile` (sem extensão):

```text
# Caddy: porteiro do servidor. Recebe a internet e repassa para a API.
# SITE_ADDRESS vem do .env:
#   estoque.seudominio.com.br  -> HTTPS automatico (certificado gratis)
#   :80                        -> so HTTP (apenas para testes!)
{$SITE_ADDRESS} {
	encode gzip zstd

	# Cabecalhos de seguranca em todas as respostas
	header {
		Strict-Transport-Security "max-age=2592000"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
		-X-Powered-By
	}

	# Passo da Aula 56: depois de criar a SUA conta, remova o "#" das
	# linhas abaixo (e reinicie o caddy) para fechar o cadastro publico.
	# @cadastro path /api/auth/register /cadastro.html
	# respond @cadastro "Cadastro desativado" 403

	reverse_proxy api:3000
}
```

| Trecho | O que faz |
|---|---|
| `{$SITE_ADDRESS}` | Lê o endereço da variável de ambiente. Com um domínio, o Caddy obtém e renova o certificado **sozinho** |
| `encode gzip zstd` | Comprime as respostas: páginas mais leves |
| `Strict-Transport-Security` | Manda o navegador usar **sempre** HTTPS neste site |
| `X-Content-Type-Options: nosniff` | Impede o navegador de "adivinhar" o tipo de um arquivo (vetor de ataque clássico) |
| `X-Frame-Options: DENY` | Impede que outro site coloque o seu dentro de um `iframe` (ataque de *clickjacking*) |
| `-Server` e `-X-Powered-By` | **Removem** os cabeçalhos que anunciam a tecnologia. Menos pista para o atacante |
| `@cadastro ... respond 403` | Comentado por enquanto. Na Aula 56 ele **fecha o cadastro público** |
| `reverse_proxy api:3000` | Entrega o pedido para a API, pelo nome do serviço |

> 💡 Reveja a Aula 05: `api` e `db` são nomes que o Docker resolve dentro da rede. É a mesma ideia: o Caddy chama a API por `api:3000`.

---

## Passo 5 — O modelo de variáveis: `.env.production.example`

Crie na raiz o arquivo `.env.production.example`:

```text
# MODELO do .env de PRODUCAO. No servidor este arquivo vira ".env".
# NUNCA coloque valores reais aqui: este modelo vai junto com o projeto.
# Gere cada segredo no servidor com:  openssl rand -hex 24

# Endereco publico do site:
#   estoque.seudominio.com.br  -> HTTPS automatico
#   :80                        -> so HTTP, apenas para testes
SITE_ADDRESS=estoque.seudominio.com.br

# API (porta interna do container)
PORT=3000

# Conexao com o MySQL (o host e o NOME DO SERVICO no compose)
DB_HOST=db
DB_PORT=3306
DB_USER=estoque
DB_PASSWORD=GERE_UM_SEGREDO_AQUI
DB_NAME=estoque_db

# Senha do root do MySQL (usada so pelo container do banco e pelo backup)
DB_ROOT_PASSWORD=GERE_OUTRO_SEGREDO_AQUI

# Assina os tokens de login. Se vazar, qualquer um forja um login.
# Precisa ter 32+ caracteres (o env.js recusa menos que isso).
JWT_SECRET=GERE_UM_TERCEIRO_SEGREDO_AQUI_COM_64_CARACTERES
JWT_EXPIRES_IN=1d
```

Este arquivo **é um modelo**, não contém segredo nenhum. Ele viaja com o projeto. O arquivo **real**, com as senhas, será criado **só no servidor** (Aula 55) e **nunca** sai de lá.

> ⚠️ Os valores `GERE_UM_SEGREDO_AQUI` são propositalmente inválidos. Se alguém subir o sistema sem trocá-los, o `JWT_SECRET` (menos de 32 caracteres) faz o `env.js` **recusar a inicialização**, graças ao *fail fast* da Aula 07.

---

## Passo 6 — Proteger o que **não** pode vazar

Substitua o conteúdo do `.gitignore`:

```text
node_modules
.env
.env.production
*.tar.gz
```

E o do `.dockerignore`:

```text
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
apostilas
apostila
database
deploy
ferramentas
*.tar.gz
```

| Item | Por que ignorar |
|---|---|
| `.env.production` e `.env.*` | Segredos reais nunca entram no Git nem na imagem |
| `*.tar.gz` | O pacote de envio é gerado a cada deploy; não se versiona |
| `database`, `deploy`, `apostila`, `ferramentas` | O container da API não precisa deles |

> 📌 Imagem Docker **não é cofre**. Quem tem a imagem consegue ler tudo que foi copiado para dentro dela. Por isso o `.env` fica fora e chega ao container só em tempo de execução.

---

## Passo 7 — O ensaio geral (no seu computador)

Antes de ir ao servidor, vamos fazer **exatamente o mesmo caminho** do deploy, mas na sua máquina. Se funcionar aqui, os erros que sobrarem na VPS serão só de servidor.

### 7.1 — Empacotar

💻 **No seu computador** (PowerShell, na raiz do projeto):

```powershell
tar -czf estoque-deploy.tar.gz src public database/producao deploy package.json package-lock.json Dockerfile.prod docker-compose.prod.yml .env.production.example
```

Isso cria um `.tar.gz` (um "zip" do mundo Linux) com **apenas** os arquivos listados.

> 📌 Repare no método: uma **lista do que entra**, e não uma lista do que fica de fora. Se amanhã alguém criar um arquivo `senhas.txt` na pasta, ele **não** viaja por acidente. Este é o conceito de *allowlist*.

Confira o conteúdo:

```powershell
tar -tzf estoque-deploy.tar.gz | Select-String "\.env|apostila|node_modules"
```

Não deve imprimir **nada**.

### 7.2 — Desempacotar em outra pasta

```powershell
mkdir ..\ensaio-prod
tar -xzf estoque-deploy.tar.gz -C ..\ensaio-prod
cd ..\ensaio-prod
```

### 7.3 — Criar o `.env` do ensaio

```powershell
copy .env.production.example .env
code .env
```

Edite assim (são valores **só de teste**; no servidor serão aleatórios):

```bash
SITE_ADDRESS=:80
DB_PASSWORD=senha-de-teste-1
DB_ROOT_PASSWORD=senha-de-teste-2
JWT_SECRET=um-segredo-de-teste-com-mais-de-32-caracteres-ok

# Só no ensaio: portas livres no seu computador
HTTP_PORT=8080
HTTPS_PORT=8443
```

`SITE_ADDRESS=:80` diz ao Caddy: "atenda em HTTP simples, sem domínio". É para teste.

### 7.4 — Subir

```powershell
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

O `-f` indica **qual** arquivo Compose usar (sem ele, o Docker procura o `docker-compose.yml`).

Aguarde `db` e `api` ficarem `healthy` (cerca de 40 segundos).

### 7.5 — Testar

Abra http://localhost:8080/login.html e também:

```powershell
curl.exe -i http://localhost:8080/api/health
```

Procure na resposta os cabeçalhos `X-Frame-Options`, `X-Content-Type-Options` e `Strict-Transport-Security`, e confirme que **não** aparece `X-Powered-By`.

### 7.6 — Confirmar o que **não** está exposto

```powershell
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

| Container | Portas esperadas |
|---|---|
| `estoque-prod-caddy-1` | `0.0.0.0:8080->80/tcp` (**publicada**) |
| `estoque-prod-api-1` | só `3000/tcp` (**sem** `0.0.0.0`) |
| `estoque-prod-db-1` | só `3306/tcp` (**sem** `0.0.0.0`) |

E confirme a segurança do container da API:

```powershell
docker compose -f docker-compose.prod.yml exec api id
docker compose -f docker-compose.prod.yml exec api touch /app/teste
```

| Comando | Resultado esperado |
|---|---|
| `id` | `uid=1000(node)`. **Não** é `root` |
| `touch` | `Read-only file system` |

E que o banco nasceu **limpo**:

```powershell
docker compose -f docker-compose.prod.yml exec db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" estoque_db -e "SELECT COUNT(*) AS usuarios FROM users;"'
```

Deve mostrar `0`. Tente entrar com `professor@estoquefacil.com` / `123456`: **não pode funcionar**.

### 7.7 — Limpar o ensaio

```powershell
docker compose -f docker-compose.prod.yml down -v
cd ..\projeto-docker-nodejs
```

> ⚠️ Aqui o `down -v` é seguro: é o banco **do ensaio**, em outra pasta e com outro nome de projeto. O seu banco de aula (`estoque-db-data`) não é tocado. Mesmo assim, **leia o diretório em que você está** antes de usar `-v`. Em produção, esse comando apagaria os dados reais.

---

## Entendendo o que fizemos

Criamos uma segunda "versão" do projeto, mais fechada, **sem mexer em uma linha do código da aplicação**. Isso mostra que segurança de implantação é em grande parte **configuração**:

- O que **não está exposto** não pode ser atacado.
- O que **não tem privilégio** não causa estrago.
- O que **não está na imagem** não vaza.
- O que **não existe** (usuário de demonstração) não pode ser usado.

---

## ✅ Confira se deu certo

- [ ] Existem `Dockerfile.prod`, `docker-compose.prod.yml`, `.env.production.example`, `database/producao/001-schema.sql` e `deploy/caddy/Caddyfile`
- [ ] O ensaio subiu e `db` e `api` ficaram `healthy`
- [ ] `/api/health` respondeu pelo Caddy (porta 8080) e **sem** `X-Powered-By`
- [ ] API e MySQL **sem** `0.0.0.0` na lista de portas
- [ ] `id` mostrou `node` e `touch` falhou com `Read-only file system`
- [ ] O banco do ensaio tem **0** usuários
- [ ] O `.tar.gz` **não** contém `.env` nem `node_modules`
- [ ] O ensaio foi removido (`down -v` **na pasta `ensaio-prod`**)

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `tar` não é reconhecido | Windows antigo | Use o Git Bash (`tar` vem junto) com os mesmos comandos |
| `Variable is not set` / `required variable` | `.env` faltando na pasta do ensaio | Rode `dir .env` (ou `ls -a`) na pasta `ensaio-prod` |
| `api` reinicia sem parar | `JWT_SECRET` com menos de 32 caracteres | Veja `docker compose -f docker-compose.prod.yml logs api` |
| `port is already allocated` | 8080 ocupada | Troque `HTTP_PORT` no `.env` do ensaio |
| `api` fica `unhealthy` | Banco ainda subindo ou senha divergente | Espere 1 minuto. Se persistir, `down -v` e suba de novo |
| Texto estranho no `.env` | Salvo com outra codificação | No VS Code: canto inferior direito, **UTF-8** e quebra de linha **LF** |

---

## ➡️ Próximo passo

Arquivos prontos. Agora vamos **conhecer o servidor**, e o primeiro assunto é como entrar nele com segurança.

**[Aula 48 — SSH: chaves e primeiro acesso](48-ssh-chaves-primeiro-acesso.md)**
