# Módulo 0 — Ambiente Profissional
## Atividade Teórica Individual (Seção 17.1)

**Aluno:** Victor Cesar Silva
**Data:** 28 de agosto de 2026

---

### 1. O que é o event loop e por que ele atende muitas conexões com uma única thread

O event loop é o mecanismo que permite ao Node.js executar código JavaScript em uma
única thread principal sem ficar parado esperando operações lentas. Ele funciona como
um laço infinito que, a cada volta, verifica filas de tarefas prontas e executa os
callbacks correspondentes. Quando a aplicação pede algo demorado — ler um arquivo,
consultar um banco, responder uma requisição HTTP — o Node não bloqueia a thread:
delega a operação ao sistema operacional (ou à pool de threads da libuv) e registra
uma função de retorno. Assim que o resultado fica pronto, o callback entra na fila e o
event loop o executa na próxima oportunidade.

É exatamente por isso que uma única thread atende milhares de conexões simultâneas.
Numa arquitetura tradicional com uma thread por conexão, mil clientes conectados
significam mil threads ocupando memória e disputando o processador, mesmo que a maioria
esteja apenas esperando I/O. No modelo do Node, essas mil conexões ficam registradas
como callbacks pendentes e a thread só trabalha quando há de fato algo para processar.
O gargalo deixa de ser o número de conexões e passa a ser o tempo de CPU consumido por
cada uma.

Um exemplo próprio: em uma API de agendamento de consultas que montei como estudo, o
endpoint `GET /agendamentos` consulta o MySQL. Enquanto o banco processa a query, o
event loop já aceita e começa a tratar outras requisições. Se dez usuários pedirem a
lista ao mesmo tempo, as dez queries ficam em andamento em paralelo no banco e o Node
apenas coleta os resultados conforme chegam — sem criar dez threads.

### 2. Síncrono versus assíncrono, e por que bloquear o event loop é um erro grave

Código síncrono executa linha após linha: a próxima instrução só começa quando a
anterior termina. Código assíncrono inicia uma operação, devolve o controle
imediatamente e trata o resultado depois, via callback, Promise ou `async/await`. No
Node, a esmagadora maioria das APIs de I/O tem versão assíncrona justamente porque a
thread principal é única e compartilhada por todas as requisições.

Bloquear o event loop significa executar, na thread principal, algo que demora e não
devolve o controle. Enquanto esse trecho roda, **nenhuma** outra requisição é atendida —
a aplicação inteira congela, não só o usuário que disparou a operação. Isso vale tanto
para chamadas síncronas de I/O (`fs.readFileSync` num arquivo grande, por exemplo)
quanto para processamento pesado de CPU, como um laço sobre um milhão de itens ou o
cálculo de um hash caro.

No mesmo projeto de agendamentos, cometi esse erro ao gerar um relatório mensal: eu
percorria todos os registros e montava o PDF de forma síncrona dentro do handler HTTP.
Durante os três segundos de geração, a API não respondia nem ao `/health`. A correção foi
publicar um evento numa fila e deixar um worker separado gerar o relatório — a thread
principal voltou a apenas receber a requisição, publicar a mensagem e responder
imediatamente. Essa é a regra prática: I/O sempre assíncrono, e trabalho pesado de CPU
fora da thread principal (worker threads ou processo separado).

### 3. O que é TypeScript, e tipagem estática versus tipagem dinâmica

TypeScript é um superconjunto do JavaScript que adiciona um sistema de tipos verificado
em tempo de compilação. Todo código JavaScript válido é TypeScript válido; o que muda é
a possibilidade de anotar tipos em variáveis, parâmetros, retornos e estruturas, e ter
um compilador (`tsc`) que checa a coerência antes de o código ir para produção. O
resultado da compilação é JavaScript puro — o Node não executa TypeScript diretamente,
executa o que foi transpilado.

A diferença central em relação ao JavaScript está em *quando* o erro de tipo aparece. Na
tipagem dinâmica do JavaScript, o tipo é verificado apenas em tempo de execução: um
campo que deveria ser número mas chegou como string só quebra quando aquela linha roda —
talvez em produção, talvez num caminho pouco testado. Na tipagem estática, o erro
aparece no editor e no build, antes de qualquer deploy.

