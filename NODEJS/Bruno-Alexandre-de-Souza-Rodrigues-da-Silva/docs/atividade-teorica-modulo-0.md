# Atividade Teórica — Módulo 0

**Aluno:** Bruno Silva
**Curso:** ADS — UniSENAI
**Disciplina:** Node.js — Projeto Guiado

---

## 1. O que é o event loop do Node.js

O event loop é o mecanismo que permite ao Node.js ficar o tempo todo checando se
apareceu alguma tarefa pronta para ser processada. Ele funciona como uma fila:
quando o código pede algo demorado, como ler um arquivo ou consultar um banco de
dados, o Node não fica parado esperando a resposta. Ele registra o que deve ser
feito quando o resultado chegar, devolve o controle para o programa e segue
atendendo outras coisas. Assim que o resultado fica pronto, o event loop pega a
função que estava guardada e executa.

É por isso que uma thread só consegue atender muitas conexões ao mesmo tempo. A
thread principal quase nunca está de fato trabalhando: na maior parte do tempo
ela está apenas coordenando. O trabalho pesado de entrada e saída é entregue ao
sistema operacional, que avisa quando terminou.

Um exemplo do meu próprio projeto: no `hello-node` eu chamo `console.log` e a
validação da zod, que são operações rápidas e síncronas. Se em vez disso eu
fizesse uma consulta ao MySQL do Cenário 1, o Node dispararia a consulta e
continuaria livre para atender outro pedido enquanto o banco responde. Se dez
pessoas acessassem a API ao mesmo tempo, as dez consultas ficariam em andamento
simultaneamente, mesmo com uma thread só.

## 2. Diferença entre operações síncronas e assíncronas

Uma operação síncrona trava a execução até terminar. A linha seguinte só roda
depois que ela acabou. Uma operação assíncrona dispara o trabalho e libera a
execução na hora, entregando o resultado depois, por callback, promise ou
`await`.

Bloquear o event loop é um erro grave em produção porque existe apenas uma
thread principal atendendo todo mundo. Se uma requisição executa um cálculo
pesado de forma síncrona, ou usa uma função como `fs.readFileSync` num arquivo
grande, essa thread fica presa. Nesse intervalo, o servidor não atende nem uma
única outra requisição — todos os outros usuários ficam esperando por causa de
um só. Em uma aplicação com um servidor tradicional que abre uma thread por
requisição, o estrago ficaria limitado àquela requisição. No Node, ele se
espalha para o servidor inteiro. Por isso a regra prática é: nunca colocar
processamento demorado dentro do fluxo da requisição. É justamente esse problema
que o RabbitMQ resolve no Cenário 1, jogando o trabalho pesado para um worker
separado.

## 3. O que é TypeScript e qual problema ele resolve

TypeScript é uma linguagem construída em cima do JavaScript que acrescenta
tipos. Ela não roda direto no Node: passa antes por uma etapa de compilação que
transforma o código em JavaScript comum.

A diferença central está em **quando** o erro aparece. O JavaScript tem tipagem
dinâmica em tempo de execução: o tipo de uma variável só é conhecido na hora em
que o código roda. Se eu somo um número com um texto por engano, ninguém me
avisa — o programa executa e produz um resultado errado, muitas vezes já em
produção. O TypeScript tem tipagem estática em tempo de compilação: o erro é
apontado antes do programa rodar, enquanto ainda estou escrevendo, direto no
editor.

Isso ficou concreto no meu `hello-node`. Ao ligar `"strict": true`, a compilação
falhou apontando que o `process` não era reconhecido. O código rodava
normalmente com `tsx`, então em JavaScript puro eu nunca teria descoberto o
problema. O compilador me obrigou a declarar `"types": ["node"]` no
`tsconfig.json` e deixar explícito de onde aquele objeto vinha.

## 4. CommonJS e ES Modules

São duas formas diferentes de dividir o código em arquivos. O CommonJS é o
sistema antigo do Node, que usa `require()` para importar e `module.exports`
para exportar. O ES Modules é o padrão oficial do JavaScript moderno, que usa
`import` e `export`.

A diferença técnica que mais gera problema é que o `require` é síncrono e
resolvido durante a execução, enquanto o `import` é estático e resolvido antes
do código rodar. Como o `import` é analisado antecipadamente, ferramentas
conseguem descobrir o que realmente é usado e descartar o resto.

O problema de compatibilidade continua acontecendo porque o ecossistema está no
meio da transição. Existem bibliotecas publicadas só em CommonJS, outras só em
ES Modules, e projetos que misturam as duas. Um pacote ES Modules não pode ser
carregado com `require` de forma direta, e o caminho contrário tem suas próprias
armadilhas. No `hello-node` eu precisei declarar `"type": "module"` no
`package.json` exatamente para o Node entender que os meus arquivos usam
`import`. Sem essa linha, o `import { z } from 'zod'` daria erro.

## 5. Comparação entre Express, Fastify e NestJS

**Express** é o framework web mais usado historicamente no Node. Ele é
minimalista: entrega roteamento e middlewares e para por aí. Não impõe nenhuma
estrutura de pastas nem padrão de organização, o que dá liberdade total e é
ótimo para aprender os fundamentos. O problema é que essa liberdade vira
desorganização quando o projeto cresce, porque cada desenvolvedor organiza do
seu jeito. **Cenário real:** uma API pequena de um projeto interno, com dois ou
três endpoints, feita por um desenvolvedor só. É o caso do backend que eu montei
no Cenário 1, onde a API tem basicamente um `/health` e algumas rotas.

