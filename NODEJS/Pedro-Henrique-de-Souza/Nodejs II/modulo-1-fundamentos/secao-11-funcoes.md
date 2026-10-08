# Seção 11 — Funções: A Unidade de Comportamento

**Como executar:** salve como `secao-11.js` e rode `node secao-11.js`.

```javascript
// Exercício 1 — calculateEndTime sem acessar variáveis externas
function calculateEndTime(startMinutes, durationMinutes) {
  return startMinutes + durationMinutes;
}
console.log("1) calculateEndTime(480, 45) ->", calculateEndTime(480, 45));

// Exercício 2 — formatService sem alterar o objeto recebido
function formatService(service) {
  return `${service.name} - ${service.durationMinutes}min - R$ ${service.price}`;
}
const original = { name: "Consulta", durationMinutes: 45, price: 150 };
const formatted = formatService(original);
console.log("2) formatService(original) ->", formatted);
console.log("2) original inalterado?    ->", original);

// Exercício 3 — explicação (comentário, sem código)
console.log(
  "3) calculateEndTime é mais fácil de testar: é pura, depende só dos parâmetros.",
);
```

## Log de execução (`node secao-11.js`)

```
1) calculateEndTime(480, 45) -> 525
2) formatService(original) -> Consulta - 45min - R$ 150
2) original inalterado?    -> { name: 'Consulta', durationMinutes: 45, price: 150 }
3) calculateEndTime é mais fácil de testar: é pura, depende só dos parâmetros.
```

## Explicação do exercício 3
`calculateEndTime` é uma **função pura**: não lê nada externo (banco, `console`, relógio) e sempre devolve o mesmo resultado para a mesma entrada — basta chamar e comparar o retorno. `formatService`, embora simples, já depende do formato do objeto `service`; se esse formato mudar, o teste também precisa mudar.
