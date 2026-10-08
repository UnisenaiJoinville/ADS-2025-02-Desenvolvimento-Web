import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { sum, multiply } from './math.js';
import { createService } from './service.js';
import { validatePrice, validateDuration } from './service-validator.js';

// Seções 3 e 4: respostas conceituais em Respostas-Fixacao.md.
console.log('\n4. RUNTIME');
console.log('Versão:', process.version);
console.log('Plataforma:', process.platform);

console.log('\n6. VARIÁVEIS E ESCOPO');
// Antes: var serviceName = 'Consulta'; var availableSlots = 10;
const serviceName = 'Consulta';
let availableSlots = 10;
availableSlots -= 1;
console.log({ serviceName, availableSlots });
const service = { name: 'Consulta', durationMinutes: 45, active: true };
service.active = false;
console.log('Somente active foi alterado:', service);

console.log('\n7. TIPOS E COMPARAÇÕES');
const comparisons = [[0, '0'], [false, 0], [null, undefined], ['', 0], [1, true]];
for (const [first, second] of comparisons) {
  // == é usado aqui porque o exercício pede comparar os dois operadores.
  console.log({ first, second, loose: first == second, strict: first === second });
}

function validateDiscount(discountPercentage) {
  if (!Number.isFinite(discountPercentage)
    || discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Desconto deve ser um número entre 0 e 100.');
  }
  return discountPercentage;
}

for (const value of [0, null, undefined]) {
  try {
    console.log('Desconto aceito:', validateDiscount(value));
  } catch (error) {
    console.log('Desconto recusado:', value, error.message);
  }
}
console.log('Number.isNaN(Number("abc")):', Number.isNaN(Number('abc')));

console.log('\n8. STRINGS E CONVERSÕES');
const pricedService = { name: 'Consulta', price: 150, durationMinutes: 45 };
console.log(`${pricedService.name}: R$ ${pricedService.price.toFixed(2)}, ${pricedService.durationMinutes} minutos.`);
const convertedPrice = Number('19.90');
console.log('Preço com duas casas:', convertedPrice.toFixed(2));
console.log('parseInt:', parseInt('10min', 10), 'Number:', Number('10min'));

console.log('\n9. OPERADORES');
const person = {};
console.log('Telefone:', person.contact?.phone);
console.log('0 || 20:', 0 || 20, '0 ?? 20:', 0 ?? 20);

function priceLabelBefore(price) {
  return price === 0 ? 'Gratuito' : price < 100 ? 'Econômico' : 'Padrão';
}

function priceLabelAfter(price) {
  if (price === 0) {
    return 'Gratuito';
  } else if (price < 100) {
    return 'Econômico';
  } else {
    return 'Padrão';
  }
}

for (const price of [0, 80, 150]) {
  console.log('Antes/depois:', priceLabelBefore(price), priceLabelAfter(price));
}

console.log('\n10. CONTROLE DE FLUXO');
function canSchedule(service) {
  if (!service || service.active !== true) return false;
  if (!Number.isFinite(service.durationMinutes) || service.durationMinutes <= 0) return false;
  return true;
}
console.log('Ativo:', canSchedule({ active: true, durationMinutes: 30 }));
console.log('Inativo:', canSchedule({ active: false, durationMinutes: 30 }));
console.log('Duração zero:', canSchedule({ active: true, durationMinutes: 0 }));

function getRoleLabel(role) {
  switch (role) {
    case 'ADMIN': return 'Administrador';
    case 'PROFESSIONAL': return 'Profissional';
    case 'CUSTOMER': return 'Cliente';
    default: return 'Perfil desconhecido';
  }
}
for (const role of ['ADMIN', 'PROFESSIONAL', 'CUSTOMER']) {
  console.log(role, getRoleLabel(role));
}

function canScheduleBefore(service) {
  if (service) {
    if (service.active === true) {
      if (Number.isFinite(service.durationMinutes) && service.durationMinutes > 0) {
        return true;
      }
    }
  }
  return false;
}
for (const input of [undefined, { active: false, durationMinutes: 30 },
  { active: true, durationMinutes: 0 }, { active: true, durationMinutes: 30 }]) {
  console.log('Ifs aninhados/early return:', canScheduleBefore(input), canSchedule(input));
}

console.log('\n11. FUNÇÕES');
function calculateEndTime(startMinutes, durationMinutes) {
  return startMinutes + durationMinutes;
}

function formatService(service) {
  return `${service.name}: R$ ${service.price.toFixed(2)} (${service.durationMinutes} min)`;
}
console.log('Fim em minutos:', calculateEndTime(840, 45));
console.log('Texto:', formatService(pricedService));
console.log('Objeto preservado:', pricedService);

