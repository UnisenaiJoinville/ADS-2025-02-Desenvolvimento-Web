import { AppError } from "../errors/app-error.js";
export function text(value, field, max, required = false) {
  if (value != null && typeof value !== "string")
    throw new AppError(`O campo ${field} deve ser texto`);
  const result = (value ?? "").trim().replace(/\s+/g, " ");
  if ((required && !result) || result.length > max)
    throw new AppError(
      `O campo ${field} e obrigatorio ou excede ${max} caracteres`,
    );
  return result;
}
export function integer(value, field, min = 0, max = 2147483647) {
  if (
    !["number", "string"].includes(typeof value) ||
    String(value).trim() === ""
  )
    throw new AppError(`${field} invalido`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw new AppError(`${field} deve ser inteiro entre ${min} e ${max}`);
  return n;
}
export function boolean(value, fallback = false) {
  if (value === undefined) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new AppError("Valor booleano invalido; use true ou false");
}
export function date(value, field) {
  if (value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new AppError(`${field}: use AAAA-MM-DD`);
  const d = new Date(value + "T00:00:00Z");
  if (
    Number.isNaN(d.getTime()) ||
    d.toISOString().slice(0, 10) !== value ||
    value < "1000-01-01"
  )
    throw new AppError(`${field}: data invalida`);
  return value;
}
export function dateRange(from, to) {
  const startDate = date(from, "data inicial"),
    endDate = date(to, "data final");
  if (startDate && endDate && startDate > endDate)
    throw new AppError("A data inicial nao pode ser maior que a final");
  return { startDate, endDate };
}
// Escape explicito: nao depende do modo NO_BACKSLASH_ESCAPES do servidor.
export function escapeLike(value) {
  return value.replace(/[!%_]/g, "!$&");
}
