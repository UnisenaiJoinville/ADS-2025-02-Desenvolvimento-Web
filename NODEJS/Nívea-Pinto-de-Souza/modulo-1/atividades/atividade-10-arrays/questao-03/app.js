const hasInactiveService = services.some(
  (service) => !service.active
);

console.log(hasInactiveService);