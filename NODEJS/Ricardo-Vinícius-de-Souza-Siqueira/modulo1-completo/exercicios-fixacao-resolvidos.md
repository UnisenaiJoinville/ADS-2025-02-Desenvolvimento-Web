# Módulo 1 — Exercícios Resolvidos e Explicados
### Fundamentos de Backend, JavaScript Moderno e Node.js — UniSENAI

Este documento resolve, em ordem, todos os **exercícios de fixação** do material (seções 3 a 22), com código comentado e explicação do raciocínio. Os projetos maiores (Miniprojeto do catálogo de serviços, seção 23, e o Desafio de agendamento, seção 26.3) estão em arquivos `.js` separados e prontos para rodar.

---

## 3. Backend e responsabilidades

**1. Diferença entre backend, API e banco de dados**

- **Banco de dados**: só guarda e devolve dados. Não sabe nada sobre regras do negócio.
- **API**: é a "porta de entrada" — o contrato de comunicação (HTTP, fila, CLI etc.) usado para *falar* com o backend.
- **Backend**: é o conjunto de responsabilidades por trás da API — validação, regra de negócio, segurança, orquestração de dados. Um backend pode ter várias APIs (HTTP, CLI, filas) e usar vários bancos.

**2. Três regras que devem ser garantidas no backend (domínio de agendamentos)**

1. Um profissional não pode ter dois agendamentos que se sobrepõem no horário.
2. Não é possível agendar um serviço que está `active: false`.
3. Um agendamento não pode ser criado em uma data/hora no passado.

**3. Classificação — validação sintática vs. regra de negócio**

| Item | Classificação | Por quê |
|---|---|---|
| e-mail sem `@` | Sintática | é só formato de texto inválido, não depende do estado do sistema |
| preço negativo | Sintática | é uma restrição de formato/tipo do próprio valor |
| conflito de horário | Regra de negócio | só existe comparando com outros dados já salvos |
| CPF com quantidade errada de dígitos | Sintática | é validação de formato |
| serviço desativado sendo agendado | Regra de negócio | depende do estado atual de outro registro (`active`) |

> Regra prática: se você consegue validar olhando **só o valor recebido**, é sintática. Se precisa **consultar outro dado ou contexto**, é regra de negócio.

**Desafio profissional** (exemplo: app de delivery de comida)

1. Cliente toca em "Confirmar pedido" (frontend).
2. Requisição chega no backend com itens, endereço e forma de pagamento.
3. Backend valida formato (endereço preenchido, itens existem) — validação sintática.
4. Backend aplica regras de negócio (restaurante está aberto? item ainda disponível? valor mínimo do pedido atingido?).
5. Backend persiste o pedido no banco e dispara evento para a cozinha/entregador.
6. Backend responde ao cliente com confirmação e tempo estimado.

---

## 4. JavaScript, Node.js e o runtime

**1. Por que `console.log` existe no navegador e no Node.js, mesmo sendo ambientes diferentes**

`console.log` não é da linguagem JavaScript (ECMAScript) — é uma API fornecida pelo **ambiente de execução**. Tanto o navegador quanto o Node.js decidiram implementar essa mesma API porque é extremamente útil para depuração, mas cada um implementa por trás do jeito que faz sentido para si (o navegador escreve no DevTools, o Node escreve no stdout do terminal).

**2. `process.version` e `process.platform`**

```js
console.log(process.version);  // ex: "v22.10.0" — versão do runtime Node.js instalado
console.log(process.platform); // ex: "linux", "darwin" (mac) ou "win32" — sistema operacional
```
- `process.version`: identifica a versão do Node.js rodando o script — importante para saber se uma API/sintaxe está disponível.
- `process.platform`: identifica o SO — útil quando o comportamento de caminhos de arquivo ou comandos varia entre Linux/Mac/Windows.

**3. Três recursos que fazem sentido no Node.js mas não numa página de navegador**

1. **`fs` (sistema de arquivos)** — ler/escrever arquivos no disco; o navegador não tem acesso livre ao disco do usuário por segurança.
2. **`process.env`** — variáveis de ambiente do sistema operacional; não existe conceito equivalente em uma aba de navegador.
3. **`http`/criação de servidor** — abrir uma porta e escutar conexões de rede como servidor; o navegador é cliente, não servidor.

---

