# Roteiro Guiado — Checkpoints dos Passos 0 a 10

**Aluno:** Victor Cesar Silva

Cada passo com a ação demonstrável e o checkpoint atendido.

---

## Passo 0 — Preparar o ambiente

```bash
$ docker --version
Docker version 28.5.1, build e180ab8
$ docker compose version
Docker Compose version v2.x
$ docker run --rm hello-world
Hello from Docker!
```

**Checkpoint:** o `docker run hello-world` baixou a imagem do Docker Hub (ela não existia
localmente), criou um container a partir dela, executou o binário que imprime a mensagem e
encerrou. O `--rm` já removeu o container ao terminar.

---

## Passo 1 — Uma API sem Docker

API Express respondendo em `/health`, rodando direto com `node server.js`.

**Pergunta disparadora:** "mandando esse projeto para o colega, ele roda igual?"
Não. Ele precisa ter a mesma versão do Node (o código usa ESM e `"type": "module"`),
rodar `npm install` e não ter a porta ocupada. Neste trabalho isso ficou evidente: as
portas 3000, 3001 e 8080 já estavam ocupadas na máquina. Esse é o problema que o Docker
resolve — empacotar o ambiente junto com o código.

**Checkpoint:** API respondendo localmente, sem Docker.

---

## Passo 2 — O primeiro Dockerfile

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t projeto-api .
docker run -p 3000:3000 projeto-api
```

**Checkpoint — imagem vs. container:** `projeto-api` é a **imagem**, um pacote imutável em
camadas produzido pelo `build`. O que passa a rodar depois do `docker run` é o
**container**, uma instância viva dessa imagem, com camada gravável própria. A imagem é a
receita; o container é o bolo. Apagar o container não apaga a imagem, e é possível criar
vários containers a partir da mesma imagem — que é o próximo passo.

---

## Passo 3 — Dois containers da mesma imagem

```bash
docker run -d -p 3000:3000 --name api-a projeto-api
docker run -d -p 4000:3000 -e PORT=3000 --name api-b projeto-api
docker ps
curl localhost:3000/health   # {"status":"ok"}
curl localhost:4000/health   # {"status":"ok"}
```

**Checkpoint:** dois containers da mesma imagem rodando ao mesmo tempo, em portas
diferentes do host, e ambos respondendo. São processos completamente isolados: cada um
tem seu próprio sistema de arquivos e sua própria pilha de rede. Só o **lado esquerdo** do
`-p` muda — dentro do container a porta continua sendo 3000. Isso mostra por que a porta
não pode estar fixa no código: ela vem de variável de ambiente.

---

## Passo 4 — Por que `localhost` não serve entre containers

```bash
docker network create projeto-net
docker run -d --name projeto-mysql --network projeto-net \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=projeto \
  -v projeto_mysql_data:/var/lib/mysql mysql:8.4
```

**Checkpoint:** dentro de um container, `localhost` (127.0.0.1) aponta para o **próprio
container**, porque cada container tem seu próprio network namespace, com sua própria
interface de loopback. Se a API buscasse `localhost:3306`, procuraria um MySQL rodando
dentro dela mesma — que não existe. Também não aponta para o host: o host é outra máquina
do ponto de vista da rede do container (para alcançá-lo existe `host.docker.internal`).

E o IP do container também não serve: ele muda a cada recriação. A resposta certa é
**resolver pelo nome do serviço** no DNS interno da rede Docker — o que leva naturalmente
ao Compose. Comprovado depois:

```
$ docker compose exec api sh -c "getent hosts mysql redis rabbitmq"
172.25.0.3    mysql
172.25.0.4    redis
172.25.0.2    rabbitmq
```

---

## Passo 5 — Docker Compose

Arquivos criados: `.env` (fora do Git) e `docker-compose.yml`.

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

**Checkpoint — cada bloco do arquivo:**

- `services` — os containers que compõem a aplicação; cada nome vira hostname na rede.
- `build` / `image` — construir a partir de um Dockerfile ou usar imagem pronta (com
  versão fixa, nunca `latest`).
- `environment` — variáveis que chegam ao processo; os valores vêm do `.env`.
- `depends_on` com `condition: service_healthy` — ordem de subida, esperando o
  healthcheck passar, não apenas o container existir.
- `networks` — a rede compartilhada que dá o DNS interno.
- `volumes` — o que persiste além do ciclo de vida do container.

**Atividade prática — `down` vs. `down -v`:**

| Comando | Resultado observado |
|---|---|
| `docker compose down` + `up -d` | Dados do MySQL **continuam** lá |
| `docker compose down -v` + `up -d` | Banco volta **vazio** |

Evidência real coletada:

```
$ curl -X POST localhost:3002/agendamentos -d '{"paciente":"Victor Cesar Silva"}' ...
{"id":1,...}
$ docker compose down
$ docker volume ls | grep cenario1
local     cenario1_mysql_data          ← o volume sobreviveu
$ docker compose up -d
$ curl localhost:3002/agendamentos
{"origem":"mysql","dados":[{"id":1,"paciente":"Victor Cesar Silva",...}]}
```

---

## Passo 6 — Redis (cache)

```yaml
redis:
  image: redis:7.4-alpine
  volumes:
    - redis_data:/data
  networks: [app_net]
