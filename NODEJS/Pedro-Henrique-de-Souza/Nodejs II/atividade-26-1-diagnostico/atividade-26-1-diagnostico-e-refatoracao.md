# Atividade 26.1 — Diagnóstico de Código e Refatoração

## Parte 1 — Diagnóstico (15 problemas identificados)

### 1. Uso de `var` em vez de `const`/`let`
**Trecho:** `var x = []; var contador = 1;`
**Por que é inadequado:** `var` tem escopo de função (não de bloco) e sofre *hoisting*, o que facilita reatribuições acidentais e dificulta prever onde uma variável é válida.
**Correção:** usar `const` para referências que não serão reatribuídas (`const services = []`) e `let` apenas quando o valor realmente muda.

### 2. Nomes que não revelam intenção
**Trecho:** `function fazer(a, b, c)`, `var x`, `function buscar(n)`
**Por que é inadequado:** nomes genéricos escondem o domínio do problema. Quem lê `fazer(a, b, c)` não sabe, sem ler o corpo inteiro, que se trata de cadastrar um serviço com nome, duração e preço.
**Correção:** `createService(name, duration, price)`, `services` em vez de `x`, `findServiceByName(name)` em vez de `buscar(n)`.

### 3. Comparação com `==` em vez de `===`
**Trecho:** `if (a == undefined || a == "")`, `if (x[i].nome.toLowerCase() == n.toLowerCase())`
**Por que é inadequado:** `==` faz coerção de tipos e pode gerar resultados inesperados (`0 == ""` é `true`, `false == 0` é `true`). Isso é especialmente perigoso em validações de entrada.
**Correção:** usar `===`/`!==` sempre, e comparar explicitamente contra `null`/`undefined` quando for o caso (`value === undefined || value === null`).

### 4. Duração armazenada com tipo inconsistente (coerção de tipos não controlada)
**Trecho:** `fazer("Consulta", "45", 150)` guarda `duracao: "45"` (string), enquanto `fazer("consulta", 30, 100)` guarda `duracao: 30` (number).
**Por que é inadequado:** o mesmo campo do mesmo tipo de objeto ora é string, ora é number. Isso quebra qualquer cálculo ou comparação futura com esse campo e mostra ausência de conversão na fronteira de entrada.
**Correção:** converter explicitamente com `Number(input.duration)` na validação e rejeitar valores que não sejam inteiros finitos, garantindo um único tipo para o campo.

### 5. Representação pouco expressiva de booleano (`"sim"`/`"nao"`)
**Trecho:** `ativo: "sim"` e depois `x[i].ativo == "sim"`
**Por que é inadequado:** o domínio é binário (ativo ou não), mas foi modelado como string livre, o que permite valores inválidos (`"talvez"`, `"SIM"`, etc.) e obriga comparação por igualdade de string em vez de um simples booleano.
**Correção:** usar `active: true/false` e verificar com `if (service.active)`.

### 6. `listar()` retorna a referência do array interno
**Trecho:** `function listar() { return x; }`
**Por que é inadequado:** quem chama `listar()` recebe a referência real do array/objetos internos e pode alterá-los diretamente (`listar()[0].preco = -999`), corrompendo o estado do módulo sem passar por nenhuma validação.
**Correção:** retornar cópias (`services.map((s) => ({ ...s }))`), como foi feito em `findAll()` no repositório refatorado.

### 7. Contador global mutável como estratégia de geração de ID
**Trecho:** `var contador = 1; ... contador = contador + 1;`
**Por que é inadequado:** uma variável global mutável pode ser alterada por qualquer parte do código, é reiniciada a cada execução do processo e não é única entre múltiplas instâncias da aplicação (problema citado no próprio material do módulo, seção 12).
**Correção:** gerar identificadores únicos e estáveis com `crypto.randomUUID()`, como fizemos no repositório refatorado.

