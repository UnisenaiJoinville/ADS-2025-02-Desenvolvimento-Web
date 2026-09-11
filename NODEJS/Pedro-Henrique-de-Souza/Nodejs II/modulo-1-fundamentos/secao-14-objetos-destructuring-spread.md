# Seção 14 — Objetos, Destructuring e Spread

**Como executar:** salve como `secao-14.js` e rode `node secao-14.js`.

```javascript
const service = { name: "Consulta", price: 150, durationMinutes: 45, internalNote: "cliente VIP" };

// Exercício 1 — destructuring de name e price
const { name, price } = service;
console.log("1) name, price ->", name, price);

// Exercício 2 — spread alterando apenas price
const updated = { ...service, price: 200 };
console.log("2) updated ->", updated);
console.log("2) service original inalterado ->", service);

// Exercício 3 — rest destructuring removendo internalNote
const { internalNote, ...publicService } = service;
console.log("3) publicService (sem internalNote) ->", publicService);
```

## Log de execução (`node secao-14.js`)

```
1) name, price -> Consulta 150
2) updated -> {
  name: 'Consulta',
  price: 200,
  durationMinutes: 45,
  internalNote: 'cliente VIP'
}
2) service original inalterado -> {
  name: 'Consulta',
  price: 150,
  durationMinutes: 45,
  internalNote: 'cliente VIP'
}
3) publicService (sem internalNote) -> { name: 'Consulta', price: 150, durationMinutes: 45 }
```

## Explicação
O spread (`{ ...service, price: 200 }`) cria um **novo objeto**, sem tocar no original — útil para atualizar estado sem mutação. O rest destructuring (`const { internalNote, ...publicService } = service`) separa uma propriedade indesejada do restante, ideal para remover campos internos antes de devolver dados ao cliente.
