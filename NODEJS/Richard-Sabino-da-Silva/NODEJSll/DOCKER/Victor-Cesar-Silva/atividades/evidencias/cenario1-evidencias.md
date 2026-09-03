# Evidencias - Cenario 1 (coletadas em 28/08/2026 20:26)

## docker compose ps
```
NAME                  IMAGE                   COMMAND                  SERVICE    CREATED          STATUS                        PORTS
cenario1-api-1        cenario1-api            "docker-entrypoint.s…"   api        35 seconds ago   Up 32 seconds                 0.0.0.0:3002->3000/tcp, [::]:3002->3000/tcp
cenario1-frontend-1   cenario1-frontend       "docker-entrypoint.s…"   frontend   9 minutes ago    Up 32 seconds                 0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp
cenario1-mysql-1      mysql:8.4               "docker-entrypoint.s…"   mysql      9 minutes ago    Up 9 minutes (healthy)        3306/tcp, 33060/tcp
cenario1-rabbitmq-1   rabbitmq:4-management   "docker-entrypoint.s…"   rabbitmq   9 minutes ago    Up About a minute (healthy)   0.0.0.0:15672->15672/tcp, [::]:15672->15672/tcp
cenario1-redis-1      redis:7.4-alpine        "docker-entrypoint.s…"   redis      9 minutes ago    Up 9 minutes                  6379/tcp
cenario1-worker-1     cenario1-worker         "docker-entrypoint.s…"   worker     9 minutes ago    Up About a minute             
```

## Logs da API
```
api-1  | [mysql] conectado e tabela pronta
api-1  | [redis] conectado
api-1  | [rabbitmq] conectado
api-1  | API na porta 3000
```

## Logs do RabbitMQ (ultimas linhas)
```
rabbitmq-1  | 2026-08-28 23:25:19.225305+00:00 [info] <0.888.0>  * rabbitmq_prometheus[0m
rabbitmq-1  | 2026-08-28 23:25:19.225305+00:00 [info] <0.888.0>  * rabbitmq_management[0m
rabbitmq-1  | 2026-08-28 23:25:19.225305+00:00 [info] <0.888.0>  * rabbitmq_management_agent[0m
rabbitmq-1  | 2026-08-28 23:25:19.225305+00:00 [info] <0.888.0>  * rabbitmq_web_dispatch[0m
rabbitmq-1  |  completed with 4 plugins.
rabbitmq-1  | 2026-08-28 23:25:19.353611+00:00 [info] <0.10.0> Time to start RabbitMQ: 7164 ms[0m
rabbitmq-1  | 2026-08-28 23:25:24.532115+00:00 [info] <0.1032.0> accepting AMQP connection 172.25.0.6:44006 -> 172.25.0.4:5672[0m
rabbitmq-1  | 2026-08-28 23:25:24.539411+00:00 [info] <0.1032.0> User 'app_mq' authenticated successfully[0m
rabbitmq-1  | 2026-08-28 23:25:24.587186+00:00 [info] <0.1032.0> connection 172.25.0.6:44006 -> 172.25.0.4:5672: user 'app_mq' authenticated and granted access to vhost '/'[0m
rabbitmq-1  | 2026-08-28 23:26:28.748199+00:00 [info] <0.1064.0> accepting AMQP connection 172.25.0.5:59304 -> 172.25.0.4:5672[0m
rabbitmq-1  | 2026-08-28 23:26:28.771938+00:00 [info] <0.1064.0> User 'app_mq' authenticated successfully[0m
rabbitmq-1  | 2026-08-28 23:26:28.820124+00:00 [info] <0.1064.0> connection 172.25.0.5:59304 -> 172.25.0.4:5672: user 'app_mq' authenticated and granted access to vhost '/'[0m
```

## Logs do worker (consumo real da fila)
```
worker-1  | [worker] aguardando mensagens na fila agendamentos
worker-1  | [worker] processando agendamento 1 de Victor Cesar Silva
```

## P5 - Persistencia: down (sem -v) e up de novo
```
$ docker compose down    # containers e rede removidos
$ docker volume ls | grep cenario1
local     cenario1_mysql_data
local     cenario1_redis_data
$ docker compose up -d
$ curl http://localhost:3002/agendamentos   # dado id=1 continua la
{"origem":"redis","dados":[{"id":1,"paciente":"Victor Cesar Silva","criado_em":"2026-08-28T23:26:46.000Z"}]}
```

## P4 - exec dentro da api (DNS interno resolvendo os nomes)
```
ad7edd92362e
--- ping mysql/redis/rabbitmq por NOME ---
172.25.0.3        mysql  mysql
172.25.0.4        redis  redis
172.25.0.2        rabbitmq  rabbitmq
```
