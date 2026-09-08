# Atividade 13: Criando uma rede Docker

## Objetivo
Criar uma rede customizada para permitir comunicação entre containers pelo nome.

## Comandos executados
```bash
docker network create minha-rede
docker network ls
```

## O que foi observado / evidenciado
Por padrão o Docker usa o driver `bridge`. Uma rede customizada permite que containers se comuniquem pelo **nome**, com DNS interno automático — algo que a rede bridge padrão não oferece.
