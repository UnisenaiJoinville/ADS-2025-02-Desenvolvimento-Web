# Cenário 3 — Biblioteca

Projeto final da disciplina de Docker e Docker Compose.

**Aluno:** Bruno Silva
**Curso:** ADS — UniSENAI

---

## O que o sistema faz

É um controle de empréstimos de livros de uma biblioteca. O usuário lista os
livros disponíveis e registra um empréstimo. Quando um empréstimo é criado, o
sistema grava no banco, responde na hora e manda a geração do comprovante para
uma fila, que um worker separado processa depois.

O foco aqui não é a funcionalidade e sim a **arquitetura de containers**: cada
peça existe para mostrar um conceito diferente.

## Arquitetura

```
                    rede app_net (interna, isolada)
   ┌──────────────────────────────────────────────────────────────┐
   │                                                              │
   │  ┌──────────┐        ┌──────────┐       ┌────────────┐       │
   │  │ frontend │◄───────│  proxy   │──────►│    api     │       │
   │  │  :5173   │   /    │  nginx   │ /api/ │   :3000    │       │
   │  └──────────┘        └────┬─────┘       └─────┬──────┘       │
   │                           │                   │              │
   │                           │      ┌────────────┼──────────┐   │
   │                           │      ▼            ▼          ▼   │
   │                           │  ┌────────┐  ┌───────┐ ┌──────────┐
   │                           │  │postgres│  │ redis │ │ rabbitmq │
   │                           │  │        │  │ cache │ │   fila   │
   │                           │  └────────┘  └───────┘ └────┬─────┘
   │                           │       │           │         │    │
   │                           │   postgres_    redis_   rabbitmq_ │
   │                           │     data        data      data    │
   │                           │                              │    │
   │                           │                     ┌────────▼──┐ │
   │                           │                     │  worker   │ │
   │                           │                     │ consome   │ │
   │                           │                     └───────────┘ │
   └───────────────────────────┼──────────────────────────────────┘
                               │ 8095 (unica porta da aplicacao)
                        ┌──────▼──────┐
                        │  navegador  │
                        └─────────────┘
```

| Serviço | Papel | Publicado no host? |
|---|---|---|
| proxy | entrada única, roteia `/` e `/api/` | sim — 8095 |
| frontend | interface web (Vite) | não |
| api | REST, endpoint `/health` | não |
| postgres | dados de livros e empréstimos | não |
| redis | cache da listagem de livros | não |
| rabbitmq | fila de geração de comprovante | só o painel — 15675 |
| worker | consome a fila | não |
| pgadmin | inspeção do banco (opcional) | só com `--profile tools` — 5051 |

---

## Requisitos

- Docker Desktop ou Docker Engine
- Docker Compose v2
- **Windows 11 sem WSL:** Hyper-V e Containers habilitados, edição Pro,
  Education ou Enterprise

---

## Como executar

### Windows 11 (sem WSL)

Antes da primeira execução, habilitar os recursos no PowerShell **como
Administrador** e reiniciar a máquina:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
Enable-WindowsOptionalFeature -Online -FeatureName Containers -All
```

No Docker Desktop, em Settings → General, escolher o backend **Hyper-V** (não o
WSL2). Depois, no PowerShell comum:

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

Se aparecer `permission denied` ao chamar o docker, adicionar o usuário ao grupo
e **fazer logout e login** (não basta reabrir o terminal):

```bash
sudo usermod -aG docker $USER
```

### macOS

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Em Apple Silicon todas as imagens usadas aqui têm suporte arm64, então não é
necessário forçar `platform`.

---

## Acessos

| O quê | Endereço |
|---|---|
| Aplicação | http://localhost:8095 |
| Health da API | http://localhost:8095/api/health |
| Lista de livros | http://localhost:8095/api/livros |
| Painel do RabbitMQ | http://localhost:15675 |
| PgAdmin (opcional) | http://localhost:5051 |

O usuário e a senha do RabbitMQ e do banco estão no `.env`.

Para subir o PgAdmin:

```bash
docker compose --profile tools up -d
```

---

## Como provar que está tudo funcionando

O endpoint `/health` consulta as três dependências de verdade e devolve o estado
de cada uma:

```bash
curl http://localhost:8095/api/health
```

```json
{
  "status": "ok",
  "servico": "api-biblioteca",
  "dependencias": { "postgres": true, "redis": true, "rabbitmq": true }
}
```

Se alguma dependência cair, a resposta muda para `"status": "degradado"` e o
HTTP vira 503.

**Cache do Redis** — chamar duas vezes e comparar o campo `origem`:

```bash
curl http://localhost:8095/api/livros    # {"origem":"postgres",...}
curl http://localhost:8095/api/livros    # {"origem":"redis",...}
```

**Fila do RabbitMQ** — criar um empréstimo e olhar o log do worker:

```bash
curl -X POST http://localhost:8095/api/emprestimos \
  -H "Content-Type: application/json" \
  -d '{"livroId":1,"aluno":"Bruno Silva"}'

