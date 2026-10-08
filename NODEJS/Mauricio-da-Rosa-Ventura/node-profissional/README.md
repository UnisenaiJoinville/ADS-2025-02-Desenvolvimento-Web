# node-profissional

Projeto prático da Atividade 26 do Módulo 1 (Fundamentos de Backend, JavaScript Moderno e Node.js), da disciplina de Desenvolvimento Web do curso de ADS na Unisenai. Continua o repositório iniciado no Módulo 0 (`hello-node`), agora em JavaScript moderno (ES Modules) puro, sem TypeScript e sem framework HTTP — o foco deste módulo é linguagem, responsabilidade e organização, não comunicação em rede.

O projeto cobre três entregas em sequência:

1. **26.1 — Diagnóstico de código**: análise do código propositalmente ruim fornecido pelo professor (documentada em PDF separado, não neste código).
2. **26.2 — Refatoração**: este projeto é o resultado da refatoração, mantendo o comportamento de domínio esperado (cadastrar, buscar, listar, desativar e calcular a média de serviços), mas corrigindo os problemas apontados no diagnóstico.
3. **26.3 — Desafio**: `scheduleAppointment`, um agendamento em memória que impede duração inválida e conflito de horário para o mesmo profissional.

## Por que a estrutura é assim

O código original concentrava validação, regra de negócio, persistência e log em um único arquivo (`app.js`), usando `var`, comparação `==`, nomes sem significado (`x`, `a`, `b`, `c`, `fazer`) e uma flag string (`"sim"`/`"nao"`) em vez de boolean. A refatoração separa cada responsabilidade em seu próprio módulo, seguindo a estrutura sugerida pelo material do Módulo 1:

```
src/
├── app.js                              # entrada: só conhece os casos de uso
└── modules/
    ├── services/
    │   ├── service-validator.js        # valida e normaliza a entrada (fronteira)
    │   ├── service-repository.js       # única parte que conhece a persistência
    │   └── service-service.js          # caso de uso: orquestra validação + regra + repositório
    ├── appointments/
    │   ├── appointment-validator.js    # valida a entrada de um agendamento
    │   ├── appointment-repository.js   # persistência dos agendamentos
    │   └── appointment-service.js      # regra de conflito de horário (desafio 26.3)
    └── shared/
        └── errors/
            └── application-error.js    # ValidationError / ConflictError / NotFoundError
```

`app.js` conhece apenas `createService`, `scheduleAppointment` e as demais funções exportadas pelos serviços de aplicação — ele não sabe como a validação é feita nem como os dados são guardados. Isso significa que, quando o PostgreSQL for introduzido em um módulo futuro, só os arquivos `*-repository.js` devem mudar.

Decisões específicas de refatoração, com trecho antes/depois e justificativa, estão no documento de diagnóstico (PDF) entregue junto com esta atividade.

## Como rodar localmente

Pré-requisito: Node.js na versão indicada em `.nvmrc` (`nvm use`, caso use nvm/nvm-windows).

```bash
npm install
npm run dev      # roda src/app.js com --watch (reinicia a cada alteração)
```

Outros scripts disponíveis:

```bash
npm start        # roda src/app.js uma vez
npm run lint     # ESLint (eqeqeq, no-var e prefer-const como erro)
npm run format   # aplica formatação do Prettier em todo o projeto
```

## Saída esperada (resumo)

```
$ npm start
Serviço cadastrado: Consulta (id: ec151bbf-6dc2-4b6c-b278-d0586dfbf4e2)
Não cadastrado (consulta): Já existe um serviço cadastrado com o nome "consulta".
Não cadastrado (): O nome do serviço é obrigatório.
Não cadastrado (Avaliação): A duração do serviço deve ser um número inteiro maior que zero.
Consulta encontrado.
[
  {
    id: 'ec151bbf-6dc2-4b6c-b278-d0586dfbf4e2',
    name: 'Consulta',
    durationMinutes: 45,
    price: 150,
    active: false,
    createdAt: '2026-09-08T17:33:25.918Z'
  }
]
Média dos serviços ativos: 0.00
Porta configurada: 3000
dados carregados
Agendamento criado: profissional prof-1, serviço service-1, início 2026-09-10T17:00:00.000Z
Agendamento recusado: O profissional "prof-1" já possui um agendamento nesse horário.
Agendamento criado: profissional prof-2, serviço service-1, início 2026-09-10T17:00:00.000Z
Agendamento recusado: durationMinutes deve ser um número inteiro maior que zero.
```

> Os `id` e `createdAt` mudam a cada execução (UUID e timestamp atual); o restante da saída é determinístico.
