# Atividade 05: Removendo um container

## Objetivo
Remover um container parado.

## Comandos executados
```bash
docker ps -a
docker rm <container_id>
```

## O que foi observado / evidenciado
Só é possível remover um container **parado**. Se estiver rodando, o comando falha a menos que se use `docker rm -f <container_id>` (força parada + remoção).
