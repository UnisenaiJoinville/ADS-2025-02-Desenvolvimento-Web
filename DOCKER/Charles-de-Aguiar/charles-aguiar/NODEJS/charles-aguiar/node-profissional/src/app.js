

import { validatePrice } from "./service-validator.js";
import { readFile } from "node:fs/promises";
import { validateServiceInputCompleto } from "./service-validator.js";


console.log("Alterado em tempo real!");

//6 -  EXERCÍCIO DE FIXAÇÃO — Variáveis e escopo

// 1. Reescreva um exemplo com var utilizando const/let de forma adequada.
// Código ruim antigo com var:
// var idade = 20;
// var nome = "Charles";

// Código corrigido e moderno:
let idade = 31; // let porque a idade muda ao longo do tempo (variável)
const nome = "Charles Aguiar"; // const porque o nome não muda (constante)


// 2. Crie uma constante service com name, durationMinutes e active. Depois altere apenas active.
const service = {
  name: "Desenvolvimento Web",
  durationMinutes: 120,
  active: true
};

// Alterando apenas a propriedade 'active'
service.active = false;

console.log("Serviço alterado:", service);


// 3. Explique por que const service = {} não torna service imutável.
/*
RESPOSTA: 
O uso do 'const' impede apenas que você substitua o OBJETO INTEIRO 
(ou seja, você não pode fazer service = "outro texto" ou service = { outro: "objeto" }).

Porém, as propriedades de dentro do objeto (como .name ou .active) 
continuam livres para serem alteradas, adicionadas ou removidas. 
O 'const' protege a "caixa" (a referência na memória), mas não o conteúdo de dentro dela.
*/

//7 - EXERCÍCIO DE FIXAÇÃO — Tipos e comparações

// 1. Execute cinco comparações com == e === e explique os resultados.
console.log("--- Exercício 1 ---");

console.log(5 == "5");   // true -> O '==' converte o texto para número antes de comparar.
console.log(5 === "5");  // false -> O '===' exige que os TIPOS sejam iguais (número vs string).

console.log(1 == true);  // true -> O '==' converte o booleano true para o número 1.
console.log(1 === true); // false -> Tipos diferentes (número vs booleano).

console.log(null == undefined);   // true -> Para o '==', null e undefined são considerados equivalentes.
console.log(null === undefined);  // false -> São tipos primitivos totalmente diferentes na memória.


// 2. Crie uma validação que aceite o valor 0 para discountPercentage, mas rejeite null e undefined.
console.log("\n--- Exercício 2 ---");

function validarDesconto(discountPercentage) {
  // Se for estritamente igual a null ou undefined, rejeita
  if (discountPercentage === null || discountPercentage === undefined) {
    console.log(`Valor (${discountPercentage}): Desconto Inválido! (Rejeitado)`);
  } else {
    console.log(`Valor (${discountPercentage}): Desconto Aceito com sucesso!`);
  }
}

validarDesconto(0);         // Deve aceitar
validarDesconto(15);        // Deve aceitar
validarDesconto(null);      // Deve rejeitar
validarDesconto(undefined); // Deve rejeitar


// 3. Use Number.isNaN para verificar o resultado de Number("abc").
console.log("\n--- Exercício 3 ---");

const resultadoConversao = Number("abc"); // Tentar converter texto em número gera um NaN (Not a Number)
const eNaN = Number.isNaN(resultadoConversao);

console.log("Resultado de Number('abc'):", resultadoConversao); // NaN
console.log("O resultado é realmente um NaN?", eNaN); // true


//8 - EXERCÍCIO DE FIXAÇÃO — Strings e conversão

// 1. Monte uma mensagem usando template literal com nome, preço e duração de um serviço.
console.log("\n--- Exercício 1 (Strings) ---");

const nomeServico = "Corte de Cabelo";
const precoServico = 45.00;
const duracaoMinutos = 30;

// Utilizando crases (`) para montar o template literal
const mensagemServico = `O serviço de ${nomeServico} custa R$ ${precoServico.toFixed(2)} e tem a duração de ${duracaoMinutos} minutos.`;
console.log(mensagemServico);


