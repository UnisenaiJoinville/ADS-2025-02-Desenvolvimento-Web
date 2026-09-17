# Atividade 26.1 — Diagnóstico de Código

> **Objetivo:** analisar o código abaixo e identificar **no mínimo 10 problemas**, justificando cada um com base nos conteúdos estudados no Módulo 1.
>
> Observe especialmente: **nomenclatura, mutação, comparação, validação, organização, tratamento de erros, dependências, escopo, coerção de tipos, funções, arrays e boas práticas de backend**.

## Cenário

O código abaixo simula um pequeno cadastro de serviços em memória para uma aplicação de agendamentos.

Ele **funciona parcialmente**, porém foi escrito propositalmente com diversos problemas.

### Tarefa

1. Leia todo o código.
2. Identifique pelo menos **10 problemas**.
3. Para cada problema:
   - indique o trecho;
   - explique por que ele é inadequado;
   - diga como deveria ser corrigido.
4. Depois, proponha uma refatoração mantendo o comportamento esperado.

---

## Código propositalmente ruim

Crie um projeto Node.js e salve o código abaixo em `src/app.js`.

```javascript
var x = [];

var contador = 1;

function fazer(a, b, c) {
  if (a == undefined || a == "") {
    console.log("erro");
    return;
  } else {
    if (b == undefined || b == "") {
      console.log("erro");
      return;
    } else {
      if (c < 0) {
        console.log("erro");
        return;
      }
    }
  }

  var obj = {
    id: contador,
    nome: a,
    duracao: b,
    preco: c,
    ativo: "sim"
  };

  contador = contador + 1;

  x.push(obj);

  console.log("cadastrado " + a);

  return obj;
}

function buscar(n) {
  var achou = null;

  for (var i = 0; i < x.length; i++) {
    if (x[i].nome.toLowerCase() == n.toLowerCase()) {
      achou = x[i];
    }
  }

  return achou;
}

function listar() {
  return x;
}

function desativar(id) {
  for (var i = 0; i < x.length; i++) {
    if (x[i].id == id) {
      x[i].ativo = "nao";
    }
  }
}

function media() {
  var soma = 0;
  var quantidade = 0;

  for (var i = 0; i < x.length; i++) {
    if (x[i].ativo == "sim") {
      soma = soma + x[i].preco;
      quantidade++;
    }
  }

  return soma / quantidade;
}

function lerConfig() {
  try {
    var porta = process.env.PORT || 3000;
    console.log("porta: " + porta);
  } catch (e) {
  }
}

async function carregar() {
  return Promise.resolve("dados carregados");
}

try {
  fazer("Consulta", "45", 150);
  fazer("consulta", 30, 100);
  fazer("", 50, 90);
  fazer("Avaliação", -10, 120);

  var servico = buscar("CONSULTA");

  if (servico != null) {
    console.log(servico.nome + " encontrado");
  }

  desativar("1");

  console.log(listar());

  console.log("Média: " + media());

  lerConfig();

  carregar().then(function (resultado) {
    console.log(resultado);
  });

} catch (erro) {
  console.log("deu erro");
}
```

---

## Perguntas orientadoras

Use estas perguntas apenas como apoio. Você pode identificar outros problemas além deles.

1. O uso de `var` é adequado em JavaScript moderno?
2. Os nomes `x`, `a`, `b`, `c` e `fazer` revelam intenção?
3. O operador `==` deveria ser utilizado nesse contexto?
4. A duração recebida como `"45"` deveria permanecer como `string`?
5. O código diferencia corretamente `null`, `undefined`, `0` e string vazia?
6. O objeto deveria representar `ativo` usando `"sim"`/`"nao"`?
7. O array interno deveria ser retornado diretamente por `listar()`?
8. A busca deveria continuar percorrendo o array depois de encontrar um item?
9. O sistema deveria permitir dois serviços com o mesmo nome?
10. O tratamento de erros usando apenas `console.log("erro")` é suficiente?
11. O `catch (e) {}` vazio é uma boa prática?
12. O cálculo da média funciona quando não existem serviços ativos?
13. O código está concentrando responsabilidades demais em um único arquivo?
14. O contador global é uma boa estratégia para gerar IDs?
15. O código assíncrono está usando `async/await` de maneira coerente?
16. `process.env.PORT` é `number` ou `string`?
17. Há mutações de estado que poderiam ser evitadas ou melhor controladas?
18. O código possui valores ou representações pouco expressivas?
19. Existem oportunidades de aplicar `find`, `filter`, `reduce`, spread ou destructuring?
20. Como o código poderia ser dividido em módulos?

---

## Entrega sugerida

Entregue um documento contendo:

- pelo menos **10 problemas encontrados**;
- justificativa de cada problema;
- proposta de correção;
- versão refatorada;
- estrutura de pastas utilizada.

### Estrutura mínima esperada após a refatoração

```text
src/
├── app.js
└── modules/
    └── services/
        ├── service-validator.js
        ├── service-repository.js
        └── service-service.js
```

> **Importante:** o objetivo não é apenas fazer o código funcionar. O acadêmico deve conseguir explicar **por que** cada alteração melhora legibilidade, segurança, previsibilidade ou manutenção do backend.
