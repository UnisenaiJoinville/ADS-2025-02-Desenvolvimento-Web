import {
  createService,
  findServiceByName,
  listServices,
  deactivateService,
  getAveragePriceOfActiveServices,
} from "./modules/services/service-service.js";

function readPort() {
  const port = Number(process.env.PORT ?? 3000);
  console.log(`Aplicação configurada para a porta ${port}`);
}

async function loadInitialData() {
  return Promise.resolve("dados carregados");
}

try {
  createService({ name: "Consulta", durationMinutes: 45, price: 150 });
  createService({ name: "consulta", durationMinutes: 30, price: 100 }); // deve falhar: nome duplicado (case-insensitive)
  createService({ name: "", durationMinutes: 50, price: 90 }); // deve falhar: nome vazio
  createService({ name: "Avaliação", durationMinutes: -10, price: 120 }); // deve falhar: duração inválida
} catch (error) {
  console.error(`Não foi possível cadastrar o serviço: ${error.message}`);
}

const servico = findServiceByName("CONSULTA");
if (servico) {
  console.log(`${servico.name} encontrado.`);
}

try {
  deactivateService(1);
} catch (error) {
  console.error(error.message);
}

console.log(listServices());
console.log(`Média: ${getAveragePriceOfActiveServices()}`);

readPort();

const resultado = await loadInitialData();
console.log(resultado);
