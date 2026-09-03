# Planejamento das Atividades — Docker, Docker Compose e Node.js

**Aluno:** Bruno Silva
**Curso:** ADS — UniSENAI
**Repositório:** https://github.com/BrunoLart/docker-node-atividades

---

## O que precisa ser entregue

Li os cinco materiais da disciplina e separei tudo que pede uma ação minha.
São **duas entregas do Módulo 0** e **três blocos de atividades** do material de
Docker Compose, mais o laboratório de 30 exercícios.

| # | Origem | O que é | Como entrego |
|---|---|---|---|
| A | Módulo 0 — 17.1 | Texto teórico com 7 perguntas | `docs/atividade-teorica-modulo-0.md` |
| B | Módulo 0 — 17.2 | Projeto hello-node no GitHub | pasta `hello-node/` |
| C | Compose — 6.3 | 4 atividades do Cenário 1 | pasta `cenario-1/` + `docs/` |
| D | Compose — 7.4 | 4 atividades do Cenário 2 | pasta `cenario-2/` + `docs/` |
| E | Compose — 8 | Projeto final em equipe (Cenário 3) | pasta `cenario-3/` |
| F | Compose — 10.1 | 8 questões teóricas | `docs/atividades-teoricas.md` |
| G | Compose — 10.2 | 8 práticas P1–P8 | `evidencias/` |
| H | step-by-step | 30 exercícios de laboratório | pasta `lab-docker/` |

O PDF de SSH não tem entrega. É pré-requisito: preciso da chave SSH funcionando
antes de conectar o projeto no GitHub.

---

## Ordem que vou seguir

Escolhi essa ordem porque cada etapa usa o que a anterior deixou pronto.
Não adianta montar o Cenário 1 sem ter entendido o Dockerfile básico primeiro.

### Etapa 1 — Ambiente (meio período)

Antes de tudo, conferir se está tudo instalado.

```bash
node -v
npm -v
docker --version
docker compose version
git --version
```

Depois gerar a chave SSH seguindo o PDF do GitBash e testar com
`ssh -T git@github.com`.

**Pronto quando:** os cinco comandos rodam e o SSH responde com o meu usuário.

---

### Etapa 2 — Atividade teórica do Módulo 0 (entrega A)

Escrever o documento de 2 a 4 páginas respondendo as 7 perguntas:
event loop, síncrono vs assíncrono, TypeScript, CommonJS vs ES Modules,
comparar Express/Fastify/NestJS, nvm e container vs máquina virtual.

Regras que o material exige e que não posso esquecer:
- texto corrido, com minhas palavras
- exemplo próprio, não copiado da documentação
- fontes citadas em ABNT

**Pronto quando:** o arquivo tem entre 2 e 4 páginas e todas as 7 respostas.

---

### Etapa 3 — Projeto hello-node (entrega B)

O material pede 6 coisas. Vou fazer nesta ordem porque uma depende da outra:

1. Criar o projeto e conectar no GitHub via SSH
2. Ligar `"strict": true` no `tsconfig.json` e corrigir os erros que aparecerem
3. Instalar ESLint e Prettier como devDependencies e criar o `.editorconfig`
4. Adicionar a biblioteca `zod` e usar numa função dentro de `src/index.ts`
5. Escrever o README com no mínimo 3 parágrafos
6. Publicar com pelo menos 3 commits separados

O item 6 é importante: **um commit só não é aceito**. Por isso vou commitar a
cada etapa concluída, não tudo no final.

**Pronto quando:** `npx tsx src/index.ts` roda sem erro, o lint não acusa nada
e o histórico mostra a evolução do trabalho.

---

### Etapa 4 — Laboratório dos 30 exercícios (entrega H)

São os exercícios do `step-by-step-docker.md`. Vou fazer em blocos e anotar a
saída de cada um num arquivo.

| Bloco | Exercícios | Assunto |
|---|---|---|
| 1 | 1 a 5 | instalar, hello-world, listar e remover containers |
| 2 | 6 a 9 | Dockerfile, build, rodar em background, expor porta |
| 3 | 10 a 14 | volumes, inspect, exec, rede entre containers |
| 4 | 15 a 16 | primeiro Docker Compose |
| 5 | 17 a 20 | atualizar imagem, tag, push e pull no Docker Hub |
| 6 | 21 a 25 | variáveis, limite de recursos, multi-stage, stats |
| 7 | 26 a 30 | secrets, backup e restore de volume, proxy, limpeza |

Alguns exercícios pedem para **explicar** o resultado, não só executar
(os de número 2, 3, 7, 11, 22 e 24). Vou escrever a explicação junto da saída.

O exercício 19 (push no Docker Hub) precisa de conta. Se não der para publicar,
registro o motivo em vez de pular sem explicação.

**Pronto quando:** os 30 têm saída registrada e os 6 acima têm explicação escrita.

---

### Etapa 5 — Cenário 1 (entrega C)

Montar a pilha Vue + Node + MySQL + Redis + RabbitMQ.

Vou seguir o roteiro do `docker-passo-a-passo-projeto-guiado.md`, que constrói
peça por peça, em vez de copiar o compose pronto. É mais trabalhoso mas eu
entendo o que cada serviço faz.

Depois de subir, fazer as 4 atividades da seção 6.3:

- **Teórica:** por que a api chama `mysql` e não `localhost` (com diagrama)
- **Prática:** subir a pilha, listar containers, abrir logs da api e do rabbitmq
- **Prática:** `docker compose down`, subir de novo e provar que o MySQL manteve os dados
- **Análise:** tabela comparando Redis e RabbitMQ com exemplo real

**Pronto quando:** `docker compose ps` mostra tudo `healthy` e as 4 atividades
estão respondidas com evidência.

