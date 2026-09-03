# Atividade 18 — Tagging de imagens

## Objetivo

Criar uma tag adicional para a imagem com `docker tag`.

## Explicação

`docker tag minha-imagem minha-imagem:v1` não duplica a imagem em disco —
ele apenas cria um **apelido novo** apontando para o mesmo `IMAGE ID` que já
existia (por padrão, sem tag explícita, o Docker usa `latest`). É assim que
um pipeline de CI/CD versiona builds: a mesma imagem construída uma vez pode
receber várias tags (`v1`, o hash do commit, `latest`), todas apontando para
o mesmo conteúdo, sem gastar espaço em disco duplicado.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