docker compose logs worker
```

O worker mostra que recebeu a mensagem e gerou o comprovante — em outro
container, depois que a API já tinha respondido.

**Persistência** — derrubar sem `-v` e conferir que os dados continuam:

```bash
docker compose down
docker compose up -d
curl http://localhost:8095/api/livros
```

---

## Diagnóstico

```bash
docker compose ps                    # status e portas
docker compose logs -f api           # logs de um servico
docker compose exec api sh           # entrar no container
docker inspect cenario-3-biblioteca-api-1
docker volume ls
docker network ls
```

---

## Troubleshooting

Erros que realmente aconteceram comigo montando este projeto:

### 1. `Bind for 0.0.0.0:XXXX failed: port is already allocated`

Outro serviço na máquina já usa a porta. Descobrir quem é:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

A solução é trocar o lado esquerdo do mapeamento (`"8096:80"`), não derrubar o
que já estava rodando. Foi por isso que este projeto usa 8095 e não 8080.

### 2. PgAdmin sobe e morre na hora

```bash
docker compose --profile tools logs pgadmin
# 'admin@local.test' does not appear to be a valid email address
```

A versão 8 do PgAdmin rejeita o domínio `.test`. Trocar para um domínio válido
como `admin@local.com` resolve. Sem olhar o log, o serviço só "some" do
`docker compose ps` e parece que o profile não funcionou.

### 3. API não conecta no banco

Quase sempre é `localhost` no lugar do nome do serviço. Dentro do container,
`localhost` é o próprio container. O host correto é o nome declarado no compose
(`postgres`, `redis`, `rabbitmq`). Conferir com:

```bash
docker compose exec api sh -c "getent hosts postgres"
```

### 4. API sobe antes do banco e quebra no primeiro request

É o que o `depends_on` com `condition: service_healthy` evita. Sem ele, o
Compose só espera o container existir, não estar pronto para aceitar conexão.
Todos os serviços de dados aqui têm healthcheck por esse motivo.

### 5. Windows: Docker Desktop não inicia

Verificar se a virtualização está habilitada na BIOS/UEFI e se Hyper-V e
Containers estão ativados em Painel de Controle → Programas → Ativar ou
desativar recursos do Windows.

---

## Limitações e o que mudaria em produção

Este projeto é de desenvolvimento. Em produção eu mudaria:

**Imagens.** Os Dockerfiles usam `npm install` e rodam em modo dev. Em produção
eu usaria multi-stage build com `npm ci --omit=dev`, gerando uma imagem menor e
com menos superfície de ataque.

**Usuário.** Os containers rodam como root. Em produção eu criaria um usuário
sem privilégio e usaria `USER node` no Dockerfile.

**Segredos.** As senhas estão em `.env`. Isso resolve o problema de não versionar
credencial, mas o arquivo continua em texto puro no disco. Em produção o certo é
um gerenciador de segredos (Docker Secrets em Swarm, Vault ou o cofre do
provedor de nuvem).

**Banco no container.** O Postgres aqui roda em container com volume local. Em
produção o banco normalmente é um serviço gerenciado, com backup automático e
réplica — coisas que um volume local não oferece.

**Observabilidade.** Hoje só tenho `docker compose logs`. Em produção seriam
necessários log estruturado em JSON, métricas e alerta. O `/health` que fiz é o
começo disso, mas sozinho não avisa ninguém quando falha.

**Escala.** Um container por serviço. Em produção a API e o worker rodariam com
várias réplicas atrás de um balanceador, o que exigiria um orquestrador de
verdade como Kubernetes.