// 2. Converta "19.90" para number e formate o resultado com duas casas decimais.
console.log("\n--- Exercício 2 (Strings) ---");

const precoTexto = "19.90";
const precoNumero = Number(precoTexto); // Conversão explícita para número

console.log("Tipo convertido:", typeof precoNumero); // Mostra que agora é um 'number'
console.log("Preço formatado: R$", precoNumero.toFixed(2)); // Formata com duas casas decimais


// 3. Demonstre por que parseInt("10min", 10) e Number("10min") produzem comportamentos diferentes.
console.log("\n--- Exercício 3 (Strings) ---");

const resultadoParseInt = parseInt("10min", 10);
const resultadoNumber = Number("10min");

console.log('Resultado do parseInt("10min", 10):', resultadoParseInt); // Retorna 10
console.log('Resultado do Number("10min"):', resultadoNumber);         // Retorna NaN

/*
EXPLICAÇÃO:
- O 'parseInt' analisa o texto da esquerda para a direita. Se ele encontra um número no início, 
  ele extrai esse número e ignora o restante dos caracteres não numéricos (como o "min").
- O 'Number' é muito mais rigoroso. Ele tenta converter a string inteira de uma vez só. 
  Como a string contém letras ("min"), ele falha completamente e retorna NaN (Not a Number).
*/


//9 - EXERCÍCIO DE FIXAÇÃO — Operadores

// 1. Use optional chaining para acessar person.contact.phone sem gerar erro quando contact não existir.
console.log("\n--- Exercício 1 (Operadores) ---");

const personSemContato = { name: "Charles" }; // Não possui a propriedade 'contact'

// O uso de '?.' impede o crash do sistema e retorna amigavelmente 'undefined'
const telefone = personSemContato.contact?.phone;
console.log("Telefone encontrado:", telefone); // undefined


// 2. Compare o resultado de 0 || 20 e 0 ?? 20.
console.log("\n--- Exercício 2 (Operadores) ---");

const resultadoOu = 0 || 20;
const resultadoNullish = 0 ?? 20;

console.log("Resultado de (0 || 20):", resultadoOu);       // 20
console.log("Resultado de (0 ?? 20):", resultadoNullish);  // 0

/*
EXPLICAÇÃO:
- O operador '||' avalia se o valor é "falsy" (falso, nulo, vazio ou o número 0). Como o 0 é falsy, ele descarta o 0 e pega o 20.
- O operador '??' avalia apenas se o valor é estritamente 'null' ou 'undefined'. Como o 0 é um número válido, ele o mantém.
*/


// 3. Reacrescreva um ternário aninhado usando if/else e avalie qual versão é mais legível.
console.log("\n--- Exercício 3 (Operadores) ---");

const notaAluno = 8;

// Versão RUIM e confusa (Ternário Aninhado):
const resultadoTernario = notaAluno >= 7 ? "Aprovado" : notaAluno >= 5 ? "Recuperação" : "Reprovado";
console.log("Resultado via Ternário:", resultadoTernario);

// Versão CORRIGIDA e legível (usando if/else):
let resultadoFinal = "";

if (notaAluno >= 7) {
  resultadoFinal = "Aprovado";
} else if (notaAluno >= 5) {
  resultadoFinal = "Recuperação";
} else {
  resultadoFinal = "Reprovado";
}

console.log("Resultado via If/Else:", resultadoFinal);

/*
AVALIAÇÃO DE LEGIBILIDADE:
A versão com 'if/else' é infinitamente mais legível. O ternário aninhado agrupa muitas condicionais 
na mesma linha, dificultando a leitura, a manutenção e a identificação de regras de negócio complexas.
*/


// 10 - EXERCÍCIO DE FIXAÇÃO — Controle de fluxo

// 1. Crie uma função canSchedule que rejeite serviço inativo e duração menor ou igual a zero usando early return.
console.log("\n--- Exercício 1 (Controle de fluxo) ---");

