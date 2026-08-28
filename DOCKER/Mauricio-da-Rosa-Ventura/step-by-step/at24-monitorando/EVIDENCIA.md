# Evidencia de execucao - Atividade 24: Monitorando containers

Gerado em: 2026-08-28 14:25:05 -0300

## Comandos e saída

```
$ docker stats --no-stream
CONTAINER ID   NAME             CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O     PIDS
726167aaaf89   at22-limitado    0.00%     1.539MiB / 512MiB     0.30%     1.21kB / 126B     0B / 0B       1
2a84e415872e   registro-local   0.00%     10.64MiB / 9.625GiB   0.11%     79.1MB / 61.3kB   0B / 79.1MB   12
f5ca533bd76c   container2       0.00%     7.609MiB / 9.625GiB   0.08%     1.78kB / 1.68kB   0B / 12.3kB   9
a38c560a272b   container1       0.00%     7.664MiB / 9.625GiB   0.08%     3.42kB / 754B     0B / 16.4kB   9
b5990f5263f5   at10-nginx       0.00%     7.617MiB / 9.625GiB   0.08%     1.75kB / 126B     0B / 12.3kB   9
1db462215a9a   at08-nginx       0.00%     30.68MiB / 9.625GiB   0.31%     13MB / 299kB      0B / 36.2MB   9

```

