import {
  createService,
  listAllServices,
  findServiceByName,
  deactivateService,
  getAveragePrice,
} from "./modules/services/service-service.js";

function tryCreate(input) {
  try {
    const service = createService(input);
    console.log(`cadastrado ${service.name}`);
    return service;
  } catch (error) {
    console.error(`erro ao cadastrar "${input?.name}": ${error.message}`);
    return null;
  }
}

const consulta = tryCreate({ name: "Consulta", duration: 45, price: 150 });
tryCreate({ name: "consulta", duration: 30, price: 100 }); // nome duplicado (case-insensitive)
tryCreate({ name: "", duration: 50, price: 90 }); // nome vazio
tryCreate({ name: "Avaliação", duration: -10, price: 120 }); // duração inválida

const encontrado = findServiceByName("CONSULTA");
if (encontrado) {
  console.log(`${encontrado.name} encontrado`);
}

if (consulta) {
  try {
    deactivateService(consulta.id);
    console.log(`serviço "${consulta.name}" desativado`);
  } catch (error) {
    console.error(error.message);
  }
}

console.log(listAllServices());
console.log(`Média: ${getAveragePrice().toFixed(2)}`);