---

### Etapa 6 — Cenário 2 (entrega D)

Montar React + PostgreSQL + Nginx + Redis + RabbitMQ.

A diferença para o Cenário 1 é o **proxy reverso Nginx** na frente e o uso de
`profiles` para o PgAdmin só subir quando eu pedir.

As 4 atividades da seção 7.4:

- **Teórica:** diferença entre `ports` e `expose`
- **Prática:** subir e acessar `http://localhost:8080`
- **Prática:** `docker compose --profile tools up -d` e abrir o PgAdmin na 5050
- **Análise:** por que o Postgres não precisa publicar porta para o host

**Pronto quando:** o site abre pelo proxy na 8080 e o PgAdmin só sobe com a flag.

---

### Etapa 7 — Práticas P1 a P8 (entrega G)

Essas eu faço em cima dos cenários já montados, então vêm depois deles.

| Nº | O que fazer | Critério de aceite |
|---|---|---|
| P1 | Criar `.env.example` do Cenário 1 | sem senha real, nomes batendo com o compose |
| P2 | Rodar `docker compose config` | valida sem erro de sintaxe |
| P3 | Subir Cenário 1 e coletar logs | logs de api, mysql e rabbitmq |
| P4 | Entrar no container da api | `docker compose exec api sh` |
| P5 | Perder o container sem perder o volume | dados continuam depois de recriar |
| P6 | Ativar o profile tools no Cenário 2 | PgAdmin só sobe quando peço |
| P7 | Adicionar healthcheck num serviço | `docker compose ps` mostra `healthy` |
| P8 | Documentar troubleshooting | README com no mínimo 3 erros e soluções |

**Pronto quando:** as 8 têm evidência salva na pasta `evidencias/`.

---

### Etapa 8 — Questões teóricas do Compose (entrega F)

As 8 questões da seção 10.1. Deixei para esta altura de propósito: depois de
montar os dois cenários eu consigo responder usando exemplos do meu próprio
projeto, em vez de teoria decorada.

1. Imagem vs container (analogia + exemplo com Node.js)
2. Por que container não substitui segurança, versionamento e observabilidade
3. Volume nomeado vs bind mount
4. Por que `localhost` no container não é o host
5. Redis como cache vs RabbitMQ como broker
6. Por que `latest` é perigoso
7. Como o Compose melhora o onboarding
8. Três riscos de versionar `.env` com credencial real

---

### Etapa 9 — Cenário 3, o projeto final (entrega E)

Este é o que vale nota cheia e é **em equipe**. Aqui não recebo compose pronto,
tenho que decidir a arquitetura.

Requisitos que são obrigatórios:

- frontend containerizado e acessível pelo navegador
- backend containerizado com endpoint `/health`
- banco com volume nomeado e variáveis no `.env`
- Redis na rede interna, chamado pelo nome do serviço
- mensageria com healthcheck
- worker em container separado
- README com instruções para Windows 11 sem WSL, Linux e macOS
- evidências de logs, healthcheck e comunicação entre serviços

E responder as 5 questões norteadoras da seção 8.2 antes de começar a montar,
porque elas decidem o desenho:

- o que o host acessa e o que fica só na rede interna
- quais dados sobrevivem ao `docker compose down`
- o que pode ir no `.env.example` e o que é segredo
- como eu provo que o backend fala com banco, Redis e fila
- como um colega em outro sistema operacional executa isso

**Peso de cada item na nota:**

| Item | Peso |
|---|---|
| docker-compose.yml | 30% |
| Dockerfiles | 15% |
| .env.example | 10% |
| README.md | 20% |
| Demonstração | 15% |
| Análise crítica | 10% |

Reparei que **README e compose juntos valem 50%**. Então não dá para deixar a
documentação para a última hora, que é o erro clássico.

---

### Etapa 10 — Conferência final

Passar o checklist do Apêndice A do material antes de entregar:

- [ ] `docker compose up -d` roda sem erro
- [ ] todos os serviços com nome claro
- [ ] banco com volume nomeado
- [ ] nenhuma variável sensível no repositório
- [ ] README explica execução nos três sistemas operacionais
- [ ] tem diagrama ou descrição da arquitetura
- [ ] tem evidência de logs, containers healthy e portas
- [ ] tem seção sobre limitações e diferenças para produção

---

## Como o repositório está organizado

```
docker-node-atividades/
├── PLANEJAMENTO.md          este arquivo
├── README.md                explicação geral do repositório
├── docs/                    textos teóricos
├── hello-node/              entrega B (Módulo 0)
├── lab-docker/              entrega H (30 exercícios)
├── cenario-1/               entrega C
├── cenario-2/               entrega D
├── cenario-3/               entrega E (projeto final)
└── evidencias/              saídas de comando das práticas
```

---

## Cuidados que anotei para não errar

Coisas que os materiais avisam e que são fáceis de esquecer:

- **Nunca commitar o `.env` real.** Só o `.env.example`. É critério de segurança
  na rubrica e vale nota.
- **Não usar `latest` em imagem.** Fixar versão (`mysql:8.4`, não `mysql:latest`).
- **Commit único não é aceito** na atividade prática do Módulo 0. Mínimo 3.
- **`docker compose down -v` apaga os dados.** Usar só quando eu quiser mesmo
  resetar o banco.
- **Antes de "apagar tudo" quando der erro:** coletar `ps`, `logs` e `inspect`.
  O material chama isso de regra profissional e é justamente o que o Passo 8 do
  roteiro guiado cobra.
- **`localhost` dentro do container não é o host.** Chamar os serviços pelo nome.
- No Windows 11 sem WSL, o Docker Desktop precisa de **Hyper-V** habilitado e
  edição Pro/Education/Enterprise.
