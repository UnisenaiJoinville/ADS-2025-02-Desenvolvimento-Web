# Hello Node Profissional - Versão A

Este projeto é uma evolução do exemplo hello-node para TypeScript. O objetivo é manter uma aplicação pequena, mas aplicar práticas comuns de um projeto profissional: tipagem estrita, padronização de código, dependências controladas e documentação de execução. Ao iniciar, o programa imprime uma saudação acompanhada da data e hora atuais.

A configuração utiliza TypeScript com `strict: true` para aumentar a segurança da tipagem durante o desenvolvimento. ESLint e Prettier foram adicionados como ferramentas de qualidade e formatação. A dependência externa escolhida foi o Day.js, pois ela simplifica a formatação de datas sem exigir que essa lógica seja escrita manualmente no exemplo.

Para executar localmente, instale uma versão compatível do Node.js, rode `npm install` e depois `npx ts-node src/index.ts`. O código também pode ser verificado com `npm run lint` e formatado com `npm run format`. O arquivo `.nvmrc` registra a versão principal de Node esperada para facilitar a padronização do ambiente.
