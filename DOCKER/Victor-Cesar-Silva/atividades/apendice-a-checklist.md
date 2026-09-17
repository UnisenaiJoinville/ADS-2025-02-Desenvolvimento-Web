# Apêndice A — Checklist de Entrega

**Aluno:** Victor Cesar Silva

Verificação final dos 8 itens, com onde cada um foi atendido.

---

| # | Item de verificação | Status | Onde / evidência |
|---|---|---|---|
| 1 | `docker compose config` roda sem erro | ✅ | Validado nos três cenários (saída vazia, exit 0) |
| 2 | `docker compose up -d --build` sobe a pilha completa | ✅ | Cenários 1, 2 e 3 subiram; `ps` em `evidencias/` |
| 3 | `.env.example` versionado, sem segredos reais | ✅ | `cenario1/`, `cenario2/`, `cenario3/` — valores `troque_esta_senha` |
| 4 | `.env` real fora do Git | ✅ | `.gitignore` de cada cenário e `.dockerignore` de cada serviço |
| 5 | Volume nomeado, dados sobrevivem ao `down` | ✅ | Registro `id 1` intacto após `down` + `up` (P5) |
| 6 | Healthcheck funcionando (`healthy` no `ps`) | ✅ | `mysql`, `postgres`, `redis` e `rabbitmq` |
| 7 | README com execução e troubleshooting | ✅ | Um por cenário; o do Cenário 3 cobre Windows sem WSL, Linux e macOS |
| 8 | Comunicação entre serviços comprovada | ✅ | `getent hosts`, `/health`, campo `origem` e log do worker |

---

## Detalhamento das evidências

**1. `docker compose config`** — valida a sintaxe e interpola as variáveis do `.env`. Nos
três cenários retornou saída vazia com código 0. É a checagem que revela variável faltando
em um segundo, antes de o `up` falhar minutos depois.

**2. Pilha completa no ar** — Cenário 1 com seis serviços:

```
api        Up                     0.0.0.0:3002->3000/tcp
frontend   Up                     0.0.0.0:5173->5173/tcp
mysql      Up (healthy)           3306/tcp
rabbitmq   Up (healthy)           0.0.0.0:15672->15672/tcp
redis      Up                     6379/tcp
worker     Up
```

**3 e 4. Segredos** — o `.env.example` traz todas as chaves com valores fictícios; o
`.env` real está no `.gitignore` e no `.dockerignore` (para não entrar na imagem, onde
ficaria visível em `docker history`).

**5. Persistência** — comprovada de ponta a ponta:

```
$ docker compose down
$ docker volume ls | grep cenario1
local     cenario1_mysql_data          ← sobreviveu
$ docker compose up -d
$ curl localhost:3002/agendamentos
{"origem":"mysql","dados":[{"id":1,"paciente":"Victor Cesar Silva",...}]}
```

**6. Healthcheck** — o do RabbitMQ precisou de correção real durante o trabalho: com
`rabbitmq-diagnostics ping`, o serviço ficava `healthy` antes de a porta 5672 aceitar
conexões, e a API morria com `ECONNREFUSED`. Trocado por `check_port_connectivity`.

**7. READMEs** — cada cenário tem o seu. O do Cenário 3 traz instruções separadas para
Windows 11 **sem WSL** (Hyper-V, `core.autocrlf input`, caminho sem espaços), Linux (grupo
`docker`) e macOS (Apple Silicon, memória do Docker Desktop), além de cinco erros comuns
documentados.

**8. Comunicação** — quatro provas independentes: resolução de nomes
(`getent hosts postgres redis rabbitmq`), logs de conexão no boot, endpoint `/health`
checando as três dependências, e o fluxo completo POST → banco → cache invalidado → fila →
worker consumindo em outro container.

---

## Estrutura entregue

```
entregas-victor-cesar-silva/
├── 01-modulo0-teorico/       documento teórico (7 itens) + guia SSH
├── 02-hello-node/            repositório TypeScript com 4 commits
└── 03-docker/
    ├── cenario1/             Vue + Node + MySQL + Redis + RabbitMQ
    ├── cenario2/             React + Postgres + Nginx + profile tools
    ├── cenario3/             projeto final (Postgres, Redis, RabbitMQ, worker)
    └── atividades/           respostas 6.3, 7.4, 8.2, 10.1, 10.2, labs
        └── evidencias/       saídas reais de ps, logs e curl
```
