# docker-compose — material "Docker e Docker Compose para ambientes profissionais"

Implementação do material `material_docker_compose.docx.pdf` (Docker e Docker Compose para ambientes profissionais de desenvolvimento — Carlos Uchôa e William Sestito).

| Pasta | Conteúdo |
|---|---|
| [`cenario-1-vue-node-mysql/`](cenario-1-vue-node-mysql/) | Cenário 1 — VueJS + NodeJS + MySQL + Redis + RabbitMQ (seção 6 do material) |
| [`cenario-2-react-express-postgres/`](cenario-2-react-express-postgres/) | Cenário 2 — ReactJS + PostgreSQL + Node/Express + Redis + RabbitMQ atrás de proxy Nginx (seção 7) |
| [`cenario-3-consolidacao/`](cenario-3-consolidacao/) | Cenário 3 — atividade de consolidação, arquitetura própria: Vue + Fastify + Postgres + Redis + RabbitMQ + worker (seção 8) |
| [`atividades-teoricas-e-praticas/`](atividades-teoricas-e-praticas/) | Banco de atividades teóricas (10.1) e práticas P1–P8 (10.2) |

Cada cenário tem seu próprio `README.md` com instruções de execução para Windows 11 sem WSL, Linux e macOS, `docker-compose.yml`, `.env.example`, Dockerfiles e um script `coletar-evidencias.sh` que sobe a pilha e gera `EVIDENCIAS.md` automaticamente. Veja o `README.md` de cada cenário para os detalhes e as decisões técnicas tomadas.
