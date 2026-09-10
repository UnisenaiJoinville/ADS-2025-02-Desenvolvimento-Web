import {
  createService,
  listAllServices,
  listActiveServices,
  deactivateService,
  getActiveServicesSummary,
  searchServicesByName,
  listServicesSortedByPrice,
} from "./modules/services/service-service.js";

console.log("=== 1) Cadastrando 8 serviços válidos ===");
const seed = [
  { name: "Consulta inicial", durationMinutes: 45, price: 150 },
  { name: "Retorno", durationMinutes: 20, price: 80 },
  { name: "Avaliação física", durationMinutes: 60, price: 120 },
  { name: "Exame de rotina", durationMinutes: 30, price: 60 },
  { name: "Sessão de fisioterapia", durationMinutes: 50, price: 100 },
  { name: "Nutrição - primeira consulta", durationMinutes: 40, price: 130 },
  { name: "Psicologia - sessão", durationMinutes: 50, price: 140 },
  { name: "Odontologia - limpeza", durationMinutes: 35, price: 90 },
];

const createdServices = [];
for (const item of seed) {
  const service = createService(item);
  createdServices.push(service);
  console.log(`Criado: ${service.name} (id: ${service.id})`);
}

console.log("\n=== 2) Listando todos os serviços ===");
console.table(listAllServices().map(({ id, ...rest }) => rest));

console.log("\n=== 3) Desativando o segundo serviço criado ===");
const deactivated = deactivateService(createdServices[1].id);
console.log("Desativado:", deactivated.name, "-> active:", deactivated.active);

console.log("\n=== 4) Listando apenas serviços ativos ===");
console.table(listActiveServices().map(({ id, ...rest }) => rest));

console.log("\n=== 5) Resumo de serviços ativos (contagem + preço médio) ===");
console.log(getActiveServicesSummary());

console.log("\n=== 6) Busca textual por 'consulta' ===");
console.table(searchServicesByName("consulta").map(({ id, ...rest }) => rest));

console.log("\n=== 7) Ordenação por preço (crescente) sem alterar o array original ===");
console.table(listServicesSortedByPrice("asc").map(({ id, ...rest }) => rest));

console.log("\n=== 8) Provocando 3 erros intencionalmente ===");

// Erro 1: nome vazio (validação sintática)
try {
  createService({ name: "   ", durationMinutes: 30, price: 50 });
} catch (error) {
  console.error(`[Erro 1 - ${error.code}]`, error.message);
}

// Erro 2: nome duplicado, ignorando maiúsculas/minúsculas (regra de negócio)
try {
  createService({ name: "consulta inicial", durationMinutes: 30, price: 50 });
} catch (error) {
  console.error(`[Erro 2 - ${error.code}]`, error.message);
}

// Erro 3: duração inválida (validação sintática)
try {
  createService({ name: "Serviço novo", durationMinutes: -10, price: 50 });
} catch (error) {
  console.error(`[Erro 3 - ${error.code}]`, error.message);
}

console.log("\nFim da execução. Rode com: npm start (ou npm run dev para live-reload)");