## 6. Variáveis, constantes e escopo

**1. Reescrevendo `var` com `const`/`let`**

```js
// Antes (evitar)
var name = "Consulta";
var count = 0;
for (var i = 0; i < 3; i++) {
  count = count + 1;
}

// Depois (moderno)
const name = "Consulta"; // nunca reatribuída → const
let count = 0;           // é reatribuída → let
for (let i = 0; i < 3; i++) { // let escopado ao bloco do for
  count = count + 1;
}
```

**2. Constante `service` e alteração de apenas `active`**

```js
const service = {
  name: "Consulta",
  durationMinutes: 45,
  active: true,
};

service.active = false; // permitido: const trava a REFERÊNCIA, não o conteúdo do objeto
console.log(service); // { name: 'Consulta', durationMinutes: 45, active: false }
```

**3. Por que `const service = {}` não torna `service` imutável**

`const` impede que a **variável** `service` seja reatribuída para apontar a outro objeto (`service = {}` daria erro). Mas o **conteúdo** do objeto continua mutável — é possível alterar, adicionar ou remover propriedades normalmente (`service.active = false` funciona). Ou seja, `const` protege a *referência*, não o *valor referenciado*. Para imutabilidade real do objeto seria necessário algo como `Object.freeze(service)`.

---

## 7. Tipos, valores e comparações

**1. Cinco comparações com `==` e `===`**

```js
console.log(1 == "1");         // true  → coerção converte "1" para número
console.log(1 === "1");        // false → tipos diferentes (number vs string)
console.log(null == undefined);// true  → == trata null e undefined como equivalentes
console.log(null === undefined);// false → tipos diferentes
console.log("" == 0);          // true  → "" é convertida para 0
console.log("" === 0);         // false → tipos diferentes
console.log(NaN == NaN);       // false → NaN nunca é igual a nada, nem a si mesmo
console.log([] == false);      // true  → [] vira "" vira 0, false vira 0
```
`==` tenta converter os tipos antes de comparar (coerção), o que produz resultados contraintuitivos. `===` compara tipo e valor ao mesmo tempo, sem conversão — por isso é o padrão recomendado em backend.

**2. Validação que aceita `0` mas rejeita `null`/`undefined`**

```js
function validateDiscountPercentage(discountPercentage) {
  // ERRADO: if (!discountPercentage) rejeitaria também o 0 válido
  if (discountPercentage === null || discountPercentage === undefined) {
    throw new Error("discountPercentage é obrigatório");
  }
  return discountPercentage;
}

validateDiscountPercentage(0);         // ok, retorna 0
validateDiscountPercentage(null);      // lança erro
validateDiscountPercentage(undefined); // lança erro
```

**3. `Number.isNaN` com `Number("abc")`**

```js
const result = Number("abc");
console.log(result);             // NaN
console.log(Number.isNaN(result)); // true

// Cuidado: isNaN() global se comporta diferente por fazer coerção antes
console.log(isNaN("abc"));       // true também, mas por um caminho diferente (converte primeiro)
console.log(isNaN(undefined));   // true (coerção estranha)
console.log(Number.isNaN(undefined)); // false (não faz coerção — mais previsível)
```
`Number.isNaN` é preferível porque não faz coerção de tipo antes de checar — só retorna `true` se o valor já for literalmente `NaN`.

---

## 8. Strings, template literals e conversões

**1. Mensagem com template literal**

```js
const name = "Consulta";
const price = 150;
const durationMinutes = 45;

const message = `Serviço: ${name} | Preço: R$ ${price.toFixed(2)} | Duração: ${durationMinutes} min`;
console.log(message);
// Serviço: Consulta | Preço: R$ 150.00 | Duração: 45 min
```

**2. Convertendo `"19.90"` e formatando com duas casas**

```js
const raw = "19.90";
const value = Number(raw);
console.log(value.toFixed(2)); // "19.90" (string formatada, sempre 2 casas)
```

**3. `parseInt` vs `Number`**

```js
console.log(parseInt("10min", 10)); // 10 → parseInt lê os dígitos até encontrar algo inválido e para ali
console.log(Number("10min"));       // NaN → Number exige que a STRING INTEIRA seja numérica, senão falha
```
`parseInt` é "tolerante": extrai o número do início da string, ignorando o resto. `Number` é "rígido": só funciona se a string inteira representar um número válido. Em validação de entrada de backend, geralmente `Number` + `Number.isFinite` é mais seguro, porque `parseInt("10min")` aceitar silenciosamente pode esconder um erro de digitação do usuário.

