import assert from "node:assert";
import test from "node:test";

import {
  validateDateRange,
  validateMovementInput,
} from "../src/modules/movements/movement-validator.js";

test("aceita entrada valida", () => {
  const result = validateMovementInput({ productId: 1, type: "in", quantity: 5 });
  assert.strictEqual(result.type, "IN");
  assert.strictEqual(result.quantity, 5);
});

test("rejeita tipo invalido", () => {
  assert.throws(() => validateMovementInput({ productId: 1, type: "X", quantity: 5 }));
});

test("rejeita quantidade zero em IN/OUT", () => {
  assert.throws(() => validateMovementInput({ productId: 1, type: "IN", quantity: 0 }));
});

test("ADJUST aceita quantidade zero (contagem zerada)", () => {
  const result = validateMovementInput({ productId: 1, type: "ADJUST", quantity: 0 });
  assert.strictEqual(result.quantity, 0);
});

test("ADJUST rejeita quantidade negativa", () => {
  assert.throws(() => validateMovementInput({ productId: 1, type: "ADJUST", quantity: -1 }));
});

test("rejeita produto invalido", () => {
  assert.throws(() => validateMovementInput({ productId: 0, type: "IN", quantity: 1 }));
});

test("validateDateRange aceita ausencia de datas", () => {
  const result = validateDateRange(undefined, undefined);
  assert.deepStrictEqual(result, { from: null, to: null });
});

test("validateDateRange rejeita formato invalido", () => {
  assert.throws(() => validateDateRange("2026/01/01", null));
});

test("validateDateRange rejeita from maior que to", () => {
  assert.throws(() => validateDateRange("2026-02-01", "2026-01-01"));
});

test("validateDateRange aceita periodo valido", () => {
  const result = validateDateRange("2026-01-01", "2026-01-31");
  assert.deepStrictEqual(result, { from: "2026-01-01", to: "2026-01-31" });
});
