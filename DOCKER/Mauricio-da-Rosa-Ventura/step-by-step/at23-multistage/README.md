# Atividade 23 — Usando Dockerfile multi-stage

## Objetivo

Criar um Dockerfile com múltiplas etapas (build e runtime) e comparar o tamanho final.

## Arquivos desta atividade

- `Dockerfile`
- `package.json`
- `tsconfig.json`
- `src/index.ts`

## Explicação

Um build multi-stage usa mais de um `FROM` no mesmo Dockerfile: o primeiro
estágio (`build`) tem todas as ferramentas pesadas necessárias só para
**compilar** o projeto (aqui, o compilador TypeScript e as dependências de
desenvolvimento); o estágio final parte de uma imagem limpa e usa `COPY
--from=build` para trazer **apenas o resultado já compilado** (o JavaScript
gerado), sem levar o compilador nem o código-fonte TypeScript para a imagem
final. O resultado é uma imagem de produção bem menor e com uma superfície de
ataque menor (menos ferramentas instaladas = menos vulnerabilidades em
potencial), sem abrir mão de nenhuma ferramenta de build durante o
desenvolvimento — o mesmo princípio citado na Seção 5.1 do material de Docker
Compose.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
