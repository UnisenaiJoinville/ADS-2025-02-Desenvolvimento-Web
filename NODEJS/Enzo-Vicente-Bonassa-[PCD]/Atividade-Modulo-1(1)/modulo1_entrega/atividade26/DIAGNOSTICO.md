# Atividade 26.1 e 26.2 - Diagnóstico e refatoração

## 26.1 - Problemas encontrados

### 1. Uso de `var`

- **Trecho:** `var x = [];`, `var contador = 1;` e outras variáveis.
- **Problema:** `var` tem escopo menos previsível e não é a escolha indicada em
  JavaScript moderno.
- **Correção:** usar `const` quando a referência não muda e `let` quando precisa mudar.

### 2. Nomes pouco claros

- **Trecho:** `x`, `a`, `b`, `c`, `obj` e `fazer`.
- **Problema:** esses nomes não explicam o que os valores representam.
- **Correção:** usar nomes como `services`, `name`, `durationMinutes`, `price`
  e `createService`.

### 3. Comparação com `==`

- **Trecho:** `a == undefined`, `x[i].id == id` e outras comparações.
- **Problema:** `==` realiza conversão automática de tipos e pode gerar resultados inesperados.
- **Correção:** converter os dados de entrada quando necessário e utilizar `===`.

### 4. Duração sem conversão e validação correta

- **Trecho:** `fazer("Consulta", "45", 150)` armazena `"45"` como texto.
- **Problema:** a duração deveria ser um número inteiro positivo. O código também
  não rejeita corretamente a duração `-10`.
- **Correção:** converter com `Number` e verificar com `Number.isInteger`.

### 5. Preço não é totalmente validado

- **Trecho:** `if (c < 0)`.
- **Problema:** a verificação não garante que o preço seja realmente numérico e finito.
- **Correção:** converter o valor e usar `Number.isFinite`, rejeitando valores negativos.

### 6. Estado ativo representado por texto

- **Trecho:** `ativo: "sim"` e `ativo = "nao"`.
- **Problema:** há apenas dois estados, portanto texto aumenta a chance de erros de escrita.
- **Correção:** representar o estado com `true` e `false`.

### 7. Permite nomes duplicados

- **Trecho:** são cadastrados `"Consulta"` e `"consulta"`.
- **Problema:** representam o mesmo serviço, mas o cadastro não verifica duplicidade.
- **Correção:** buscar o nome ignorando maiúsculas e minúsculas antes de salvar.

### 8. Busca percorre todo o array

- **Trecho:** laço `for` dentro de `buscar`.
- **Problema:** mesmo depois de encontrar um serviço, o laço continua.
- **Correção:** utilizar `find`, que retorna a primeira correspondência.

### 9. Array interno retornado diretamente

- **Trecho:** `function listar() { return x; }`.
- **Problema:** quem recebe o array pode alterar diretamente os dados internos.
- **Correção:** devolver um novo array com cópias dos objetos usando `map` e spread.

### 10. Tratamento de erros inadequado

- **Trecho:** `console.log("erro")`, `console.log("deu erro")` e `catch (e) {}`.
- **Problema:** as mensagens não explicam o erro e o `catch` vazio esconde falhas.
- **Correção:** lançar erros com mensagens simples e mostrar `error.message` no `app.js`.

### 11. Média pode resultar em `NaN`

- **Trecho:** `return soma / quantidade`.
- **Problema:** se não houver serviço ativo, ocorre divisão de zero por zero.
- **Correção:** retornar zero quando a lista de ativos estiver vazia.

### 12. Tudo está concentrado em um arquivo

- **Trecho:** validação, armazenamento, regras e execução ficam em `app.js`.
- **Problema:** mistura responsabilidades e dificulta manutenção.
- **Correção:** separar validador, repositório, serviço e entrada da aplicação.

## Principais trechos antes e depois

### Nomes e validação

**Antes:**

```javascript
function fazer(a, b, c) {
  if (a == undefined || a == "") {
    console.log("erro");
    return;
  }
}
```

**Depois:**

```javascript
export function validateServiceInput(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (!name) throw new Error('Nome é obrigatório.');

}
```

Os nomes agora mostram a intenção. A validação fica separada e lança mensagens
que explicam o motivo da falha.

### Busca

**Antes:**

```javascript
for (var i = 0; i < x.length; i++) {
  if (x[i].nome.toLowerCase() == n.toLowerCase()) {
    achou = x[i];
  }
}
```

**Depois:**

```javascript
return services.find(
  (service) => service.name.toLowerCase() === name.toLowerCase(),
);
```

`find` deixa claro que queremos a primeira correspondência e usa comparação estrita.

### Listagem

**Antes:**

```javascript
return x;
```

**Depois:**

```javascript
return services.map((service) => ({ ...service }));
```

A listagem não entrega o array interno diretamente.

### Ativo e média

**Antes:**

```javascript
if (x[i].ativo == "sim") {
  soma = soma + x[i].preco;
  quantidade++;
}
return soma / quantidade;
```

**Depois:**

```javascript
const activeServices = findAll().filter((service) => service.active);
if (activeServices.length === 0) return 0;

const total = activeServices.reduce((sum, service) => sum + service.price, 0);
return total / activeServices.length;
```