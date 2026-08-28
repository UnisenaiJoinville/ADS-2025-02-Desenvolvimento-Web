# Evidencia de execucao - Atividade 03: Listando containers

Gerado em: 2026-08-28 14:21:41 -0300

## Comandos e saída

```
$ docker ps -a
CONTAINER ID   IMAGE                   COMMAND                  CREATED         STATUS                      PORTS     NAMES
61cfe0a98a7d   hello-world             "/hello"                 3 seconds ago   Exited (0) 2 seconds ago              kind_nightingale
fe403a86df6a   projeto-guiado-worker   "docker-entrypoint.s…"   42 hours ago    Exited (137) 22 hours ago             projeto-guiado-worker-1
16c68f1c6bfb   rabbitmq:4-management   "docker-entrypoint.s…"   42 hours ago    Exited (0) 22 hours ago               projeto-guiado-rabbitmq-1
e8b8b4d035b3   projeto-guiado-api      "docker-entrypoint.s…"   42 hours ago    Exited (137) 22 hours ago             projeto-guiado-api-1
24b621f3f2a9   redis:7.4-alpine        "docker-entrypoint.s…"   42 hours ago    Exited (0) 22 hours ago               projeto-guiado-redis-1
e27dfd87fbd0   mysql:8.4               "docker-entrypoint.s…"   42 hours ago    Exited (137) 22 hours ago             projeto-guiado-mysql-1
0ece3b9bd2c1   projeto-api             "docker-entrypoint.s…"   43 hours ago    Created                               relaxed_booth
28af77b8e01d   projeto-api             "docker-entrypoint.s…"   43 hours ago    Created                               mystifying_lehmann
61261f9e7cb1   projeto-api             "docker-entrypoint.s…"   43 hours ago    Created                               sharp_joliot
f35f60df46f5   projeto-api             "docker-entrypoint.s…"   43 hours ago    Created                               condescending_leavitt
f0f0f15a6081   74f852ab19cc            "docker-entrypoint.s…"   2 days ago      Exited (137) 2 days ago               musing_williams
561649176dbf   74f852ab19cc            "docker-entrypoint.s…"   2 days ago      Exited (137) 2 days ago               awesome_jennings
42f33272d740   74f852ab19cc            "docker-entrypoint.s…"   2 days ago      Exited (137) 2 days ago               wizardly_jackson
02d1e8bfe1bd   74f852ab19cc            "docker-entrypoint.s…"   2 days ago      Exited (137) 2 days ago               sleepy_payne

```

