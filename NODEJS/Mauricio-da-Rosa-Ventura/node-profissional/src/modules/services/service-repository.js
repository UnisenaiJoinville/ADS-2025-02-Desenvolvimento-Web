/**
 * Repositório em memória. É a única parte do módulo que conhece a forma
 * atual de "guardar" os dados — quando o PostgreSQL for introduzido, só
 * este arquivo muda; service-service.js continua igual.
 *
 * Todas as funções devolvem cópias (spread), nunca a referência interna do
 * array, para que quem chamar não consiga mutar o estado do repositório por
 * fora (ex.: services[0].active = false direto na lista retornada).
 */
const services = [];

export function save(service) {
  services.push(service);
  return { ...service };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findById(id) {
  const found = services.find((service) => service.id === id);
  return found ? { ...found } : null;
}

export function findByName(name) {
  const normalizedName = name.toLocaleLowerCase("pt-BR");
  const found = services.find(
    (service) => service.name.toLocaleLowerCase("pt-BR") === normalizedName,
  );
  return found ? { ...found } : null;
}

export function update(id, changes) {
  const index = services.findIndex((service) => service.id === id);
  if (index === -1) {
    return null;
  }
  services[index] = { ...services[index], ...changes };
  return { ...services[index] };
}