### 8. `buscar()` continua percorrendo o array após encontrar o item
**Trecho:**
```javascript
for (var i = 0; i < x.length; i++) {
  if (x[i].nome.toLowerCase() == n.toLowerCase()) {
    achou = x[i];
  }
}
```
**Por que é inadequado:** o laço não interrompe a busca ao encontrar uma correspondência, continua percorrendo o array inteiro (desperdício) e, se houver mais de um serviço com nomes parecidos, retorna o **último** encontrado, não o primeiro — comportamento não intuitivo.
**Correção:** usar `Array.prototype.find`, que já para na primeira ocorrência: `services.find((s) => s.name.toLowerCase() === name.toLowerCase())`.

### 9. Nenhuma regra de unicidade de nome
**Trecho:** a função `fazer` nunca verifica se já existe um serviço com aquele nome antes de inserir.
**Por que é inadequado:** o próprio enunciado da atividade (seção 23.1) exige que dois serviços não possam ter o mesmo nome, ignorando maiúsculas/minúsculas — regra de negócio ausente no código original.
**Correção:** antes de salvar, checar `findByName(name)` e lançar erro se já existir (implementado em `createService`).

### 10. Tratamento de erro insuficiente (`console.log("erro")`)
**Trecho:** todas as validações de `fazer` apenas imprimem a string genérica `"erro"` e retornam `undefined` silenciosamente.
**Por que é inadequado:** não há diferenciação entre os tipos de falha (nome vazio, duração inválida, preço negativo), o chamador não recebe nenhuma informação estruturada e o `undefined` retornado pode causar erros em cascata em quem espera um objeto.
**Correção:** lançar (`throw`) um `Error` com mensagem específica para cada regra violada, e deixar quem chama decidir como tratar (`try/catch`), como no `service-validator.js` refatorado.

### 11. `catch (e) {}` vazio
**Trecho:**
```javascript
function lerConfig() {
  try {
    var porta = process.env.PORT || 3000;
    console.log("porta: " + porta);
  } catch (e) {
  }
}
```
**Por que é inadequado:** capturar uma exceção e não fazer nada com ela (nem logar, nem relançar) esconde falhas reais e torna qualquer diagnóstico futuro extremamente difícil — é um anti-padrão citado explicitamente no material (seção 24).
**Correção:** remover o `try/catch` (essa função não lança nada que precise ser capturado) ou, se necessário, ao menos logar o erro: `catch (error) { console.error("Falha ao ler porta:", error.message); }`.

### 12. Divisão por zero não tratada em `media()`
**Trecho:** `return soma / quantidade;`
**Por que é inadequado:** se não houver nenhum serviço ativo, `quantidade` é `0` e a divisão retorna `NaN`, um valor que se propaga silenciosamente por qualquer cálculo posterior sem lançar erro nem aviso.
**Correção:** verificar o caso vazio explicitamente e retornar `0` (ou `null`, dependendo da regra de negócio): `return active.length ? total / active.length : 0;`.

### 13. Excesso de responsabilidades em um único arquivo
**Trecho:** o arquivo inteiro mistura validação de entrada, acesso/mutação de dados, regra de negócio e o próprio "script principal" de teste.
**Por que é inadequado:** dificulta testar cada parte isoladamente, aumenta o acoplamento e faz qualquer mudança pequena (ex.: trocar a persistência por um banco) exigir tocar em tudo.
**Correção:** separar em `service-validator.js` (validação), `service-repository.js` (acesso a dados) e `service-service.js` (regra de aplicação), como pede a estrutura mínima da atividade.

### 14. Estruturas de controle aninhadas em vez de *early return*
**Trecho:**
```javascript
if (a == undefined || a == "") {
  ...
} else {
  if (b == undefined || b == "") {
    ...
  } else {
    if (c < 0) { ... }
  }
}
```
**Por que é inadequado:** o aninhamento cresce a cada nova regra, tornando o código mais difícil de ler e de saber qual condição está ativa em qual ponto.
**Correção:** validar cada condição inválida e retornar/lançar erro imediatamente, sem `else`, como no material (seção 10) e no `service-validator.js` refatorado.

