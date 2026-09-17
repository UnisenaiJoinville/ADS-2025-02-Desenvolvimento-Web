import path from "node:path";
import { readFile } from "node:fs/promises";
import { sum, subtract } from "./math.js";
import { validateServiceInput } from "../src/modules/services/service-validator.js";

function showTitle(title) {
  console.log(`\n${title}`);
}

showTitle("Atividade 6 - Variáveis e escopo");

const serviceName = "Consulta";
let availableSlots = 10;
availableSlots -= 1;

const service = {
  name: serviceName,
  durationMinutes: 45,
  active: true,
};

service.active = false;
console.log({ service, availableSlots });

showTitle("Atividade 7 - Tipos e comparações");

const comparisons = [
  { expression: '0 == "0"', result: 0 == "0" },
  { expression: '0 === "0"', result: 0 === "0" },
  { expression: "false == 0", result: false == 0 },
  { expression: "false === 0", result: false === 0 },
  { expression: "null == undefined", result: null == undefined },
];

console.table(comparisons);

function validateDiscountPercentage(value) {
  if (value === null || value === undefined) {
    throw new Error("O desconto deve ser informado");
  }

  return value;
}

console.log("Desconto aceito:", validateDiscountPercentage(0));

const invalidNumber = Number("abc");
console.log("Number('abc') é NaN:", Number.isNaN(invalidNumber));

showTitle("Atividade 8 - Strings e conversões");

const formattedMessage = `Serviço: Consulta, preço: R$ ${150.5.toFixed(2)}, duração: 45 minutos.`;
const convertedPrice = Number("19.90");

console.log(formattedMessage);
console.log("Preço convertido:", convertedPrice.toFixed(2));
console.log("parseInt:", parseInt("10min", 10));
console.log("Number:", Number("10min"));

showTitle("Atividade 9 - Operadores modernos");

const person = { name: "Ana" };
const phone = person.contact?.phone;

console.log("Telefone:", phone);
console.log("0 || 20:", 0 || 20);
console.log("0 ?? 20:", 0 ?? 20);

function getAgeGroup(age) {
  if (age < 12) {
    return "Criança";
  }

  if (age < 18) {
    return "Adolescente";
  }

  return "Adulto";
}

console.log("Faixa etária:", getAgeGroup(20));

showTitle("Atividade 10 - Controle de fluxo");

function canSchedule(selectedService, durationMinutes) {
  if (!selectedService.active) {
    return false;
  }

  if (durationMinutes <= 0) {
    return false;
  }

  return true;
}

function getProfileLabel(profile) {
  switch (profile) {
    case "ADMIN":
      return "Administrador";
    case "PROFESSIONAL":
      return "Profissional";
    case "CUSTOMER":
      return "Cliente";
    default:
      return "Perfil desconhecido";
  }
}

function canConfirmAppointment(user, selectedService, hasAvailableTime) {
  if (!user) {
    return false;
  }

  if (!selectedService.active) {
    return false;
  }

  if (!hasAvailableTime) {
    return false;
  }

  return true;
}

console.log("Pode agendar:", canSchedule({ active: true }, 45));
console.log("Perfil:", getProfileLabel("PROFESSIONAL"));
console.log(
  "Pode confirmar:",
  canConfirmAppointment({ id: 1 }, { active: true }, true),
);

showTitle("Atividade 11 - Funções");

function calculateEndTime(startMinutes, durationMinutes) {
  return startMinutes + durationMinutes;
}

function formatService(serviceToFormat) {
  return `${serviceToFormat.name} - R$ ${serviceToFormat.price.toFixed(2)}`;
}

console.log("Término em minutos:", calculateEndTime(840, 45));
console.log("Serviço formatado:", formatService({ name: "Consulta", price: 150 }));

showTitle("Atividade 12 - Closures e estado");

function createSequence(start) {
  let currentValue = start;

  return function nextNumber() {
    const result = currentValue;
    currentValue += 1;
    return result;
  };
}

const nextId = createSequence(10);
console.log(nextId(), nextId(), nextId());

showTitle("Atividade 13 - Arrays");

const services = [
  { id: 1, name: "Consulta", active: true, price: 150 },
  { id: 2, name: "Retorno", active: false, price: 80 },
  { id: 3, name: "Avaliação", active: true, price: 120 },
];