function canSchedule(serviceActive, durationMinutes) {
  // Early returns: validam as condições inválidas logo no início da função
  if (!serviceActive) {
    throw new Error("Agendamento rejeitado: O serviço está inativo.");
  }

  if (durationMinutes <= 0) {
    throw new Error("Agendamento rejeitado: A duração deve ser maior que zero.");
  }

  // Caminho principal limpo se todas as validações passarem
  return "Agendamento pode ser realizado com sucesso!";
}

// Testando a função
try {
  console.log(canSchedule(true, 45)); // Sucesso
  console.log(canSchedule(false, 30)); // Vai disparar o erro de inativo
} catch (error) {
  console.error(error.message);
}


// 2. Implemente um switch para os perfis ADMIN, PROFESSIONAL e CUSTOMER.
console.log("\n--- Exercício 2 (Controle de fluxo) ---");

function obterPermissaoPerfil(perfil) {
  switch (perfil) {
    case "ADMIN":
      return "Acesso total ao sistema configurado.";
    case "PROFESSIONAL":
      return "Acesso à visualização e edição de agendas profissionais.";
    case "CUSTOMER":
      return "Acesso apenas para realização e consulta de agendamentos.";
    default:
      return "Perfil desconhecido ou não identificado.";
  }
}

console.log(obterPermissaoPerfil("ADMIN"));
console.log(obterPermissaoPerfil("CUSTOMER"));
console.log(obterPermissaoPerfil("ESTUDANTE")); // Cai no default


// 3. Refatore uma sequência de três ifs aninhados para reduzir a profundidade.
console.log("\n--- Exercício 3 (Controle de fluxo) ---");

// Código antigo RUIM (Aninhado/Profundo):
/*
if (usuarioLogado) {
  if (possuiSaldo) {
    if (horarioDisponivel) {
      realizarAgendamento();
    }
  }
}
*/

// Código NOVO LIMPO (Refatorado usando Cláusulas de Guarda / Early Return):
function processarAgendamento(usuarioLogado, possuiSaldo, horarioDisponivel) {
  if (!usuarioLogado) return "Erro: Usuário precisa estar logado.";
  if (!possuiSaldo) return "Erro: Saldo insuficiente para o agendamento.";
  if (!horarioDisponivel) return "Erro: Horário selecionado não está mais disponível.";

  // Caminho principal livre de aninhamentos profundos
  return "Agendamento processado com sucesso!";
}

console.log(processarAgendamento(true, true, true));  // Sucesso
console.log(processarAgendamento(true, false, true)); // Erro de saldo


//11 -  EXERCÍCIO DE FIXAÇÃO — Funções

// 1. Crie uma função calculateEndTime(startMinutes, durationMinutes) sem acessar variáveis externas.
console.log("\n--- Exercício 1 (Funções) ---");

function calculateEndTime(startMinutes, durationMinutes) {
  // Função pura: depende apenas dos parâmetros recebidos
  return startMinutes + durationMinutes;
}

const fimAgendamento = calculateEndTime(540, 60); // Ex: 09:00 (540min) + 1h (60min)
console.log("Minuto final do agendamento:", fimAgendamento); // 600


// 2. Crie uma função formatService que retorna uma string e não altere o objeto recebido.
console.log("\n--- Exercício 2 (Funções) ---");

function formatService(serviceObj) {
  // Retorna uma nova string sem fazer nenhuma mutação/alteração nas propriedades do objeto original
  return `Serviço: ${serviceObj.name} | Duração: ${serviceObj.durationMinutes}min | Status: ${serviceObj.active ? "Ativo" : "Inativo"}`;
}

const meuServico = { name: "Barba Completa", durationMinutes: 45, active: true };
const stringFormatada = formatService(meuServico);

console.log(stringFormatada);
console.log("Objeto original continua idêntico:", meuServico); // Prova de imutabilidade


// 3. Explique qual das duas funções seria mais fácil testar e por quê.
/*
RESPOSTA:
A função 'calculateEndTime' é a mais fácil de testar. 

Motivo: Ela lida apenas com tipos de dados primitivos simples (números de entrada e número de saída). 
Para testá-la, basta passar dois números quaisquer e checar o resultado matemático esperado. 
A função 'formatService', embora também seja fácil por ser uma função pura, exige que você monte e gerencie a estrutura completa de um objeto estruturado no código do teste para que ela funcione, tornando o teste ligeiramente mais burocrático de escrever.
*/



