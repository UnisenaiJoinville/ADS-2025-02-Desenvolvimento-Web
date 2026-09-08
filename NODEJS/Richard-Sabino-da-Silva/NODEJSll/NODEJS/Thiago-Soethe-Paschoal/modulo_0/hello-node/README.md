# Hello Node Profissional

Este projeto foi criado para a atividade prática do Módulo 0 de Node.js. Ele executa um programa simples em TypeScript que mostra a versão do Node.js e a data e hora atual. A ideia é validar que o ambiente de desenvolvimento está funcionando corretamente.

O projeto utiliza TypeScript com o modo `strict` ativado para ajudar a encontrar erros de tipagem antes da execução. Também foram configurados ESLint, Prettier e EditorConfig para manter o código organizado. A dependência externa escolhida foi o `dayjs`, usada somente para formatar a data e a hora exibidas pelo programa.

Para executar localmente, primeiro rode `npm install` e depois `npx ts-node src/index.ts`. Também é possível usar `npm run dev`. Para testar com Docker, execute `docker build -t hello-node .` e depois `docker run --rm hello-node`. O resultado deve mostrar a mensagem de ambiente válido, a versão do Node.js e a data e hora atual.

## Comandos úteis

```bash
npm install
npx ts-node src/index.ts
npm run typecheck
npm run lint
npm run format:check
```

## Docker

```bash
docker build -t hello-node .
docker run --rm hello-node
```
