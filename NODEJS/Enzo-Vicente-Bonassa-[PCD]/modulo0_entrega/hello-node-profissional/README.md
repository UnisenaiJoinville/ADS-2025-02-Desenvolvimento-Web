# Hello Node Profissional

A versão do Node.js é indicada pelo arquivo `.nvmrc`, usando a linha LTS. Para executar o projeto localmente, primeiro selecione a versão correta com `nvm use`, depois instale as dependências com `npm install` e execute `npm start`. O comando exigido nos critérios de aceite também funciona diretamente: `npx ts-node src/index.ts`. Para conferir a tipagem, a formatação e o lint, podem ser usados os comandos `npm run typecheck`, `npm run format:check` e `npm run lint`.

## Requisitos

- Node.js LTS
- npm
- nvm ou nvm-windows recomendado para alternar versões

## Como executar

```bash
nvm use
npm install
npm start
```

Também é possível executar exatamente pelo comando solicitado na atividade:

```bash
npx ts-node src/index.ts
```

## Comandos de qualidade

```bash
npm run typecheck
npm run lint
npm run format:check
```

## Resultado esperado

A saída será semelhante a:

```text
Olá, Node.js! Ambiente OK, v24.x.x. Execução: 28/08/2026 19:00:00
```

O número da versão e o horário variam conforme o ambiente de execução.
