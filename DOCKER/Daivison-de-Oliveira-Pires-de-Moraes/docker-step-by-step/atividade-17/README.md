# Atividade 17: Atualizando uma imagem

## Objetivo
Alterar o Dockerfile (novo pacote) e reconstruir a imagem.

## Comandos executados
```bash
docker build -t minha-imagem .
docker images
```

## O que foi observado / evidenciado
O Docker usa cache de camadas: como `FROM ubuntu` não mudou, essa camada é reaproveitada; como a linha `RUN` mudou (novo pacote `wget`), ela é reconstruída. A imagem antiga fica órfã (`<none>`) até ser removida.

## Arquivos desta pasta
- `Dockerfile`: versão com `wget` adicionado, evidenciando a atualização em relação à Atividade 6.
