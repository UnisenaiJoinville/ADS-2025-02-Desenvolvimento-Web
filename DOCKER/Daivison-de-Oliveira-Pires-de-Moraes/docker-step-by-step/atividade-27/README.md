# Atividade 27: Backup de volumes

## Objetivo
Compactar o conteúdo de um volume em um arquivo tar no host.

## Comandos executados
```bash
docker run --rm -v meu-volume:/data -v $(pwd):/backup ubuntu tar cvf /backup/backup.tar /data
```

## O que foi observado / evidenciado
Sobe um container Ubuntu temporário (`--rm` remove ao final), monta o volume em `/data` e a pasta atual do host em `/backup`, e usa `tar` para compactar `/data` em `backup.tar`, salvo direto no host.
