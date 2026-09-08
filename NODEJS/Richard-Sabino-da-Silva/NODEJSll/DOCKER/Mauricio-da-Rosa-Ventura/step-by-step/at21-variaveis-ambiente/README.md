# Atividade 21 — Criando um container com variáveis de ambiente

## Objetivo

Passar uma variável de ambiente com `-e` e verificar dentro do container.

## Explicação

`-e "MY_VAR=Hello"` injeta uma variável de ambiente no processo que roda
dentro do container, sem precisar alterar a imagem — é assim que
configurações que mudam entre ambientes (desenvolvimento, homologação,
produção), como URLs de banco de dados ou chaves de API, são passadas para
uma aplicação containerizada, sem hardcodar esses valores dentro da imagem
(prática recomendada tanto neste material quanto no de Docker Compose, que
usa `.env`/`environment:` para o mesmo fim).

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
