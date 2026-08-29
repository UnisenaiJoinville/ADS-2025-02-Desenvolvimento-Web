# Atividades Práticas P1 a P8 (seção 10.2)

**Aluno:** Bruno Silva

Todas foram executadas de verdade. As saídas completas estão em `evidencias/`.

---

## P1 — Criar `.env.example` para o Cenário 1

**Critério:** sem senhas reais, nomes coerentes com o compose.

Arquivo `cenario-1/.env.example`:

```env
MYSQL_DATABASE=projeto
MYSQL_USER=projeto_user
MYSQL_PASSWORD=troque_esta_senha
MYSQL_ROOT_PASSWORD=troque_esta_senha_root

RABBITMQ_USER=projeto_mq
RABBITMQ_PASSWORD=troque_esta_senha_mq
```

Os nomes batem exatamente com o que o compose consome (`${MYSQL_USER}`,
`${RABBITMQ_PASSWORD}` e os demais). Nenhum valor é senha real — as de senha
levam `troque_esta_senha` de propósito.

Conferi que o `.env` real não foi versionado:

```
$ git ls-files | grep "cenario-1/.env$"
(nenhum resultado)
```

**Feito.**

---

## P2 — Executar `docker compose config`

**Critério:** arquivo validado sem erro de sintaxe.

```
$ docker compose config
OK - arquivo validado sem erro de sintaxe

$ docker compose config --services
mysql
rabbitmq
redis
api
worker
```

Rodei nos três cenários e todos passaram. O `config` também expande as
variáveis do `.env`, então ele acusa variável faltando antes de tentar subir.

**Feito.**

---

## P3 — Subir o Cenário 1 e coletar logs

**Critério:** logs de api, mysql e rabbitmq apresentados.

```
SERVICE    STATUS                   PORTS
api        Up About a minute        0.0.0.0:3010->3000/tcp
mysql      Up 2 minutes (healthy)   3306/tcp
rabbitmq   Up 2 minutes (healthy)   0.0.0.0:15672->15672/tcp
redis      Up 2 minutes             6379/tcp
worker     Up 2 minutes
```

```
api-1       | Redis conectado
api-1       | RabbitMQ conectado
api-1       | API rodando na porta 3000

mysql-1     | /usr/sbin/mysqld: ready for connections. Version: '8.4.11'

rabbitmq-1  | user 'projeto_mq' authenticated and granted access to vhost '/'

worker-1    | Worker no ar, esperando mensagens na fila "tarefas"
worker-1    | Mensagem recebida: acesso ao /status
```

Evidência completa em `evidencias/cenario-1-p3-logs.txt`.

**Feito.**

---

## P4 — Executar comando dentro da api

**Critério:** `docker compose exec api sh` ou equivalente.

```
$ docker compose exec api sh -c '...'
hostname: 6cafec976af7
node: v24.20.0
DB_HOST=mysql REDIS_HOST=redis

--- resolvendo o nome do servico ---
172.24.0.4        mysql
```

Esse último comando é a prova prática do item teórico: dentro do container, o
nome `mysql` foi resolvido para o IP do container do banco pelo DNS interno do
Compose.

**Feito.**

---

## P5 — Simular perda de container sem perder o volume

**Critério:** dados persistem após recriação.

Inseri um registro a mais dos 3 que o `init.sql` cria:

```
$ ... SELECT COUNT(*) FROM projeto.horarios;
4
```

Derrubei os containers:

```
$ docker compose down
 Container cenario-1-bruno-mysql-1  Removed
 Network cenario-1-bruno_app_net  Removed

$ docker compose ps -a
(nenhum container)

$ docker volume ls --filter name=cenario-1-bruno
cenario-1-bruno_mysql_data   local
cenario-1-bruno_redis_data   local
```

Subi de novo e contei:

```
$ docker compose up -d
$ ... SELECT COUNT(*) FROM projeto.horarios;
4
```

Os 4 registros continuam. O container foi destruído e recriado; o dado
sobreviveu porque mora no volume `mysql_data`.

**Feito.**

---

## P6 — Ativar o profile tools no Cenário 2

**Critério:** PgAdmin executando apenas quando solicitado.

Sem a flag:

```
$ docker compose ps --services --filter status=running
api frontend postgres proxy rabbitmq redis
```

Com a flag:

```
$ docker compose --profile tools up -d
 Container cenario-2-bruno-pgadmin-1  Started

$ curl -s -o /dev/null -w '%{http_code}' http://localhost:5050
HTTP 302
```

O 302 é o redirecionamento para a tela de login, ou seja, está no ar.

Detalhe: na primeira tentativa o PgAdmin subiu e morreu. O log mostrou que a
versão 8 rejeita o e-mail `admin@local.test` do material, porque o domínio
`.test` não passa na validação. Troquei para `admin@local.com`.

**Feito.**

---

## P7 — Adicionar healthcheck em um serviço

**Critério:** `docker compose ps` mostra status `healthy`.

```
SERVICE    STATUS
mysql      Up 2 minutes (healthy)
rabbitmq   Up 2 minutes (healthy)
```

No Cenário 3 fui além e adicionei healthcheck também no Redis e na própria API:

```yaml
  api:
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
```

O `start_period` é importante: sem ele, a API seria marcada como não saudável
nos primeiros segundos, enquanto ainda está conectando nas dependências.

**Feito.**

---

## P8 — Documentar troubleshooting

**Critério:** README contém pelo menos três erros comuns e soluções.

O `cenario-3/README.md` tem uma seção de troubleshooting com cinco erros. Os
três primeiros aconteceram comigo de verdade durante este trabalho:

**1. `port is already allocated`** — outro serviço da máquina já usa a porta.
Descobrir com `docker ps --format "table {{.Names}}\t{{.Ports}}"` e trocar o
lado esquerdo do mapeamento, sem derrubar o que já estava rodando.

**2. PgAdmin sobe e morre** — o log revela que o e-mail `.test` é rejeitado.
Sem olhar o log, o serviço só some do `ps` e parece que o profile não funcionou.

**3. API não conecta no banco** — quase sempre é `localhost` no lugar do nome do
serviço.

**4. API sobe antes do banco** — resolvido com `depends_on` +
`condition: service_healthy`.

**5. Docker Desktop não inicia no Windows** — virtualização desabilitada na
BIOS ou recursos Hyper-V/Containers desativados.

**Feito.**
