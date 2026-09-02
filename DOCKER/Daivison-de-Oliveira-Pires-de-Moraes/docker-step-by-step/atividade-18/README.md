# Atividade 18: Tagging de imagens

## Objetivo
Criar uma nova tag (versão) para uma imagem já existente.

## Comandos executados
```bash
docker tag minha-imagem minha-imagem:v1
docker images
```

## O que foi observado / evidenciado
`docker tag` não duplica a imagem no disco — cria uma nova referência apontando para o mesmo Image ID. É assim que se versiona imagens (v1, v2, latest) sem gastar espaço extra.