```

Ligado à API por `REDIS_HOST: redis` — de novo, o nome do serviço como hostname.

**Checkpoint — quando usar Redis em vez do MySQL:** para dado que pode ser **recalculado**
e cujo objetivo é velocidade. No projeto, o `GET /agendamentos` guarda o resultado da
consulta no Redis com TTL de 30s. A resposta mostra a diferença no campo `origem`:

```
1ª chamada: {"origem":"mysql",...}   ← cache vazio, foi ao banco
2ª chamada: {"origem":"redis",...}   ← veio do cache
```

Outros exemplos: sessão de login, contador de visitas, rate limiting. Se o Redis cair, a
aplicação fica lenta, não quebrada — esse é o critério.

---

## Passo 7 — RabbitMQ e worker

```bash
docker compose up -d --build
# painel em http://localhost:15672
```

**Consumo real da fila implementado** (`worker/worker.js`): o worker declara a fila como
`durable`, usa `prefetch(1)` e dá `ack` só depois de processar. Evidência:

```
$ curl -X POST localhost:3002/agendamentos -d '{"paciente":"Victor Cesar Silva"}' ...
{"id":1,"paciente":"Victor Cesar Silva","evento":"publicado na fila"}

$ docker compose logs worker
worker-1  | [worker] aguardando mensagens na fila agendamentos
worker-1  | [worker] processando agendamento 1 de Victor Cesar Silva
```

**Checkpoint — Redis vs. RabbitMQ:** o Redis tem leitura **não destrutiva** (vários leem o
mesmo valor, que expira pelo TTL) e serve para "já calculei isso?". O RabbitMQ tem leitura
**destrutiva** (a mensagem sai da fila após o `ack`) e serve para "faça isso depois, não
me faça esperar". No projeto: a listagem em cache é Redis; o e-mail de confirmação
disparado pelo POST é RabbitMQ — a API responde em milissegundos e o worker, em outro
container, processa depois. Perder um item do cache é indiferente; perder uma mensagem
significa um paciente sem confirmação.

---

## Passo 8 — Diagnóstico de falhas

**Atividade:** o professor quebra uma variável do `.env` e o aluno resolve só com `logs`,
`ps` e `inspect`, sem rebuild às cegas.

Simulei removendo `MYSQL_PASSWORD` do `.env`:

```bash
docker compose ps -a
# api    Exited (1)          ← o -a é essencial: sem ele o container morto some da lista

docker compose logs api
# Falha ao iniciar: Access denied for user 'app_user'@'172.25.0.5'

docker inspect cenario1-api-1 --format '{{json .Config.Env}}'
# ...,"DB_PASSWORD=",...     ← a variável chegou VAZIA: causa raiz encontrada
```

Diagnóstico: `DB_PASSWORD` vazia porque `MYSQL_PASSWORD` não existe no `.env`. O compose
interpola string vazia em vez de falhar. Correção: repor a variável e `docker compose up -d`
— sem rebuild, porque a imagem não mudou; só a configuração.

**Falha real encontrada neste trabalho** (não simulada): a API subia e morria com
`connect ECONNREFUSED 172.25.0.2:5672`. Pelo mesmo método — `ps -a` mostrando
`Exited (1)` e `logs` apontando a porta 5672 — identifiquei que o healthcheck
`rabbitmq-diagnostics ping` fica `healthy` **antes** de a porta aceitar conexões,
liberando o `depends_on` cedo demais. Corrigido com `check_port_connectivity` e
`restart: on-failure`.

**Checkpoint:** problema resolvido apenas com ferramentas de diagnóstico, sem "apagar tudo
e tentar de novo" como primeira reação.

---

## Passo 9 (opcional) — Frontend Vue

Implementado no Cenário 1 (`frontend/`, Vue 3 + Vite, publicado em `5173:5173`), fechando
a arquitetura completa: Vue + Node + MySQL + Redis + RabbitMQ + worker.

---

## Passo 10 — Boas práticas aplicadas

| Prática | Onde está no projeto |
|---|---|
| `.env.example` versionado, `.env` no `.gitignore` | os três cenários |
| Versões fixas de imagem | `node:22-alpine`, `mysql:8.4`, `redis:7.4-alpine`, `rabbitmq:4-management`, `postgres:16-alpine`, `nginx:1.27-alpine` |
| Volume nomeado para dado persistente | `mysql_data`, `redis_data`, `postgres_data` |
| Healthcheck em serviço do qual outros dependem | `mysql`, `postgres`, `redis`, `rabbitmq` |
| `.dockerignore` | em api, worker e frontend de todos os cenários |
| Multi-stage build | frontend dos Cenários 2 e 3 |
| Publicar só a porta de entrada | Cenário 2 (só Nginx) e Cenário 3 (só frontend) |

`.dockerignore` usado:

```
node_modules
npm-debug.log
.env
```

Ele importa por dois motivos: build mais rápido e imagem menor (o `node_modules` do host
não é copiado, e seria inútil — pode ter binários de outro sistema operacional), e
segurança (o `.env` não entra na imagem, onde ficaria visível em `docker history`).
