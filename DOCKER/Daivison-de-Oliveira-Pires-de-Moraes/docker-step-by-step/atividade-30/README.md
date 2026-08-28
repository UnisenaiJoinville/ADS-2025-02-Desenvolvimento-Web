# Atividade 30: Limpeza de recursos

## Objetivo
Remover containers parados e imagens não utilizadas.

## Comandos executados
```bash
docker container prune
docker image prune
```

## O que foi observado / evidenciado
`docker container prune` remove todos os containers parados (`Exited`). `docker image prune` remove imagens *dangling* (sem tag, sobras de builds antigos). Para remover todas as imagens não usadas por nenhum container, mesmo com tag: `docker image prune -a`. Para limpeza geral (containers, imagens, redes e cache de build): `docker system prune -a`.