const activeAboveOneHundred = services.filter(
  (item) => item.active && item.price > 100,
);
const serviceNames = services.map(({ id, name }) => ({ id, name }));
const hasInactiveService = services.some((item) => !item.active);
const averagePrice =
  services.reduce((total, item) => total + item.price, 0) / services.length;

function paginate(items, page, pageSize) {
  if (!Number.isInteger(page) || page <= 0) {
    throw new Error("A página deve ser um número inteiro positivo");
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error("O tamanho da página deve ser um número inteiro positivo");
  }

  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

const twentyFiveItems = Array.from({ length: 25 }, (_, index) => index + 1);

console.log("Ativos acima de R$ 100:", activeAboveOneHundred);
console.log("IDs e nomes:", serviceNames);
console.log("Existe inativo:", hasInactiveService);
console.log("Preço médio:", averagePrice.toFixed(2));
console.log("Página 2:", paginate(twentyFiveItems, 2, 10));

showTitle("Atividade 14 - Objetos");

const detailedService = {
  id: 10,
  name: "Consulta inicial",
  price: 150,
  internalNote: "Uso interno",
};
const { name, price } = detailedService;
const updatedService = { ...detailedService, price: 160 };
const { internalNote, ...publicService } = detailedService;

console.log({ name, price });
console.log("Preço atualizado:", updatedService);
console.log("Objeto público:", publicService);

showTitle("Atividade 15 - JSON");

const jsonText = JSON.stringify({
  service: "Consulta",
  professional: "Ana",
});

console.log(jsonText);

try {
  JSON.parse('{ "name": "Consulta", }');
} catch (error) {
  console.log("JSON inválido:", error.message);
}

showTitle("Atividade 16 - ES Modules");

console.log("Soma:", sum(8, 4));
console.log("Subtração:", subtract(8, 4));
console.log("Extensão do arquivo:", path.extname("dados/services.json"));

showTitle("Atividade 17 - Tratamento de erros");

function validatePrice(value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("O preço deve ser um número maior ou igual a zero");
  }

  return value;
}

try {
  validatePrice(-50);
} catch (error) {
  console.log("Não foi possível cadastrar o preço:", error.message);
}

showTitle("Atividade 18 - Async e await");

async function loadServices(fileUrl) {
  const content = await readFile(fileUrl, "utf8");
  return JSON.parse(content);
}

async function doubleResolvedValue() {
  const value = await Promise.resolve(42);
  return value * 2;
}

const loadedServices = await loadServices(new URL("./services.json", import.meta.url));
console.log("Serviços do arquivo:", loadedServices);

try {
  await loadServices(new URL("./arquivo-inexistente.json", import.meta.url));
} catch (error) {
  console.log("Não foi possível ler o arquivo:", error.code);
}

console.log("Dobro de 42:", await doubleResolvedValue());

showTitle("Atividade 19 - Processo e configuração");

const [, , receivedName = "Consulta", rawDuration = "45"] = process.argv;
const receivedDuration = Number(rawDuration);
const appEnvironment = process.env.APP_ENV ?? "development";

console.log({
  name: receivedName,
  durationMinutes: receivedDuration,
  appEnvironment,
});

showTitle("Atividade 20 - Clean code");

function calculateCommission(saleValue, commissionPercentage) {
  return saleValue * (commissionPercentage / 100);
}

function validatePositiveDuration(durationMinutes) {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("A duração deve ser um número inteiro positivo");
  }
}

function createAppointment(durationMinutes) {
  validatePositiveDuration(durationMinutes);
  return { durationMinutes, status: "SCHEDULED" };
}

const activeServiceName = "Consulta inicial";
console.log("Comissão:", calculateCommission(1000, 5));
console.log("Agendamento:", createAppointment(45));
console.log("Serviço ativo:", activeServiceName);

showTitle("Atividade 21 - Validação");

const invalidInputs = [
  { name: "", durationMinutes: 45, price: 100 },
  { name: "Consulta", durationMinutes: 0, price: 100 },
  { name: "Consulta", durationMinutes: 10.5, price: 100 },
  { name: "Consulta", durationMinutes: 45, price: -1 },
  { name: "Consulta", durationMinutes: 45, price: "abc" },
];

for (const input of invalidInputs) {
  try {
    validateServiceInput(input);
  } catch (error) {
    console.log("Entrada rejeitada:", error.message);
  }
}
