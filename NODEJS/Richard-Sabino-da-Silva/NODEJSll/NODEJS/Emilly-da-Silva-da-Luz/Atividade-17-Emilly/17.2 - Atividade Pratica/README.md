# Hello Node Profissional - Versão B

O projeto demonstra uma aplicação de console em Node.js escrita em TypeScript. Apesar de pequeno, ele foi estruturado para praticar o mesmo fluxo utilizado em aplicações maiores: configuração estrita do compilador, validação de qualidade com lint, formatação automática e uso consciente de uma biblioteca externa.

Nesta versão foi escolhida a biblioteca Zod. TypeScript verifica os tipos conhecidos durante o desenvolvimento, mas uma aplicação real também recebe valores desconhecidos em tempo de execução. O Zod foi usado para validar um objeto antes de tratá-lo como usuário válido, mostrando a diferença entre tipagem estática e validação de dados em runtime. ESLint e Prettier complementam o projeto mantendo regras de código e formatação previsíveis.

Para rodar o projeto, use a versão de Node indicada em `.nvmrc`, execute `npm install` e em seguida `npx ts-node src/index.ts`. Para verificar o código, execute `npm run lint`; para aplicar a formatação configurada, execute `npm run format`. Antes da entrega, o aluno deve publicar esta pasta no repositório da Organização pelo SSH solicitado na atividade.

## Commits sugeridos
1. `chore: configura base TypeScript strict`
2. `feat: valida usuario com zod`
3. `docs: adiciona instrucoes e ferramentas de qualidade`

> O histórico real de Git e o link do GitHub precisam ser produzidos pelo aluno na própria conta/Organização.