console.log('\n12. CLOSURES E ESTADO');
function createSequence(start) {
  let nextValue = start;
  return function next() {
    const currentValue = nextValue;
    nextValue += 1;
    return currentValue;
  };
}
const next = createSequence(10);
console.log('Sequência:', next(), next(), next());
const anotherSequence = createSequence(10);
console.log('Outra sequência independente:', anotherSequence());

console.log('\n13. ARRAYS');
const services = [
  { id: 1, name: 'Consulta', price: 150, active: true },
  { id: 2, name: 'Retorno', price: 80, active: false },
  { id: 3, name: 'Avaliação', price: 120, active: true },
];
console.log('Ativos acima de 100:', services.filter((service) => service.active && service.price > 100));
console.log('ID e nome:', services.map(({ id, name }) => ({ id, name })));
console.log('Existe inativo:', services.some((service) => !service.active));
const total = services.reduce((sum, service) => sum + service.price, 0);
const average = services.length ? total / services.length : 0;
console.log('Média:', average.toFixed(2));

function paginate(items, page, pageSize) {
  if (!Number.isInteger(page) || page <= 0
    || !Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('Página e tamanho devem ser inteiros positivos.');
  }
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
const items = Array.from({ length: 25 }, (_, index) => index + 1);
console.log('Página 1:', paginate(items, 1, 10));
console.log('Página 2:', paginate(items, 2, 10));
console.log('Página 3:', paginate(items, 3, 10));

console.log('\n14. OBJETOS');
const { name, price } = pricedService;
console.log('Nome e preço:', name, price);
const updatedService = { ...pricedService, price: 175 };
console.log('Original:', pricedService, 'Novo:', updatedService);
const internalService = { ...pricedService, internalNote: 'Observação interna' };
const { internalNote, ...publicService } = internalService;
console.log('Objeto público sem internalNote:', publicService);

console.log('\n15. JSON');
const payload = JSON.stringify({ service: pricedService, professional: { name: 'Ana' } });
console.log('Texto JSON:', payload);
try {
  JSON.parse('{name: Consulta}');
} catch (error) {
  console.log('JSON inválido:', error.message);
}
console.log('Função e undefined omitidos:', JSON.stringify({ name: 'Consulta', extra: undefined, run() {} }));

console.log('\n16. ES MODULES');
console.log('math.js: soma =', sum(2, 3), 'multiplicação =', multiply(2, 3));
console.log('service.js com validador separado:', createService(pricedService));
console.log('Extensão de documentos/atividade.pdf:', extname('documentos/atividade.pdf'));

console.log('\n17. TRATAMENTO DE ERROS');
try {
  validatePrice(-10);
} catch (error) {
  console.log('Não foi possível cadastrar o serviço:', error.message);
}

console.log('\n18. ASYNC/AWAIT');
const content = await readFile(new URL('./services.json', import.meta.url), 'utf8');
console.log('Arquivo services.json:', JSON.parse(content));
try {
  await readFile(new URL('./arquivo-inexistente.json', import.meta.url), 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.log('Arquivo não encontrado. Confira o caminho informado.');
}

async function doubleResolvedValue() {
  const value = await Promise.resolve(42);
  return value * 2;
}
console.log('Dobro do resultado:', await doubleResolvedValue());

console.log('\n19. PROCESSO E CONFIGURAÇÃO');
console.log('APP_ENV:', process.env.APP_ENV ?? 'development');
console.log('Para os argumentos, execute: npm run cli -- "Consulta" 45');

console.log('\n20. CLEAN CODE');
function calculateCommission(saleAmount, commissionPercentage) {
  const commission = saleAmount * commissionPercentage / 100;
  return commission;
}
console.log('Comissão:', calculateCommission(1000, 10));

// validateDuration foi extraída para service-validator.js e é reutilizada.
function calculateAppointmentEnd(startMinutes, durationMinutes) {
  validateDuration(durationMinutes);
  return startMinutes + durationMinutes;
}
console.log('Duração validada por função extraída:', calculateAppointmentEnd(840, 45));

const discountedPrice = 150 - 150 * (10 / 100);
console.log('Nome que explica o valor:', discountedPrice);

console.log('\n21. VALIDAÇÃO NAS FRONTEIRAS');
const invalidInputs = [
  { name: '', price: 150, durationMinutes: 45 },
  { name: 123, price: 150, durationMinutes: 45 },
  { name: 'Consulta B', price: -1, durationMinutes: 45 },
  { name: 'Consulta C', price: 150, durationMinutes: 0 },
  { name: 'Consulta D', price: 150, durationMinutes: 1.5 },
];
for (const [index, input] of invalidInputs.entries()) {
  try {
    createService(input);
  } catch (error) {
    console.log(`Entrada inválida ${index + 1}:`, error.message);
  }
}
try {
  createService(pricedService);
} catch (error) {
  console.log('Nome válido, mas já cadastrado:', error.message);
}

console.log('\n23 e 26.3: execute npm start para o miniprojeto e o agendamento.');
