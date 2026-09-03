# Evidencia de execucao - Atividade 28: Restaurando volumes

Gerado em: 2026-08-28 14:25:51 -0300

## Comandos e saída

```
$ docker volume create meu-volume-restaurado
meu-volume-restaurado

$ docker run --rm -v meu-volume-restaurado:/data -v $(pwd)/../at27-backup-volumes:/backup ubuntu bash -c "tar xvf /backup/backup.tar -C /data --strip-components=1"
tar: /backup/backup.tar: Cannot open: No such file or directory
tar: Error is not recoverable: exiting now

$ docker run --rm -v meu-volume-restaurado:/data alpine sh -c 'echo conteudo restaurado:; cat /data/arquivo.txt'
conteudo restaurado:
cat: can't open '/data/arquivo.txt': No such file or directory

```

