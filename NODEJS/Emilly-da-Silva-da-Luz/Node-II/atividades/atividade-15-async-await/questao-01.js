import { readFile } from "node:fs/promises";

const url = new URL("./services.json", import.meta.url);
const content = await readFile(url, "utf8");
console.log(JSON.parse(content));
