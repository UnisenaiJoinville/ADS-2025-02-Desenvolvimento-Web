# Atividade 26 — Usando Docker Secrets

## Objetivo

Criar um secret e usá-lo em um serviço do Docker Swarm.

## Explicação

`docker secret` é um recurso do **Docker Swarm** (o orquestrador de
múltiplos hosts embutido no próprio Docker) para guardar dados sensíveis
(senhas, chaves de API) de forma criptografada, disponibilizando-os para os
containers de um serviço apenas como um arquivo temporário em
`/run/secrets/<nome>` — nunca como variável de ambiente visível em
`docker inspect`, o que é mais seguro. Como secrets exigem Swarm (e não
funcionam com `docker run` comum), a evidência abaixo inicia um Swarm de um
único nó (`docker swarm init`), cria o secret, sobe um serviço mínimo que o
usa e comprova, via `docker exec`, que o conteúdo do secret está acessível
como arquivo dentro do container — depois desfaz tudo (`docker service rm` e
`docker swarm leave`) para não deixar o nó em modo Swarm.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
