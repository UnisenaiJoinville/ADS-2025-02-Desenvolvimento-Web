import {
  createService,
  deactivateService,
  getActiveServicesSummary,
  listActiveServices,
  listServices,
} from "./modules/services/service-service.js";

const servicesToCreate = [
  { name: "Consulta inicial", durationMinutes: 45, price: 150 },
  { name: "Corte de cabelo", durationMinutes: 30, price: 60 },
  { name: "Manicure", durationMinutes: 40, price: 45 },
  { name: "Massagem relaxante", durationMinutes: 60, price: 180 },
  { name: "Depilação", durationMinutes: 30, price: 90 },
  { name: "Limpeza de pele", durationMinutes: 50, price: 120 },
  { name: "Sobrancelha", durationMinutes: 20, price: 35 },
  { name: "Escova progressiva", durationMinutes: 90, price: 250 },
];

for (const input of servicesToCreate) {
  const service = createService(input);
  console.log("Serviço criado:", service.name);
}

console.log("\nTotal de serviços cadastrados:", listServices().length);

const [primeiro] = listServices();
deactivateService(primeiro.id);
console.log(`\nServiço "${primeiro.name}" desativado.`);

console.log("Serviços ativos:", listActiveServices().length);
console.log("Resumo dos ativos:", getActiveServicesSummary());

console.log("\n--- Provocando erros de propósito ---");

try {
  createService({ name: "   ", durationMinutes: 30, price: 50 });
} catch (error) {
  console.error("Erro esperado (nome vazio):", error.message);
}

try {
  createService({ name: "Corte de Cabelo", durationMinutes: 30, price: 60 });
} catch (error) {
  console.error("Erro esperado (nome duplicado, case insensitive):", error.message);
}

try {
  createService({ name: "Serviço inválido", durationMinutes: 0, price: -10 });
} catch (error) {
  console.error("Erro esperado (duração inválida):", error.message);
}