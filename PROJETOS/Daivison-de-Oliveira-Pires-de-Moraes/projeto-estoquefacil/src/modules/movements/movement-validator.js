import { AppError } from "../../shared/errors/app-error.js";
import { integer, text } from "../../shared/http/input.js";
export function validateMovementInput(input) {
  const productId = integer(input?.productId, "Produto", 1);
  const type = text(input?.type, "Tipo", 10, true).toUpperCase();
  if (!["IN", "OUT", "ADJUST"].includes(type))
    throw new AppError("Tipo deve ser IN, OUT ou ADJUST");
  const quantity = integer(
    input?.quantity,
    "Quantidade",
    type === "ADJUST" ? 0 : 1,
  );
  const note = text(input?.note, "Observacao", 180, type === "ADJUST");
  return { productId, type, quantity, note: note || null };
}
