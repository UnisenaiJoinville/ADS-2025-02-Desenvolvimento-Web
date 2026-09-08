# Docker e Docker Compose — Bruno Silva

Entregas das atividades de Docker e Docker Compose.

## O que tem aqui

| Pasta / arquivo | Conteúdo |
|---|---|
| [PLANEJAMENTO.md](PLANEJAMENTO.md) | Planejamento de todas as atividades |
| [lab-docker/](lab-docker/) | As 30 atividades do `step-by-step-docker.md`, com as saídas |
| [cenario-1/](cenario-1/) | Vue + Node + MySQL + Redis + RabbitMQ |
| [cenario-2/](cenario-2/) | React + Postgres + Nginx + Redis + RabbitMQ |
| [cenario-3/](cenario-3/) | Projeto final — Biblioteca |
| [docs/](docs/) | Respostas das atividades teóricas e das práticas |
| [evidencias/](evidencias/) | Saídas reais dos comandos executados |

## Respostas por seção do material

| Seção | Arquivo |
|---|---|
| 6.3 — Atividades do Cenário 1 | [docs/cenario-1-atividades.md](docs/cenario-1-atividades.md) |
| 7.4 — Atividades do Cenário 2 | [docs/cenario-2-atividades.md](docs/cenario-2-atividades.md) |
| 8.2 — Questões norteadoras + análise crítica | [docs/cenario-3-questoes-norteadoras.md](docs/cenario-3-questoes-norteadoras.md) |
| 10.1 — 8 questões teóricas | [docs/atividades-teoricas-compose.md](docs/atividades-teoricas-compose.md) |
| 10.2 — Práticas P1 a P8 | [docs/praticas-p1-p8.md](docs/praticas-p1-p8.md) |

## Como executar

Cada cenário tem o próprio README. O padrão é:

```bash
cd cenario-3
cp .env.example .env
docker compose up -d --build
docker compose ps
```

O projeto final (Cenário 3) tem instruções separadas para Windows 11 sem WSL,
Linux e macOS no [seu README](cenario-3/README.md).

## Observação

Nenhum arquivo `.env` real foi enviado — apenas os `.env.example` com valores
de exemplo.

As portas foram ajustadas em relação ao material (3010, 8090, 8095) porque as
originais já estavam ocupadas na máquina onde os cenários foram executados. O
motivo está registrado nos READMEs de cada cenário.
