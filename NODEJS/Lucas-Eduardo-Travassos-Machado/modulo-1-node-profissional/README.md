# Módulo 1 - Fundamentos de Backend com Node.js

Projeto construído durante o Módulo 1 da disciplina, seguindo o material guiado das seções 22 e 23. Ainda não existe HTTP nem banco de dados, o foco aqui é entender responsabilidade de cada camada antes de expandir a arquitetura.

## Estrutura

src/
├── app.js
└── modules/
└── services/
├── service-repository.js
├── service-service.js
└── service-validator.js


O `app.js` só conhece o caso de uso (`service-service.js`). O caso de uso conhece a validação e o repositório. O repositório é quem decide como os dados são guardados hoje, um array em memória. Quando o banco entrar no projeto, a ideia é trocar só o repositório, sem mexer na regra de negócio.

## Decisões tomadas

O nome do serviço é normalizado antes de qualquer validação (trim e remoção de espaços duplicados), porque a regra de unicidade compara nomes ignorando maiúsculas e minúsculas, então dois espaços a mais não podiam furar essa regra.

O `findAll` do repositório devolve cópias dos objetos, nunca o array original. Isso evita que alguém altere um serviço por fora sem passar pelas funções que validam a mudança.

## Como rodar

```bash
npm run dev
```

## Regras implementadas

Cadastro com nome, duração e preço validados, bloqueio de nome duplicado, listagem geral e só de ativos, desativação e cálculo do preço médio dos ativos.

## Desafio profissional

Implementei busca textual por parte do nome e ordenação por preço. A ordenação sempre trabalha em cima de uma cópia da lista, então o array original nunca perde a ordem de criação, o que dá pra conferir no log do `app.js`.

## Pendências

As atividades 26.1 (diagnóstico de código) e 26.2 (refatoração) dependem de um arquivo que o professor ainda vai disponibilizar, o sistema da disciplina está em manutenção no momento.