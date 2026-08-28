# Atividade 19 — Publicando uma imagem

## Objetivo

Fazer login em um registry e publicar a imagem com `docker push`.

## Explicação

O material original pede `docker login` seguido de `docker push
minha-imagem:v1` no Docker Hub. Publicar no Docker Hub de verdade exige uma
conta pessoal do aluno (`docker login` com usuário/senha ou token), então a
evidência automática abaixo usa, em vez disso, um **registry local** (a
própria imagem oficial `registry:2`, rodando em `localhost:5000`) — o mesmo
conceito de "publicar uma imagem em um registry" (build uma vez, publicar,
puxar de outro lugar), só que sem depender de uma conta externa. Quem quiser
também publicar no Docker Hub de verdade só precisa trocar `localhost:5000/`
pelo próprio usuário (`docker login` e depois `docker push
<seu-usuario>/minha-imagem:v1`) — os dois caminhos estão documentados abaixo.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
