# Seção 6 — Variáveis, Constantes e Escopo

**Como executar:** salve o código abaixo como `secao-06.js` e rode `node secao-06.js`.

```javascript
// Exercício 1 — reescrever var usando const/let
let duration = 30;
duration = 45;
console.log("1) duration após reatribuição:", duration);

// Exercício 2 — const service, alterar apenas active
const service = { name: "Consulta", durationMinutes: 45, active: true };
service.active = false;
console.log("2) service após alterar active:", service);

// Exercício 3 — const não torna objeto imutável (demonstração)
const empty = {};
empty.novaPropriedade = "isso é permitido";
console.log("3) const service = {} não é imutável, prova:", empty);
```

## Log de execução (`node secao-06.js`)

```
1) duration após reatribuição: 45
2) service após alterar active: { name: 'Consulta', durationMinutes: 45, active: false }
3) const service = {} não é imutável, prova: { novaPropriedade: 'isso é permitido' }
```

## Explicação do exercício 3
`const` impede apenas a **reatribuição da variável**. Ela não protege o conteúdo do objeto: as propriedades continuam podendo ser adicionadas/alteradas normalmente. Para imutabilidade real seria necessário `Object.freeze(objeto)`.
