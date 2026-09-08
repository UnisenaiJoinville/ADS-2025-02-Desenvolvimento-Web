# Atividade 03: Listando containers

## Objetivo
Entender a diferença entre containers em execução e parados.

## Comandos executados
```bash
docker ps -a
```

## O que foi observado / evidenciado
`docker ps` mostra apenas containers **em execução** (status `Up`). `docker ps -a` mostra **todos**, inclusive os já **parados** (status `Exited`). Um container parado continua existindo em disco até ser removido com `docker rm`.
