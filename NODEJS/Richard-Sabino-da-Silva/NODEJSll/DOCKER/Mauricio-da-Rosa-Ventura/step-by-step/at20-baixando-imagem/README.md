# Atividade 20 — Baixando uma imagem do Docker Hub

## Objetivo

Rodar `docker pull nginx` e verificar a imagem baixada.

## Explicação

`docker pull` baixa uma imagem de um registry (por padrão, o Docker Hub)
sem criar nenhum container — é só a etapa de download, útil para pré-carregar
imagens antes de precisar delas (por exemplo, em uma pipeline de CI, ou antes
de uma demonstração offline), separando claramente a etapa de "obter a
imagem" da etapa de "rodar um container a partir dela" (`docker run`, que faz
o pull automaticamente se a imagem ainda não existir localmente, como visto
na atividade 2).

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
