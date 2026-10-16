import assert from "node:assert";
import test from "node:test";

import { validateProductInput } from "../src/modules/products/product-validator.js";

test("converte SKU para maiusculas e remove espacos extras do nome", () => {
  const result = validateProductInput({
    name: "  Cafe   1kg ",
    sku: "abc-1",
    costPrice: 5,
    salePrice: 10,
  });

  assert.strictEqual(result.sku, "ABC-1");
  assert.strictEqual(result.name, "Cafe 1kg");
});

test("aceita fornecedor opcional e devolve null quando ausente", () => {
  const semFornecedor = validateProductInput({ name: "X", sku: "X-1" });
  assert.strictEqual(semFornecedor.supplier, null);

  const comFornecedor = validateProductInput({
    name: "X",
    sku: "X-1",
    supplier: "  Acme  Ltda ",
  });
  assert.strictEqual(comFornecedor.supplier, "Acme Ltda");
});

test("rejeita nome vazio", () => {
  assert.throws(() => validateProductInput({ sku: "X-1" }));
});

test("rejeita SKU vazio", () => {
  assert.throws(() => validateProductInput({ name: "X" }));
});

test("rejeita venda menor que custo", () => {
  assert.throws(() =>
    validateProductInput({ name: "X", sku: "X-1", costPrice: 50, salePrice: 10 })
  );
});

test("aceita venda igual ao custo", () => {
  const result = validateProductInput({
    name: "X",
    sku: "X-1",
    costPrice: 10,
    salePrice: 10,
  });

  assert.strictEqual(result.salePrice, 10);
});

test("rejeita preco negativo", () => {
  assert.throws(() =>
    validateProductInput({ name: "X", sku: "X-1", costPrice: -1, salePrice: 5 })
  );
});

test("rejeita quantidade nao inteira", () => {
  assert.throws(() =>
    validateProductInput({ name: "X", sku: "X-1", quantity: 1.5 })
  );
});

test("rejeita quantidade negativa", () => {
  assert.throws(() =>
    validateProductInput({ name: "X", sku: "X-1", quantity: -1 })
  );
});

test("rejeita categoria invalida (nao numerica)", () => {
  assert.throws(() =>
    validateProductInput({ name: "X", sku: "X-1", categoryId: "abc" })
  );
});

test("aceita categoria ausente como null", () => {
  const result = validateProductInput({ name: "X", sku: "X-1", categoryId: "" });
  assert.strictEqual(result.categoryId, null);
});

test("usa valores padrao quando active nao e informado", () => {
  const result = validateProductInput({ name: "X", sku: "X-1" });
  assert.strictEqual(result.active, true);
});

test("respeita active=false quando informado explicitamente", () => {
  const result = validateProductInput({ name: "X", sku: "X-1", active: false });
  assert.strictEqual(result.active, false);
});

test("arredonda precos para duas casas decimais", () => {
  const result = validateProductInput({
    name: "X",
    sku: "X-1",
    costPrice: 1.234,
    salePrice: 10.006,
  });

  assert.strictEqual(result.costPrice, 1.23);
  assert.strictEqual(result.salePrice, 10.01);
});

test("rejeita nome maior que 120 caracteres", () => {
  assert.throws(() =>
    validateProductInput({ name: "A".repeat(121), sku: "X-1" })
  );
});
