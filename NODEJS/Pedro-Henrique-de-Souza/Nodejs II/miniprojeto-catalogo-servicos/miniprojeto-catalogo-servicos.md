# Miniprojeto Guiado — Catálogo de Serviços (Seção 23 / Atividades 26.1–26.3)

Este arquivo reúne a implementação completa dos requisitos da seção 23.1, o exercício de fixação da seção 23 (mínimo de 8 serviços cadastrados e 3 erros provocados) e o desafio profissional (busca textual + ordenação por preço sem mutar o array original).

## Estrutura de pastas

```text
src/
├── app.js
└── modules/
    └── services/
        ├── service-validator.js
        ├── service-repository.js
        └── service-service.js
```

**Como executar:**
1. Crie a estrutura de pastas acima
2. Copie cada arquivo abaixo para seu respectivo caminho
3. Crie um `package.json` com `"type": "module"` na raiz (`npm init -y` + adicionar a linha)
4. Rode `node src/app.js`

---

## `src/modules/services/service-validator.js`
```javascript
const MIN_SERVICE_DURATION_MINUTES = 1;

export function validateServiceInput(input) {
  const name = input?.name?.trim();
  const duration = Number(input?.duration);
  const price = Number(input?.price);

  if (!name) {
    throw new Error("O nome do serviço é obrigatório.");
  }

  if (!Number.isInteger(duration) || duration < MIN_SERVICE_DURATION_MINUTES) {
    throw new Error("A duração deve ser um número inteiro maior que zero.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("O preço não pode ser negativo.");
  }

  return { name, duration, price };
}
```

## `src/modules/services/service-repository.js`
```javascript
import { randomUUID } from "node:crypto";

const services = [];

export function save(service) {
  const newService = { ...service, id: randomUUID() };
  services.push(newService);
  return { ...newService };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findByName(name) {
  const normalized = name.toLocaleLowerCase("pt-BR");
  const found = services.find(
    (service) => service.name.toLocaleLowerCase("pt-BR") === normalized,
  );
  return found ? { ...found } : null;
}

export function findById(id) {
  const found = services.find((service) => service.id === id);
  return found ? { ...found } : null;
}

export function deactivateById(id) {
  const service = services.find((service) => service.id === id);

  if (!service) {
    return null;
  }

  service.active = false;
  return { ...service };
}
```

## `src/modules/services/service-service.js`
```javascript
import { validateServiceInput } from "./service-validator.js";
import {
  save,
  findAll,
  findByName,
  deactivateById,
} from "./service-repository.js";

export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new Error(`Já existe um serviço cadastrado com o nome "${data.name}".`);
  }

  return save({ ...data, active: true, createdAt: new Date().toISOString() });
}

export function listAllServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function findServiceByName(name) {
  return findByName(name);
}

export function deactivateService(id) {
  const updated = deactivateById(id);

  if (!updated) {
    throw new Error(`Nenhum serviço encontrado com o id "${id}".`);
  }

  return updated;
}

export function getAveragePrice() {
  const active = listActiveServices();

  if (active.length === 0) {
    return 0;
  }

  const total = active.reduce((sum, service) => sum + service.price, 0);
  return total / active.length;
}

// Desafio profissional: busca textual por parte do nome, sem mutar o estado.
export function searchServicesByName(term) {
  const normalized = term.toLocaleLowerCase("pt-BR");
  return findAll().filter((service) =>
    service.name.toLocaleLowerCase("pt-BR").includes(normalized),
  );
}

// Desafio profissional: ordenação por preço sem modificar o array original.
export function listServicesSortedByPrice() {
  return findAll().toSorted((a, b) => a.price - b.price);
}
```

