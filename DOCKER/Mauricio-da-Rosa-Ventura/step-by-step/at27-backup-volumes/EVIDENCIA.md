# Evidencia de execucao - Atividade 27: Backup de volumes

Gerado em: 2026-08-28 14:25:37 -0300

## Comandos e saída

```
$ docker volume create meu-volume-dados
meu-volume-dados

$ docker run --rm -v meu-volume-dados:/data alpine sh -c "echo conteudo-de-teste > /data/arquivo.txt"
Unable to find image 'alpine:latest' locally
latest: Pulling from library/alpine
Digest: sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b
Status: Downloaded newer image for alpine:latest

$ docker run --rm -v meu-volume-dados:/data -v $(pwd):/backup ubuntu tar cvf /backup/backup.tar /data
tar: Cannot connect to C: resolve failed

$ ls -la backup.tar
ls: cannot access 'backup.tar': No such file or directory

```