**Fastify** segue a mesma filosofia enxuta do Express, mas foi construído com
foco explícito em desempenho e já traz validação de schema integrada via JSON
Schema. Ele valida a entrada e a saída das rotas sem biblioteca extra e é
mensuravelmente mais rápido em cenários de alto volume. **Cenário real:** uma
API que recebe eventos de dispositivos IoT, com milhares de requisições por
minuto, onde cada milissegundo de latência multiplicado pelo volume vira custo
de servidor.

**NestJS** é o oposto dos dois: é opinativo e estrutura a aplicação em módulos,
controllers, services e providers, com injeção de dependência nativa. Ele é
inspirado no Angular e cumpre no mundo Node um papel parecido com o do Spring
Boot no Java. Ele impõe um padrão, e é exatamente isso que se quer quando várias
pessoas mexem no mesmo código. **Cenário real:** o sistema de uma empresa com
uma equipe de oito desenvolvedores, onde entram e saem pessoas ao longo do ano.
Nesse contexto, o padrão imposto vale mais que a liberdade, porque quem chega
depois consegue se localizar no código sem precisar perguntar.

## 6. O que é um gerenciador de versões do Node.js

O nvm é uma ferramenta que permite instalar várias versões do Node.js na mesma
máquina e alternar entre elas com um comando. Sem ele, trocar de versão exige
desinstalar o Node e instalar outro, o que é lento e fácil de errar.

Ele é considerado prática obrigatória em times profissionais por um motivo bem
concreto: numa empresa é normal conviver um sistema legado preso numa versão
antiga do Node ao lado de um projeto novo na LTS mais recente. O mesmo
desenvolvedor pode precisar mexer nos dois no mesmo dia. Sem gerenciador de
versões, isso seria inviável.

Além disso, o nvm permite fixar a versão por projeto através do arquivo
`.nvmrc`. Quando um colega clona o repositório, ele roda `nvm use` e recebe
automaticamente a versão certa, sem precisar perguntar a ninguém qual versão o
projeto usa. Essa é a diferença entre a informação estar no código e estar na
cabeça de alguém.

## 7. Container Docker e máquina virtual

Um container Docker é um processo isolado que roda a partir de uma imagem. A
imagem carrega a aplicação e tudo de que ela precisa: bibliotecas, runtime e
arquivos de sistema.

A diferença conceitual em relação a uma máquina virtual está no que é
virtualizado. A máquina virtual virtualiza o hardware inteiro e roda um sistema
operacional completo, com kernel próprio, por cima do sistema da máquina real.
São dois sistemas operacionais empilhados. O container não faz isso: ele
compartilha o kernel do sistema hospedeiro e isola apenas o espaço de execução —
processos, sistema de arquivos e rede.

A consequência prática é grande. Um container sobe em segundos, ocupa espaço na
casa das centenas de megabytes e permite rodar vários serviços ao mesmo tempo na
mesma máquina sem peso. Uma máquina virtual leva minutos para iniciar e ocupa
gigabytes. No Cenário 1 eu subo seis serviços simultaneamente — frontend, API,
MySQL, Redis, RabbitMQ e worker — em um notebook comum. Com máquinas virtuais,
seriam seis sistemas operacionais completos rodando ao mesmo tempo, o que a
máquina não aguentaria.

Vale registrar uma nuance: o isolamento do container é mais fraco que o da
máquina virtual, justamente porque o kernel é compartilhado. Uma falha grave de
kernel afeta todos os containers da máquina. Por isso o material insiste que
container organiza a execução, mas não substitui conhecimento de segurança.

---

## Referências

DOCKER INC. **Docker documentation**. Disponível em: https://docs.docker.com.
Acesso em: 28 ago. 2026.

FASTIFY. **Fastify documentation**. Disponível em: https://fastify.dev/docs.
Acesso em: 28 ago. 2026.

MOZILLA. **JavaScript modules**. MDN Web Docs. Disponível em:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules. Acesso
em: 28 ago. 2026.

NESTJS. **NestJS documentation**. Disponível em: https://docs.nestjs.com. Acesso
em: 28 ago. 2026.

NODE.JS FOUNDATION. **The Node.js Event Loop**. Disponível em:
https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick.
Acesso em: 28 ago. 2026.

NVM-SH. **nvm — Node Version Manager**. Disponível em:
https://github.com/nvm-sh/nvm. Acesso em: 28 ago. 2026.

TYPESCRIPT. **TypeScript documentation**. Disponível em:
https://www.typescriptlang.org/docs. Acesso em: 28 ago. 2026.

UCHÔA, Carlos; SESTITO, William. **Docker e Docker Compose para ambientes
profissionais de desenvolvimento**. Joinville: UniSENAI, ago. 2026.

UCHÔA, Carlos; SESTITO, William. **Node.js — Projeto Guiado: Módulo 0 —
Montando o ambiente profissional de desenvolvimento**. Joinville: UniSENAI, ago.
2026.
