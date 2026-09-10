# Atividade 26.1 e 26.2 — Diagnóstico de código e Refatoração

O material pede um arquivo "propositalmente ruim" fornecido pelo professor. Como ele não veio anexado, criei um exemplo representativo (bem comum em projetos reais) cobrindo os mesmos temas do módulo, diagnostiquei os problemas e refatorei mantendo o comportamento.

## Código original (ruim)

```js

var services = [];

function f(n, d, p) {
  if (n == "" || n == null) {
    console.log("erro");
  } else {
    if (d <= 0) {
      console.log("erro 2");
    } else {
      var x = { id: services.length + 1, name: n, durationMinutes: d, price: p, active: true };
      for (var i = 0; i < services.length; i++) {
        if (services[i].name == n) {
          console.log("já existe");
          return;
        }
      }
      services.push(x);
      console.log("criado");
    }
  }
}

function calc(a, b) {
  var x = a * b;
  return x;
}

f("Consulta", 45, 150);
f("Consulta", 45, 150);
f("", 45, 150);

try {
  var data = JSON.parse(services);
} catch (e) {}

console.log(services);
```

## 26.1 — Diagnóstico: 10+ problemas identificados

| # | Problema | Categoria |
|---|---|---|
| 1 | `var` usado em todo o arquivo em vez de `const`/`let` | Variáveis/escopo |
| 2 | `f`, `n`, `d`, `p`, `x`, `a`, `b` — nomes que não revelam intenção | Nomenclatura |
| 3 | `n == ""` e `n == null` usam `==` (coerção) em vez de `===` | Comparação |
| 4 | Falha de validação apenas faz `console.log("erro")` e continua a execução em vez de lançar um erro (`throw`) | Tratamento de erro / fail fast |
| 5 | `if/else` aninhado três níveis em vez de early return | Controle de fluxo |
| 6 | Toda a lógica (validação, verificação de duplicidade, criação) misturada em uma única função `f` | Organização/responsabilidade única |
| 7 | Nada está separado em módulos — tudo em `app.js` | Organização (anti-padrão "tudo em app.js") |
| 8 | `services` é uma variável global mutável, acessível e alterável de qualquer lugar | Estado global mutável |
| 9 | Loop manual com `for` para checar duplicidade em vez de `Array.prototype.some` | Estilo moderno/legibilidade |
| 10 | `catch (e) {}` — captura o erro e não faz absolutamente nada com ele (esconde falha) | Tratamento de erro ("catch vazio") |
| 11 | `JSON.parse(services)` tentando fazer parse de um **array de objetos JS**, não de uma string — erro de uso da API | Uso incorreto de API |
| 12 | Função `calc` tem nome e parâmetros genéricos (`a`, `b`, `x`) sem revelar o que calcula | Nomenclatura |
| 13 | Nenhuma validação de `price` (aceita negativo, string, `undefined`) | Validação incompleta |
| 14 | `id: services.length + 1` gera IDs pouco confiáveis (quebra se algo for removido) | Design de dados |

## 26.2 — Código refatorado

Estrutura de pastas final:
```
src/
├── app.js
└── modules/
    └── services/
        ├── service-validator.js
        ├── service-repository.js
        └── service-service.js
```

```js

export function validateServiceInput(input) {
  const name = input?.name?.trim();
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (!name) {
    throw new Error("Nome é obrigatório");
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("durationMinutes deve ser um inteiro positivo");
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("price não pode ser negativo");
  }

  return { name, durationMinutes, price };
}
```
*Justificativa: extrai a validação sintática para um módulo próprio, com nomes claros e `throw` real em vez de `console.log`, permitindo que quem chamar decida como reagir ao erro (fail fast).*

```js

import { randomUUID } from "node:crypto";

const services = [];

export function save(service) {
  const record = { id: randomUUID(), ...service };
  services.push(record);
  return { ...record };
}

export function findByName(name) {
  return services.find((service) => service.name.toLowerCase() === name.toLowerCase());
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}
```
*Justificativa: encapsula o array `services` (deixa de ser global e acessível de qualquer lugar), usa `randomUUID` em vez de `length + 1` para IDs confiáveis, e usa `Array.prototype.find` em vez de loop manual com `var i`.*

```js

import { validateServiceInput } from "./service-validator.js";
import { findByName, save } from "./service-repository.js";

export function createService(input) {
  const data = validateServiceInput(input); 
  if (findByName(data.name)) {
    throw new Error(`Já existe um serviço chamado "${data.name}"`);
  }
  return save({ ...data, active: true, createdAt: new Date().toISOString() });
}

export function calculateServiceTotal(unitPrice, quantity) {
  return unitPrice * quantity; 
}
```
*Justificativa: cada função tem uma única responsabilidade (validar OU checar duplicidade OU salvar, orquestrado aqui). `calc` virou `calculateServiceTotal`, com parâmetros nomeados.*

```js

import { createService } from "./modules/services/service-service.js";

try {
  createService({ name: "Consulta", durationMinutes: 45, price: 150 });
  console.log("Criado com sucesso");
} catch (error) {
  console.error("Falha ao criar serviço:", error.message);
}

try {
  createService({ name: "Consulta", durationMinutes: 45, price: 150 }); // duplicado de propósito
} catch (error) {
  console.error("Falha ao criar serviço:", error.message); // captura tratada, não um catch vazio
}

try {
  createService({ name: "", durationMinutes: 45, price: 150 }); // nome vazio de propósito
} catch (error) {
  console.error("Falha ao criar serviço:", error.message);
}
```
*Justificativa: `app.js` fica só com a orquestração de alto nível; cada `catch` agora efetivamente trata o erro (loga uma mensagem útil) em vez de silenciá-lo.*

**Comportamento mantido**: o programa continua criando serviços, rejeitando nome vazio e rejeitando duplicidade — só que agora de forma explícita, testável e sem estado global solto.
