export function createServiceRepository() {
  let nextId = 1;
  let services = [];

  function clone(service) {
    return { ...service };
  }

  return {
    insert(serviceData) {
      const service = {
        id: nextId++,
        ...serviceData,
        active: true
      };

      services = [...services, service];
      return clone(service);
    },

    findByName(name) {
      const normalizedName = name.trim().toLowerCase();
      const service = services.find(
        (item) => item.name.toLowerCase() === normalizedName
      );

      return service ? clone(service) : null;
    },

    findById(id) {
      const service = services.find((item) => item.id === Number(id));
      return service ? clone(service) : null;
    },

    findAll() {
      return services.map(clone);
    },

    update(id, changes) {
      let updated = null;

      services = services.map((service) => {
        if (service.id !== Number(id)) return service;

        updated = { ...service, ...changes };
        return updated;
      });

      return updated ? clone(updated) : null;
    }
  };
}
