# Projeto Guiado com Docker

Projeto demonstrativo de uma arquitetura com API, MySQL, Redis, RabbitMQ e um worker separado.

## Arquitetura

- **API**: aplicacao Node.js com Express, publicada na porta `3000`.
- **MySQL**: banco de dados com o volume nomeado `mysql_data`.
- **Redis**: servico para cache e dados temporarios, com o volume `redis_data`.
- **RabbitMQ**: broker de mensagens com painel de gerenciamento na porta `15672`.
- **Worker**: processo Node.js separado, conectado a mesma rede Docker. Nesta etapa ele apenas inicia e permanece aguardando; o consumo de mensagens sera implementado em uma etapa posterior.
- **app_net**: rede interna compartilhada entre os servicos.

## Pre-requisitos

- Docker Desktop instalado e em execucao.
- Docker Compose disponivel pelo comando `docker compose`.

## Configuracao

O arquivo `.env` contem as credenciais locais e nao deve ser versionado. Use `.env.example` como modelo:

```powershell
Copy-Item .env.example .env
```

Edite o `.env` e defina valores locais para:

```text
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
MYSQL_ROOT_PASSWORD
RABBITMQ_USER
RABBITMQ_PASSWORD
```

## Executar o projeto

Execute os comandos a partir da raiz do projeto:

```powershell
docker compose up -d --build
```

Verifique os servicos:

```powershell
docker compose ps
```

A API deve responder:

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/health).Content
```

Resposta esperada:

```json
{"status":"ok"}
```

Abra o painel do RabbitMQ em http://localhost:15672 e use o usuario e a senha definidos por `RABBITMQ_USER` e `RABBITMQ_PASSWORD`.

## Diagnostico

Confira rapidamente o estado e a saude dos servicos:

```powershell
docker compose ps
```

Acompanhe os logs da API:

```powershell
docker compose logs -f api
```

Acompanhe os logs de um servico especifico:

```powershell
docker compose logs -f worker
```

Entre em um container para investigar arquivos e variaveis:

```powershell
docker compose exec api sh
exit
```

Inspecione um container:

```powershell
docker inspect projeto-guiado-mysql-1
```

Liste volumes e redes:

```powershell
docker volume ls
docker network ls
```

Se a API nao iniciar, verifique primeiro os logs e confirme se o MySQL esta `healthy`. O `depends_on` com `condition: service_healthy` impede que a API seja liberada antes do healthcheck do MySQL passar. O worker usa a mesma estrategia em relacao ao RabbitMQ.

## Parar o projeto

Para parar containers e a rede, preservando os dados dos volumes:

```powershell
docker compose down
```

Para remover tambem os volumes, perdendo os dados persistidos:

```powershell
docker compose down -v
```

## Boas praticas aplicadas

- `.env.example` serve como modelo sem credenciais reais.
- `.env` e ignorado pelo Git.
- As imagens usam versoes explicitas, como `mysql:8.4` e `redis:7.4-alpine`.
- `mysql_data` e `redis_data` sao volumes nomeados para persistencia.
- MySQL e RabbitMQ possuem healthchecks.
- `backend/.dockerignore` e `worker/.dockerignore` excluem `node_modules`, logs do npm e `.env` do contexto de build.
- A rede `app_net` permite comunicacao por nome de servico, como `mysql`, `redis` e `rabbitmq`.

## O que mudaria em producao

- Usaria build multi-stage para reduzir o tamanho das imagens finais.
- Fixaria imagens por digest, alem de usar tags de versao.
- Armazenaria credenciais em Docker Secrets ou em um gerenciador externo de segredos, em vez de arquivos `.env` no servidor.
- Usaria um usuario sem privilegios para executar a API e o worker.
- Adicionaria limites de CPU e memoria, politicas de restart, logs centralizados e monitoramento.
- Configuraria TLS, autenticacao forte e restricao de portas do RabbitMQ.
- Criaria healthchecks especificos da aplicacao e testes automatizados no pipeline de entrega.
- Implementaria consumo real do RabbitMQ com confirmacao, mensagens persistentes, retries e dead-letter queue.
- Usaria um banco e um Redis gerenciados ou uma estrategia de backup e restauracao testada.

## Referencia rapida de comandos

### Navegacao

```powershell
cd nome-da-pasta
cd ..
mkdir nome-da-pasta
dir
```

### Containers avulsos

```powershell
docker --version
docker build -t nome .
docker run -p A:B nome
docker ps
docker rm -f nome
docker network create x
docker network rm x
docker inspect nome
docker volume ls
docker network ls
```

### Docker Compose

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose exec api sh
docker compose down
docker compose down -v
```
