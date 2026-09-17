import { createServiceRepository } from "./modules/services/service-repository.js";
import { createServiceService } from "./modules/services/service-service.js";

const repository = createServiceRepository();
const serviceService = createServiceService(repository);

try {
  serviceService.createService({
    name: "Consulta",
    durationMinutes: "45",
    price: 150
  });

  serviceService.createService({
    name: "Avaliação",
    durationMinutes: 30,
    price: 100
  });

  console.log("Busca:", serviceService.findServiceByName("CONSULTA"));
  console.log("Todos:", serviceService.listServices());

  serviceService.deactivateService(1);

  console.log("Ativos:", serviceService.listActiveServices());
  console.log("Média:", serviceService.averageActivePrice());
} catch (error) {
  console.error("Erro:", error.message);
}
