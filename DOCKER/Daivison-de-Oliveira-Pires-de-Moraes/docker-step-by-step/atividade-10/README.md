# Atividade 10: Usando volumes

## Objetivo
Criar um volume nomeado e montá-lo em um container.

## Comandos executados
```bash
docker volume create meu-volume
docker run -d -v meu-volume:/data nginx
docker volume ls
```

## O que foi observado / evidenciado
Um volume é uma área de armazenamento gerenciada pelo Docker, independente do ciclo de vida do container. Mesmo removendo o container, os dados em `/data` persistem em `meu-volume`.
