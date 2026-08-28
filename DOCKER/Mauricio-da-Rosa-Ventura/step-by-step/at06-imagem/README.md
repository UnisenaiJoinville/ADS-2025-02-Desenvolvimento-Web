# Atividade 06 — Criando uma imagem Docker

## Objetivo

Escrever um Dockerfile e construir uma imagem com `docker build`.

## Arquivos desta atividade

- `Dockerfile`

## Explicação

Um Dockerfile é uma receita, em texto, de como montar uma imagem: cada
instrução gera uma nova camada em cima da anterior. `FROM ubuntu` parte da
imagem oficial do Ubuntu como base; `RUN apt-get update && apt-get install -y
curl` executa, ainda durante o build (não em tempo de execução do container),
o comando que atualiza a lista de pacotes e instala o `curl`, deixando o
resultado já "assado" dentro da imagem. É por isso que dois `RUN` foram unidos
com `&&` em vez de dois comandos `RUN` separados: cada `RUN` gera uma camada
nova, e se o `apt-get update` ficasse em uma camada e o `install` em outra
camada posterior (reconstruída em outro dia), o cache do Docker poderia
reaproveitar a camada antiga do `update` e instalar pacotes desatualizados —
juntar os dois no mesmo `RUN` garante que a lista de pacotes usada é sempre a
mais recente daquele build. `docker build -t minha-imagem .` lê o Dockerfile
da pasta atual (`.` é o *build context*) e produz uma imagem local chamada
`minha-imagem`.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
