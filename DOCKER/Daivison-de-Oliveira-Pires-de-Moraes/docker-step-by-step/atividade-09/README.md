# Atividade 09: Expondo portas

## Objetivo
Mapear a porta 80 do container Nginx para a porta 8080 do host.

## Comandos executados
```bash
docker run -d -p 8080:80 nginx
# depois, no navegador:
# http://localhost:8080
```

## O que foi observado / evidenciado
`-p 8080:80` mapeia a porta 80 do container (onde o Nginx escuta) para a porta 8080 da máquina host. Formato: `-p <porta_host>:<porta_container>`.
