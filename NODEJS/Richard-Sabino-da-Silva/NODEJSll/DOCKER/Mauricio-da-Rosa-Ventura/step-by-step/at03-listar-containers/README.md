# Atividade 03 — Listando containers

## Objetivo

Usar `docker ps -a` e explicar a diferença entre containers em execução e parados.

## Explicação

`docker ps`, sozinho, mostra apenas os containers **em execução** no momento
(status `Up`). `docker ps -a` (all) mostra **todos** os containers que já
existiram na máquina, inclusive os que já terminaram (status `Exited`) — como
o `hello-world` da atividade anterior, ou qualquer container que tenha sido
parado com `docker stop`. Um container parado não é removido automaticamente:
ele continua ocupando espaço em disco (o filesystem de escrita dele, mais
metadados) até ser explicitamente removido com `docker rm`, o que é feito na
próxima atividade. Isso é proposital — permite inspecionar depois o que
aconteceu num container que já terminou (ver seus logs com `docker logs`,
por exemplo), mesmo sem ele estar mais rodando.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
