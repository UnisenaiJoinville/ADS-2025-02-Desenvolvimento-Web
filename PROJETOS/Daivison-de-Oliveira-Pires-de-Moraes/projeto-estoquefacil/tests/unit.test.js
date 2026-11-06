import test from "node:test";
import assert from "node:assert/strict";
import { validateProductInput } from "../src/modules/products/product-validator.js";
import { validateMovementInput } from "../src/modules/movements/movement-validator.js";
import { validateRegisterInput } from "../src/modules/auth/user-validator.js";
import {
  parsePagination,
  buildPagination,
} from "../src/shared/http/pagination.js";
import { dateRange, escapeLike, boolean } from "../src/shared/http/input.js";
import { toCsv } from "../src/shared/http/to-csv.js";
const product = {
  name: " Produto teste ",
  sku: " sku-1 ",
  costPrice: 2,
  salePrice: 3,
};
test("produto normaliza nome, SKU, fornecedor e defaults", () => {
  const p = validateProductInput({ ...product, supplier: " ACME  Ltda " });
  assert.equal(p.name, "Produto teste");
  assert.equal(p.sku, "SKU-1");
  assert.equal(p.supplier, "ACME Ltda");
  assert.equal(p.active, true);
  assert.equal(p.quantity, 0);
  assert.equal(p.categoryId, null);
});
const invalid = [
  ["name", ""],
  ["name", "a".repeat(121)],
  ["name", {}],
  ["sku", ""],
  ["sku", "x".repeat(41)],
  ["supplier", "x".repeat(121)],
  ["costPrice", -1],
  ["costPrice", "abc"],
  ["costPrice", true],
  ["costPrice", 100000000],
  ["salePrice", 1],
  ["salePrice", Infinity],
  ["quantity", -1],
  ["quantity", 1.5],
  ["quantity", 2147483648],
  ["quantity", true],
  ["minimumStock", -2],
  ["minimumStock", "n"],
  ["categoryId", 0],
  ["categoryId", "abc"],
  ["active", "falsey"],
];
for (const [key, value] of invalid)
  test(`produto recusa ${key}: ${String(value).slice(0, 20)}`, () =>
    assert.throws(() => validateProductInput({ ...product, [key]: value })));
test("booleano false permanece false", () => {
  assert.equal(
    validateProductInput({ ...product, active: false }).active,
    false,
  );
  assert.equal(boolean("false"), false);
  assert.throws(() => boolean([]));
});
test("ajuste aceita zero e exige observacao; demais tipos exigem quantidade positiva", () => {
  assert.equal(
    validateMovementInput({
      productId: 1,
      type: "ADJUST",
      quantity: 0,
      note: "Inventario",
    }).quantity,
    0,
  );
  for (const input of [
    { type: "IN", quantity: 0 },
    { type: "OUT", quantity: -1 },
    { type: "OTHER", quantity: 1 },
    { type: "ADJUST", quantity: 0 },
    { type: "IN", quantity: 1.5 },
    { type: "IN", quantity: true },
  ])
    assert.throws(() => validateMovementInput({ productId: 1, ...input }));
  assert.throws(() =>
    validateMovementInput({ productId: 0, type: "IN", quantity: 1 }),
  );
  assert.throws(() =>
    validateMovementInput({
      productId: 1,
      type: "IN",
      quantity: 1,
      note: "x".repeat(181),
    }),
  );
});
test("cadastro exige nome 3-60, senha 8 e no maximo 72 bytes UTF-8", () => {
  const valid = {
    name: "Ana Paula",
    email: "ANA@EXAMPLE.COM",
    password: "Senha123",
    passwordConfirmation: "Senha123",
  };
  assert.equal(validateRegisterInput(valid).email, "ana@example.com");
  for (const input of [
    { name: "ab" },
    { name: "x".repeat(61) },
    { email: "invalido" },
    { password: "1234567" },
    { passwordConfirmation: "outro" },
    { password: "é".repeat(37), passwordConfirmation: "é".repeat(37) },
  ])
    assert.throws(() => validateRegisterInput({ ...valid, ...input }));
});
test("paginacao e offset limitados, alias perPage", () => {
  assert.deepEqual(parsePagination({ page: "2", perPage: "5" }), {
    page: 2,
    pageSize: 5,
    offset: 5,
  });
  for (const q of [
    { page: 0 },
    { page: 1.2 },
    { pageSize: 500 },
    { page: ["1", "2"] },
    { page: "99999999999" },
  ])
    assert.throws(() => parsePagination(q));
  assert.equal(buildPagination({ page: 1, pageSize: 20 }, 0).totalPages, 1);
});
test("datas reais, ano bissexto e ordem", () => {
  assert.deepEqual(dateRange("2024-02-29", "2024-02-29"), {
    startDate: "2024-02-29",
    endDate: "2024-02-29",
  });
  for (const [a, b] of [
    ["2026-02-29", ""],
    ["2026-02-31", ""],
    ["01/01/2026", ""],
    ["2026-02-02", "2026-01-01"],
    [["2026-01-01"], ""],
  ])
    assert.throws(() => dateRange(a, b));
});
test("LIKE escapa curingas sem concatenar entrada em SQL", () =>
  assert.equal(escapeLike("50%_!"), "50!%!_!!"));
test("CSV escapa aspas, separadores, quebra de linha e formulas", () => {
  const csv = toCsv(
    [{ v: 'a;"b\nc' }, { v: "=1+1" }],
    [{ key: "v", label: "Nome" }],
  );
  assert.ok(csv.startsWith("\uFEFFNome\r\n"));
  assert.ok(csv.includes('"a;""b\nc"'));
  assert.ok(csv.includes("'=1+1"));
});

test("setup gera segredos diferentes e preserva configuracao existente", async () => {
  const { mkdtemp, copyFile, readFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const directory = await mkdtemp(join(tmpdir(), "estoque-setup-"));
  try {
    await copyFile(
      new URL("../.env.example", import.meta.url),
      join(directory, ".env.example"),
    );
    const { fileURLToPath } = await import("node:url");
    const script = fileURLToPath(
      new URL("../scripts/setup.js", import.meta.url),
    );
    assert.equal(
      spawnSync(process.execPath, [script], { cwd: directory }).status,
      0,
    );
    const first = await readFile(join(directory, ".env"), "utf8");
    const secrets = ["DB_PASSWORD", "DB_ROOT_PASSWORD", "JWT_SECRET"].map(
      (key) =>
        first.match(new RegExp("^" + key + "=([a-f0-9]{64})$", "m"))?.[1],
    );
    assert.ok(secrets.every(Boolean));
    assert.equal(new Set(secrets).size, 3);
    assert.equal(
      spawnSync(process.execPath, [script], { cwd: directory }).status,
      0,
    );
    assert.equal(await readFile(join(directory, ".env"), "utf8"), first);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
