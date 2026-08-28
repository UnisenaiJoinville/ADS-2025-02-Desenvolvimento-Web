# Atividade 05 — Removendo um container

## Objetivo

Listar containers e remover um com `docker rm`.

## Explicação

`docker rm <container>` remove permanentemente um container parado (o
filesystem de escrita dele e os metadados são apagados; a imagem usada por
ele **não** é afetada, porque imagens e containers são coisas diferentes —
uma imagem é o molde somente-leitura, o container é a instância). Por padrão,
`docker rm` recusa remover um container que ainda está em execução, para
evitar perda de dados/estado por engano; para forçar de qualquer forma existe
`docker rm -f`, que primeiro para e depois remove.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
