# Atividade teórica — Módulo 0

## 1. O que é o event loop do Node.js?

O event loop é o mecanismo que permite ao Node.js continuar trabalhando enquanto operações que dependem de recursos externos estão acontecendo. A aplicação possui uma thread principal para executar o código JavaScript, mas não precisa ficar parada esperando uma operação de entrada e saída terminar.

Um exemplo simples seria uma API recebendo várias requisições para consultar um arquivo ou banco de dados. Em vez de deixar a thread principal parada durante toda a espera, o Node.js pode iniciar a operação e continuar tratando outras tarefas. Quando a operação termina, o resultado volta para ser processado.

Por isso o Node.js consegue lidar bem com muitas conexões simultâneas, principalmente quando a aplicação trabalha com operações de I/O. O ganho não significa que qualquer código pesado fique rápido: uma função que ocupa a thread principal por muito tempo ainda pode prejudicar todas as outras requisições.

## 2. Operações síncronas e assíncronas

Uma operação síncrona espera a tarefa terminar antes de continuar. É como fazer uma fila: o próximo passo só começa quando o anterior acabou. Já uma operação assíncrona permite iniciar uma tarefa e continuar executando outras coisas enquanto a primeira está aguardando uma resposta.

Em produção, bloquear o event loop é um problema porque a thread principal é compartilhada pelo processamento do JavaScript. Se uma função fizer um cálculo muito pesado durante vários segundos, outras requisições podem ficar esperando. Um exemplo seria colocar um processamento enorme de dados diretamente no caminho de uma requisição HTTP.

Por isso aplicações Node.js precisam tomar cuidado com operações bloqueantes e com funções que consomem muito tempo de CPU.

## 3. O que é TypeScript?

TypeScript é uma linguagem baseada em JavaScript que adiciona recursos de tipagem e outras ferramentas para desenvolvimento. Um dos principais benefícios é detectar vários problemas durante o desenvolvimento e a compilação, antes de o código chegar à execução.

JavaScript possui tipagem dinâmica. Por exemplo, uma variável pode receber um número e depois receber uma string. No TypeScript, posso declarar que determinada informação deve ser um `string`, `number` ou outro tipo.

A diferença importante é que a verificação de tipos do TypeScript acontece no desenvolvimento/compilação. Em tempo de execução, quem executa o programa continua sendo JavaScript.

Na prática, para um projeto maior, isso ajuda a deixar contratos entre funções mais claros e reduz alguns erros simples de programação.

## 4. CommonJS e ES Modules

CommonJS usa principalmente `require` e `module.exports`. Um exemplo seria:

```js
const dayjs = require("dayjs");
```

Já ES Modules usa `import` e `export`:

```js
import dayjs from "dayjs";
```

Os dois modelos aparecem em projetos Node.js. A compatibilidade pode causar confusão porque a configuração do projeto precisa indicar como os módulos serão interpretados. Extensões de arquivo, `package.json`, `module` do TypeScript e a versão do Node.js podem influenciar o comportamento.

Nesta atividade eu usei CommonJS no `tsconfig.json` porque o objetivo é conseguir executar diretamente com:

```bash
npx ts-node src/index.ts
```

## 5. Express, Fastify e NestJS

O Express é um framework web minimalista. Ele não força uma arquitetura grande e deixa o desenvolvedor decidir como organizar rotas, middlewares e serviços. Eu usaria Express em uma API pequena ou em um projeto de estudo em que o objetivo fosse entender primeiro os fundamentos de HTTP e middleware.

O Fastify também segue uma proposta mais enxuta, mas tem foco forte em desempenho e validação de schemas. Eu consideraria Fastify em uma API que precisasse de uma estrutura simples, bom desempenho e validação de entrada integrada.

O NestJS é mais opinativo e organiza a aplicação em módulos, controllers, services e providers. Eu usaria NestJS em uma aplicação maior, principalmente quando várias pessoas precisam seguir uma arquitetura parecida. A estrutura pronta ajuda a manter um padrão entre os módulos do sistema.

Não existe uma escolha universal. O tamanho do sistema, a equipe e as necessidades técnicas influenciam a decisão.

## 6. O que é um gerenciador de versões do Node.js?

Um gerenciador de versões permite instalar e alternar entre diferentes versões do Node.js na mesma máquina.

Isso é útil porque projetos diferentes podem depender de versões diferentes. Um projeto antigo pode continuar usando uma versão específica enquanto outro usa uma versão LTS mais nova.

O módulo apresenta o nvm como uma prática importante justamente para evitar o problema de cada projeto depender de uma instalação manual diferente.

No Windows, o material utiliza o `nvm-windows`. Em Linux e macOS, apresenta o nvm.

## 7. O que é um container Docker?

Um container é um ambiente isolado usado para executar uma aplicação junto com aquilo que ela precisa para funcionar. No caso deste módulo, a ideia é colocar a aplicação Node.js e suas dependências dentro de um ambiente reproduzível.

Uma máquina virtual normalmente virtualiza uma máquina completa e possui um sistema operacional convidado próprio. Um container compartilha o kernel do sistema operacional do host, mas mantém processos, arquivos e dependências isolados.

Na prática, o container tende a ser mais leve do que uma máquina virtual completa. Isso facilita reproduzir o mesmo ambiente em desenvolvimento, testes e servidores.

## Fontes em formato ABNT

DOCKER INC. **Docker documentation**. Disponível em: <https://docs.docker.com>. Acesso em: 20 ago. 2026.

GITHUB. **Connecting to GitHub with SSH**. Disponível em: <https://docs.github.com>. Acesso em: 20 ago. 2026.

MICROSOFT. **PowerShell documentation**. Disponível em: <https://learn.microsoft.com/powershell>. Acesso em: 20 ago. 2026.

MICROSOFT. **Visual Studio Code documentation**. Disponível em: <https://code.visualstudio.com/docs>. Acesso em: 20 ago. 2026.

NODE.JS FOUNDATION. **Node.js documentation**. Disponível em: <https://nodejs.org/en/docs>. Acesso em: 20 ago. 2026.

NVM-SH. **nvm — Node Version Manager**. Disponível em: <https://github.com/nvm-sh/nvm>. Acesso em: 20 ago. 2026.

PRETTIER. **Prettier documentation**. Disponível em: <https://prettier.io/docs>. Acesso em: 20 ago. 2026.
