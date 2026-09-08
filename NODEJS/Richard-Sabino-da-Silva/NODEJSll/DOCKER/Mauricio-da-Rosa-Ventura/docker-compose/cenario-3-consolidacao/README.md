# Cenário 3 — Atividade de consolidação

Arquitetura escolhida por mim para a atividade de consolidação (seção 8 do material de Docker e Docker Compose), que pede para aplicar os conceitos **sem** receber um `docker-compose.yml` pronto: front containerizado, back containerizado com `/health`, banco persistente, Redis na rede interna, mensageria com healthcheck e um worker dedicado.

## Arquitetura escolhida e por quê

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | Vue 3 + Vite | Mesma tecnologia do Cenário 1 — reaproveitei o padrão já validado (funciona, então não há motivo para trocar só por trocar). |
| Backend | **Fastify** (não Express) | Escolha deliberada, diferente do Cenário 2 (Express): o Módulo 0 (seção 14.1) cita Fastify como a opção com validação de schema (JSON Schema) integrada — usada de verdade na rota `POST /eventos` (`backend/src/index.js`), que rejeita corpos sem o campo `tipo`. |
| Banco | PostgreSQL | Um dos três bancos sugeridos pelo material (Postgres, MySQL ou Mongo); Postgres já validado no Cenário 2. |
| Cache/sessão | Redis | Obrigatório pelo enunciado; usado por `GET /status` para provar escrita/leitura real. |
| Mensageria | RabbitMQ | Obrigatório (ou equivalente); com healthcheck (`rabbitmq-diagnostics ping`), igual aos Cenários 1 e 2. |
| Worker | Container Node dedicado | Consome `cenario3.eventos` e, diferente dos Cenários 1/2 (que só logavam a mensagem), **atualiza uma linha no Postgres** — prova de processamento assíncrono real, não só um `console.log`. |

Uma decisão que mudei em relação aos Cenários 1 e 2: aqui, **nem Postgres nem Redis publicam porta para o host** (`ports:`) — só `frontend`, `api` e o painel do `rabbitmq` publicam. Nos cenários anteriores eu havia publicado a porta do banco/Redis "por hábito"; ao responder a atividade parcial do Cenário 2 (`ATIVIDADES-PARCIAIS.md` de lá, sobre `ports` x `expose`) percebi que isso não tinha necessidade real aqui — só a API acessa esses dois serviços, e ela já está na mesma rede — então apliquei a lição aprendida também neste cenário.

## Como o backend prova que fala com banco, Redis e mensageria (questão-guia 8.2)

`GET /status` testa as três dependências em tempo real a cada chamada (não é um valor fixo): conta linhas na tabela `eventos` (Postgres), grava e lê uma chave (Redis) e garante a existência da fila (RabbitMQ). Além disso, `POST /eventos` é um fluxo de ponta a ponta completo: a API grava o evento no Postgres **e** publica na fila; o `worker`, em um container completamente separado, consome essa fila e atualiza a mesma linha do Postgres marcando-a como processada — o `docker compose logs worker` mostra a mensagem chegando, e uma nova consulta em `/status` mostra a contagem de eventos crescendo. Isso é evidência de comunicação real entre 4 containers diferentes (frontend, api, worker, mais os 3 de infraestrutura), não apenas containers "ligados ao mesmo tempo".

## Estrutura

```
cenario-3-consolidacao/
├── docker-compose.yml
├── .env.example
├── frontend/         # Vue 3 + Vite
├── backend/          # Fastify + healthcheck proprio no compose
├── worker/           # consumidor da fila, atualiza o Postgres
├── database/init.sql
├── coletar-evidencias.sh
└── EVIDENCIAS.md
```

## Como executar

### Windows 11 sem WSL

Docker Desktop com backend Hyper-V (Módulo 0, seção 10.1: `Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All` e `...-FeatureName Containers -All`, depois reiniciar). Com o Docker Desktop aberto, no PowerShell ou Windows Terminal:

```powershell
copy .env.example .env
docker compose up -d --build
docker compose ps
```

