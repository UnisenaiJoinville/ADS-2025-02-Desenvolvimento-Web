# node-profissional

Entrega das atividades de fixação do Módulo 1 (JavaScript moderno e Node.js):

- **26.1 — Diagnóstico de código**: análise do código ruim fornecido em
  `../atividade-26-1-diagnostico-codigo.md`.
- **26.2 — Refatoração**: este projeto, mantendo o comportamento esperado do cadastro de
  serviços (catálogo em memória).
- **26.3 — Desafio**: `scheduleAppointment`, em `src/modules/appointments`, que impede duração
  inválida e conflito de horário do mesmo profissional.

O diagnóstico completo (problemas encontrados, justificativas, trechos antes/depois e as respostas
da discussão do desafio 26.3) está em [`docs/diagnostico-refatoracao.md`](docs/diagnostico-refatoracao.md).

## Estrutura

```
src/
├── app.js
└── modules/
    ├── services/
    │   ├── service-validator.js
    │   ├── service-repository.js
    │   └── service-service.js
    └── appointments/
        ├── appointment-validator.js
        ├── appointment-repository.js
        └── appointment-service.js
```

## Como executar

Projeto sem dependências externas — apenas Node.js (ver `.nvmrc` do projeto `hello-node` do Módulo
0 para a versão recomendada, LTS).

```
npm start        # roda src/app.js uma vez
npm run dev      # roda com --watch, reiniciando a cada alteração
```
