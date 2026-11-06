import { integer } from "./input.js";
export function parseId(value, label = "id") {
  return integer(value, label, 1);
}
