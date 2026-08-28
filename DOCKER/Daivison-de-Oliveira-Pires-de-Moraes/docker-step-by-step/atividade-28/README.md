# Atividade 28: Restaurando volumes

## Objetivo
Extrair um backup tar de volta para dentro de um volume.

## Comandos executados
```bash
docker run --rm -v meu-volume:/data -v $(pwd):/backup ubuntu bash -c "tar xvf /backup/backup.tar -C /data"
```

## O que foi observado / evidenciado
Processo inverso ao backup: extrai o conteúdo de `backup.tar` diretamente para dentro do volume `meu-volume`, restaurando os dados. Muito usado em migrações entre ambientes/servidores.
