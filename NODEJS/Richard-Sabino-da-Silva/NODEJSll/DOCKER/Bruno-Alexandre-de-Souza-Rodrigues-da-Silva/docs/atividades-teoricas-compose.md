# Atividades Teóricas — Docker e Docker Compose (seção 10.1)

**Aluno:** Bruno Silva
**Curso:** ADS — UniSENAI

---

## 1. Diferença entre imagem e container

A analogia que funciona bem é a de classe e objeto na programação orientada a
objetos. A **imagem** é a classe: um modelo imutável, escrito uma vez, que
descreve o que a coisa é. O **container** é o objeto: uma instância viva daquele
modelo, com estado próprio, que pode ser criada e destruída sem afetar o molde.

Assim como eu posso instanciar dez objetos da mesma classe, posso subir dez
containers da mesma imagem. Cada um tem seu próprio sistema de arquivos de
escrita, suas variáveis de ambiente e seu ciclo de vida.

**Exemplo com Node.js do meu projeto:** no `hello-node` eu escrevi um
`Dockerfile` que parte de `node:24-alpine`, copia o projeto e instala as
dependências. Quando rodo `docker build -t hello-node .`, o resultado é uma
imagem — um arquivo parado, que não faz nada sozinho. Quando rodo
`docker run --rm hello-node`, o Docker cria um container a partir dela, executa
o `npx tsx src/index.ts`, imprime a saída e encerra. A imagem continua lá,
intacta, pronta para gerar outro container. Foi isso que fiz no Passo 3 do
roteiro guiado, quando subi dois containers da mesma imagem nas portas 3000 e
4000 ao mesmo tempo: uma imagem, dois processos isolados.

## 2. Por que containers não substituem segurança, versionamento e observabilidade

Container resolve um problema específico — empacotamento e reprodutibilidade do
ambiente. Ele não resolve os outros, e confundir isso é perigoso.

Em **segurança**, o isolamento do container é mais fraco do que parece. Ele
compartilha o kernel da máquina hospedeira, então uma vulnerabilidade de kernel
atinge todos os containers. Além disso, um container rodando como root com uma
senha escrita direto no `docker-compose.yml` continua sendo um problema de
segurança, mesmo isolado. Foi por isso que separei as credenciais em `.env` e
versionei apenas o `.env.example`.

Em **versionamento**, o container congela o ambiente, não o histórico. Se eu
subo uma imagem com a tag `latest`, não sei o que mudou entre uma build e outra,
nem consigo voltar atrás. Por isso fixei `mysql:8.4` e `redis:7.4-alpine` nos
meus cenários em vez de usar `latest`.

Em **observabilidade**, o container facilita coletar logs com `docker compose
logs`, mas não gera métrica nem rastreamento sozinho. Se a minha API do Cenário
1 começar a responder devagar, o Docker me diz que o container está de pé — não
me diz qual consulta está lenta. Isso continua exigindo log estruturado e
métricas na aplicação.

## 3. Volume nomeado e bind mount

O **volume nomeado** é uma área de armazenamento gerenciada pelo Docker. Eu não
sei nem preciso saber onde ela fica no disco; eu a referencio pelo nome. O
**bind mount** aponta uma pasta específica da minha máquina para dentro do
container — eu controlo o caminho exato.

O volume nomeado é o certo para **dado que precisa persistir e pertence ao
serviço**. É o caso do banco: no Cenário 1 usei `mysql_data:/var/lib/mysql`.
Como o Docker gerencia, funciona igual no Windows, Linux e macOS, sem problema
de permissão de arquivo — que é justamente a dor que o material cita no Linux.

O bind mount é o certo para **código em desenvolvimento**, quando quero editar
no meu editor e ver a mudança refletida no container sem rebuild. Por isso o
frontend do Cenário 1 usa `./frontend:/app`: eu salvo o arquivo e o hot reload
funciona na hora.

Um detalhe que aprendi montando os cenários: quando uso bind mount no código
Node, preciso de um volume nomeado por cima do `node_modules`
(`frontend_node_modules:/app/node_modules`). Sem isso, a pasta da minha máquina
sobrescreve a que foi instalada dentro do container, e as dependências somem ou
quebram por diferença de sistema operacional.

## 4. Por que localhost dentro do container não é o host

Cada container tem sua própria interface de rede isolada. Quando a aplicação
dentro do container chama `localhost`, ela está chamando **o próprio container**
— não a máquina onde o Docker está rodando, e muito menos um container vizinho.

É o erro mais comum de quem começa. Se a minha API tenta se conectar em
`localhost:3306` procurando o MySQL, ela vai procurar um MySQL dentro dela
mesma, não encontrar nada, e falhar com "connection refused". O banco está de
pé, mas em outro container, com outra interface de rede.

