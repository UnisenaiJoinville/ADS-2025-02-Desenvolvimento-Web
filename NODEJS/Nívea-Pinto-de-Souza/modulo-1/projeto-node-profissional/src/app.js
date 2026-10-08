import {
  createService,
  deactivateService,
  getActiveServicesSummary,
  listActiveServices,
  listServices,
  searchServices,
  sortServicesByPrice,
} from "./modules/services/service-service.js";

const testServices = [
  { name: "Consulta inicial", durationMinutes: 45, price: 150 },
  { name: "Retorno", durationMinutes: 30, price: 80 },
  { name: "Avaliação", durationMinutes: 60, price: 120 },
  { name: "Orientação", durationMinutes: 40, price: 100 },
  { name: "Consulta premium", durationMinutes: 90, price: 250 },
  { name: "Triagem", durationMinutes: 20, price: 60 },
  { name: "Acompanhamento", durationMinutes: 50, price: 140 },
  { name: "Revisão", durationMinutes: 35, price: 90 },
];

for (const input of testServices) createService(input);

const firstId = listServices()[0].id;
deactivateService(firstId);

console.log("Todos:", listServices());
console.log("Ativos:", listActiveServices());
console.log("Resumo:", getActiveServicesSummary());
console.log("Busca por consulta:", searchServices("consulta"));
console.log("Ordenados por preço:", sortServicesByPrice("asc"));

const invalidInputs = [
  { name: "", durationMinutes: 45, price: 100 },
  { name: "Preço negativo", durationMinutes: 45, price: -1 },
  { name: "Consulta inicial", durationMinutes: 45, price: 150 },
];

for (const input of invalidInputs) {
  try {
    createService(input);
  } catch (error) {
    console.log("Erro provocado:", error.message);
  }
}
