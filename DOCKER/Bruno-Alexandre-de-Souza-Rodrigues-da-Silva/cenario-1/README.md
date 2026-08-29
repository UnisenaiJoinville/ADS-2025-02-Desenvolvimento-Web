# Cenário 1 — Vue + Node + MySQL + Redis + RabbitMQ

**Aluno:** Bruno Silva

Pilha do Cenário 1 do material, montada seguindo o roteiro incremental do
`docker-passo-a-passo-projeto-guiado.md`.

## Serviços

| Serviço | Papel | Porta |
|---|---|---|
| api | REST em Node/Express | 3010 → 3000 |
| mysql | dados transacionais | interna |
| redis | cache da agenda | interna |
| rabbitmq | fila de tarefas | painel em 15672 |
| worker | consome a fila | interna |

**Obs.:** a API usa a porta 3010 no host porque a 3000 já estava ocupada por
outro projeto na minha máquina. Dentro do container continua sendo a 3000.

## Como executar

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

## Endpoints

```bash
curl http://localhost:3010/health     # status da api
curl http://localhost:3010/status     # testa mysql, redis e rabbitmq
curl http://localhost:3010/agenda     # 1a vez vem do mysql, 2a do redis
```

Painel do RabbitMQ: http://localhost:15672

## Diagnóstico

```bash
docker compose logs -f api
docker compose exec api sh
docker compose ps
```

## Cuidado

`docker compose down` mantém os dados. `docker compose down -v` apaga o volume
do MySQL e o banco volta vazio.

As respostas das atividades estão em `docs/cenario-1-atividades.md`.
