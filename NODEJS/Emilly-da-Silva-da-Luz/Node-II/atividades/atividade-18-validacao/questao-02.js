import { validateServiceInput } from "./questao-01.js";

const services = [{ name: "Consulta" }];

function createService(input) {
  const data = validateServiceInput(input); // formato inválido: validação de entrada
  const exists = services.some(
    (service) => service.name.toLocaleLowerCase("pt-BR") === data.name.toLocaleLowerCase("pt-BR")
  );
  if (exists) throw new Error("Serviço com este nome já existe"); // regra de negócio
  return data;
}

try {
  console.log(createService({ name: "Consulta", price: 150, durationMinutes: 45 }));
} catch (error) {
  console.log(error.message);
}
