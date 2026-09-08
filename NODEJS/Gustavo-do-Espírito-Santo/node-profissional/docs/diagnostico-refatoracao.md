# Atividade 26 — Diagnóstico, Refatoração e Desafio (Módulo 1)

Referências de seção (§) apontam para `Modulo-1-Fundamentos-Backend-JavaScript-NodeJS.docx.pdf`.

## 1. Diagnóstico do código original (26.1)

1. **Uso generalizado de `var`** (`var x = []`, `var contador`, `var i`, `var obj`, `var achou`,
   `var soma`, `var quantidade`, `var porta`). `var` tem escopo de função e sofre hoisting, o que
   permite acessar a variável antes da declaração e vaza para fora de blocos `if`/`for`. Deveria ser
   `const` (valor não reatribuído: `obj`, `achou`, `soma` inicial) ou `let` (contadores de loop,
   acumuladores) — §6.1.

2. **Nomes que não revelam intenção**: array `x`, função `fazer`, parâmetros `a`, `b`, `c`. Quem lê
   `fazer(a, b, c)` não sabe o que está sendo criado nem o que cada parâmetro representa. Deveriam
   ser `services`, `createService(name, durationMinutes, price)` — §20.1.

3. **Comparação com `==` em vez de `===`** em todos os pontos (`a == undefined`, `.toLowerCase() ==
   .toLowerCase()`, `x[i].id == id`, `x[i].ativo == "sim"`). O operador `==` faz coerção de tipo e
   permite, por exemplo, que um `id` numérico bata com um `id` em string sem que isso seja
   intencional. Backend profissional deve usar `===` — §7.2 e §24 (anti-padrões).

4. **Validação de campo ausente/vazio frágil**: `a == undefined || a == ""` não cobre `null` de
   forma explícita nem uma string só com espaços (`"   "` passaria pela validação). O correto é
   normalizar e checar depois de `trim()`, como `!input?.name?.trim()` — §21.

