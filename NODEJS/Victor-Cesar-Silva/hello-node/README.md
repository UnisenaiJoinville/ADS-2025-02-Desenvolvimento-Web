# hello-node

Projeto da atividade prática 17.2 do Módulo 0 — Ambiente Profissional.
Autor: **Victor Cesar Silva**

## O que faz

Aplicação de linha de comando em TypeScript que representa o "hello world" de um
ambiente Node profissional. O programa define o contrato de um aluno (nome, módulo e
data de matrícula), valida esses dados em tempo de execução e imprime no terminal uma
linha formatada com o nome, o módulo e há quantos dias a matrícula foi feita. A ideia é
pequena de propósito: o objetivo da entrega não é a lógica, e sim o ambiente ao redor
dela — TypeScript em modo estrito, lint, formatação padronizada e dependências externas
reais em uso.

## Decisões técnicas

O `tsconfig.json` está com `"strict": true`, e além disso liguei `noUnusedLocals`,
`noUnusedParameters` e `noImplicitReturns`. O módulo é `NodeNext` com `"type": "module"`
no `package.json`, ou seja, o projeto usa ES Modules de ponta a ponta, sem misturar com
CommonJS. Escolhi duas dependências externas em vez de uma: o **zod** valida a entrada
em runtime e, com `z.infer`, gera o tipo estático a partir do mesmo schema — assim
validação e tipo não podem divergir; o **dayjs** cuida da formatação de data e do
cálculo de diferença em dias, que em `Date` puro daria código verboso e propenso a erro.
Usei `safeParse` em vez de `parse` para tratar a falha de validação como fluxo normal do
programa (mensagem de erro e `exitCode = 1`), em vez de deixar uma exceção subir.

Para qualidade de código, ESLint e Prettier entram como `devDependencies` — nunca em
produção. O ESLint usa o parser do `@typescript-eslint` e estende `eslint:recommended`,
`plugin:@typescript-eslint/recommended` e `prettier`; esse último desliga as regras de
estilo do ESLint que conflitariam com o Prettier, deixando cada ferramenta com uma
responsabilidade só: o ESLint cuida de erros, o Prettier cuida de formatação. O
`.editorconfig` na raiz garante indentação de 2 espaços, `LF` e UTF-8 para qualquer
pessoa que abra o projeto, independentemente do editor. O `.nvmrc` fixa o Node 22, que é
a versão em que o projeto foi desenvolvido e testado.

## Como rodar

Pré-requisitos: Node 22 (use `nvm use` para pegar a versão do `.nvmrc`) e npm.

```bash
git clone git@github.com:<organizacao>/hello-node.git
cd hello-node
nvm use
npm install

npm run build   # compila src/ para dist/
npm start       # executa dist/index.js
npm run dev     # compila e executa em um passo
```

Scripts de qualidade:

```bash
npm run lint     # ESLint, deve terminar sem nenhuma violação
npm run format   # Prettier, formata os arquivos de src/
```

Saída esperada:

```
Hello Node profissional!
Victor Cesar Silva | modulo 0 | matriculado em 01/08/2026 (ha 27 dias)
```
