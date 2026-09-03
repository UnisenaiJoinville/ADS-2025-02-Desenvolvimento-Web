# Atividade 07 — Executando uma imagem

## Objetivo

Rodar `docker run minha-imagem` e explicar o que a imagem faz.

## Explicação

A imagem `minha-imagem` (criada na atividade 6) é baseada na imagem `ubuntu`
padrão, cujo comando padrão (`CMD`) é abrir um `/bin/bash`. Rodar `docker run
minha-imagem` sem `-it` e sem um comando adicional inicia esse bash, mas como
não há terminal interativo nem entrada de dados, o bash não tem o que fazer e
encerra imediatamente (`Exited (0)`) — o container "funciona", só não faz
nada visível, porque a imagem em si não tem nenhum processo de longa duração
definido. Para realmente ver o que essa imagem contém em ação, é preciso
passar um comando explícito na hora de rodar, sobrescrevendo o `CMD` padrão —
por exemplo `docker run minha-imagem curl --version`, que usa exatamente o
pacote instalado no Dockerfile da atividade 6 para provar que ele está
disponível dentro da imagem.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
