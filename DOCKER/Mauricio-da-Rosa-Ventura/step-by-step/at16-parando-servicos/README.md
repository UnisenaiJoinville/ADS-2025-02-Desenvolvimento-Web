# Atividade 16 — Parando serviços com Docker Compose

## Objetivo

Rodar `docker compose down` e verificar se os containers foram removidos.

## Explicação

`docker compose down` para e **remove** os containers e a rede criados por
`docker compose up` para aquele projeto (mas não apaga volumes nomeados nem
imagens, a menos que se use `docker compose down -v` ou `--rmi`). É a forma
correta de "desligar" um ambiente local no fim do dia sem deixar containers
zumbis rodando; para recomeçar do zero, basta rodar `docker compose up -d`
de novo a partir do mesmo `docker-compose.yml`. Este script referencia o
mesmo `docker-compose.yml` criado na atividade 15 (`-f
../at15-compose/docker-compose.yml`), para derrubar exatamente a pilha que
foi subida lá.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
