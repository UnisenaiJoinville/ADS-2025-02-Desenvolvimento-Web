import { validatePrice } from "./validate-price.js";

try {
  validatePrice(-50);
  console.log("Preço válido");
} catch (error) {
  console.log(`Não foi possível continuar: ${error.message}`);
}
