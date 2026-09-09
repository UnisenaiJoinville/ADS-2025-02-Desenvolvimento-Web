# hello-node

Projeto de validação do ambiente profissional de desenvolvimento Node.js, desenvolvido como
atividade prática do Módulo 0 do curso. A aplicação é intencionalmente simples: ao ser executada,
monta e imprime no console uma mensagem confirmando que o ambiente está funcional, combinando a
versão do Node.js em execução (`process.version`) com a data e hora atual formatadas por uma
biblioteca externa. O objetivo não é a funcionalidade em si, mas replicar em escala reduzida o
fluxo profissional completo: projeto TypeScript tipado, versionado no Git com histórico de commits
coerente e com qualidade de código garantida por ferramentas automatizadas.

Entre as decisões técnicas tomadas, o `tsconfig.json` foi configurado com `"strict": true`, exigindo
tipagem explícita e eliminando classes inteiras de erros de `null`/`undefined` já em tempo de
compilação — prática padrão em projetos TypeScript profissionais. Como dependência externa foi
escolhida a biblioteca [dayjs](https://day.js.org/), usada em `src/index.ts` para formatar a data de
inicialização: ela foi preferida em vez do módulo nativo `Date` por oferecer uma API de formatação
mais legível e é amplamente adotada no mercado como alternativa leve ao Moment.js. ESLint e Prettier
foram instalados como `devDependencies` do próprio projeto (não apenas como extensão do editor),
com `typescript-eslint` para entender a sintaxe TypeScript e `eslint-config-prettier` para desativar
regras de estilo do ESLint que conflitariam com a formatação do Prettier — garantindo que qualquer
pessoa que clone o repositório rode as mesmas checagens, independente do editor usado.

Para rodar o projeto localmente, é necessário ter o Node.js (versão LTS, ver `.nvmrc`) instalado.
Após clonar o repositório, instale as dependências com `npm install`. Para executar o projeto
diretamente a partir do TypeScript, sem etapa manual de build, use `npm run dev` (equivalente a
`npx tsx src/index.ts`). Para gerar o build de produção em JavaScript, use `npm run build`
(equivalente a `npx tsc`), que cria os arquivos em `dist/`, e em seguida `npm start` para executá-los
com `node`. Para verificar a qualidade do código, use `npm run lint` (ESLint) e `npm run format`
(Prettier).

## Scripts disponíveis

| Comando         | Descrição                                          |
| --------------- | --------------------------------------------------- |
| `npm run dev`    | Executa `src/index.ts` diretamente via `tsx`        |
| `npm run build`  | Compila o projeto TypeScript para `dist/`           |
| `npm start`      | Executa o build compilado com `node`                |
| `npm run lint`   | Roda o ESLint sobre o projeto                       |
| `npm run format` | Formata o código com Prettier                       |