### 15. `async`/`.then()` sem tratamento de rejeição, dentro de um `try/catch` síncrono
**Trecho:**
```javascript
carregar().then(function (resultado) {
  console.log(resultado);
});
```
dentro de um bloco `try { ... } catch (erro) { console.log("deu erro"); }`.
**Por que é inadequado:** o `try/catch` só captura exceções síncronas lançadas durante a execução do bloco; se a Promise de `carregar()` for rejeitada, o `catch` externo **não** vai capturar esse erro, pois a rejeição acontece de forma assíncrona. Falta um `.catch()` na própria Promise (ou `await` dentro de uma função `async`).
**Correção:** usar `await carregar()` dentro de uma função `async` com seu próprio `try/catch`, ou encadear `.catch()` explicitamente na Promise.

> Problemas adicionais que também valem menção: valor mágico não nomeado para duração mínima; `desativar("1")` dependendo de coerção implícita entre string e number para casar com o `id` numérico; ausência de `import`/`export` (tudo em escopo global de um único arquivo).

---

## Parte 2 — Estrutura de pastas utilizada

```text
src/
├── app.js
└── modules/
    └── services/
        ├── service-validator.js
        ├── service-repository.js
        └── service-service.js
```

- **`service-validator.js`**: só entende formato e tipo (nome, duração, preço). Não sabe nada sobre onde os dados são guardados.
- **`service-repository.js`**: só entende como guardar/consultar os dados (hoje em memória; amanhã poderia ser PostgreSQL sem que o resto do código mude).
- **`service-service.js`**: orquestra o caso de uso — chama o validador, aplica a regra de negócio (nome único) e delega a persistência ao repositório.
- **`app.js`**: só conhece o caso de uso (`service-service.js`), não acessa o array nem valida nada diretamente.

---

## Parte 3 — Código refatorado

### `src/modules/services/service-validator.js`
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

### `src/modules/services/service-repository.js`
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

### `src/modules/services/service-service.js`a
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
```

### `src/app.js`
```javascript
import {
  createService,
  listAllServices,
  findServiceByName,
  deactivateService,
  getAveragePrice,
} from "./modules/services/service-service.js";

function tryCreate(input) {
  try {
    const service = createService(input);
    console.log(`cadastrado ${service.name}`);
    return service;
  } catch (error) {
    console.error(`erro ao cadastrar "${input?.name}": ${error.message}`);
    return null;
  }
}

const consulta = tryCreate({ name: "Consulta", duration: 45, price: 150 });
tryCreate({ name: "consulta", duration: 30, price: 100 }); // nome duplicado (case-insensitive)
tryCreate({ name: "", duration: 50, price: 90 }); // nome vazio
tryCreate({ name: "Avaliação", duration: -10, price: 120 }); // duração inválida

const encontrado = findServiceByName("CONSULTA");
if (encontrado) {
  console.log(`${encontrado.name} encontrado`);
}

if (consulta) {
  try {
    deactivateService(consulta.id);
    console.log(`serviço "${consulta.name}" desativado`);
  } catch (error) {
    console.error(error.message);
  }
}

console.log(listAllServices());
console.log(`Média: ${getAveragePrice().toFixed(2)}`);
```

**Saída ao executar `node src/app.js`** (testada e confirmada):
```
cadastrado Consulta
Consulta encontrado
serviço "Consulta" desativado
[
  {
    name: 'Consulta',
    duration: 45,
    price: 150,
    active: false,
    createdAt: '2026-09-07T19:18:17.694Z',
    id: 'bb9c01da-3052-4b81-82d8-fcb5f2cc5d1f'
  }
]
Média: 0.00

// stderr:
erro ao cadastrar "consulta": Já existe um serviço cadastrado com o nome "consulta".
erro ao cadastrar "": O nome do serviço é obrigatório.
erro ao cadastrar "Avaliação": A duração deve ser um número inteiro maior que zero.
```

O comportamento essencial do código original foi mantido (mesmas quatro tentativas de cadastro, mesma busca, mesma desativação, mesma listagem e cálculo de média), mas agora com mensagens de erro específicas, regra de nome duplicado aplicada (que faltava no original) e média retornando `0` em vez de `NaN` quando não há serviços ativos.