// 12 -  EXERCÍCIO DE FIXAÇÃO — Closures e estado

// 1. Implemente createSequence(start) que retorne uma função geradora de números.
console.log("\n--- Exercício 1 (Closures) ---");

function createSequence(start) {
  let current = start; // Estado encapsulado na memória pela closure

  return function() {
    const valueToReturn = current;
    current += 1; // Incrementa para a próxima execução
    return valueToReturn;
  };
}

// Testando a sequência começando do número 10
const minhaSequencia = createSequence(10);
console.log("Primeiro número:", minhaSequencia()); // 10
console.log("Segundo número:", minhaSequencia());  // 11
console.log("Terceiro número:", minhaSequencia()); // 12


// 2. Explique o que acontece com o estado quando o processo Node.js é encerrado.
/*
RESPOSTA:
Quando o processo do Node.js é encerrado (por exemplo, ao fechar o terminal ou derrubar o servidor), 
toda a memória RAM alocada para aquela aplicação é completamente limpa pelo sistema operacional. 
Como consequência, o estado armazenado na variável 'current' ou 'value' deixa de existir e é perdido para sempre. 
Ao iniciar o servidor novamente, o contador reiniciará do valor inicial padrão ('start').
*/


// 3. Explique por que duas instâncias do backend não compartilhariam esse contador.
/*
RESPOSTA:
Cada instância do backend roda em seu próprio processo isolado do sistema operacional, possuindo seu 
próprio espaço exclusivo na memória RAM. Uma instância não consegue ler ou alterar a memória física da outra. 
Portanto, se você tiver duas instâncias da mesma aplicação rodando ao mesmo tempo, cada uma gerenciará 
uma cópia independente do contador criado pela closure, impossibilitando o compartilhamento do estado entre elas.
*/


// 13 - EXERCÍCIO DE FIXAÇÃO — Arrays

const exercicioServices = [
  { id: 1, name: "Consulta", active: true, price: 150 },
  { id: 2, name: "Retorno", active: false, price: 80 },
  { id: 3, name: "Avaliação", active: true, price: 120 },
];

// 1. Dado um array de serviços, retorne somente os ativos com preço maior que 100.
console.log("\n--- Exercício 1 (Arrays) ---");
const ativosECaros = exercicioServices.filter(service => service.active && service.price > 100);
console.log("Ativos > 100:", ativosECaros);


// 2. Gere um novo array contendo apenas { id, name }.
console.log("\n--- Exercício 2 (Arrays) ---");
const apenasIdEName = exercicioServices.map(({ id, name }) => ({ id, name }));
console.log("Apenas ID e Name:", apenasIdEName);


// 3. Verifique com some se existe algum serviço inativo.
console.log("\n--- Exercício 3 (Arrays) ---");
const temInativo = exercicioServices.some(service => !service.active);
console.log("Existe algum serviço inativo?", temInativo); // true


// 4. Calcule o preço médio dos serviços usando reduce.
console.log("\n--- Exercício 4 (Arrays) ---");
const precoTotal = exercicioServices.reduce((sum, service) => sum + service.price, 0);
const precoMedio = precoTotal / exercicioServices.length;
console.log("Preço médio:", precoMedio.toFixed(2));


// ====== DESAFIO PROFISSIONAL ======
console.log("\n--- Desafio Profissional (Paginete) ---");

// Implementação da função paginate
function paginate(items, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return items.slice(startIndex, endIndex);
}

// Criando uma lista de teste com 25 itens usando Array.from
const listaDeItens = Array.from({ length: 25 }, (_, index) => `Item ${index + 1}`);

// Testando a paginação (Ex: Página 2, com 5 itens por página)
const pagina2 = paginate(listaDeItens, 2, 5);
console.log("Itens da Página 2 (Tamanho 5):", pagina2); 
// Deve exibir: ['Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10']



// 14 -  EXERCÍCIO DE FIXAÇÃO — Objetos

const objetoOriginalService = {
  id: 10,
  name: "Corte e Barba",
  price: 60,
  durationMinutes: 45,
  internalNote: "Cliente prefere a máquina 2 nas laterais."
};

