# Evidencia de execucao - Atividade 22: Limitando recursos do container

Gerado em: 2026-08-28 14:24:40 -0300

## Comandos e saída

```
$ docker run -d --name at22-limitado -m 512m --cpus="1.0" ubuntu sleep 60
726167aaaf8904f45b8fb99965f02d73680019220203a659af8a44d2ceb025e1

$ docker inspect at22-limitado --format 'Memory (bytes): {{.HostConfig.Memory}}'
Memory (bytes): 536870912

$ docker inspect at22-limitado --format 'NanoCPUs: {{.HostConfig.NanoCpus}}'
NanoCPUs: 1000000000

$ docker stats --no-stream at22-limitado
CONTAINER ID   NAME            CPU %     MEM USAGE / LIMIT   MEM %     NET I/O       BLOCK I/O   PIDS
726167aaaf89   at22-limitado   0.00%     2.742MiB / 512MiB   0.54%     872B / 126B   0B / 0B     1

```