---

## 9. Operadores modernos úteis no backend

**1. Optional chaining em `person.contact.phone`**

```js
const person = { name: "Ana" }; // sem contact

const phone = person.contact?.phone;
console.log(phone); // undefined, sem lançar TypeError
```

**2. `0 || 20` vs `0 ?? 20`**

```js
console.log(0 || 20); // 20 → || considera 0 "falsy" e usa o valor alternativo
console.log(0 ?? 20); // 0  → ?? só usa o alternativo se for null ou undefined
```
Isso importa muito em backend: se `pageSize = 0` for um valor **válido** (por exemplo, "não paginar"), usar `||` substituiria erradamente por 20.

**3. Ternário aninhado reescrito como `if/else`**

```js
// Antes — difícil de ler
const label = status === "SCHEDULED"
  ? "Agendado"
  : status === "CANCELED"
  ? "Cancelado"
  : "Desconhecido";

// Depois — mais legível
function getStatusLabel(status) {
  if (status === "SCHEDULED") return "Agendado";
  if (status === "CANCELED") return "Cancelado";
  return "Desconhecido";
}
```
A versão com `if/else` (ou `switch`) deixa cada condição em uma linha própria, fácil de escanear visualmente — o ternário aninhado obriga o leitor a "descascar" a expressão camada por camada.

---

## 10. Controle de fluxo e early return

**1. `canSchedule` com early return**

```js
function canSchedule(service) {
  if (!service.active) {
    return false;
  }
  if (service.durationMinutes <= 0) {
    return false;
  }
  return true;
}
```

**2. `switch` para perfis**

```js
function getPermissionLevel(role) {
  switch (role) {
    case "ADMIN":
      return "Acesso total";
    case "PROFESSIONAL":
      return "Acesso à própria agenda";
    case "CUSTOMER":
      return "Acesso aos próprios agendamentos";
    default:
      return "Sem permissão";
  }
}
```

**3. Reduzindo profundidade de três `if` aninhados**

```js
// Antes
function process(order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.customer.active) {
        return "processado";
      }
    }
  }
  return "rejeitado";
}

// Depois — early return elimina o "pyramid of doom"
function process(order) {
  if (!order) return "rejeitado";
  if (order.items.length === 0) return "rejeitado";
  if (!order.customer.active) return "rejeitado";
  return "processado";
}
```

---

## 11. Funções: a unidade de comportamento

**1. `calculateEndTime` sem acessar variáveis externas**

```js
function calculateEndTime(startMinutes, durationMinutes) {
  return startMinutes + durationMinutes;
}

console.log(calculateEndTime(480, 45)); // 525 (08:00 + 45min = 08:45 em minutos)
```

**2. `formatService` que não altera o objeto original**

```js
function formatService(service) {
  return `${service.name} — ${service.durationMinutes}min — R$ ${service.price.toFixed(2)}`;
}

const service = { name: "Consulta", durationMinutes: 45, price: 150 };
console.log(formatService(service));
console.log(service); // continua intacto
```

**3. Qual função é mais fácil de testar?**

`calculateEndTime` é mais fácil: é uma **função pura** — recebe entradas, devolve saída, sem depender de nada fora dela (sem `console`, sem banco, sem data atual). Para testar basta chamar com valores e comparar o retorno. Funções que leem `Date.now()`, fazem I/O ou têm efeitos colaterais exigem simular ("mockar") esse contexto externo para serem testadas, o que é mais trabalhoso.

---

## 12. Escopo, closures e estado

**1. `createSequence(start)`**

```js
function createSequence(start) {
  let current = start;
  return function next() {
    const value = current;
    current += 1;
    return value;
  };
}

const seq = createSequence(100);
console.log(seq()); // 100
console.log(seq()); // 101
console.log(seq()); // 102
```

**2. O que acontece com o estado quando o processo Node.js é encerrado**

Todo o estado guardado em memória (variáveis como `current` na closure) é perdido. A memória do processo é liberada pelo sistema operacional quando o processo termina — não existe persistência automática. Por isso esse padrão serve para aprender closures, mas não substitui um banco de dados para dados que precisam sobreviver a um restart.