// 1. Extraia name e price de um objeto service usando destructuring.
console.log("\n--- Exercício 1 (Objetos) ---");

const { name, price } = objetoOriginalService;
console.log(`Nome extraído: ${name} | Preço extraído: R$ ${price}`);


// 2. Crie um novo objeto com spread alterando apenas price.
console.log("\n--- Exercício 2 (Objetos) ---");

const serviceComDesconto = {
  ...objetoOriginalService,
  price: 50 // Substitui apenas o valor da propriedade price
};

console.log("Novo objeto com preço alterado:", serviceComDesconto);
console.log("Preço original continua intacto:", objetoOriginalService.price); // 60


// 3. Remova uma propriedade interna chamada internalNote usando rest destructuring antes de devolver o objeto ao cliente.
console.log("\n--- Exercício 3 (Objetos) ---");

// O '...rest' (neste caso chamado de 'serviceParaCliente') agrupa todas as propriedades que sobraram
const { internalNote, ...serviceParaCliente } = objetoOriginalService;

console.log("Objeto limpo para o cliente (Sem nota interna):", serviceParaCliente);
console.log("A nota interna foi isolada com sucesso:", internalNote);


//15 -  EXERCÍCIO DE FIXAÇÃO — JSON

// 1. Converta um objeto com service e professional para JSON.
console.log("\n--- Exercício 1 (JSON) ---");

const agendamento = {
  service: "Manicure",
  professional: "Ana Silva",
  price: 50
};

// JSON.stringify converte o objeto JavaScript em uma string JSON estruturada
const agendamentoJSON = JSON.stringify(agendamento);
console.log("Objeto convertido para String JSON:", agendamentoJSON);
console.log("Tipo do resultado:", typeof agendamentoJSON); // string


// 2. Tente executar JSON.parse com um texto inválido e capture o erro.
console.log("\n--- Exercício 2 (JSON) ---");

const textoInvalido = "{ nome: Charles, preco: 100 }"; // Erro: chaves e textos precisam de aspas duplas ""

try {
  console.log("Tentando ler o JSON inválido...");
  const resultadoConst = JSON.parse(textoInvalido);
  console.log(resultadoConst);
} catch (error) {
  console.error("Capturado com sucesso! Ocorreu um erro de sintaxe:");
  console.error("Mensagem do erro:", error.message);
}


// 3. Explique por que funções e undefined não são representados normalmente em JSON.
/*
RESPOSTA:
O formato JSON (JavaScript Object Notation) foi desenhado estritamente como um formato universal 
e estático para intercâmbio e armazenamento de DADOS estruturados entre sistemas diferentes 
(ex: um backend em Node falando com um frontend ou com um sistema em Python/Java).

- FUNÇÕES contêm código executável e lógica de comportamento, e não dados estáticos. Permitir a transferência 
  de funções via JSON quebraria o propósito do formato e criaria graves falhas de segurança.
- UNDEFINED é um tipo primitivo exclusivo da linguagem JavaScript que representa a ausência de atribuição. 
  Outras linguagens não entendem o conceito de 'undefined'. Para representar a ausência de valor de forma universal, 
  o padrão JSON adota exclusivamente o valor 'null'.

Por esses motivos, ao rodar JSON.stringify, propriedades com funções ou undefined são simplesmente ignoradas ou removidas.
*/


// 16 - EXERCÍCIO DE FIXAÇÃO — ES Modules
import path from "node:path";
import { somar, subtrair } from "./math.js";
import { criarServico } from "./service.js";

// ... Exercício 17 (Tratamento de Erros) será implementado abaixo.

try {
    console.log("\n--- Exercício 17.1 (Tratamento de Erros) ---");
    
    const precoInvalido = -10; // Testando com um valor inválido
    validatePrice(precoInvalido);
    
} catch (error) {
    // Imprime a mensagem amigável para o usuário
    console.error("Mensagem Amigável: Não foi possível processar o produto. Por favor, verifique o preço digitado.");
}


console.log("\n--- Exercício 1 & 2 (ES Modules) ---");
console.log("Soma (math.js):", somar(10, 5));
console.log("Subtração (math.js):", subtrair(10, 5));