### Linux

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Se aparecer erro de permissão no socket do Docker, seu usuário provavelmente não está no grupo `docker` (Módulo 0, seção 15.2) — adicione com `sudo usermod -aG docker $USER` e faça logout/login.

### macOS (Apple Silicon ou Intel)

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Todas as imagens usadas (`node:22-alpine`, `postgres:17-alpine`, `redis:7.4-alpine`, `rabbitmq:4-management`) têm build multi-arch oficial — não é necessário `platform: linux/amd64`.

### Coletando todas as evidências de uma vez (qualquer sistema)

```bash
./coletar-evidencias.sh
```

## Portas

| Serviço | URL/porta local |
|---|---|
| frontend (Vue/Vite) | http://localhost:5174 (5173 já é usada pelo Cenário 1) |
| api (Fastify) | http://localhost:3001/health, /status, /eventos (3000 já é usada pelo Cenário 1) |
| rabbitmq (painel) | http://localhost:15674 (15672 já é usada pelo Cenário 1) |
| postgres / redis | **não publicadas** (só acessíveis dentro da rede `app_net`, ver "Arquitetura escolhida") |

## Diagnóstico e troubleshooting

```bash
docker compose ps                      # status e healthy/unhealthy de cada serviço
docker compose logs -f api
docker compose logs -f worker
docker compose exec api sh
docker inspect --format '{{json .State.Health}}' $(docker compose ps -q api)
docker compose down                    # mantém volumes (dados do Postgres)
docker compose down -v                 # também apaga os volumes
```

Erros comuns (ver também Módulo 0, seção 15, e o material de Docker Compose, seção 11):

| Sintoma | Causa provável | Ação |
|---|---|---|
| `api` fica `unhealthy` | Postgres/RabbitMQ ainda inicializando | O `depends_on: condition: service_healthy` já espera isso; se persistir, `docker compose logs postgres`/`rabbitmq`. |
| Porta já em uso | Outro processo (ou o Cenário 1, que fica rodando) usando 3001/5174/15674 no host | Trocar o mapeamento em `docker-compose.yml` ou encerrar o processo conflitante. |
| `worker` não atualiza o Postgres | RabbitMQ ainda não estava pronto no primeiro consumo | O worker tenta reconectar 10x com espera de 3s; ver `docker compose logs worker`. |

## Análise crítica — o que seria diferente em produção?

Este ambiente foi desenhado para **desenvolvimento local**, e várias escolhas feitas aqui deliberadamente não deveriam ir para produção. Primeiro, os Dockerfiles usam `npm install` (não `npm ci`) e montam o código como bind mount (`volumes: - ./backend:/app`) para permitir edição ao vivo sem rebuild — em produção, a imagem deveria ser construída uma vez, de forma imutável, copiando o código para dentro dela (sem bind mount) e usando `npm ci` com o `package-lock.json` para uma instalação determinística, idealmente com um build multi-stage (como na atividade 23 do `step-by-step`) separando dependências de desenvolvimento do artefato final. Segundo, as senhas neste repositório vivem em um `.env` local, não versionado — em produção, isso deveria vir de um gerenciador de segredos de verdade (AWS Secrets Manager, Vault, ou os *secrets* do Docker Swarm/Kubernetes vistos na atividade 26 do `step-by-step`), nunca de um arquivo texto na máquina. Terceiro, os volumes nomeados (`postgres_data`, `redis_data`) aqui ficam no disco de uma única máquina — em produção, o banco normalmente seria um serviço gerenciado (RDS, Cloud SQL) com backup automático e réplicas, porque um volume Docker local não sobrevive à perda do host. Quarto, este `docker-compose.yml` sobe **um** container de cada serviço; em produção, a API e o worker precisariam rodar com múltiplas réplicas atrás de um balanceador (o que o Compose sozinho não orquestra bem — esse é o papel de um Swarm ou Kubernetes) para tolerar a queda de uma instância sem downtime. Por fim, não há aqui nenhuma coleta centralizada de logs/métricas (Pino/Winston e observabilidade, citados no Módulo 0 seção 14.5) nem HTTPS na frente da aplicação — em produção, um proxy reverso com TLS (e não a porta exposta diretamente) seria obrigatório.
