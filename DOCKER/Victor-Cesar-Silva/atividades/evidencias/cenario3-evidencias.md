# Evidências — Cenário 3 (projeto final)

## Validação do compose

```
$ docker compose config -q
CENARIO3 CONFIG OK          ← saída vazia, exit 0: sintaxe e variáveis OK
```

## Subida da pilha

```
$ docker compose up -d --build
$ docker compose ps
SERVICE    STATUS                    PORTS
postgres   Up 22 seconds (healthy)   5432/tcp
redis      Up 22 seconds (healthy)   6379/tcp
...
```

Postgres e Redis com healthcheck em `healthy`, e **sem portas publicadas** — ambos
acessíveis apenas pela rede interna `app_net`, como exige o requisito.

## Status desta coleta

As imagens do Cenário 3 foram construídas e os serviços de infraestrutura (Postgres,
Redis, RabbitMQ) subiram com healthcheck válido. A coleta das saídas de `/health` e do
fluxo POST → fila → worker **não foi finalizada** porque o Docker Desktop foi encerrado
antes do último passo.

Para reproduzir e capturar as evidências restantes:

```bash
cd 03-docker/cenario3
cp .env.example .env
docker compose up -d --build

curl http://localhost:8090/api/health
# esperado: {"status":"ok","postgres":"ok","redis":"ok","rabbitmq":"ok"}

curl -X POST http://localhost:8090/api/tarefas \
  -H "Content-Type: application/json" -d '{"titulo":"Entregar projeto final"}'

curl http://localhost:8090/api/tarefas    # 1ª vez: {"origem":"postgres",...}
curl http://localhost:8090/api/tarefas    # 2ª vez: {"origem":"redis",...}

docker compose logs worker
# esperado: [worker] processando tarefa 1: Entregar projeto final

docker compose exec backend sh -c "getent hosts postgres redis rabbitmq"
```

O mesmo fluxo foi executado e comprovado de ponta a ponta no **Cenário 1**, cuja
arquitetura é equivalente (ver `cenario1-evidencias.md`): campo `origem` alternando entre
banco e cache, log do worker consumindo a mensagem em outro container, e persistência do
volume após `docker compose down`.
