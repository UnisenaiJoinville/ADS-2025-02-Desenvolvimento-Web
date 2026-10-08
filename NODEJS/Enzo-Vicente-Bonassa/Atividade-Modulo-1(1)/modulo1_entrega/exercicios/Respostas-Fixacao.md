# Respostas dos exercícios de fixação - Módulo 1

Os exemplos de código das seções 4 a 21 estão identificados em `exercicios/app.js` e podem ser executados com `npm run exercicios`. O script de argumentos é executado separadamente com
`npm run cli -- "Consulta" 45`.

## Seção 3 - Backend e responsabilidades

1. **Backend** processa solicitações, valida dados e aplica regras do sistema.
   **API** é a interface pela qual programas oferecem ou solicitam operações.
   **Banco de dados** armazena e consulta informações. Um backend pode oferecer
   uma API e utilizar um banco, mas os três conceitos são diferentes.
2. Três regras para agendamentos: impedir horários sobrepostos para o mesmo
   profissional; impedir agendamento de serviço inativo; exigir duração positiva.
3. Classificação:

| Situação | Classificação |
| --- | --- |
| E-mail sem @ | Validação sintática: formato |
| Preço negativo | Regra de negócio: limite permitido para o preço |
| Conflito de horário | Regra de negócio |
| CPF com quantidade errada de dígitos | Validação sintática: formato |
| Serviço desativado sendo agendado | Regra de negócio |

## Seção 4 - Runtime

1. Navegador e Node.js oferecem uma API de console ao JavaScript. Por isso
   `console.log` pode existir nos dois ambientes, embora sua implementação e
   o destino da saída sejam definidos por cada ambiente.
2. No REPL do ambiente usado para preparar a atividade, `process.version`
   retornou `'v24.19.0'`, a versão do Node, e `process.platform` retornou
   `'linux'`, a plataforma de execução. Para conferir na sua máquina, execute
   `node`, digite essas duas expressões e use `.exit` para sair. O resultado
   da plataforma pode ser diferente, como `'win32'` no Windows.
3. Três recursos do Node: acessar arquivos do servidor, aceitar conexões de
   rede e ler variáveis de ambiente do processo. Uma página comum no navegador
   não tem os mesmos acessos gerais ao sistema operacional.

## Seção 6 - Variáveis e escopo

1. Antes: `var serviceName = 'Consulta'; var availableSlots = 10;`.
   Depois: `const serviceName = 'Consulta'; let availableSlots = 10;`.
   O nome não é reatribuído; a quantidade muda quando uma vaga é ocupada.
2. O código cria `const service = { name: 'Consulta', durationMinutes: 45,
   active: true }` e altera apenas `service.active = false`.
3. `const` impede reatribuir a variável, mas não torna imutáveis as propriedades
   do objeto ao qual ela se refere.

## Seção 7 - Tipos e comparações

1. Os cinco pares executados produzem:

| Operandos | Resultado com == | Resultado com === |
| --- | --- | --- |
| `0` e `'0'` | true | false |
| `false` e `0` | true | false |
| `null` e `undefined` | true | false |
| `''` e `0` | true | false |
| `1` e `true` | true | false |

## Seção 8 - Strings e conversão

1. O template literal gera `Consulta: R$ 150.00, 45 minutos.` utilizando
   nome, preço e duração do objeto.
2. `Number('19.90')` produz um número. `toFixed(2)` formata esse valor como
   a string `'19.90'`, com duas casas decimais.
3. `parseInt('10min', 10)` lê o prefixo inteiro e retorna 10.
   `Number('10min')` tenta converter o conteúdo completo e retorna `NaN`.

## Seção 9 - Operadores

1. `person.contact?.phone` retorna `undefined` se `contact` não existir,
   sem tentar acessar uma propriedade de `undefined`.
2. `0 || 20` retorna 20, pois zero é falsy. `0 ?? 20` retorna zero,
   pois `??` só utiliza a alternativa para `null` ou `undefined`.
3. `priceLabelBefore` utiliza um ternário aninhado. `priceLabelAfter` utiliza
   `if`, `else if` e `else`. As duas versões são executadas com preços 0, 80
   e 150, retornando Gratuito, Econômico e Padrão. A segunda deixa cada
   condição mais visível.

## Seção 10 - Controle de fluxo

1. `canSchedule` retorna `false` imediatamente para serviço ausente/inativo
   ou duração inválida/não positiva. Retorna `true` para o caso válido.
2. `getRoleLabel` usa `switch`: ADMIN corresponde a Administrador,
   PROFESSIONAL a Profissional e CUSTOMER a Cliente. O `default` trata
   um perfil desconhecido.
3. `canScheduleBefore` contém três `if` aninhados. A versão `canSchedule`
   antecipa os retornos das condições inválidas. O programa executa as duas
   com serviço ausente, inativo, duração zero e um caso válido, mantendo
   os mesmos resultados com menos níveis de indentação.

## Seção 11 - Funções

1. `calculateEndTime(startMinutes, durationMinutes)` retorna a soma dos
   argumentos, sem ler variáveis externas. Para 840 e 45, retorna 885,
   equivalente a 14h45 em minutos contados a partir da meia-noite.
2. `formatService` retorna uma string com nome, preço e duração. O objeto
   recebido é apenas lido e permanece inalterado.
3. Ambas são determinísticas e não fazem I/O. O cálculo é o mais simples
   de testar, pois compara números. A formatação também é simples, mas exige
   conferir a string esperada.

## Seção 12 - Closures e estado

1. `createSequence(start)` mantém um contador no seu escopo e retorna a
   função `next`. Com início 10, as três primeiras chamadas retornam 10, 11 e 12.
2. Quando o processo Node.js é encerrado, o estado em memória é perdido.
   Um novo processo cria um contador novo.
3. Duas instâncias do backend são processos com memórias independentes.
   Portanto, seus contadores não são automaticamente compartilhados.

## Seção 13 - Arrays

O array usado possui Consulta (150, ativa), Retorno (80, inativo) e Avaliação
(120, ativa).

1. `filter` com atividade e preço maior que 100 retorna Consulta e Avaliação.
2. `map(({ id, name }) => ({ id, name }))` retorna três objetos com apenas ID e nome.
3. `some((service) => !service.active)` retorna `true`, pois Retorno está inativo.
4. `reduce` soma 350; dividindo pelos três registros, a média é aproximadamente
   116,67. O código também protege o caso de coleção vazia, retornando zero.


## Seção 21 - Validação nas fronteiras

1. `validateServiceInput` valida nome textual não vazio, preço finito não
   negativo e duração inteira positiva antes de aceitar o serviço.
2. O validador indica `Entrada inválida` quando um campo não atende ao
   contrato. Depois disso, `service.js` verifica a coleção: um nome válido
   já existente gera `Regra de negócio: serviço com este nome já existe.`
3. Os cinco casos executados são: nome vazio, nome numérico, preço -1,
   duração zero e duração 1,5. Todos são rejeitados com mensagens de validação.
   A duplicidade é demonstrada separadamente, usando uma entrada válida.
