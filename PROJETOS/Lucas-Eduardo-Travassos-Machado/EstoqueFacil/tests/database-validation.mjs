// Roda no host, somente contra o Compose de validacao do projeto.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const compose = [
  "compose",
  "-p",
  "estoque-parte9",
  "-f",
  "docker-compose.validation.yml",
];
const existing = process.env.VALIDATION_DB_CONTAINER;
const dbExec = existing
  ? ["exec", "-i", existing]
  : [...compose, "exec", "-T", "db"];
let hostEnv;
if (existing) {
  const credentials = JSON.parse(
    execFileSync(
      "docker",
      [
        ...dbExec,
        "sh",
        "-c",
        'printf \'["%s","%s"]\' "$MYSQL_USER" "$MYSQL_PASSWORD"',
      ],
      { encoding: "utf8" },
    ),
  );
  hostEnv = {
    ...process.env,
    DB_HOST: "127.0.0.1",
    DB_PORT: process.env.VALIDATION_DB_PORT ?? "3308",
    DB_USER: credentials[0],
    DB_PASSWORD: credentials[1],
    JWT_SECRET: "local-validation-secret-at-least-32-characters",
    TRUST_PROXY: "false",
  };
}
function sql(input, database) {
  const output = execFileSync(
    "docker",
    [
      ...dbExec,
      "sh",
      "-c",
      'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot --batch --skip-column-names ' +
        (database ?? ""),
    ],
    { input, encoding: "utf8" },
  );
  return output.trim();
}
function create(name, schema) {
  if (!/^estoque_[a-z_]+_validation$/.test(name))
    throw new Error("Nome inseguro");
  // Bases exclusivas desta suite; recusa sobrescrever uma execucao anterior.
  sql(`CREATE DATABASE ${name}; GRANT ALL ON ${name}.* TO 'estoque'@'%';`);
  sql(schema, name);
}
const read = (path) => readFileSync(path, "utf8");
const init = read("database/init.sql");
const prefix = process.env.VALIDATION_RUN ?? "partnine";
if (!/^[a-z_]+$/.test(prefix))
  throw new Error("VALIDATION_RUN: use somente letras e sublinhado");
const fresh = `estoque_${prefix}_fresh_validation`,
  migrated = `estoque_${prefix}_migrated_validation`;
const oldSchema = init
  .split("-- Dados de apoio aos relatorios")[0]
  .replace("  user_id INT NULL,", "")
  .replace(/,\s*CONSTRAINT fk_movements_user[\s\S]*?ON DELETE SET NULL/, "")
  .replace("CREATE INDEX idx_movements_user ON stock_movements (user_id);", "")
  .replace("ON DELETE RESTRICT", "ON DELETE CASCADE");
create(fresh, init);
create(migrated, oldSchema);
const counts = (database) =>
  sql(
    "SELECT (SELECT COUNT(*) FROM products),(SELECT COUNT(*) FROM stock_movements),(SELECT COUNT(*) FROM categories),(SELECT COUNT(*) FROM users);",
    database,
  );
const baseline = counts(migrated);
for (const file of [
  "002-dados-relatorios.sql",
  "003-movimentacoes-por-usuario.sql",
  "004-produto-com-historico.sql",
])
  sql(read("database/migrations/" + file), migrated);
const after = counts(migrated);
sql(read("database/migrations/002-dados-relatorios.sql"), migrated);
assert.equal(counts(migrated), after, "002 reaplicavel");
assert.equal(after, counts(fresh), "Bases nova e migrada equivalentes");
const rule = (database) =>
  sql(
    "SELECT DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_movements_product';",
    database,
  );
assert.equal(rule(fresh), "RESTRICT");
assert.equal(rule(migrated), "RESTRICT");
sql(read("database/migrations/004-rollback.sql"), migrated);
assert.equal(rule(migrated), "CASCADE");
assert.equal(counts(migrated), after);
sql(read("database/migrations/004-produto-com-historico.sql"), migrated);
for (const file of ["003-rollback.sql", "002-rollback.sql"])
  sql(read("database/migrations/" + file), migrated);
assert.equal(
  counts(migrated),
  baseline,
  "Rollbacks anteriores continuam compativeis com RESTRICT",
);
for (const file of [
  "002-dados-relatorios.sql",
  "003-movimentacoes-por-usuario.sql",
])
  sql(read("database/migrations/" + file), migrated);
assert.equal(counts(migrated), after);
console.log(
  `Migracoes e rollbacks aprovados; base anterior ${baseline}, atual ${after}.`,
);
for (const database of [fresh, migrated]) {
  for (const test of ["reports.integration.mjs", "part9.integration.mjs"]) {
    // Cada suite recebe dados novos; alteracoes restritas a estas bases.
    sql(
      "SET FOREIGN_KEY_CHECKS=0; DROP TABLE stock_movements, products, categories, users; SET FOREIGN_KEY_CHECKS=1;",
      database,
    );
    sql(database === migrated ? oldSchema : init, database);
    if (database === migrated)
      for (const file of [
        "002-dados-relatorios.sql",
        "003-movimentacoes-por-usuario.sql",
        "004-produto-com-historico.sql",
      ])
        sql(read("database/migrations/" + file), database);
    if (existing)
      execFileSync(process.execPath, [`tests/${test}`], {
        stdio: "inherit",
        env: { ...hostEnv, DB_NAME: database },
      });
    else
      execFileSync(
        "docker",
        [
          ...compose,
          "exec",
          "-T",
          "-e",
          `DB_NAME=${database}`,
          "api",
          "node",
          `tests/${test}`,
        ],
        { stdio: "inherit" },
      );
  }
}
if (existing) {
  const browser = `estoque_${prefix}_browser_validation`;
  create(browser, init);
  console.log("Base de navegador preparada: " + browser);
}