try {
  const novoServico = criarServico("Desenvolvimento Node.js", 150);
  console.log("Serviço criado com sucesso:", novoServico);
} catch (error) {
  console.error(error.message);
}

console.log("\n--- Exercício 3 (node:path) ---");
const caminhoArquivo = "/usuarios/downloads/projeto-faculdade/index.html";
console.log("Extensão extraída:", path.extname(caminhoArquivo)); // .html


// --- 18  EXERCÍCIO DE FIXAÇÃO - Async/await ---
console.log("\n--- Módulo 18 (Promises e Async/Await) ---");

async function carregarServicos() {
    try {
        const conteudo = await readFile("./services.json", "utf8");
        const dados = JSON.parse(conteudo);
        console.log("Arquivo lido com sucesso:", dados);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error("Erro: O arquivo 'services.json' não foi encontrado.");
        } else {
            console.error("Falha ao carregar serviços:", error.message);
        }
    }
}

async function calcularDobroAsync() {
    const valor = await Promise.resolve(42);
    return valor * 2;
}

// Executando as funções com Top-level await
await carregarServicos();

const resultadoDobro = await calcularDobroAsync();
console.log("Resultado do dobro da Promise (42 * 2):", resultadoDobro);


// --- 19 EXERCÍCIO DE FIXAÇÃO - Processo e Configuração ---
console.log("\n--- Módulo 19 (Process, Argumentos e Variáveis de Ambiente) ---");

// 1. Recebe name e durationMinutes via linha de comando (utilizando destructuring)
const [, , nameArg, rawDuration] = process.argv;
const durationMinutes = Number(rawDuration);

// 2. Leia APP_ENV de process.env e use "development" como padrão (Nullish coalescing)
const appEnv = process.env.APP_ENV ?? "development";

// Exibindo as configurações capturadas
console.log("Configurações Carregadas:");
console.log(`- Nome do Argumento: ${nameArg ?? "Não informado"}`);
console.log(`- Duração (em minutos): ${isNaN(durationMinutes) ? "Não informada" : durationMinutes}`);
console.log(`- Ambiente (APP_ENV): ${appEnv}`);


// --- 20 - EXERCÍCIO DE FIXAÇÃO - Clean Code Pragmático ---
console.log("\n--- Módulo 20 (Clean Code Pragmático) ---");

// 2. Extraia uma validação repetida para uma função com nome de domínio
// Evita "valores mágicos" (Regra: comissão não pode ser calculada para valores zerados ou negativos)
const VALOR_MINIMO_VALIDO_REAIS = 0;

function verificarSeValorEhValido(valorVenda) {
    return valorVenda > VALOR_MINIMO_VALIDO_REAIS;
}

// 1. Renomeie variáveis a, b e x em uma função de cálculo de comissão
// 3. Identifique um comentário que apenas repete o código e substitua-o por um nome melhor
function calcularComissaoVendedor(valorTotalVenda, taxaComissaoPercentual) {
    if (!verificarSeValorEhValido(valorTotalVenda)) {
        throw new Error("O valor da venda deve ser maior que zero para calcular a comissão.");
    }

    // COMENTÁRIO LIMPO: Decisão de negócio baseada na política interna de teto de comissão de 2026.
    const VALOR_MAXIMO_COMISSAO_REAIS = 5000;

    const valorComissaoCalculado = valorTotalVenda * (taxaComissaoPercentual / 100);

    // Substituído o comentário redundante usando a função Math.min para limitar ao teto máximo
    const valorComissaoFinal = Math.min(valorComissaoCalculado, VALOR_MAXIMO_COMISSAO_REAIS);

    return valorComissaoFinal;
}

// Testando a função limpa e refatorada
try {
    const totalVenda = 10000;       // antigo 'a'
    const taxaPercentual = 5;       // antigo 'b'
    
    const comissaoFinal = calcularComissaoVendedor(totalVenda, taxaPercentual); // antigo 'x'
    console.log(`Comissão calculada com sucesso: R$ ${comissaoFinal}`);
} catch (error) {
    console.error(`Erro no domínio de comissão: ${error.message}`);
}


