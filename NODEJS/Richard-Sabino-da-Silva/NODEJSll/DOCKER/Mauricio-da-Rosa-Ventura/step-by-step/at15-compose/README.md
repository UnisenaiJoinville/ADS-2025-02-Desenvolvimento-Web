# Atividade 15 — Usando Docker Compose

## Objetivo

Criar um `docker-compose.yml` com um serviço Nginx e subir com `docker compose up`.

## Arquivos desta atividade

- `docker-compose.yml`

## Explicação

Um `docker-compose.yml` descreve, em YAML, um ou mais serviços que devem
subir juntos, com suas portas, variáveis, volumes e redes — em vez de digitar
um `docker run` longo toda vez, `docker compose up -d` lê esse arquivo e sobe
tudo de uma vez (e, se houvesse mais de um serviço, criaria automaticamente
uma rede compartilhada entre eles, como nas atividades 13/14, sem precisar de
`docker network create` manual). Este é o primeiro contato com a ferramenta
que sustenta os Cenários 1, 2 e 3 do material de Docker Compose desta
disciplina.

> Nota: como a atividade 09 também publica a porta 8080 e fica rodando, o
> `run.sh` remove o container `at09-nginx` antes de subir este Compose, só
> para liberar a porta quando as atividades rodam em sequência. Pelo mesmo
> motivo, ao final o `run.sh` faz `docker compose down` deste stack — o
> Cenário 2 do material de Docker Compose também publica a porta 8080 e
> roda mais adiante, na mesma sequência de entrega.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
