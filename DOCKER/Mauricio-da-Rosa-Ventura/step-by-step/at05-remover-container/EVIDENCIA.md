# Evidencia de execucao - Atividade 05: Removendo um container

Gerado em: 2026-08-28 14:22:17 -0300

## Comandos e saída

```
$ docker ps -a --filter name=at04-interativo
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS                     PORTS     NAMES
5d9267137a70   ubuntu    "bash -c 'apt-get up…"   25 seconds ago   Exited (0) 2 seconds ago             at04-interativo

$ docker rm at04-interativo
at04-interativo

$ docker ps -a --filter name=at04-interativo
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES

```