O ganho que mais senti foi na manutenção. Em uma função `criarAgendamento(paciente,
data)`, o JavaScript aceitava alegremente que eu passasse a data como string em um lugar
e como objeto `Date` em outro — e o bug só aparecia na formatação, longe da origem. Com
a assinatura `criarAgendamento(paciente: string, data: Date): Agendamento`, o compilador
apontou as três chamadas inconsistentes assim que salvei o arquivo. Some-se a isso o
autocomplete confiável no editor, que passa a conhecer a forma exata de cada objeto.

### 4. CommonJS versus ES Modules e os problemas de compatibilidade

CommonJS é o sistema de módulos histórico do Node, baseado em `require()` e
`module.exports`. Seu carregamento é síncrono e resolvido em tempo de execução, o que
permite coisas como chamar `require()` dentro de um `if`. ES Modules (ESM) é o padrão
oficial da linguagem, com `import` e `export`, resolvido estaticamente antes da execução —
o que viabiliza análise estática, *tree shaking* e `top-level await`.

O atrito nasce da convivência dos dois. Um arquivo `.mjs`, ou um projeto com `"type":
"module"` no `package.json`, é tratado como ESM; caso contrário é CommonJS, e arquivos
`.cjs` forçam esse modo. Um módulo ESM consegue importar um CommonJS, mas o inverso não
funciona diretamente: `require()` de um pacote puramente ESM lança erro, e a saída é usar
`import()` dinâmico, que é assíncrono. Some-se a isso que `__dirname` e `__filename` não
existem em ESM (precisam ser reconstruídos a partir de `import.meta.url`) e que
importações ESM exigem a extensão explícita do arquivo.

Vivi esse problema no projeto hello-node desta própria entrega: configurei o
`package.json` com `"type": "module"` e, ao tentar usar uma biblioteca antiga que só
exportava CommonJS, recebi o erro de *named export não encontrado*. A solução foi
importar o pacote como default (`import pkg from '...'`) e desestruturar em seguida.
A recomendação prática para projeto novo é adotar ESM desde o início e manter a
coerência, evitando misturar os dois estilos no mesmo pacote.

### 5. Express, Fastify e NestJS

**Express** é o framework HTTP mais consolidado do ecossistema Node. Sua proposta é
minimalista: oferece roteamento, um sistema de middlewares encadeados e pouco mais —
todo o resto (validação, autenticação, estrutura de pastas) fica a cargo do
desenvolvedor. Isso lhe dá enorme flexibilidade e uma base gigantesca de tutoriais,
middlewares e respostas prontas, mas também significa que dois projetos Express podem
ter organizações completamente diferentes. Cenário real de uso: uma API interna pequena,
com cinco ou seis endpoints, escrita por uma equipe de dois desenvolvedores que precisa
entregar rápido — o custo de aprendizado é o menor possível e qualquer pessoa contratada
já conhece o framework.

**Fastify** nasceu com foco em desempenho e em validação declarativa. Ele usa um roteador
mais eficiente e, principalmente, serializa respostas a partir de JSON Schema, o que
reduz bastante o custo de transformar objetos em JSON — o ponto que costuma dominar o
tempo de resposta de uma API. O mesmo schema que acelera a serialização também valida a
entrada e alimenta a documentação Swagger automaticamente. Cenário real de uso: um
serviço de consulta de catálogo que recebe alto volume de requisições de leitura, com
contratos de payload bem definidos, onde ganhar alguns milissegundos por requisição e
garantir validação de entrada sem código manual faz diferença direta no custo de
infraestrutura.

**NestJS** é um framework opinativo, escrito em TypeScript, que traz arquitetura pronta:
módulos, controllers, providers e injeção de dependências, em um desenho inspirado no
Angular. Ele não substitui Express ou Fastify — roda *sobre* um deles — mas impõe uma
estrutura padronizada e oferece integrações oficiais para ORM, filas, WebSockets,
GraphQL e testes. O preço é uma curva de aprendizado maior e mais cerimônia para tarefas
simples. Cenário real de uso: um sistema corporativo de médio a grande porte, com várias
equipes trabalhando em domínios diferentes do mesmo repositório, onde a padronização e a
testabilidade valem mais do que a velocidade inicial de escrita.

