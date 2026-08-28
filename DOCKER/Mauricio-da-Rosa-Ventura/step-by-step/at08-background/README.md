# Atividade 08 — Criando um container em segundo plano

## Objetivo

Rodar `docker run -d nginx` e verificar com `docker ps`.

## Explicação

`-d` (*detached*) inicia o container em segundo plano e devolve o
terminal imediatamente, em vez de prender o terminal ao processo do
container (como aconteceria sem `-d`, mostrando os logs do Nginx ao vivo).
Isso é o modo padrão de rodar qualquer serviço de longa duração (um servidor
web, uma API, um banco de dados) — diferente do `hello-world` da atividade 2,
o Nginx tem um processo mestre que fica escutando conexões indefinidamente,
então o container continua com status `Up` até ser parado manualmente.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
