import test from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import jwt from "jsonwebtoken";
// Exclusivamente um banco dedicado: nunca limpa estoque_db.
process.env.DB_HOST = process.env.TEST_DB_HOST ?? "127.0.0.1";
process.env.DB_PORT = process.env.TEST_DB_PORT ?? "3307";
process.env.DB_USER = process.env.TEST_DB_USER ?? "root";
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? "testpass";
process.env.DB_NAME = process.env.TEST_DB_NAME ?? "estoque_integration_test";
process.env.JWT_SECRET =
  "teste-automatizado-local-segredo-com-64-caracteres-123456789";
process.env.JWT_EXPIRES_IN = "15m";
process.env.TRUST_PROXY = "false";
process.env.REGISTRATION_OPEN = "true";
if (!/^[a-z0-9_]+_test$/.test(process.env.DB_NAME))
  throw new Error("TEST_DB_NAME deve terminar em _test");
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  decimalNumbers: true,
  dateStrings: true,
  timezone: "-03:00",
});
const dbName = process.env.DB_NAME;
await db.query(
  `DROP DATABASE IF EXISTS \`${dbName}\`; CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${dbName}\`; SET time_zone='-03:00';`,
);
await db.query(
  await readFile(new URL("../database/init.sql", import.meta.url), "utf8"),
);
const { app } = await import("../src/app.js");
const { pool } = await import("../src/config/database.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
let admin, operator;
async function request(
  path,
  { method = "GET", body, token = admin?.token, expected } = {},
) {
  const r = await fetch(base + "/api" + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (expected !== undefined)
    assert.equal(r.status, expected, `${method} ${path}: ${text}`);
  return { status: r.status, data, headers: r.headers };
}
const p = (overrides = {}) => ({
  name: "Teste",
  sku: "TEST-1",
  supplier: "ACME",
  costPrice: 2,
  salePrice: 3,
  quantity: 10,
  minimumStock: 2,
  ...overrides,
});
test("integracao HTTP e MySQL real", async (t) => {
  try {
    await t.test(
      "health publico; API protegida, JSON invalido e cabecalhos",
      async () => {
        const r = await request("/health", { token: null, expected: 200 });
        assert.equal(r.headers.get("x-powered-by"), null);
        assert.ok(r.headers.get("content-security-policy"));
        await request("/products", { token: null, expected: 401 });
        const bad = await fetch(base + "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        });
        assert.equal(bad.status, 400);
      },
    );
    await t.test(
      "cadastro inicial ADMIN; demais OPERATOR; hash e normalizacao",
      async () => {
        admin = (
          await request("/auth/register", {
            method: "POST",
            token: null,
            body: {
              name: "Administrador Teste",
              email: "ADMIN@EXAMPLE.COM",
              password: "Senha123!",
              passwordConfirmation: "Senha123!",
            },
            expected: 201,
          })
        ).data;
        operator = (
          await request("/auth/register", {
            method: "POST",
            token: null,
            body: {
              name: "Operador Teste",
              email: "operador@example.com",
              password: "Senha123!",
              passwordConfirmation: "Senha123!",
            },
            expected: 201,
          })
        ).data;
        assert.equal(admin.user.role, "ADMIN");
        assert.equal(operator.user.role, "OPERATOR");
        assert.ok(admin.refreshToken);
        assert.equal(admin.user.passwordHash, undefined);
        const [[u]] = await db.query(
          "SELECT password_hash FROM users WHERE id=?",
          [admin.user.id],
        );
        assert.notEqual(u.password_hash, "Senha123!");
        await request("/auth/register", {
          method: "POST",
          body: {
            name: "Administrador",
            email: "admin@example.com",
            password: "Senha123!",
            passwordConfirmation: "Senha123!",
          },
          expected: 409,
        });
      },
    );
    await t.test("login, perfil e JWT adulterado/expirado", async () => {
      const r = await request("/auth/login", {
        method: "POST",
        token: null,
        body: { email: "admin@example.com", password: "Senha123!" },
        expected: 200,
      });
      admin = r.data;
      assert.ok(admin.user.lastLoginAt);
      await request("/auth/me", { expected: 200 });
      await request("/products", { token: admin.token + "x", expected: 401 });
      await request("/products", {
        token: jwt.sign({ version: 0 }, process.env.JWT_SECRET, {
          subject: String(admin.user.id),
          expiresIn: -1,
        }),
        expected: 401,
      });
    });
    let category, product;
    await t.test(
      "CRUD categorias; nome duplicado e papel restrito",
      async () => {
        category = (
          await request("/categories", {
            method: "POST",
            body: { name: "Categoria Teste" },
            expected: 201,
          })
        ).data;
        await request("/categories", {
          method: "POST",
          body: { name: "Categoria Teste" },
          expected: 409,
        });
        await request("/categories/" + category.id, {
          method: "PUT",
          body: { name: "Categoria editada" },
          expected: 200,
        });
        await request("/categories/" + category.id, {
          method: "DELETE",
          token: operator.token,
          expected: 403,
        });
      },
    );
    await t.test(
      "produtos, fornecedor, filtros, pagina, ordem e validacoes",
      async () => {
        product = (
          await request("/products", {
            method: "POST",
            body: p({ categoryId: category.id }),
            expected: 201,
          })
        ).data;
        assert.equal(product.supplier, "ACME");
        await request("/products", {
          method: "POST",
          body: p(),
          expected: 409,
        });
        await request("/products", {
          method: "POST",
          body: p({ sku: "ERR", salePrice: -1 }),
          expected: 400,
        });
        await request("/products?pageSize=500", { expected: 400 });
        await request("/products?orderBy=quantity%3BDROP%20TABLE%20products", {
          expected: 400,
        });
        const r = await request(
          "/products?page=1&pageSize=3&orderBy=quantity",
          { expected: 200 },
        );
        assert.equal(r.data.rows.length, 3);
        assert.equal(r.data.pagination.total, 13);
        await request("/products?q=a&q=b", { expected: 200 });
        await request("/products/search?q=a&q=b", { expected: 400 });
        await request("/products/search?limit=21", { expected: 400 });
      },
    );
    await t.test("busca literal de curingas e busca por SKU", async () => {
      await request("/products", {
        method: "POST",
        body: p({ name: "Desconto 50%_!", sku: "PERCENT" }),
        expected: 201,
      });
      const r = await request("/products/search?q=%25_%21", { expected: 200 });
      assert.equal(r.data.length, 1);
      assert.equal(r.data[0].sku, "PERCENT");
      const sku = await request("/products/search?q=TEST-1", { expected: 200 });
      assert.equal(sku.data[0].id, product.id);
    });
    await t.test(
      "duas saidas concorrentes: somente uma confirma; sem estoque negativo",
      async () => {
        const results = await Promise.all(
          [1, 2].map(() =>
            request("/movements", {
              method: "POST",
              body: {
                productId: product.id,
                type: "OUT",
                quantity: 7,
                note: "concorrencia",
                userId: 999,
              },
            }),
          ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [201, 400]);
        const current = (await request("/products/" + product.id)).data;
        assert.equal(current.quantity, 3);
        const [[count]] = await db.query(
          "SELECT COUNT(*) AS n FROM stock_movements WHERE product_id=?",
          [product.id],
        );
        assert.equal(count.n, 1);
        const movement = results.find((r) => r.status === 201).data;
        assert.equal(movement.userId, admin.user.id);
      },
    );
    await t.test(
      "ajuste zero, entrada, saldo auditavel e produto inativo",
      async () => {
        const adj = await request("/movements", {
          method: "POST",
          body: {
            productId: product.id,
            type: "ADJUST",
            quantity: 0,
            note: "Contagem fisica",
          },
          expected: 201,
        });
        assert.equal(adj.data.previousQuantity, 3);
        assert.equal(adj.data.resultingQuantity, 0);
        await request("/movements", {
          method: "POST",
          body: { productId: product.id, type: "ADJUST", quantity: 0 },
          expected: 400,
        });
        await request("/movements", {
          method: "POST",
          body: { productId: product.id, type: "IN", quantity: 5 },
          expected: 201,
        });
        await request("/products/" + product.id + "/active", {
          method: "PATCH",
          body: { active: false },
          expected: 200,
        });
        await request("/movements", {
          method: "POST",
          body: { productId: product.id, type: "IN", quantity: 1 },
          expected: 400,
        });
        assert.equal(
          (await request("/products/search?q=TEST-1")).data.length,
          0,
        );
        assert.equal(
          (await request("/products?search=TEST-1")).data.rows.length,
          0,
        );
        assert.equal(
          (await request("/products?search=TEST-1&includeInactive=true")).data
            .rows.length,
          1,
        );
        await request("/products/" + product.id + "/active", {
          method: "PATCH",
          body: { active: "false" },
          expected: 400,
        });
        await request("/products/" + product.id + "/active", {
          method: "PATCH",
          body: { active: true },
          expected: 200,
        });
      },
    );
    await t.test(
      "edicao nao sobrescreve saldo e exclusao preserva historico/FK",
      async () => {
        await request("/products/" + product.id, {
          method: "PUT",
          body: p({ quantity: 10 }),
          expected: 409,
        });
        await request("/products/" + product.id, {
          method: "DELETE",
          expected: 409,
        });
        await assert.rejects(
          () => db.query("DELETE FROM products WHERE id=?", [product.id]),
          (e) => e.code === "ER_ROW_IS_REFERENCED_2",
        );
        const temp = (
          await request("/products", {
            method: "POST",
            body: p({ sku: "TEMP" }),
            expected: 201,
          })
        ).data;
        await request("/products/" + temp.id, {
          method: "DELETE",
          expected: 204,
        });
        await request("/products/" + temp.id, { expected: 404 });
      },
    );
    await t.test(
      "periodo, datas impossiveis, fim inclusivo e ajustes no relatorio",
      async () => {
        await request("/movements?from=2026-02-31", { expected: 400 });
        await request("/movements?from=2026-02-02&to=2026-01-01", {
          expected: 400,
        });
        const r = await request(
          "/reports/movements?startDate=2026-09-15&endDate=2026-09-15",
          { expected: 200 },
        );
        assert.equal(r.data.rows.length, 1);
        assert.equal(r.data.rows[0].quantity, 20);
        const adj = await request("/reports/movements?type=ADJUST", {
          expected: 200,
        });
        assert.equal(adj.data.rows[0].signedQuantity, -3);
        assert.equal(adj.data.totals.unitsAdjusted, -3);
        assert.equal(adj.data.totals.balance, -3);
      },
    );
    await t.test(
      "todos os relatorios e graficos, joins vazios e precos",
      async () => {
        for (const endpoint of [
          "stock-summary",
          "stock-by-category",
          "products-without-movement",
          "abc-curve",
          "movements-by-user",
          "movements-by-month",
          "top-products",
          "stagnant-products",
          "turnover-by-category",
          "stockout-forecast",
          "compare?periodA=2026-05&periodB=2026-06",
        ])
          await request("/reports/" + endpoint, { expected: 200 });
        const categories = (await request("/reports/stock-by-category")).data;
        assert.ok(
          categories.some(
            (c) => c.categoryName === "Ferramentas" && c.productCount === 0,
          ),
        );
        assert.ok(categories.some((c) => c.categoryName === "Sem categoria"));
        await request("/reports/products?minPrice=20&maxPrice=10", {
          expected: 400,
        });
        const prices = (
          await request("/reports/products?minPrice=10&maxPrice=50")
        ).data;
        assert.ok(
          prices.rows.every((p) => p.salePrice >= 10 && p.salePrice <= 50),
        );
        const abc = (await request("/reports/abc-curve")).data;
        assert.ok(Math.abs(abc.at(-1).accumulatedPercent - 100) < 0.1);
        for (const days of [7, 30, 90]) {
          const chart = (
            await request("/dashboard/daily-movements?days=" + days, {
              expected: 200,
            })
          ).data;
          assert.equal(chart.length, days);
          assert.match(chart[0].day, /^\d{4}-\d{2}-\d{2}$/);
          assert.equal(typeof chart[0].unitsIn, "number");
        }
        await request("/dashboard/daily-movements?days=15", { expected: 400 });
        assert.equal(
          typeof (await request("/dashboard")).data.totals.averageSalePrice,
          "number",
        );
      },
    );
    await t.test(
      "cache de resumo invalida em escrita e categoria excluida fica NULL",
      async () => {
        const before = (await request("/reports/stock-summary")).data
          .totalUnits;
        await request("/movements", {
          method: "POST",
          body: { productId: product.id, type: "IN", quantity: 2 },
          expected: 201,
        });
        const after = (await request("/reports/stock-summary")).data.totalUnits;
        assert.equal(after, before + 2);
        await request("/categories/" + category.id, {
          method: "DELETE",
          expected: 204,
        });
        assert.equal(
          (await request("/products/" + product.id)).data.categoryId,
          null,
        );
      },
    );
    await t.test(
      "CSV exporta mais de 200 linhas e neutraliza formulas",
      async () => {
        const values = Array.from({ length: 225 }, (_, i) => [
          '=FORMULA;"' + i,
          "CSV-" + i,
          1,
          2,
        ]);
        await db.query(
          "INSERT INTO products(name,sku,cost_price,sale_price) VALUES ?",
          [values],
        );
        const csv = await request("/reports/products?search=CSV-&format=csv", {
          expected: 200,
        });
        assert.equal(csv.data.split("\r\n").length, 226);
        assert.ok(csv.data.includes("'=FORMULA"));
        assert.ok(
          csv.headers.get("content-disposition").includes("attachment"),
        );
        const exported = await request("/products/export?search=CSV-", {
          expected: 200,
        });
        assert.equal(exported.data.split("\r\n").length, 226);
        await request("/reports/movements-by-user?format=csv", {
          expected: 200,
        });
      },
    );
    await t.test(
      "perfil usa id do token, refresh rotativo e senha revoga sessao",
      async () => {
        const updated = await request("/auth/me", {
          method: "PUT",
          body: { name: "Admin Renomeado", id: operator.user.id },
          expected: 200,
        });
        assert.equal(updated.data.id, admin.user.id);
        const oldRefresh = admin.refreshToken;
        const fresh = (
          await request("/auth/refresh", {
            method: "POST",
            token: null,
            body: { refreshToken: oldRefresh },
            expected: 200,
          })
        ).data;
        await request("/auth/refresh", {
          method: "POST",
          token: null,
          body: { refreshToken: oldRefresh },
          expected: 401,
        });
        admin = fresh;
        await request("/auth/password", {
          method: "PUT",
          body: { currentPassword: "errada", newPassword: "SenhaNova123" },
          expected: 401,
        });
        await request("/auth/password", {
          method: "PUT",
          body: { currentPassword: "Senha123!", newPassword: "Senha123!" },
          expected: 400,
        });
        await request("/auth/password", {
          method: "PUT",
          body: { currentPassword: "Senha123!", newPassword: "SenhaNova123" },
          expected: 204,
        });
        await request("/auth/me", { expected: 401 });
        await request("/auth/refresh", {
          method: "POST",
          token: null,
          body: { refreshToken: fresh.refreshToken },
          expected: 401,
        });
        admin = (
          await request("/auth/login", {
            method: "POST",
            token: null,
            body: { email: "admin@example.com", password: "SenhaNova123" },
            expected: 200,
          })
        ).data;
      },
    );
    await t.test(
      "reset local: token expiravel, uso unico e revogacao",
      async () => {
        let link;
        const old = console.log;
        console.log = (...args) => {
          const text = args.join(" ");
          if (text.startsWith("Recuperacao de senha")) link = text;
          else old(...args);
        };
        try {
          await request("/auth/forgot-password", {
            method: "POST",
            token: null,
            body: { email: "operador@example.com" },
            expected: 200,
          });
        } finally {
          console.log = old;
        }
        assert.ok(link);
        const token = new URL(
          link.split(": http")[1] ? "http" + link.split(": http")[1] : link,
        ).searchParams.get("token");
        await request("/auth/reset-password", {
          method: "POST",
          token: null,
          body: { token, newPassword: "SenhaNova456" },
          expected: 204,
        });
        await request("/auth/reset-password", {
          method: "POST",
          token: null,
          body: { token, newPassword: "SenhaNova789" },
          expected: 400,
        });
        await request("/auth/me", { token: operator.token, expected: 401 });
      },
    );
    await t.test(
      "schema vazio, migracoes 004/005 e laboratorio SQL",
      async () => {
        const other = await mysql.createConnection({
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          multipleStatements: true,
        });
        try {
          await other.query(
            "DROP DATABASE IF EXISTS estoque_schema_test; CREATE DATABASE estoque_schema_test CHARACTER SET utf8mb4; USE estoque_schema_test;",
          );
          await other.query(
            await readFile(
              new URL("../database/producao/001-schema.sql", import.meta.url),
              "utf8",
            ),
          );
          const [[counts]] = await other.query(
            "SELECT (SELECT COUNT(*) FROM products) AS products,(SELECT COUNT(*) FROM users) AS users",
          );
          assert.equal(counts.products, 0);
          assert.equal(counts.users, 0);
          await other.query(
            "DROP DATABASE IF EXISTS estoque_legacy_test; CREATE DATABASE estoque_legacy_test CHARACTER SET utf8mb4; USE estoque_legacy_test;",
          );
          await other.query(
            await readFile(
              new URL("./fixtures/legacy.sql", import.meta.url),
              "utf8",
            ),
          );
          for (const file of ["004-revisao-local.sql", "005-checks.sql"])
            await other.query(
              await readFile(
                new URL("../database/migrations/" + file, import.meta.url),
                "utf8",
              ),
            );
          const [[user]] = await other.query(
            "SELECT role FROM users WHERE email='professor@estoquefacil.com'",
          );
          assert.equal(user.role, "ADMIN");
          const [columns] = await other.query("SHOW COLUMNS FROM products");
          assert.ok(columns.some((c) => c.Field === "supplier"));
          const [[definition]] = await other.query(
            "SHOW CREATE TABLE stock_movements",
          );
          assert.ok(!definition["Create Table"].includes("ON DELETE CASCADE"));
          await db.query(
            await readFile(
              new URL(
                "../database/queries/atividades-resolvidas.sql",
                import.meta.url,
              ),
              "utf8",
            ),
          );
        } finally {
          await other.end();
        }
      },
    );
    await t.test(
      "limite: 5 falhas 401 e sexta 429, nem senha correta passa; header restante",
      async () => {
        for (let i = 0; i < 5; i++) {
          const r = await request("/auth/login", {
            method: "POST",
            token: null,
            body: { email: "admin@example.com", password: "Incorreta123" },
            expected: 401,
          });
          assert.ok(r.headers.get("ratelimit"));
        }
        const limited = await request("/auth/login", {
          method: "POST",
          token: null,
          body: { email: "admin@example.com", password: "SenhaNova123" },
          expected: 429,
        });
        assert.match(limited.data.error, /Muitas tentativas/);
      },
    );
  } finally {
    await new Promise((r) => server.close(r));
    await pool.end();
    await db.end();
  }
});
