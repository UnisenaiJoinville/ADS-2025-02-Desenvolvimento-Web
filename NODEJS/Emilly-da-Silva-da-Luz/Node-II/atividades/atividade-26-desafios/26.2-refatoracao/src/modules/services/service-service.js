import { validateServiceInput } from "./service-validator.js";

export function createServiceService(repository) {
  return {
    createService(input) {
      const data = validateServiceInput(input);

      if (repository.findByName(data.name)) {
        throw new Error("Já existe um serviço com esse nome.");
      }

      return repository.insert(data);
    },

    findServiceByName(name) {
      if (typeof name !== "string" || !name.trim()) {
        throw new Error("O nome para busca é obrigatório.");
      }

      return repository.findByName(name);
    },

    listServices() {
      return repository.findAll();
    },

    listActiveServices() {
      return repository.findAll().filter((service) => service.active);
    },

    deactivateService(id) {
      const service = repository.findById(id);

      if (!service) {
        throw new Error("Serviço não encontrado.");
      }

      return repository.update(service.id, { active: false });
    },

    averageActivePrice() {
      const activeServices = repository
        .findAll()
        .filter((service) => service.active);

      if (activeServices.length === 0) return 0;

      const total = activeServices.reduce(
        (sum, service) => sum + service.price,
        0
      );

      return total / activeServices.length;
    }
  };
}
