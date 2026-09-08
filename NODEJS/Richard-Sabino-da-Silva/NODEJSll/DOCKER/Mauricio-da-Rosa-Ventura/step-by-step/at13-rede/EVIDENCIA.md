# Evidencia de execucao - Atividade 13: Criando uma rede Docker

Gerado em: 2026-08-28 14:23:25 -0300

## Comandos e saída

```
$ docker network create minha-rede
9518cb96de2f39dfdb803eecab1545946231dea5fba1876e5a0bdf891f82ef0d

$ docker network ls --filter name=minha-rede
NETWORK ID     NAME         DRIVER    SCOPE
9518cb96de2f   minha-rede   bridge    local

$ docker network inspect minha-rede --format '{{.Driver}}'
bridge

```

