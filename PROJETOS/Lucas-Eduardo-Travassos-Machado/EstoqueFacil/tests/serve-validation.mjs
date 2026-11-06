// Alternativa explicita quando o Docker nao consegue iniciar novos containers.
// Reutiliza somente o servidor MySQL, sempre em um banco de validacao separado.
import { execFileSync } from "node:child_process";
const container = process.env.VALIDATION_DB_CONTAINER;
const database = process.env.VALIDATION_DB_NAME;
if (!container || !/^estoque_[a-z_]+_validation$/.test(database ?? ""))
  throw new Error(
    "Informe VALIDATION_DB_CONTAINER e VALIDATION_DB_NAME isolado",
  );
const [user, password] = JSON.parse(
  execFileSync(
    "docker",
    [
      "exec",
      container,
      "sh",
      "-c",
      'printf \'["%s","%s"]\' "$MYSQL_USER" "$MYSQL_PASSWORD"',
    ],
    { encoding: "utf8" },
  ),
);
Object.assign(process.env, {
  PORT: "3019",
  DB_HOST: "127.0.0.1",
  DB_PORT: process.env.VALIDATION_DB_PORT ?? "3308",
  DB_USER: user,
  DB_PASSWORD: password,
  DB_NAME: database,
  JWT_SECRET: "local-validation-secret-at-least-32-characters",
  TRUST_PROXY: "false",
});
await import("../src/server.js");
