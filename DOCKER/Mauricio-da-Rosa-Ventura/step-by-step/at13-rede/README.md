# Atividade 13 — Criando uma rede Docker

## Objetivo

Criar uma rede com `docker network create` e verificar com `docker network ls`.

## Explicação

Por padrão, todo container Docker entra na rede `bridge` padrão, onde ele
só enxerga outros containers pelo IP interno (não pelo nome). Uma rede
**definida pelo usuário** (`docker network create minha-rede`), por outro
lado, vem com um servidor DNS embutido do próprio Docker: qualquer container
conectado a essa rede consegue resolver o nome de outro container pelo seu
`--name`, sem precisar saber o IP dele — a mesma técnica que faz `api` conseguir
falar com `mysql` só pelo nome do serviço dentro de um `docker-compose.yml`
(ver Cenário 1 do material de Docker Compose).

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