A solução é usar o **nome do serviço**. O Compose cria uma rede interna e um DNS
próprio, onde cada serviço é resolvido pelo nome declarado no arquivo. Por isso
a minha API usa `DB_HOST: mysql` e `REDIS_HOST: redis`. Isso também resolve o
problema do IP, que muda a cada `docker run` e por isso nunca deve ser fixado.

## 5. Redis como cache e RabbitMQ como broker

Os dois guardam dados temporariamente, mas com propósitos opostos.

O **Redis** é um banco em memória usado para **leitura rápida e repetida**. Eu
guardo um valor e leio quantas vezes quiser; ele fica lá até expirar. O padrão é
sempre o mesmo: consulto o cache, se não tiver eu busco no banco e guardo no
cache para a próxima vez. O objetivo é evitar trabalho repetido.

O **RabbitMQ** é um broker de mensagens usado para **entregar trabalho a outro
processo**. A mensagem é publicada, consumida uma vez pelo worker e sai da fila.
O objetivo não é velocidade de leitura, é desacoplamento: a API responde ao
usuário na hora e o trabalho pesado acontece depois, em outro container.

| | Redis | RabbitMQ |
|---|---|---|
| Modelo | chave e valor | fila de mensagens |
| Leitura | várias vezes | uma vez, e a mensagem sai |
| Serve para | evitar trabalho repetido | adiar trabalho demorado |
| Exemplo no projeto | guardar a sessão de login | disparar o e-mail de confirmação |

**Exemplo real do Cenário 1:** quando um agendamento é criado, a API grava no
MySQL e responde ao usuário imediatamente. O e-mail de confirmação não é enviado
ali — seria lento e travaria a resposta. A API publica um evento no RabbitMQ e o
worker envia o e-mail depois. Já a lista de horários disponíveis, que todo mundo
consulta o tempo todo e muda pouco, fica no Redis para não bater no banco a cada
acesso.

## 6. Por que o latest é perigoso

A tag `latest` não significa "a versão mais recente e estável". Ela significa
apenas "a última imagem que foi publicada com essa tag" — e isso muda sem aviso.

O perigo é a quebra silenciosa. Eu subo o projeto hoje com `mysql:latest` e
funciona. Daqui a três meses, um colega clona o repositório, roda o mesmo
comando, e recebe uma versão maior do MySQL, com mudanças incompatíveis. O
arquivo é idêntico, o resultado é diferente, e ninguém alterou nada. Isso destrói
justamente a reprodutibilidade que é o motivo de usar Docker.

Pior: o erro aparece longe da causa. Ninguém vai suspeitar da tag, porque não
houve commit nenhum. Por isso fixei versão em todas as imagens dos meus
cenários: `mysql:8.4`, `redis:7.4-alpine`, `postgres:17-alpine`,
`rabbitmq:4-management`, `nginx:1.27-alpine`.

## 7. Como o Compose melhora o onboarding

Sem Compose, receber um projeto novo significa ler um documento de instalação e
executar uma sequência de passos manuais: instalar o banco na versão certa,
criar a base, configurar a senha, instalar o Redis, subir a fila, ajustar as
portas que estão em conflito com outra coisa na máquina. Isso leva de horas a
dias e quase sempre dá errado em algum ponto, porque o documento está
desatualizado.

Com Compose, tudo isso vira dois comandos: `cp .env.example .env` e
`docker compose up -d --build`. O ambiente inteiro sobe igual para todo mundo.

O ganho maior nem é o tempo, é a informação deixar de ser oral. O
`docker-compose.yml` responde por escrito quais serviços existem, quais portas
são usadas, quais variáveis são necessárias e o que precisa persistir. É por
isso que o material chama o arquivo de **contrato técnico** e recomenda revisá-lo
em pull request com o mesmo cuidado do código. O documento de instalação
desatualiza; o compose não, porque se ele estiver errado o ambiente não sobe.

## 8. Três riscos de versionar o .env com credenciais reais

**1. A credencial fica no histórico do Git para sempre.** Apagar o arquivo em um
commit posterior não resolve: o valor continua acessível em qualquer commit
anterior. A correção verdadeira é reescrever o histórico e trocar a senha —
muito mais trabalhoso do que nunca ter commitado.

**2. Quem tem acesso ao repositório passa a ter acesso ao sistema.** Isso inclui
gente além do time: ex-integrantes que ainda têm o clone na máquina, ferramentas
de CI, integrações e, se o repositório for público, qualquer pessoa. Existem
robôs que varrem o GitHub procurando exatamente esse tipo de arquivo, e o tempo
entre publicar e ser encontrado é medido em minutos.

**3. Some a separação entre ambientes.** Se a senha de produção está no `.env`
versionado, qualquer pessoa rodando o projeto localmente aponta para produção
sem perceber. Um `docker compose down -v` executado por engano deixa de apagar o
banco local e passa a apagar o banco real.

Por isso versionei apenas o `.env.example`, com os nomes das variáveis e valores
falsos, e coloquei `.env` no `.gitignore` antes do primeiro commit.
