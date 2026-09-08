# Node.js — Módulo 0 — Bruno Silva

Entregas das atividades de fixação do Módulo 0 (seção 17).

## O que tem aqui

| Item | Onde |
|---|---|
| Atividade teórica — 7 perguntas | [docs/atividade-teorica-modulo-0.md](docs/atividade-teorica-modulo-0.md) |
| Atividade prática — hello-node | [hello-node/](hello-node/) |

## Sobre o hello-node

Projeto TypeScript com modo estrito ligado, ESLint e Prettier como
devDependencies, `.editorconfig` na raiz e a biblioteca **zod** usada para
validar um objeto em `src/index.ts`.

```bash
cd hello-node
npm install
npm run dev
```

Saída esperada:

```
Ambiente OK, v22.21.0
Bruno Silva - ADS (matricula 202601)
Dados invalidos:
  nome: Too small: expected string to have >=3 characters
  matricula: a matricula tem 6 digitos
```

Outros comandos: `npm run lint`, `npm run format`, `npm run build`.

As decisões técnicas estão explicadas no [README do projeto](hello-node/README.md).
