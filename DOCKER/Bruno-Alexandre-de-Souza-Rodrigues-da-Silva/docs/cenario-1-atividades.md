# Atividades do Cenário 1 (seção 6.3)

**Aluno:** Bruno Silva
**Pilha:** Vue + Node + MySQL + Redis + RabbitMQ

---

## 1. Teórica — Por que a api usa os serviços pelo nome e não por localhost

Porque `localhost` dentro de um container aponta para o **próprio container**.
Cada container tem sua rede isolada. Se a minha API chamasse `localhost:3306`
procurando o MySQL, ela procuraria um banco dentro dela mesma e receberia
"connection refused" — mesmo com o MySQL de pé no container ao lado.

O Compose cria uma rede interna com DNS próprio, onde cada serviço é resolvido
pelo nome declarado no arquivo. Por isso a minha API usa `DB_HOST: mysql`,
`REDIS_HOST: redis` e `RABBITMQ_HOST: rabbitmq`.

Também não daria para usar o IP: ele muda toda vez que o container é recriado.
Comprovei isso na prática entrando na API:

```
$ docker compose exec api sh -c 'getent hosts mysql'
172.24.0.4        mysql
```

O nome `mysql` foi resolvido para o IP do container do banco, sem eu precisar
saber qual era o IP.

### Diagrama da rede

```
                    rede app_net (criada pelo Compose)
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   │   ┌─────────┐         ┌─────────┐                        │
   │   │   api   │ ──────► │  mysql  │  volume mysql_data     │
   │   │  :3000  │  "mysql"└─────────┘                        │
   │   │         │                                            │
   │   │         │ ──────► ┌─────────┐  volume redis_data     │
   │   │         │  "redis"│  redis  │                        │
   │   │         │         └─────────┘                        │
   │   │         │                                            │
   │   │         │ ──────► ┌──────────┐ ◄────── ┌─────────┐   │
   │   └─────────┘"rabbitmq"│ rabbitmq │ consome │ worker  │   │
   │        ▲               └──────────┘         └─────────┘   │
   └────────┼─────────────────────────────────────────────────┘
            │ porta publicada 3010 → 3000
      ┌─────┴─────┐
      │ navegador │  (host)
      └───────────┘
```

Só a API (3010) e o painel do RabbitMQ (15672) são publicados para o host.
MySQL, Redis e worker ficam apenas na rede interna, porque ninguém de fora
precisa acessá-los diretamente.

---

## 2. Prática — Subir a pilha, listar containers e abrir os logs

```
$ docker compose up -d --build
$ docker compose ps

SERVICE    STATUS                   PORTS
api        Up About a minute        0.0.0.0:3010->3000/tcp
mysql      Up 2 minutes (healthy)   3306/tcp, 33060/tcp
rabbitmq   Up 2 minutes (healthy)   0.0.0.0:15672->15672/tcp
redis      Up 2 minutes             6379/tcp
worker     Up 2 minutes
```

Logs da api:

```
api-1  | Redis conectado
api-1  | RabbitMQ conectado
api-1  | API rodando na porta 3000
```

Logs do rabbitmq:

```
rabbitmq-1  | user 'projeto_mq' authenticated and granted access to vhost '/'
```

Logs do worker, provando que a mensagem publicada pela API chegou:

```
worker-1  | Worker no ar, esperando mensagens na fila "tarefas"
worker-1  | Mensagem recebida: acesso ao /status
```

A evidência completa está em `evidencias/cenario-1-p3-logs.txt`.

### Problema que apareceu e como resolvi

Na primeira tentativa a pilha não subiu inteira:

```
Bind for 0.0.0.0:3000 failed: port is already allocated
```

Antes de mexer em qualquer coisa, fui olhar quem estava usando a porta:

```
$ docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 3000
polos-api-1    0.0.0.0:3000->3000/tcp
```

Era outro projeto meu já rodando. Segui a orientação da tabela de
troubleshooting do material: trocar o mapeamento em vez de derrubar o que já
estava no ar. Mudei para `"3010:3000"` — o host usa 3010, o container continua
na 3000. Registrei tudo em `evidencias/troubleshooting-porta-3000.txt`.

---

## 3. Prática — Provar que os dados do MySQL persistem

Este teste mostra a diferença entre destruir o container e destruir o dado.

**Antes:** a tabela tinha 3 registros vindos do `init.sql`. Inseri um quarto:

```
$ docker compose exec mysql mysql -uroot -p... -e "INSERT INTO projeto.horarios (descricao) VALUES ('11:00 - 12:00');"
$ ... SELECT COUNT(*) FROM projeto.horarios;
4
```

**Derrubei tudo:**

```
$ docker compose down
 Container cenario-1-bruno-mysql-1  Removed
 Network cenario-1-bruno_app_net  Removed

$ docker compose ps -a
SERVICE   STATUS
(nenhum container)

$ docker volume ls --filter name=cenario-1-bruno
cenario-1-bruno_mysql_data   local
cenario-1-bruno_redis_data   local
```

Os containers sumiram. Os volumes continuaram.

**Subi de novo e contei:**

```
$ docker compose up -d
$ ... SELECT COUNT(*) FROM projeto.horarios;
4
```

Os 4 registros continuam lá, incluindo o que inseri manualmente. O container foi
destruído e recriado do zero; o dado sobreviveu porque mora no volume nomeado
`mysql_data`, não dentro do container.

Se eu tivesse usado `docker compose down -v`, o volume também seria apagado e a
contagem voltaria para 3 (só o que o `init.sql` recria). Essa é a diferença entre
os dois comandos, e é por isso que o `-v` só deve ser usado quando eu quero
mesmo resetar o banco.

---

## 4. Análise — Redis e RabbitMQ, quando usar cada um

| | Redis | RabbitMQ |
|---|---|---|
| O que é | banco chave-valor em memória | broker de mensagens |
| Padrão de uso | escrevo uma vez, leio muitas | publico uma vez, consumo uma vez |
| A mensagem sai? | não, fica até expirar | sim, sai da fila ao ser processada |
| Problema que resolve | evitar trabalho repetido | adiar trabalho demorado |
| Quem consome | a própria API | um worker separado |

### Exemplo real do meu projeto

O endpoint `/agenda` mostra o Redis como cache funcionando. Na primeira chamada
o dado vem do banco; na segunda, do cache:

```
$ curl localhost:3010/agenda
{"origem":"mysql","dados":[...]}

$ curl localhost:3010/agenda
{"origem":"redis","dados":[...]}
```

A lista de horários muda pouco e é consultada o tempo todo. Guardar no Redis por
30 segundos evita bater no MySQL a cada acesso. Se o dado sumir do cache não tem
problema nenhum — a API busca no banco de novo. Cache é descartável.

O RabbitMQ resolve outro problema. No endpoint `/status`, a API publica uma
mensagem na fila `tarefas` e responde ao usuário na hora. O worker, em outro
container, consome essa mensagem depois:

```
worker-1  | Mensagem recebida: acesso ao /status
```

Num sistema de verdade seria o envio de um e-mail de confirmação: a API não pode
segurar a resposta HTTP esperando o servidor de e-mail. Aqui a mensagem **não
pode** se perder, diferente do cache. Por isso a fila é `durable: true` e o
worker confirma o processamento com `ack`.

**Resumindo:** uso Redis quando o dado pode ser recalculado sem prejuízo e o que
eu quero é velocidade. Uso RabbitMQ quando o trabalho precisa acontecer, mas não
agora, e não pode ser perdido no caminho.
