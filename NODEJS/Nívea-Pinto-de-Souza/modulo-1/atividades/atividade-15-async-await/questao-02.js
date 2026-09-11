import { readFile } from "node:fs/promises";

try {
  await readFile(new URL("./arquivo-inexistente.json", import.meta.url), "utf8");
} catch (error) {
  console.log("Arquivo não encontrado:", error.code);
}
