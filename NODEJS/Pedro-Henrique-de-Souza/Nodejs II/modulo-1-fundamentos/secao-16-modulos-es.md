# Seção 16 — Módulos: Organizando Responsabilidades (ES Modules)

Esta seção precisa de **mais de um arquivo** no ar ao mesmo tempo. Crie os quatro arquivos abaixo na mesma pasta, mais um `package.json` com `"type": "module"`, e rode sempre o arquivo principal (`node app.js`) — os `import`s carregam os demais automaticamente.

**Como executar:**
1. Crie a pasta e rode `npm init -y`
2. Adicione `"type": "module"` no `package.json` gerado
3. Crie os 4 arquivos `.js` abaixo
4. Rode `node app.js`

## `math.js`
```javascript
export function sum(a, b) {
  return a + b;
}

export function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
```

## `service-validator.js`
```javascript
export function validateService(input) {
  if (!input?.name?.trim()) {
    throw new Error("Nome é obrigatório.");
  }
  return { name: input.name.trim() };
}
```

## `service.js`
```javascript
import { validateService } from "./service-validator.js";

export function createService(input) {
  const data = validateService(input);
  return { ...data, active: true };
}
```

## `app.js` (arquivo principal — execute este)
```javascript
import { sum, average } from "./math.js";
import { createService } from "./service.js";
import path from "node:path";

// Exercício 1 — math.js exportando funções, importadas aqui
console.log("1) sum(2, 3)          ->", sum(2, 3));
console.log("1) average([10,20,30])->", average([10, 20, 30]));

// Exercício 2 — validação em módulo separado
console.log("2) createService      ->", createService({ name: "Consulta" }));

// Exercício 3 — node:path para extensão
console.log("3) path.extname('/src/app.js') ->", path.extname("/src/app.js"));
```

## Log de execução (`node app.js`)

```
1) sum(2, 3)          -> 5
1) average([10,20,30])-> 20
2) createService      -> { name: 'Consulta', active: true }
3) path.extname('/src/app.js') -> .js
```

## Explicação
Cada arquivo declara explicitamente o que importa (`import ... from "./arquivo.js"`), o que torna as dependências visíveis: `app.js` conhece `math.js` e `service.js`; `service.js` conhece `service-validator.js`. O prefixo `node:` (usado em `node:path`) deixa claro que o módulo pertence ao runtime do Node, não é uma dependência instalada via npm.
