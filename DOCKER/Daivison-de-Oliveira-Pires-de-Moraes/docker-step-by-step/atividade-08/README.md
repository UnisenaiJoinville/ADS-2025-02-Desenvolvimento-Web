# Atividade 08: Criando um container em segundo plano

## Objetivo
Rodar o Nginx em modo *detached*.

## Comandos executados
```bash
docker run -d nginx
docker ps
```

## O que foi observado / evidenciado
`-d` (detached) roda o container em segundo plano. Como o Nginx é um servidor que fica ativo esperando conexões, ele aparece em `docker ps` com status `Up`.