**3. Por que duas instâncias do backend não compartilhariam esse contador**

Cada instância do processo Node.js tem seu **próprio espaço de memória**, isolado do sistema operacional. Se você rodar duas cópias do backend (por exemplo, para escalar horizontalmente), cada uma vai criar sua própria closure com seu próprio `current`, começando do zero de forma independente — elas não "conversam" entre si automaticamente. Isso pode gerar IDs duplicados entre instâncias, por exemplo, e é exatamente o tipo de problema que leva a usar um banco de dados ou um gerador de IDs distribuído (como UUID) em produção.

---

## 13. Arrays e programação orientada a coleções

```js
const services = [
  { id: 1, name: "Consulta", active: true, price: 150 },
  { id: 2, name: "Retorno", active: false, price: 80 },
  { id: 3, name: "Avaliação", active: true, price: 120 },
  { id: 4, name: "Exame", active: true, price: 60 },
];
```

**1. Ativos com preço maior que 100**

```js
const expensiveActive = services.filter((s) => s.active && s.price > 100);
console.log(expensiveActive);
// [{ id:1, name:'Consulta', ... }, { id:3, name:'Avaliação', ... }]
```

**2. Novo array só com `{ id, name }`**

```js
const summary = services.map(({ id, name }) => ({ id, name }));
console.log(summary);
// [{id:1,name:'Consulta'}, {id:2,name:'Retorno'}, {id:3,name:'Avaliação'}, {id:4,name:'Exame'}]
```

**3. Existe algum inativo?**

```js
const hasInactive = services.some((s) => !s.active);
console.log(hasInactive); // true
```

**4. Preço médio**

```js
const average = services.reduce((sum, s) => sum + s.price, 0) / services.length;
console.log(average); // 102.5
```

**Desafio — `paginate(items, page, pageSize)`**

```js
function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
}

const manyItems = Array.from({ length: 25 }, (_, i) => `item-${i + 1}`);
console.log(paginate(manyItems, 1, 10)); // item-1 ... item-10
console.log(paginate(manyItems, 3, 10)); // item-21 ... item-25 (só sobram 5)
```

---

## 14. Objetos, destructuring e spread

```js
const service = { id: 1, name: "Consulta", price: 150, internalNote: "cliente VIP" };
```

**1. Destructuring de `name` e `price`**

```js
const { name, price } = service;
console.log(name, price); // Consulta 150
```

**2. Novo objeto com spread alterando `price`**

```js
const repriced = { ...service, price: 180 };
console.log(repriced.price); // 180
console.log(service.price);  // 150 — o original não muda
```

**3. Removendo `internalNote` com rest destructuring**

```js
const { internalNote, ...publicService } = service;
console.log(publicService); // { id: 1, name: 'Consulta', price: 150 } — sem internalNote
```
Esse é um padrão muito comum em backend: usar rest destructuring para "peneirar" campos internos antes de devolver um objeto para o cliente da API.

---

## 15. JSON: formato de troca de dados

**1. Convertendo `service` + `professional` para JSON**

```js
const payload = JSON.stringify({
  service: { name: "Consulta", price: 150 },
  professional: { name: "Dra. Ana" },
});
console.log(payload);
// {"service":{"name":"Consulta","price":150},"professional":{"name":"Dra. Ana"}}
```

**2. Capturando erro de `JSON.parse` com texto inválido**

```js
try {
  JSON.parse("{ nome: 'Consulta' }"); // aspas simples e chave sem aspas: JSON inválido
} catch (error) {
  console.error("Falha ao interpretar JSON:", error.message);
}
```

**3. Por que funções e `undefined` não são representados em JSON**

JSON é um formato de **texto para troca de dados entre sistemas diferentes** (não só JavaScript) — sua especificação define apenas tipos "de dados": objetos, arrays, strings, números, booleanos e `null`. Funções são *comportamento*, não *dado*, e não fazem sentido para uma linguagem qualquer do outro lado (Python, Java, etc.) interpretar. `undefined` também não existe em JSON porque representa "ausência de valor na linguagem JS" — um conceito específico do JavaScript, não um valor universal. Por isso, `JSON.stringify({ a: undefined, f: () => {} })` simplesmente omite essas propriedades do resultado.

---

## 16. Módulos: organizando responsabilidades