// --- 21 - EXERCÍCIO DE FIXAÇÃO - Validação Avançada ---
console.log("\n--- Módulo 21 (Validação de Serviços) ---");

// 3. Criar pelo menos cinco casos de entrada inválida
const casosDeTeste = [
    { cenario: "Caso 1: Nome vazio", input: { name: "", price: 100, durationMinutes: 30 } },
    { cenario: "Caso 2: Preço inválido (negativo)", input: { name: "Backup", price: -50, durationMinutes: 60 } },
    { cenario: "Caso 3: Duração inválida (texto)", input: { name: "Consultoria", price: 150, durationMinutes: "trinta" } },
    { cenario: "Caso 4: Objeto totalmente vazio", input: {} },
    { cenario: "Caso 5: Conflito (Serviço já existente)", input: { name: "Desenvolvimento Node.js", price: 200, durationMinutes: 120 } }
];

// Verificando se todos falham de forma previsível
casosDeTeste.forEach(({ cenario, input }) => {
    try {
        validateServiceInputCompleto(input);
        console.log(`X ${cenario}: Passou inesperadamente.`);
    } catch (error) {
        // Exibe o erro de forma limpa e previsível
        console.log(`V ${cenario} falhou corretamente -> Motivo: ${error.message}`);
    }
});

// Caso de Sucesso para testar o fluxo positivo
try {
    const entradaValida = { name: "Criar API Rest", price: 350, durationMinutes: 180 };
    const resultadoValido = validateServiceInputCompleto(entradaValida);
    console.log("# Caso de Sucesso: Entrada válida processada!", resultadoValido);
} catch (error) {
    console.error("X O caso de sucesso falhou:", error.message);
}


// Garanta que estas importações estão no topo do seu app.js, se não estiverem, cole-as aqui:
import { 
    createService, 
    listAllServices, 
    deactivateService, 
    calculateAveragePriceActive 
} from "./service-service.js";

console.log("\n=============================================");
console.log("🔝 EXECUTANDO TESTES DO MINIPROJETO FINAL");
console.log("=============================================");

try {
    console.log("\n1. Cadastrando 8 serviços de teste...");
    const s1 = createService({ name: "  Desenvolvimento   Web ", price: 1000, durationMinutes: 240 });
    const s2 = createService({ name: "Consultoria Educacional", price: 200, durationMinutes: 60 });
    const s3 = createService({ name: "Hospedagem Dedicada", price: 150, durationMinutes: 30 });
    const s4 = createService({ name: "Suporte Técnico", price: 80, durationMinutes: 45 });
    const s5 = createService({ name: "Design de Interface", price: 600, durationMinutes: 120 });
    const s6 = createService({ name: "Auditoria de Segurança", price: 1500, durationMinutes: 300 });
    const s7 = createService({ name: "Otimização de SEO", price: 400, durationMinutes: 90 });
    const s8 = createService({ name: "Mentoria Individual", price: 300, durationMinutes: 60 });

    console.log(`V Cadastrados ${listAllServices().length} serviços com sucesso!`);
    console.log("\n¥ Média inicial dos serviços ativos:", calculateAveragePriceActive());

    console.log(`\n❌ Desativando o serviço: "${s3.name}"`);
    deactivateService(s3.id);

    console.log("# Nova média após desativação (deve mudar):", calculateAveragePriceActive());

    console.log("\n2. Provocando 3 erros intencionais para validação...");
    try {
        createService({ name: "suporte técnico", price: 100, durationMinutes: 60 });
    } catch (error) {
        console.log(`❌ Erro 1 esperado: ${error.message}`);
    }
    try {
        createService({ name: "Serviço Invalido", price: -5, durationMinutes: 30 });
    } catch (error) {
        console.log(`❌ Erro 2 esperado: ${error.message}`);
    }
    try {
        deactivateService("id-falso-123");
    } catch (error) {
        console.log(`❌ Erro 3 esperado: ${error.message}`);
    }
} catch (errorGlobal) {
    console.error("Ocorreu um erro inesperado na execução do miniprojeto:", errorGlobal.message);
}
