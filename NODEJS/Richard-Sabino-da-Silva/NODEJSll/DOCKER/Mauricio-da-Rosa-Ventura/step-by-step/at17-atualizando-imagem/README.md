# Atividade 17 — Atualizando uma imagem

## Objetivo

Alterar o Dockerfile da atividade 6, reconstruir e comparar a nova imagem.

## Arquivos desta atividade

- `Dockerfile`

## Explicação

Alterar o Dockerfile (aqui, adicionando a instalação do pacote `wget` junto
com o `curl` já existente) e rodar `docker build -t minha-imagem .` de novo
gera uma **nova imagem**, com um novo `IMAGE ID`, sem apagar a imagem antiga
automaticamente — a antiga fica órfã (sem tag, aparecendo como `<none>` em
`docker images`) até ser removida manualmente ou por um `docker image prune`
(atividade 30). Isso mostra por que fixar uma tag específica (em vez de
sempre sobrescrever `latest`) é importante em produção: sem uma tag versionada,
não há como saber, olhando só o nome, qual build está de fato rodando em cada
lugar.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
