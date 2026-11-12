import assert from "node:assert/strict";
import { once } from "node:events";

if (!/^estoque_[a-z_]+_validation$/.test(process.env.DB_NAME ?? ""))
  throw new Error("Use banco estoque_*_validation isolado");
const { app } = await import("../src/app.js");
const { pool } = await import("../src/config/database.js");
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}/api`;
let token,
  checks = 0;
async function request(
  path,
  { method = "GET", body, status = 200, auth = true, headers = {} } = {},
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, status, `${method} ${path}`);
  checks++;
  if (status === 204) {
    assert.equal(await response.text(), "");
    checks++;
    return null;
  }
  return response.json();
}
function check(value, label) {
  assert.ok(value, label);
  checks++;
}
const credentials = { email: "professor@estoquefacil.com", password: "123456" };
try {
  const login = await request("/auth/login", {
    method: "POST",
    body: credentials,
  });
  token = login.token;
  await request("/products/search", { auth: false, status: 401 });
  await request("/dashboard/movements-by-day", { auth: false, status: 401 });
  const page1 = await request("/products?pageSize=3"),
    page2 = await request("/products?pageSize=3&page=2");
  check(
    page1.rows.length === 3 && page1.pagination.total === 12,
    "Envelope e contagem",
  );
  check(
    page2.rows.every((row) => !page1.rows.some((p) => p.id === row.id)),
    "Paginas nao repetem IDs",
  );
  const far = await request("/products?page=999");
  check(
    !far.rows.length && far.pagination.total === 12,
    "Pagina fora do intervalo preserva contagem",
  );
  for (const query of [
    "page=0",
    "pageSize=101",
    "page=9007199254740992",
    "page=1&page=2",
    "pageSize[]=3",
    "pageSize=2&page=9007199254740991",
  ])
    await request("/products?" + query, { status: 400 });
  for (const query of [
    "limit=0",
    "limit=21",
    "limit=abc",
    "limit=1&limit=2",
    "q=" + "a".repeat(61),
  ])
    await request("/products/search?" + query, { status: 400 });
  const repeated = await request("/products/search?q=a&q=b");
  check(repeated.length <= 8, "Busca repetida nao causa 500");
  const fixtures = [
    ["Kit teclado e mouse", "P9-KIT"],
    ["Mouse sem fio", "P9-MOUSE"],
    ["Outro produto", "mouse"],
    ["Literal 50% a_b c\\d !", "P9-LITERAL"],
    ["Literal 500 axb cd", "P9-NORMAL"],
    ["Mesmo nome", "P9-TIE-A"],
    ["Mesmo nome", "P9-TIE-B"],
  ];
  for (const [name, sku] of fixtures)
    await request("/products", {
      method: "POST",
      status: 201,
      body: { name, sku, costPrice: 1, salePrice: 2 },
    });
  const relevant = await request("/products/search?q=mouse");
  check(relevant[0].sku === "MOUSE", "SKU exato primeiro");
  check(
    relevant.findIndex((p) => p.sku === "P9-MOUSE") <
      relevant.findIndex((p) => p.sku === "P9-KIT"),
    "Nome iniciado antes de trecho interno",
  );
  for (const term of ["50%", "a_b", "c\\d", "!"]) {
    const found = await request(
      "/products/search?q=" + encodeURIComponent(term),
    );
    check(
      found.length === 1 && found[0].sku === "P9-LITERAL",
      `LIKE literal ${term}`,
    );
    const list = await request("/products?search=" + encodeURIComponent(term));
    check(list.pagination.total === 1, `Contagem literal ${term}`);
  }
  const firstTie = await request("/products?search=Mesmo%20nome&pageSize=1"),
    secondTie = await request(
      "/products?search=Mesmo%20nome&pageSize=1&page=2",
    );
  check(firstTie.rows[0].id < secondTie.rows[0].id, "Desempate por ID");
  const disposable = await request("/products", {
    method: "POST",
    status: 201,
    body: { name: "Descartavel", sku: "P9-DELETE" },
  });
  await request(`/products/${disposable.id}`, {
    method: "DELETE",
    status: 204,
  });
  await request(`/products/${disposable.id}`, { status: 404 });
  const product = await request("/products/1");
  await request("/products/1", { method: "DELETE", status: 409 });
  await assert.rejects(
    pool.query("DELETE FROM products WHERE id = 1"),
    (error) => error.errno === 1451,
  );
  checks++;
  const [before] = await pool.query(
    "SELECT COUNT(*) AS n FROM stock_movements WHERE product_id = 1",
  );
  await request("/products/1", {
    method: "PUT",
    body: { ...product, active: false, quantity: 999 },
  });
  check(
    (await request("/products/1")).quantity === product.quantity,
    "PUT nao sobrescreve saldo",
  );
  check(
    !(await request("/products/search?q=BEB-001")).length,
    "Inativo fora da busca",
  );
  for (const type of ["IN", "OUT"])
    await request("/movements", {
      method: "POST",
      status: 400,
      body: { productId: 1, type, quantity: 1 },
    });
  const [after] = await pool.query(
    "SELECT COUNT(*) AS n FROM stock_movements WHERE product_id = 1",
  );
  check(before[0].n === after[0].n, "Inativacao preserva historico");
  await request("/products/1", { method: "PUT", body: product });
  const concurrent = await request("/products", {
    method: "POST",
    status: 201,
    body: { name: "Concorrencia", sku: "P9-CONCURRENT", quantity: 1 },
  });
  const stockOutcomes = await Promise.all(
    [1, 2].map(() =>
      fetch(base + "/movements", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: concurrent.id,
          type: "OUT",
          quantity: 1,
        }),
      }),
    ),
  );
  assert.deepEqual(stockOutcomes.map((r) => r.status).sort(), [201, 400]);
  checks++;
  check(
    (await request(`/products/${concurrent.id}`)).quantity === 0,
    "FOR UPDATE impede saldo negativo concorrente",
  );
  const category = await request("/categories", {
    method: "POST",
    status: 201,
    body: { name: "Categoria temporaria P9" },
  });
  const uncategorized = await request("/products", {
    method: "POST",
    status: 201,
    body: {
      name: "Sem categoria depois",
      sku: "P9-CATEGORY",
      categoryId: category.id,
    },
  });
  await request(`/categories/${category.id}`, {
    method: "DELETE",
    status: 204,
  });
  check(
    (await request(`/products/${uncategorized.id}`)).categoryId === null,
    "SET NULL preservado",
  );
  // Limites temporais: meia-noite conta em apenas um dia, inclusive dias vazios.
  await pool.query("DELETE FROM stock_movements");
  await pool.query(
    "INSERT INTO stock_movements(product_id,type,quantity,created_at) VALUES (1,'IN',11,CURDATE()),(1,'OUT',4,CURDATE()-INTERVAL 1 DAY),(1,'IN',9,CURDATE()-INTERVAL 89 DAY)",
  );
  for (const days of [7, 30, 90]) {
    const rows = await request(`/dashboard/movements-by-day?days=${days}`);
    check(
      rows.length === days &&
        rows.every(
          (r) =>
            /^\d{4}-\d{2}-\d{2}$/.test(r.day) &&
            typeof r.unitsIn === "number" &&
            typeof r.unitsOut === "number",
        ),
      "Serie tipada " + days,
    );
    check(
      rows.at(-1).unitsIn === 11 &&
        rows.at(-1).unitsOut === 0 &&
        rows.at(-2).unitsOut === 4,
      "Fronteiras de datas " + days,
    );
    check(
      rows.some((r) => r.unitsIn === 0 && r.unitsOut === 0),
      "Dias vazios " + days,
    );
    const [today] = await pool.query(
      "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS day",
    );
    check(rows.at(-1).day === today[0].day, "Ultimo dia e hoje");
  }
  check(
    (await request("/dashboard/movements-by-day")).length === 30,
    "Periodo padrao",
  );
  for (const query of ["days=15", "days=7&days=30", "days=abc", "days=0"])
    await request("/dashboard/movements-by-day?" + query, { status: 400 });
  // Sucessos nao gastam tentativas; X-Forwarded-For nao contorna limite local.
  for (let i = 0; i < 6; i++)
    await request("/auth/login", { method: "POST", body: credentials });
  for (let i = 0; i < 5; i++)
    await request("/auth/login", {
      method: "POST",
      body: { ...credentials, password: "errada" },
      status: 401,
    });
  await request("/auth/login", {
    method: "POST",
    body: credentials,
    status: 429,
  });
  const blocked = await request("/auth/login", {
    method: "POST",
    body: credentials,
    status: 429,
    headers: { "X-Forwarded-For": "203.0.113.80" },
  });
  check(blocked.error.includes("Muitas tentativas"), "429 em JSON portugues");
  for (let i = 0; i < 10; i++)
    await request("/auth/register", { method: "POST", body: {}, status: 400 });
  await request("/auth/register", { method: "POST", body: {}, status: 429 });
  console.log(`Parte 9: ${checks} verificacoes aprovadas.`);
} finally {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
}
