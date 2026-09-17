# Seção 21 — Validação nas Fronteiras

**Como executar:** salve como `secao-21.js` e rode `node secao-21.js`.

```javascript
// Exercício 1 — validar name, price e durationMinutes
function validateServiceFull(input) {
  const name = input?.name?.trim();
  const price = Number(input?.price);
  const durationMinutes = Number(input?.durationMinutes);

  if (!name) throw new Error("Nome é obrigatório.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Preço inválido.");
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) throw new Error("Duração inválida.");

  return { name, price, durationMinutes };
}
console.log(
  "1) válido ->",
  validateServiceFull({ name: "Consulta", price: 150, durationMinutes: 45 }),
);

// Exercício 2 — diferenciar formato inválido de regra de negócio
function assertUniqueName(name, existingNames) {
  if (existingNames.includes(name.toLowerCase())) {
    throw new Error(`Serviço "${name}" já existe.`);
  }
}
try {
  assertUniqueName("Consulta", ["consulta"]);
} catch (error) {
  console.log("2) regra de negócio (nome duplicado) ->", error.message);
}

// Exercício 3 — cinco casos de entrada inválida
const invalidCases = [
  { input: {}, label: "sem nenhum campo" },
  { input: { name: "" }, label: "nome vazio" },
  { input: { name: "Consulta", price: -10, durationMinutes: 30 }, label: "preço negativo" },
  { input: { name: "Consulta", price: 100, durationMinutes: 0 }, label: "duração zero" },
  { input: { name: "Consulta", price: 100, durationMinutes: "abc" }, label: "duração não numérica" },
];

for (const { input, label } of invalidCases) {
  try {
    validateServiceFull(input);
    console.log(`3) [${label}] passou (não deveria)`);
  } catch (error) {
    console.log(`3) [${label}] falhou como esperado: ${error.message}`);
  }
}
```

## Log de execução (`node secao-21.js`)

```
1) válido -> { name: 'Consulta', price: 150, durationMinutes: 45 }
2) regra de negócio (nome duplicado) -> Serviço "Consulta" já existe.
3) [sem nenhum campo] falhou como esperado: Nome é obrigatório.
3) [nome vazio] falhou como esperado: Nome é obrigatório.
3) [preço negativo] falhou como esperado: Preço inválido.
3) [duração zero] falhou como esperado: Duração inválida.
3) [duração não numérica] falhou como esperado: Duração inválida.
```

## Explicação
`validateServiceFull` é validação **sintática**: checa apenas formato e tipo, sem conhecer nenhum outro dado do sistema. `assertUniqueName` é uma regra de **negócio**: só existe porque o sistema já tem um estado acumulado (nomes já cadastrados) — por isso pertence a uma camada diferente (o `service`, não o `validator`).
