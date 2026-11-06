import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env")) {
  console.log(".env existente preservado.");
  process.exit(0);
}
let t = readFileSync(".env.example", "utf8");
for (const key of ["DB_PASSWORD", "DB_ROOT_PASSWORD", "JWT_SECRET"])
  t = t.replace(
    new RegExp("^" + key + "=.*$", "m"),
    key + "=" + randomBytes(32).toString("hex"),
  );
writeFileSync(".env", t, { mode: 0o600 });
console.log("Configuracao local criada. Rode docker compose up -d --build.");
