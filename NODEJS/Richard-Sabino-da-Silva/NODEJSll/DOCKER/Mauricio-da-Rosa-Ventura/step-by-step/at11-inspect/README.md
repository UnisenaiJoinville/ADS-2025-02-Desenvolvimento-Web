# Atividade 11 — Inspecionando um container

## Objetivo

Rodar `docker inspect` em um container e explicar as informações obtidas.

## Explicação

`docker inspect <container>` devolve um JSON completo com tudo que o
Docker sabe sobre aquele container: em `State`, o status atual e o PID do
processo principal; em `Config`, a imagem de origem, variáveis de ambiente e
o comando executado; em `Mounts`, quais volumes/bind mounts estão montados e
em que caminho; em `NetworkSettings`, o endereço IP interno do container e a(s)
rede(s) Docker a que ele pertence. É a ferramenta de diagnóstico mais
completa quando `docker ps` e `docker logs` não são suficientes para entender
por que um container está se comportando de um jeito inesperado (ex.: porta
não publicada, volume no caminho errado, variável de ambiente ausente).

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
