import { validateServiceInput } from "./questao-01.js";

const invalidCases = [
  { name: "", price: 100, durationMinutes: 30 },
  { name: "Consulta", price: -1, durationMinutes: 30 },
  { name: "Consulta", price: "abc", durationMinutes: 30 },
  { name: "Consulta", price: 100, durationMinutes: 0 },
  { name: "Consulta", price: 100, durationMinutes: 12.5 },
];

for (const [index, input] of invalidCases.entries()) {
  try {
    validateServiceInput(input);
    console.log(`Caso ${index + 1}: ERRO - deveria ter falhado`);
  } catch (error) {
    console.log(`Caso ${index + 1}: falhou como esperado - ${error.message}`);
  }
}
