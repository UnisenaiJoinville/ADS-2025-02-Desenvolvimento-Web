# hello-node

Projeto prático da Atividade de Fixação 17.2 do Módulo 0 (Montando o Ambiente Profissional de Desenvolvimento — Node.js), da disciplina de Desenvolvimento Web do curso de ADS na Unisenai. O objetivo não é construir uma aplicação com regras de negócio, e sim provar, de ponta a ponta, que o ambiente profissional de Node.js com TypeScript está corretamente configurado: gerenciador de versões fixado por projeto, compilador em modo estrito, uma dependência externa real instalada via npm, e qualidade de código garantida por ESLint e Prettier.

O programa em si é intencionalmente simples: `src/index.ts` monta e imprime uma mensagem confirmando que o ambiente está pronto, informando a versão do Node.js em execução (`process.version`) e o instante da validação, formatado com a biblioteca `dayjs`. A lógica de formatação foi isolada na função `buildStatusMessage`, que recebe a data como parâmetro (com valor padrão `new Date()`), justamente para deixar o código testável sem depender do relógio do sistema durante um teste automatizado futuro.

Algumas decisões técnicas foram tomadas de propósito, replicando práticas de mercado descritas no material do Módulo 0. A dependência externa escolhida foi o `dayjs` em vez do `Moment.js` (descontinuado) ou de manipulação manual de datas com `Date`, porque é uma biblioteca leve (~2KB), imutável e com API de formatação simples — um caso de uso realista para qualquer API Node.js que precise exibir datas em log ou payload de resposta. O `tsconfig.json` foi configurado com `"strict": true` mais reforços adicionais (`noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`), para pegar o máximo de erros ainda em tempo de compilação, como recomenda o material. ESLint e Prettier entram como `devDependencies` do próprio projeto (não apenas como extensão do editor), com `eslint-config-prettier` desligando as regras de estilo do ESLint que conflitariam com o Prettier — assim, qualquer pessoa que clonar o repositório roda exatamente as mesmas checagens, independente do editor usado.

## Como rodar localmente

Pré-requisito: Node.js na versão indicada em `.nvmrc` (`nvm use`, caso use nvm/nvm-windows).

```bash
npm install
npm run dev      # roda src/index.ts diretamente via tsx
```

Outros scripts disponíveis:

```bash
npm run build    # compila TypeScript para dist/ (tsc)
npm start        # roda o código já compilado (node dist/index.js)
npm run lint     # ESLint (zero erros/avisos configurados como erro)
npm run format   # aplica formatação do Prettier em todo o projeto
```

## Estrutura

```
hello-node/
├── src/index.ts        # ponto de entrada
├── tsconfig.json        # modo estrito
├── eslint.config.js     # ESLint (flat config) + typescript-eslint + eslint-config-prettier
├── .prettierrc.json      # regras de formatação
├── .editorconfig         # charset/indentação consistentes entre editores
├── .nvmrc                # versão do Node.js fixada por projeto (lts/*)
└── package.json
```

## Saída esperada

```
$ npm run dev
Ambiente OK, v22.x.x — validado em 28/08/2026 às 16:33:41
```