### 6. O que é o nvm e por que usá-lo é prática obrigatória

O nvm (*Node Version Manager*) é um gerenciador que permite instalar várias versões do
Node.js na mesma máquina e alternar entre elas por comando — `nvm install 22`, `nvm use
22`. No Windows, o equivalente mais usado é o nvm-windows. Cada versão fica isolada, com
seus próprios pacotes globais, e a troca é imediata.

A obrigatoriedade vem de um problema concreto do dia a dia: projetos diferentes exigem
versões diferentes do Node. Um sistema legado que só roda no Node 18 e um projeto novo
que usa recursos do Node 22 não convivem se houver uma única instalação global. Sem
gerenciador, a alternativa é desinstalar e reinstalar o Node a cada troca de contexto —
inviável. Além disso, o arquivo `.nvmrc` na raiz do repositório registra a versão
esperada do projeto, e um `nvm use` no clone já coloca toda a equipe na mesma versão,
eliminando a classe de bugs do "na minha máquina funciona".

Há ainda um ganho de permissões: instalando o Node pelo nvm, os binários ficam no
diretório do usuário, e não é preciso `sudo` para instalar pacotes globais — o que evita
problemas de propriedade de arquivos que atrapalham bastante em Linux e macOS.

### 7. Container Docker versus máquina virtual

Uma máquina virtual emula um computador inteiro. O hipervisor aloca CPU, memória e disco
virtuais, e sobre esse hardware simulado roda um sistema operacional completo, com seu
próprio kernel. O isolamento é forte, porque a fronteira está no nível do hardware
virtualizado, mas o custo é alto: cada VM carrega um sistema operacional inteiro,
ocupando gigabytes de disco e centenas de megabytes de memória, e leva de dezenas de
segundos a minutos para iniciar.

Um container não virtualiza hardware. Ele é um processo (ou conjunto de processos)
rodando diretamente sobre o kernel do host, isolado por recursos do próprio kernel Linux —
*namespaces*, que separam a visão de processos, rede e sistema de arquivos, e *cgroups*,
que limitam CPU e memória. Como não há sistema operacional convidado, a imagem contém
apenas a aplicação e suas dependências: uma imagem Node Alpine fica na casa das dezenas
de megabytes e um container sobe em menos de um segundo. Em contrapartida, o isolamento
é mais fraco, e todos os containers do host compartilham o mesmo kernel — por isso não é
possível rodar nativamente um container Windows sobre um kernel Linux, e vice-versa. É
justamente por isso que o Docker Desktop no Windows e no macOS mantém uma VM Linux leve
por baixo.

Na prática, a escolha depende do objetivo. Para empacotar e distribuir uma aplicação —
que é o caso deste módulo — o container é imbatível: leve, rápido, reproduzível e
descrito por um Dockerfile versionado junto ao código. Para rodar um sistema operacional
diferente do host, ou para isolar cargas de tenants distintos com requisito forte de
segurança, a máquina virtual continua sendo a resposta correta. Os dois modelos, aliás,
costumam ser combinados: containers rodando dentro de VMs em provedores de nuvem.

---

## Referências

DOCKER INC. **Docker overview**. Docker Docs, 2026. Disponível em:
https://docs.docker.com/get-started/docker-overview/. Acesso em: 28 ago. 2026.

MICROSOFT. **TypeScript Handbook**. TypeScript Documentation, 2026. Disponível em:
https://www.typescriptlang.org/docs/handbook/intro.html. Acesso em: 28 ago. 2026.

NODE.JS FOUNDATION. **The Node.js Event Loop**. Node.js Docs, 2026. Disponível em:
https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick. Acesso em:
28 ago. 2026.

NODE.JS FOUNDATION. **Modules: ECMAScript modules**. Node.js Docs, 2026. Disponível em:
https://nodejs.org/api/esm.html. Acesso em: 28 ago. 2026.

SCHLUETER, Isaac Z. et al. **nvm — Node Version Manager**. GitHub, 2026. Disponível em:
https://github.com/nvm-sh/nvm. Acesso em: 28 ago. 2026.

UCHÔA, Carlos; SESTITO, William. **Docker e Docker Compose para ambientes profissionais
de desenvolvimento**. Material didático, ago. 2026.
