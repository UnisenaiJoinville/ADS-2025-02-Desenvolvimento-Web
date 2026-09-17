# Docker e Docker Compose

**Aluno:** Victor Cesar Silva

## Cenários

| Pasta | Pilha | Entrada |
|---|---|---|
| [`cenario1/`](cenario1/) | Vue + Node + MySQL + Redis + RabbitMQ + worker | http://localhost:5173 |
| [`cenario2/`](cenario2/) | React + Postgres + Nginx + PgAdmin (profile `tools`) | http://localhost:8082 |
| [`cenario3/`](cenario3/) | Vue/Nginx + Node + Postgres + Redis + RabbitMQ + worker | http://localhost:8090 |

Todos sobem com:

```bash
cp .env.example .env
docker compose up -d --build
```

## Atividades

| Documento | Conteúdo |
|---|---|
| [`6.3`](atividades/6.3-atividades-cenario1.md) | Nome de serviço vs. localhost + diagrama, subida da pilha, persistência, Redis vs. RabbitMQ |
| [`7.4`](atividades/7.4-atividades-cenario2.md) | `ports` vs. `expose`, acesso via Nginx, profile `tools`, Postgres sem porta publicada |
| [`8.2`](atividades/8.2-questoes-norteadoras.md) | As 5 questões norteadoras do projeto final |
| [`10.1`](atividades/10.1-atividades-teoricas.md) | As 8 atividades teóricas |
| [`10.2`](atividades/10.2-atividades-praticas.md) | P1 a P8 com saídas reais |
| [`step-by-step`](atividades/step-by-step-30-atividades.md) | As 30 atividades de laboratório |
| [`roteiro guiado`](atividades/roteiro-guiado-checkpoints.md) | Checkpoints dos Passos 0 a 10 |
| [`Apêndice A`](atividades/apendice-a-checklist.md) | Checklist final de 8 itens |
| [`evidências/`](atividades/evidencias/) | Saídas reais de `ps`, `logs` e `curl` |

## Observações

**Portas.** As portas 3000, 3001, 8080 e 8081 estavam ocupadas por outras aplicações na
máquina de desenvolvimento. Os mapeamentos foram ajustados (API do Cenário 1 em 3002,
Nginx do Cenário 2 em 8082, frontend do Cenário 3 em 8090). Só o lado esquerdo do
mapeamento mudou — dentro da rede Docker nada é afetado.

**Correção aplicada.** O healthcheck `rabbitmq-diagnostics ping` marcava o serviço como
`healthy` antes de a porta 5672 aceitar conexões, e a API subia cedo demais e morria com
`ECONNREFUSED`. Substituído por `check_port_connectivity`, com `restart: on-failure`.
O diagnóstico está em [`10.2`](atividades/10.2-atividades-praticas.md) (P7).
