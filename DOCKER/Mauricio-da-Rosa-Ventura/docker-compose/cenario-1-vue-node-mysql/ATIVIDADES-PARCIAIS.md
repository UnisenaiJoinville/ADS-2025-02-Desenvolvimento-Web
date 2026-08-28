# Atividades parciais do Cenário 1 (seção 6.3 do material)

## Teórica — Por que a API usa `mysql`, `redis` e `rabbitmq` por nome de serviço, e não por `localhost`?

Dentro do `docker-compose.yml`, cada serviço roda em seu próprio container, e todos os containers listados nesta pilha estão conectados à mesma rede definida pelo usuário (`app_net`). O Docker Compose cria automaticamente, para essa rede, um servidor DNS interno que resolve o **nome do serviço** (`mysql`, `redis`, `rabbitmq`, `api`) para o endereço IP interno do container correspondente — por isso o backend se conecta usando `DB_HOST=mysql`, `REDIS_HOST=redis` e `RABBITMQ_HOST=rabbitmq` (ver `.env.example`), em vez de um IP fixo ou de `localhost`.

`localhost` (ou `127.0.0.1`), de dentro de um container, se refere **ao próprio container**, nunca ao host nem a outro container — é justamente a pergunta 4 do banco de atividades teóricas (item 10.1) do material. Se a API tentasse `mysql2.createConnection({ host: "localhost" })`, ela estaria tentando conectar a um MySQL rodando dentro do próprio container da API (que não existe ali), e a conexão falharia sempre, independente de o container `mysql` estar saudável ou não.

Diagrama de rede simplificado desta pilha:

```
                    rede "app_net" (DNS interno do Compose)
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│   frontend (5173) ──REST──▶ api (3000) ──┬──▶ mysql (3306)        │
│                                            ├──▶ redis (6379)       │
│                                            └──▶ rabbitmq (5672)    │
│                                                     ▲               │
│                                            worker ──┘ (consome fila)│
└──────────────────────────────────────────────────────────────────┘
```

## Prática — Subir a pilha, listar containers, abrir logs da api e do rabbitmq

Automatizado por `./coletar-evidencias.sh` (rode com o Docker aberto). O script sobe a pilha com `docker compose up -d --build`, espera os healthchecks, e grava em `EVIDENCIAS.md` a saída de `docker compose ps`, `docker compose logs api` e `docker compose logs rabbitmq`, entre outras evidências.

## Prática — `docker compose down` e subir de novo: os dados do MySQL persistem?

Também automatizado por `coletar-evidencias.sh` (seção 7 do `EVIDENCIAS.md` gerado): o script consulta `SELECT COUNT(*) FROM eventos` antes do `docker compose down`, derruba a pilha, sobe de novo, e consulta a mesma contagem depois. Como o volume nomeado `mysql_data` não é removido por um `docker compose down` simples (só seria removido com `docker compose down -v`), a contagem de linhas se mantém igual — a tabela `eventos` (criada por `database/init.sql` só na primeira inicialização do volume) e o registro inserido pela API em `/api/status` continuam lá, mesmo com os containers tendo sido recriados do zero.

## Análise — Redis como cache x RabbitMQ como fila: quando usar cada um?

| Critério | Redis (cache) | RabbitMQ (fila) |
|---|---|---|
| Propósito | Guardar um resultado já calculado/consultado para reaproveitar rapidamente depois. | Desacoplar quem gera um evento de quem processa esse evento, garantindo que a mensagem não se perde. |
| Modelo de acesso | Leitura/escrita direta por chave (`GET`/`SET`), o dado pode ser sobrescrito ou expirar. | Mensagem é publicada em uma fila e consumida uma única vez por um worker (ou distribuída entre vários). |
| Latência esperada | Sub-milissegundo; feito para ser consultado a cada requisição. | Depende do processamento do consumidor; a mensagem pode esperar na fila até haver capacidade. |
| Perda de dado é aceitável? | Geralmente sim — um cache pode ser reconstruído a partir da fonte original (o próprio MySQL, por exemplo). | Geralmente não — a fila é durável (`durable: true`, como configurado em `backend/src/index.js`) porque representa um trabalho que precisa acontecer. |
| Exemplo real neste cenário | Guardar `cenario1:ultima-verificacao` em Redis (ver `checkRedis()` em `backend/src/index.js`) para não recalcular esse valor a cada leitura. | A API publica um evento `status-check` na fila `cenario1.eventos`; o `worker` consome essa fila de forma assíncrona e processa cada evento sem bloquear a resposta HTTP da API. |

Em resumo: Redis responde "qual é o valor agora, rápido, e tudo bem se eu perder"; RabbitMQ responde "isso precisa ser processado em algum momento, e não pode simplesmente desaparecer".
