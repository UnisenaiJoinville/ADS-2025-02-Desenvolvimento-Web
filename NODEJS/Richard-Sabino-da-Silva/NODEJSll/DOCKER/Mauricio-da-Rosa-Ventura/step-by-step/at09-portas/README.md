# Atividade 09 — Expondo portas

## Objetivo

Rodar `docker run -d -p 8080:80 nginx` e acessar `http://localhost:8080`.

## Explicação

Por padrão, as portas de um container ficam isoladas na rede interna do
Docker e não são alcançáveis a partir do host. `-p 8080:80` publica a porta
80 do **container** (onde o Nginx escuta por padrão) na porta 8080 do
**host** (a máquina do desenvolvedor) — o formato é sempre
`porta-do-host:porta-do-container`. Depois disso, `http://localhost:8080` no
navegador (ou um `curl` no terminal) chega até o Nginx dentro do container,
mesmo que ele esteja isolado. Essa técnica é a base de como qualquer
aplicação containerizada (API, frontend, banco) fica acessível durante o
desenvolvimento local.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
