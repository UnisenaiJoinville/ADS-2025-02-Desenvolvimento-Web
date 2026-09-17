# Cenário 3 — Projeto Final

**Aluno:** Victor Cesar Silva

Pilha containerizada com frontend Vue servido por Nginx, backend Node/Express, Postgres,
Redis, RabbitMQ e um worker em container separado.

---

## Arquitetura

```
        HOST                       rede interna app_net
 ┌──────────────────────────────────────────────────────────────┐
 │ navegador → localhost:8090                                   │
 │                  │                                           │
 │          ┌───────▼────────┐      ┌──────────────┐            │
 │          │   frontend     │─────▶│   backend    │            │
 │          │ (Vue + Nginx)  │ /api │  (Express)   │            │
 │          └────────────────┘      └──┬───┬────┬──┘            │
 │                                     │   │    │               │
 │                    postgres:5432 ◀──┘   │    └──▶ rabbitmq:5672
 │                    redis:6379    ◀──────┘              │     │
 │                                                        ▼     │
 │  painel rabbitmq → localhost:15673              ┌──────────┐ │
 │                                                 │  worker  │ │
 │                                                 └──────────┘ │
 └──────────────────────────────────────────────────────────────┘

 Publicado no host : frontend (8090), painel do RabbitMQ (15673)
 Somente interno   : backend, postgres, redis, porta 5672, worker
```

Só o frontend é publicado. O backend usa `expose` e é alcançado apenas pelo Nginx do
frontend, que faz proxy de `/api` para `http://backend:3000`. Postgres, Redis e a porta
de mensageria (5672) não são acessíveis do host.

---

## Requisitos mínimos atendidos

| Requisito | Onde está |
|---|---|
| Frontend containerizado acessível pelo navegador | `frontend/`, publicado em `8090:80` |
| Backend com endpoint `/health` | `backend/server.js`, checa Postgres, Redis e RabbitMQ |
| Banco com volume nomeado + variáveis no `.env` | `postgres_data`, `${POSTGRES_*}` |
| Redis na rede interna referenciado por nome | serviço `redis`, sem `ports`, `REDIS_HOST: redis` |
| Mensageria com healthcheck | `rabbitmq` com `check_port_connectivity` |
| Worker em container separado | serviço `worker`, `build: ./worker` |
| README para Windows 11 sem WSL, Linux e macOS | seções abaixo |
| Evidências | `../atividades/evidencias/` |

---

## Como executar

### Pré-requisitos comuns

Docker e Docker Compose instalados. Verifique:

```bash
docker --version
docker compose version
```

### Windows 11 **sem WSL**

O Docker Desktop no Windows pode usar o backend **Hyper-V** em vez do WSL 2. Requer
Windows 11 Pro/Enterprise (o Home só tem WSL 2).

1. Ative o Hyper-V: *Painel de Controle → Programas → Ativar ou desativar recursos do
   Windows* → marque **Hyper-V** e **Plataforma de Máquina Virtual**. Reinicie.
2. Instale o Docker Desktop e, na instalação, **desmarque** "Use WSL 2 instead of Hyper-V".
   Se já estiver instalado: *Settings → General* → desmarque *Use the WSL 2 based engine*
   → *Apply & Restart*.
3. Use **PowerShell** ou **Git Bash** (não o `cmd`):

```powershell
cd cenario3
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

Detalhes importantes no Windows sem WSL:
- Mantenha o projeto em um caminho **sem espaços e sem acentos** (ex.: `C:\projetos\`).
- Em *Settings → Resources → File sharing*, a unidade `C:` precisa estar compartilhada.
- Fim de linha: rode `git config --global core.autocrlf input` antes de clonar. Scripts
  com CRLF quebram dentro de containers Linux (`exec format error`).
- O Hyper-V é incompatível com VirtualBox rodando ao mesmo tempo.

### Linux

```bash
cd cenario3
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Se `docker` exigir `sudo`, adicione seu usuário ao grupo e reabra a sessão:

```bash
sudo usermod -aG docker $USER && newgrp docker
```

Arquivos criados por volume podem pertencer ao root; ajuste com `sudo chown -R $USER:$USER .`
quando necessário.

### macOS (Intel e Apple Silicon)

