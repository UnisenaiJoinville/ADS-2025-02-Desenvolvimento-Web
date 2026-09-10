# Seção 10 — Controle de Fluxo e Early Return

**Como executar:** salve como `secao-10.js` e rode `node secao-10.js`.

```javascript
// Exercício 1 — canSchedule com early return
function canSchedule(service) {
  if (!service.active) return false;
  if (service.durationMinutes <= 0) return false;
  return true;
}
console.log("1) canSchedule(ativo, 30min)  ->", canSchedule({ active: true, durationMinutes: 30 }));
console.log("1) canSchedule(inativo, 30min)->", canSchedule({ active: false, durationMinutes: 30 }));
console.log("1) canSchedule(ativo, 0min)   ->", canSchedule({ active: true, durationMinutes: 0 }));

// Exercício 2 — switch para perfis
function getRoleLabel(role) {
  switch (role) {
    case "ADMIN": return "Administrador";
    case "PROFESSIONAL": return "Profissional";
    case "CUSTOMER": return "Cliente";
    default: return "Desconhecido";
  }
}
console.log("2) getRoleLabel('ADMIN')       ->", getRoleLabel("ADMIN"));
console.log("2) getRoleLabel('PROFESSIONAL')->", getRoleLabel("PROFESSIONAL"));
console.log("2) getRoleLabel('CUSTOMER')    ->", getRoleLabel("CUSTOMER"));

// Exercício 3 — refatorar 3 ifs aninhados
function validateOld(a, b, c) {
  if (a) {
    if (b) {
      if (c) {
        return "válido";
      }
    }
  }
  return "inválido";
}
function validate(a, b, c) {
  if (!a) return "inválido";
  if (!b) return "inválido";
  if (!c) return "inválido";
  return "válido";
}
console.log("3) validateOld(1,1,1) ->", validateOld(1, 1, 1));
console.log("3) validate(1,1,1)    ->", validate(1, 1, 1));
console.log("3) validate(1,0,1)    ->", validate(1, 0, 1));
```

## Log de execução (`node secao-10.js`)

```
1) canSchedule(ativo, 30min)  -> true
1) canSchedule(inativo, 30min)-> false
1) canSchedule(ativo, 0min)   -> false
2) getRoleLabel('ADMIN')       -> Administrador
2) getRoleLabel('PROFESSIONAL')-> Profissional
2) getRoleLabel('CUSTOMER')    -> Cliente
3) validateOld(1,1,1) -> válido
3) validate(1,1,1)    -> válido
3) validate(1,0,1)    -> inválido
```

## Explicação
Early return valida as condições inválidas primeiro e sai da função imediatamente, evitando o aninhamento crescente de `if/else` que fica difícil de acompanhar conforme mais regras são adicionadas.