## `src/app.js`
```javascript
import {
  createService,
  listAllServices,
  listActiveServices,
  findServiceByName,
  deactivateService,
  getAveragePrice,
  searchServicesByName,
  listServicesSortedByPrice,
} from "./modules/services/service-service.js";

function tryCreate(input) {
  try {
    const service = createService(input);
    console.log(`cadastrado: ${service.name}`);
    return service;
  } catch (error) {
    console.error(`erro ao cadastrar "${input?.name}": ${error.message}`);
    return null;
  }
}

console.log("=== Cadastrando ao menos 8 serviços ===");
const consulta = tryCreate({ name: "Consulta", duration: 45, price: 150 });
tryCreate({ name: "Retorno", duration: 20, price: 60 });
tryCreate({ name: "Avaliação Física", duration: 60, price: 120 });
tryCreate({ name: "Exame de Rotina", duration: 30, price: 90 });
tryCreate({ name: "Consulta de Retorno", duration: 25, price: 70 });
tryCreate({ name: "Sessão de Fisioterapia", duration: 50, price: 110 });
tryCreate({ name: "Nutrição Esportiva", duration: 40, price: 130 });
tryCreate({ name: "Check-up Completo", duration: 90, price: 250 });

console.log("\n=== Provocando 3 erros intencionalmente ===");
tryCreate({ name: "consulta", duration: 30, price: 100 });      // nome duplicado (case-insensitive)
tryCreate({ name: "", duration: 50, price: 90 });                // nome vazio
tryCreate({ name: "Avaliação Extra", duration: -10, price: 120 }); // duração inválida

console.log("\n=== Busca por nome ===");
const encontrado = findServiceByName("CONSULTA");
if (encontrado) {
  console.log(`${encontrado.name} encontrado`);
}

console.log("\n=== Desativando um serviço ===");
if (consulta) {
  deactivateService(consulta.id);
  console.log(`serviço "${consulta.name}" desativado`);
}

console.log("\n=== Listagem completa ===");
console.log(listAllServices());

console.log("\n=== Apenas ativos ===");
console.log(listActiveServices());

console.log("\n=== Média dos ativos ===");
console.log(getAveragePrice().toFixed(2));

console.log("\n=== Desafio: busca textual por 'consulta' ===");
console.log(searchServicesByName("consulta"));

console.log("\n=== Desafio: ordenado por preço (array original intacto) ===");
console.log(listServicesSortedByPrice());
```

---

## Log de execução (`node src/app.js`)

```
=== Cadastrando ao menos 8 serviços ===
cadastrado: Consulta
cadastrado: Retorno
cadastrado: Avaliação Física
cadastrado: Exame de Rotina
cadastrado: Consulta de Retorno
cadastrado: Sessão de Fisioterapia
cadastrado: Nutrição Esportiva
cadastrado: Check-up Completo

=== Provocando 3 erros intencionalmente ===
erro ao cadastrar "consulta": Já existe um serviço cadastrado com o nome "consulta".
erro ao cadastrar "": O nome do serviço é obrigatório.
erro ao cadastrar "Avaliação Extra": A duração deve ser um número inteiro maior que zero.

=== Busca por nome ===
Consulta encontrado

=== Desativando um serviço ===
serviço "Consulta" desativado

=== Listagem completa ===
[ { name: 'Consulta', duration: 45, price: 150, active: false, createdAt: '...', id: '...' },
  { name: 'Retorno', duration: 20, price: 60, active: true, createdAt: '...', id: '...' },
  { name: 'Avaliação Física', duration: 60, price: 120, active: true, createdAt: '...', id: '...' },
  { name: 'Exame de Rotina', duration: 30, price: 90, active: true, createdAt: '...', id: '...' },
  { name: 'Consulta de Retorno', duration: 25, price: 70, active: true, createdAt: '...', id: '...' },
  { name: 'Sessão de Fisioterapia', duration: 50, price: 110, active: true, createdAt: '...', id: '...' },
  { name: 'Nutrição Esportiva', duration: 40, price: 130, active: true, createdAt: '...', id: '...' },
  { name: 'Check-up Completo', duration: 90, price: 250, active: true, createdAt: '...', id: '...' } ]

=== Apenas ativos ===
[ (os mesmos 7 serviços acima, exceto "Consulta", que está desativado) ]

=== Média dos ativos ===
118.57

=== Desafio: busca textual por 'consulta' ===
[ { name: 'Consulta', ... , active: false },
  { name: 'Consulta de Retorno', ... , active: true } ]

=== Desafio: ordenado por preço (array original intacto) ===
[ Retorno (60), Consulta de Retorno (70), Exame de Rotina (90), Sessão de Fisioterapia (110),
  Avaliação Física (120), Nutrição Esportiva (130), Consulta (150), Check-up Completo (250) ]
```

> Os campos `id` e `createdAt` variam a cada execução (UUID e timestamp gerados na hora), por isso foram abreviados com `'...'` acima — a saída real no seu terminal mostrará valores completos.

## Discussão (perguntas da seção 26.3, aplicáveis também aqui)

- **Onde fica a regra de nome duplicado?** No `service-service.js`, porque é uma regra de negócio que depende do estado já salvo (não é possível validar isso olhando só para o dado recebido).
- **O `listAllServices()` expõe o array interno?** Não — `findAll()` sempre devolve cópias (`{ ...service }`), então nenhuma mutação externa afeta o repositório.
- **O que muda quando o PostgreSQL for introduzido?** Apenas o conteúdo de `service-repository.js`. `service-validator.js` e `service-service.js` não precisam mudar, pois não conhecem a forma de persistência.