5. **Bug real de validação assimétrica**: só o preço é checado contra valor negativo (`if (c < 0)`);
   a duração nunca é validada. Isso faz `fazer("Avaliação", -10, 120)` ser aceito como válido,
   quando deveria ser rejeitado — §21 e §23.1 (regra explícita: "não permitir durationMinutes menor
   ou igual a zero").

6. **Inconsistência de tipo em `duracao`**: a primeira chamada passa `"45"` (string) e a segunda
   passa `30` (number) para o mesmo campo, sem nenhuma conversão. Dados vindos de fronteiras
   externas (CLI, HTTP, arquivo) chegam como texto e precisam ser convertidos explicitamente com
   `Number(...)` antes de qualquer regra — §8.

7. **`ativo: "sim" | "nao"` como string** em vez de `boolean`. É um valor pouco expressivo que exige
   comparação por string (`== "sim"`) em vez de uma checagem direta (`if (service.active)`) — §7.1 e
   §20.3.

8. **Ausência de checagem de nome duplicado no cadastro**: `buscar` ignora maiúsculas/minúsculas,
   mas `fazer` nunca chama `buscar` antes de inserir — nada impede dois serviços chamados
   "Consulta"/"consulta" coexistirem. A regra de unicidade (case-insensitive) precisa estar em quem
   cadastra, não só em quem busca — §23.1/§23.3.

9. **`buscar` continua percorrendo o array após encontrar o item** (não há `break` nem retorno
   antecipado), fazendo trabalho desnecessário até o fim da coleção. `Array.prototype.find` resolve
   isso nativamente e comunica a intenção ("primeiro que corresponder") — §13.

10. **`listar()` retorna a referência direta ao array interno `x`**. Qualquer código externo que
    receba esse retorno pode fazer `resultado.push(...)` ou `resultado[0].preco = 0` e corromper o
    estado interno sem passar pelas regras do módulo. Deveria devolver uma cópia (`services.map(s =>
    ({...s}))`) — §22.1/§23.3.

11. **Tratamento de erro por `console.log("erro") + return`** em vez de `throw new Error(...)`. Isso
    impede que quem chama a função saiba, de forma programática, que algo falhou (o retorno
    `undefined` de um cadastro rejeitado é indistinguível de outros usos de `undefined`) — §17.

12. **`catch (e) {}` vazio em `lerConfig`**: qualquer exceção ali é silenciosamente descartada, sem
    log e sem propagação — um anti-padrão citado explicitamente no material (§24) — e ainda por cima
    desnecessário, já que ler `process.env` não lança exceção.

13. **`catch (erro) { console.log("deu erro") }` no bloco principal** descarta `erro.message`,
    tornando impossível diagnosticar qual das operações falhou e por quê — contraria o princípio de
    "fail fast" comunicando a causa (§17).

14. **`media()` pode retornar `NaN`**: quando não há nenhum serviço ativo, `soma / quantidade` vira
    `0 / 0`. Falta o guard mostrado no próprio material: `active.length ? total / active.length : 0`
    — §23.5.

15. **Contador global mutável (`contador`) como gerador de id**: só é único dentro de um único
    processo Node.js rodando; reiniciar o processo ou rodar duas instâncias gera ids duplicados. O
    material recomenda `crypto.randomUUID()` justamente para isso — §12 e §22.2.

16. **Responsabilidades misturadas em um único arquivo/escopo global**: validação, geração de id,
    persistência em memória e log de auditoria (`console.log("cadastrado " + a)`) convivem dentro da
    mesma função `fazer`, sem módulos (`import`/`export`). Isso dificulta testar a validação sem
    acionar o "banco" em memória, e testar o cadastro sem produzir saída no console — §16 e §22
    (a separação validator/service/repository existe exatamente para isolar essas preocupações).

17. **`if/else` aninhado em vez de early return** na validação de `fazer`, criando três níveis de
    indentação para checar três condições independentes. Early return deixa o caminho principal
    (cadastro bem-sucedido) mais evidente — §10.

## 2. Estrutura de pastas final (26.2)

```
node-profissional/
├── package.json
├── README.md
├── docs/
│   └── diagnostico-refatoracao.md
└── src/
    ├── app.js
    └── modules/
        ├── services/
        │   ├── service-validator.js
        │   ├── service-repository.js
        │   └── service-service.js
        └── appointments/
            ├── appointment-validator.js
            ├── appointment-repository.js
            └── appointment-service.js
```

`app.js` só conhece as funções exportadas por `service-service.js` e `appointment-service.js` —
nunca acessa os arrays internos dos repositórios diretamente, corrigindo o problema 10.

## 3. Principais trechos antes/depois

### Validação (problemas 1, 3, 4, 5, 6, 17)

Antes:

```javascript
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
  // ...
}
```

Depois (`service-validator.js`):

```javascript
export function validateServiceInput(input) {
  const name = input?.name?.trim().replace(/\s+/g, ' ');
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (!name) {
    throw new Error('Nome do serviço é obrigatório');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Duração deve ser um número inteiro maior que zero');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Preço não pode ser negativo');
  }

  return { name, durationMinutes, price };
}
```

Early return substitui o aninhamento, `===`/checagens explícitas substituem `==`, a duração passa a
ser validada (corrige o bug do item 5) e ambos os campos numéricos são normalizados com `Number(...)`
antes de qualquer regra.

### Geração de id (problema 15)

Antes: `contador` global reatribuído a cada cadastro (`contador = contador + 1`).

Depois (`service-service.js`): `id: randomUUID()`, importado de `node:crypto` — único mesmo entre
reinícios ou múltiplas instâncias do processo.

### Listagem sem expor estado interno (problema 10)

Antes: `function listar() { return x; }`.

Depois (`service-repository.js`): `return services.map((service) => ({ ...service }));` — quem
recebe a lista pode ler, mas não mutar o array nem os objetos internos do repositório.

### Média com guard (problema 14)

Antes: `return soma / quantidade;` (pode virar `NaN`).

Depois (`service-service.js`):

```javascript
return {
  count: active.length,
  averagePrice: active.length ? totalPrice / active.length : 0,
};
```

### Tratamento de erro (problemas 11, 12, 13)

Antes: `console.log("erro"); return;` dentro da regra, e `catch (e) {}` / `catch (erro) {
console.log("deu erro") }` nas bordas.

Depois: os módulos de validação/serviço lançam `throw new Error("mensagem específica")`; `app.js`
captura cada chamada individualmente e loga `error.message`, então cada falha é identificável sem
interromper as demais demonstrações.

## 4. Desafio — agendamento em memória (26.3)

`scheduleAppointment(professionalId, serviceId, startAt, durationMinutes)` foi implementado em
`src/modules/appointments/`, seguindo a mesma separação validator → service → repository:

- `appointment-validator.js` garante que os quatro campos existem e que `startAt` é uma data válida
  e `durationMinutes` um inteiro positivo (validação sintática).
- `appointment-service.js` converte o agendamento em um intervalo `[início, fim)`, busca os
  agendamentos existentes do mesmo `professionalId` e rejeita a criação se algum intervalo existente
  se sobrepuser ao novo (regra de negócio).
- `appointment-repository.js` só guarda e consulta os agendamentos em memória, sem saber o que é
  "conflito".

### Respostas às questões de discussão do material

**Onde deveria ficar a regra de conflito?** No service de aplicação
(`appointment-service.js`), não no validator nem no repositório. O validator resolve apenas formato
(datas e números válidos); o repositório resolve apenas acesso a dados. Decidir se um horário pode
coexistir com outro é uma regra de negócio que precisa orquestrar validação + consulta, o que é
exatamente o papel da camada de serviço.

**O repositório deve decidir se um horário é permitido?** Não. Se o repositório
decidisse isso, ele deixaria de ser uma simples camada de acesso a dados e passaria a concentrar
regra de negócio — dificultando trocar a persistência (por exemplo, para PostgreSQL) sem duplicar ou
perder essa regra no caminho.

**O que acontece quando existem duas requisições simultâneas?** Dentro de um único
processo Node.js, chamadas síncronas como as deste desafio não se intercalam (o event loop executa
uma por vez), então não há problema aqui. Mas assim que existir qualquer operação assíncrona entre
"ler os agendamentos existentes" e "salvar o novo" (uma consulta a banco, por exemplo) ou mais de uma
instância do processo rodando, duas requisições concorrentes podem ler "sem conflito" antes de
qualquer uma delas salvar, e ambas passariam — uma condição de corrida clássica.

**O que muda quando o PostgreSQL for introduzido?** A checagem de sobreposição
deixaria de ser um `.some(...)` em memória e passaria a ser garantida pelo próprio banco (por
exemplo, uma constraint `EXCLUDE` sobre um intervalo `tsrange`, ou uma transação com lock), que é
atômica e resolve a condição de corrida descrita acima. O `appointment-service.js` continuaria com a
mesma responsabilidade de orquestrar validação e chamada ao repositório — só a implementação de
`appointment-repository.js` mudaria.
