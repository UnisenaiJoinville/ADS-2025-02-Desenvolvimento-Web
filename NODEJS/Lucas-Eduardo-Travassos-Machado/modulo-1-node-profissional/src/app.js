import { createService } from "./modules/services/service-service.js";

try {
    const service = createService({
        name: "Consulta inicial",
        durationMinutes: 45,
    });
    console.log("Serviço criado:", service);
} catch (error) {
    console.error("Não foi possível criar o serviço", error.message);
}