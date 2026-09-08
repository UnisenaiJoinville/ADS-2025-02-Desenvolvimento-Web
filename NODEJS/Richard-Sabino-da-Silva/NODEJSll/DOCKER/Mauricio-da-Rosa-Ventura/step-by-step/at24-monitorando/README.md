# Atividade 24 — Monitorando containers

## Objetivo

Rodar `docker stats` e explicar as métricas apresentadas.

## Explicação

`docker stats` mostra, em tempo real (ou como uma única foto com
`--no-stream`), o uso de recursos de cada container em execução: `CPU %` (uso
de processador relativo ao total disponível), `MEM USAGE / LIMIT` (memória
usada e o teto configurado, se houver — ver atividade 22), `NET I/O`
(tráfego de rede recebido/enviado) e `BLOCK I/O` (leitura/escrita em disco).
É a ferramenta de primeiro socorro quando uma aplicação está lenta: mostra
rapidamente se o gargalo é CPU, memória ou I/O, sem precisar entrar em cada
container individualmente.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
