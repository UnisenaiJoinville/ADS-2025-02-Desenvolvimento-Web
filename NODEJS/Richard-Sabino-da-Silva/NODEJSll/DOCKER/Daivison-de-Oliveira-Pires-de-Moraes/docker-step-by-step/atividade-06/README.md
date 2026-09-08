# Atividade 06: Criando uma imagem Docker

## Objetivo
Construir uma imagem customizada a partir de um Dockerfile.

## Comandos executados
```bash
docker build -t minha-imagem .
docker images
```

## O que foi observado / evidenciado
`FROM ubuntu` define a imagem base. `RUN` executa um comando durante o build, criando uma nova camada (layer). `-t minha-imagem` nomeia a imagem gerada. O `.` indica o contexto de build (pasta atual).

## Arquivos desta pasta
- `Dockerfile`: imagem base Ubuntu com `curl` instalado.