**1. `math.js` com duas funções, importadas em `app.js`**

```js
// math.js
export function sum(a, b) {
  return a + b;
}
export function multiply(a, b) {
  return a * b;
}
```
```js
// app.js
import { sum, multiply } from "./math.js";
console.log(sum(2, 3));       // 5
console.log(multiply(2, 3));  // 6
```

**2. `service-validator.js` e `service.js`**

```js
// service-validator.js
export function validateServiceInput(input) {
  if (!input.name?.trim()) {
    throw new Error("Nome é obrigatório");
  }
  return { name: input.name.trim() };
}
```
```js
// service.js
import { validateServiceInput } from "./service-validator.js";

export function createService(input) {
  const data = validateServiceInput(input);
  return { ...data, active: true };
}
```

**3. `node:path` para obter extensão**

```js
import path from "node:path";

console.log(path.extname("relatorio-final.pdf")); // ".pdf"
console.log(path.extname("src/app.js"));           // ".js"
```

---

## 17. Erros, exceções e fail fast

**1. `validatePrice`**

```js
function validatePrice(price) {
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    throw new Error("Preço inválido");
  }
  return price;
}
```

**2. Capturando no `app.js` com mensagem amigável**

```js
try {
  validatePrice(-50);
} catch (error) {
  console.error("Não foi possível processar o serviço:", error.message);
}
```

**3. Um erro que não deve ser "engolido" silenciosamente**

Exemplo: falha ao **salvar dados no banco** (`try { await save(order) } catch (e) {}`). Se esse erro for silenciado sem tratamento, o sistema responde "sucesso" ao cliente mesmo tendo falhado internamente — o pedido parece confirmado, mas não existe no banco. Isso gera inconsistência grave e difícil de diagnosticar depois. Erros de infraestrutura (banco, rede, arquivo) sempre devem ser logados e, no mínimo, propagados como falha visível.

---

## 18. Promises e async/await — primeiro contato

**1. Ler `services.json` com `node:fs/promises`**

```js
import { readFile } from "node:fs/promises";

async function loadServices() {
  const content = await readFile("./services.json", "utf8");
  return JSON.parse(content);
}
```

**2. Tratando arquivo inexistente**

```js
async function loadServicesSafely() {
  try {
    const content = await readFile("./services.json", "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("Arquivo services.json não encontrado. Usando lista vazia.");
      return [];
    }
    throw error; // outros erros continuam sendo propagados
  }
}
```

**3. Função async aguardando `Promise.resolve(42)` e dobrando**

```js
async function doubleAsyncValue() {
  const value = await Promise.resolve(42);
  return value * 2;
}

doubleAsyncValue().then((result) => console.log(result)); // 84
```

---

## 19. Process, argumentos e variáveis de ambiente

**1. Script recebendo `name` e `durationMinutes` via linha de comando**

```js
// app.js
// executar com: node src/app.js "Consulta" 45
const [, , name, rawDuration] = process.argv;
const durationMinutes = Number(rawDuration);

if (!name || !Number.isFinite(durationMinutes)) {
  throw new Error("Uso: node app.js <name> <durationMinutes>");
}

console.log({ name, durationMinutes });
```

**2. `APP_ENV` com padrão `"development"`**

```js
const appEnv = process.env.APP_ENV ?? "development";
console.log(`Ambiente: ${appEnv}`);
```

**3. Por que `process.env.PORT` é string**

Variáveis de ambiente são um mecanismo do **sistema operacional**, e o SO só entende texto puro para esse tipo de configuração — não existe um "tipo número" nativo em variáveis de ambiente. Por isso o Node.js sempre entrega tudo em `process.env` como `string`, mesmo que pareça um número (`"3000"`). É responsabilidade do código converter explicitamente com `Number(process.env.PORT)` antes de usar como número.

---

## 20. Boas práticas de código para backend

**1. Renomeando `a`, `b`, `x`**

```js
// Antes
function calc(a, b) {
  const x = a * (b / 100);
  return x;
}

// Depois
function calculateCommission(saleValue, commissionPercentage) {
  const commissionAmount = saleValue * (commissionPercentage / 100);
  return commissionAmount;
}
```

**2. Extraindo validação repetida**

