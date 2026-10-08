1. `var x = []` e `var contador = 1` como estado global mutável, qualquer parte do arquivo altera sem controle. Corrigir: encapsular em módulo com funções de acesso.

2. Nomes sem significado: `x`, `a`, `b`, `c`, `fazer`, `n`. Dificulta leitura e manutenção. Corrigir para: `services`, `name`, `durationMinutes`, `price`, `createService`, `searchTerm`.

3. `if (a == undefined || a == "")` usa `==` em vez de `===`, sujeito a coerção de tipo inesperada. Corrigir: comparação estrita, e usar `?.trim()` pra tratar espaços.

4. `fazer("Consulta", "45", 150)` manda duração como string, `fazer("consulta", 30, 100)` manda number. Inconsistência de tipo não validada. Corrigir: validar tipo explicitamente antes de aceitar o dado.

5. `ativo: "sim"` / `"nao"` como string em vez de boolean. Representação pouco expressiva e propensa a erro de digitação. Corrigir: `active: true/false`.

6. `buscar()` continua percorrendo o array inteiro mesmo depois de já ter achado o item (não dá `break`/`return` antecipado). Ineficiente. Corrigir: usar `Array.prototype.find`, que já para no primeiro match.

7. Nada impede dois serviços com o mesmo nome (`"Consulta"` e depois `"consulta"` são aceitos como itens diferentes). Corrigir: checar duplicidade normalizando o nome antes de cadastrar.

8. `listar()` retorna o array original (`return x`), quem chama pode alterar o estado interno diretamente por fora. Corrigir: retornar cópia (`[...x]` ou `.map`).

9. `desativar("1")` compara id number armazenado com string `"1"` usando `==`, funciona por coerção, mas é frágil. Corrigir: usar `===` com tipos consistentes desde a criação do id.

10. `media()` faz `soma / quantidade` sem checar `quantidade === 0`, gera `NaN` quando não há serviço ativo. Corrigir: checar antes e retornar 0 ou lançar erro tratado.