```bash
cd cenario3
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Em Apple Silicon (M1/M2/M3), todas as imagens usadas têm build `arm64` nativo. Se alguma
imagem só existir em `amd64`, adicione `platform: linux/amd64` ao serviço (roda emulado,
mais lento). Em *Settings → Resources*, garanta pelo menos 4 GB de memória — a pilha tem
seis serviços.

---

## Acessos

| Serviço | URL | Observação |
|---|---|---|
| Frontend | http://localhost:8090 | interface da aplicação |
| Health do backend | http://localhost:8090/api/health | via proxy do Nginx |
| Painel RabbitMQ | http://localhost:15673 | login pelo `.env` |
| Postgres / Redis | — | apenas rede interna, por decisão de segurança |

Teste rápido:

```bash
curl http://localhost:8090/api/health
curl -X POST http://localhost:8090/api/tarefas \
  -H "Content-Type: application/json" -d '{"titulo":"Minha tarefa"}'
curl http://localhost:8090/api/tarefas
docker compose logs worker
```

---

## Comandos do dia a dia

```bash
docker compose up -d --build      # sobe tudo
docker compose ps                 # status e portas
docker compose logs -f backend    # acompanha logs
docker compose exec backend sh    # entra no container
docker compose down               # derruba, MANTÉM os dados
docker compose down -v            # derruba e APAGA os volumes
```

---

## Troubleshooting

**`port is already allocated`**
Outra aplicação usa a porta. Descubra com `netstat -ano | findstr :8090` (Windows) ou
`sudo lsof -i :8090` (Linux/macOS) e mude o lado esquerdo do mapeamento
(`"8091:80"`). O lado direito é a porta interna e não deve mudar.

**O backend sobe e morre com `ECONNREFUSED ...:5672`**
O RabbitMQ ainda não aceitava conexões. Já tratado com o healthcheck
`check_port_connectivity` e `restart: on-failure`. Diagnostique com
`docker compose ps -a` (o `-a` mostra containers que morreram) e `docker compose logs backend`.

**`getaddrinfo ENOTFOUND` ou recusa ao usar `localhost`**
Dentro de um container, `localhost` é o próprio container. Use o **nome do serviço**
(`postgres`, `redis`, `rabbitmq`). Confirme com
`docker compose exec backend sh -c "getent hosts postgres redis rabbitmq"`.

**`password authentication failed` no Postgres após trocar a senha no `.env`**
A senha só é aplicada na primeira inicialização do volume. Em ambiente local:
`docker compose down -v` e suba de novo.

**Alteração no código não aparece**
A imagem foi construída antes. Rode `docker compose up -d --build`; se persistir,
`docker compose build --no-cache <serviço>`.

**Frontend abre mas `/api` dá 502**
O backend ainda está iniciando ou caiu. Verifique com `docker compose ps` e
`docker compose logs backend`.

---

## Análise crítica — o que mudaria em produção

O `.env` em texto puro seria substituído por um gerenciador de segredos (Docker Secrets,
Vault ou AWS Secrets Manager), já que qualquer um com acesso ao host lê o arquivo e as
variáveis aparecem em `docker inspect`.

O frontend já usa **multi-stage build** (Node compila, imagem final só tem Nginx e os
estáticos). Aplicaria a mesma técnica ao backend e faria os containers rodarem com
usuário não-root (`USER node`), em vez de root — hoje é o padrão herdado da imagem base.

Adicionaria observabilidade real: `docker logs` não guarda histórico nem correlaciona
serviços. Com seis containers, entender uma lentidão exige métricas e tracing
(Prometheus, Grafana, OpenTelemetry), além de logs estruturados em JSON enviados a um
agregador.

Definiria limites de CPU e memória por serviço (`deploy.resources.limits`), para que um
vazamento de memória no worker não derrube o host inteiro. E o Compose daria lugar a um
orquestrador (Kubernetes ou ECS) para réplicas, rolling update e reinício automático em
outro nó — o Compose sobe tudo em uma máquina só, que é um ponto único de falha.

Por fim, o `restart: on-failure` é um paliativo. O correto é o backend ter *retry* com
backoff exponencial na conexão com Postgres, Redis e RabbitMQ, tolerando indisponibilidade
momentânea sem depender do Docker reiniciar o processo.
