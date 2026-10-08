# Hello node

Esta aplicação expande o modelo básico hello-node utilizando TypeScript para incorporar os padrões adotados no mercado: tipagem rigorosa, linters, padronização de formatação e controle rígido do ambiente. A funcionalidade principal é simples: ao ser executado, o script exibe uma mensagem de boas-vindas junto com o registro atual de data e hora.

O uso do TypeScript com a opção strict: true ativada garante validações rigorosas nos tipos de dados durante o desenvolvimento. A qualidade e o estilo do código são assegurados pela integração do ESLint com o Prettier. Para gerenciar a exibição de temporalidade de forma limpa e direta, a biblioteca Day.js foi integrada ao projeto.

Guia de Execução Local

Instalação de pacotes: Após garantir o uso da versão correta do Node (indicada no arquivo .nvmrc), instale as dependências com npm install.

Execução direta: Execute o arquivo principal via npx ts-node src/index.ts (ou através do script npm start).

Análise de código: Rode npm run lint para verificar possíveis desvios de padrão.

Formatação automática: Rode npm run format para alinhar a estilização do código-fonte.