```js
// Antes — repetido em vários lugares
if (!durationMinutes || durationMinutes <= 0) { throw new Error("Duração inválida"); }
// ...em outro trecho...
if (!durationMinutes || durationMinutes <= 0) { throw new Error("Duração inválida"); }

// Depois — extraído para uma função de domínio
function validateDurationMinutes(durationMinutes) {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Duração inválida");
  }
}
```

**3. Comentário que só repete o código**

```js
// Antes
// soma o preço de todos os serviços
const t = services.reduce((s, srv) => s + srv.price, 0);

// Depois — o nome já explica, comentário desnecessário é removido
const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
```

---

## 21. Validação nas fronteiras

**1. Validando `name`, `price` e `durationMinutes`**

```js
function validateServiceInput(input) {
  const name = input?.name?.trim();
  const price = Number(input?.price);
  const durationMinutes = Number(input?.durationMinutes);

  if (!name) throw new Error("Nome é obrigatório");
  if (!Number.isFinite(price) || price < 0) throw new Error("Preço inválido");
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Duração inválida");
  }

  return { name, price, durationMinutes };
}
```

**2. Diferenciando "formato inválido" de "já existe"**

```js
function createService(input, existingServices) {
  const data = validateServiceInput(input); // ← validação SINTÁTICA (formato)

  const alreadyExists = existingServices.some(
    (s) => s.name.toLowerCase() === data.name.toLowerCase(),
  );
  if (alreadyExists) {
    throw new Error("Serviço com este nome já existe"); // ← REGRA DE NEGÓCIO
  }

  return data;
}
```
Note que são dois `throw` com mensagens e origens diferentes — em uma API real, isso normalmente viraria códigos HTTP diferentes (400 para formato inválido, 409 para conflito).

**3. Cinco casos de entrada inválida**

```js
const invalidCases = [
  {},                                              // sem nenhum campo
  { name: "", price: 10, durationMinutes: 30 },    // nome vazio
  { name: "Consulta", price: -10, durationMinutes: 30 }, // preço negativo
  { name: "Consulta", price: 10, durationMinutes: 0 },   // duração zero
  { name: "Consulta", price: "abc", durationMinutes: 30 }, // preço não numérico
];

for (const testCase of invalidCases) {
  try {
    validateServiceInput(testCase);
    console.log("NÃO deveria ter passado:", testCase);
  } catch (error) {
    console.log("Falhou como esperado:", error.message);
  }
}
```

---

## 22. Estrutura inicial do backend

Essa seção não tem exercício de fixação próprio — ela prepara diretamente o **Miniprojeto guiado (seção 23)**. A ideia central para levar adiante: `app.js` conhece o caso de uso (`service-service.js`); o caso de uso conhece a validação e o repositório; o repositório conhece a forma atual de guardar dados (memória, e futuramente PostgreSQL). Essa é a estrutura implementada no projeto completo a seguir.

---

## 25. Checklist de domínio da sintaxe

Passando item a item do checklist do módulo, com onde cada um foi demonstrado acima:

| Item do checklist | Onde foi demonstrado |
|---|---|
| Criar e executar projeto ESM | Miniprojeto (arquivo `package.json` + `src/app.js`) |
| `const` vs `let` | Seção 6 |
| `null`, `undefined`, falsy, `NaN` | Seções 7 e 9 |
| `===`, `?.`, `??` | Seções 7 e 9 |
| Parâmetros padrão, rest, arrow functions | Seções 11 e 13 (`sumValues(...values)`, `paginate`) |
| `map`, `filter`, `find`, `some`, `every`, `reduce` | Seção 13 |
| Destructuring e spread sem mutar original | Seção 14 |
| Converter dados externos com `Number` e validar | Seções 8, 19 e 21 |
| `JSON.stringify`/`JSON.parse` com tratamento de erro | Seção 15 |
| Módulos com `import`/`export` | Seção 16 e Miniprojeto |
| APIs nativas com `node:` | Seções 16, 18, 19 |
| Lançar e capturar erros conscientemente | Seções 17, 21 |
| Promise com `async/await` | Seção 18 |
| `process.argv` e `process.env` | Seção 19 |
| Organizar caso de uso em arquivos separados | Miniprojeto (`service-validator.js`, `service-service.js`, `service-repository.js`) |

Se você conseguiu acompanhar cada exemplo acima e rodá-los no seu ambiente, os itens do checklist estão cobertos.
