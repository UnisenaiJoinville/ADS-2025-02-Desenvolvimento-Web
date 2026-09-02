# Atividade 22 — Limitando recursos do container

## Objetivo

Rodar um container com limite de memória e CPU e confirmar o limite aplicado.

## Explicação

`-m 512m` limita o container a, no máximo, 512 MB de memória RAM, e
`--cpus="1.0"` limita o uso de CPU ao equivalente a 1 núcleo inteiro — se o
processo dentro do container tentar usar mais que isso, o kernel do host
(via cgroups) simplesmente restringe/mata o processo (no caso de memória) ou
limita seu tempo de CPU, protegendo o restante da máquina de um container mal
comportado. Isso é essencial em produção, onde vários containers dividem a
mesma máquina física: sem limites, um container com um vazamento de memória
pode consumir toda a RAM do servidor e derrubar todos os outros serviços
junto com ele. `docker inspect` confirma que os limites configurados na
criação do container foram de fato aplicados no `HostConfig`.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
