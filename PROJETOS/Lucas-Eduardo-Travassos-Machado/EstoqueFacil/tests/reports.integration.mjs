import assert from "node:assert/strict";
import { once } from "node:events";

// Recusa o banco de uso normal: esta verificacao cria dados temporarios.
if (!/^estoque_[a-z_]+_validation$/.test(process.env.DB_NAME ?? "")) {
  throw new Error("Execute apenas em um banco estoque_*_validation separado");
}

const { app } = await import("../src/app.js");
const { pool } = await import("../src/config/database.js");
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
let token;
let checks = 0;

function check(condition, description) {
  assert.ok(condition, description);
  checks += 1;
}

async function request(path, { method = "GET", body, authenticated = true, status = 200 } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, status, `${method} ${path}`);
  checks += 1;
  if (response.status === 204) return null;
  if (response.headers.get("content-type")?.includes("text/csv")) return response;
  return response.json();
}

try {
  const credentials = { email: "professor@estoquefacil.com", password: "123456" };
  const login = await request("/auth/login", { method: "POST", body: credentials });
  token = login.token;
  check(Boolean(token), "Login emite token");
  await request("/auth/me");
  await request("/auth/login", { method: "POST", body: { ...credentials, password: "errada" }, status: 401 });

  const routes = ["products", "stock-summary", "stock-by-category", "products-without-movement", "abc-curve", "movements", "movements-by-user", "movements-by-month", "top-products"];
  for (const route of routes) {
    await request(`/reports/${route}`);
    await request(`/reports/${route}`, { authenticated: false, status: 401 });
  }

  const products = await request("/reports/products");
  check(products.pagination.total === 12, "Banco novo tem 12 produtos");
  const movements = await request("/reports/movements");
  check(movements.pagination.total === 24, "JOINs preservam as 24 movimentacoes");
  check(movements.rows.some(row => row.userId === null), "Historico sem responsavel aparece");
  const categoryRows = await request("/reports/stock-by-category");
  check(categoryRows.some(row => row.categoryName === "Ferramentas" && row.productCount === 0), "Categoria vazia tem contagem zero");
  check(categoryRows.some(row => row.categoryId === null && row.productCount === 1), "Produtos sem categoria aparecem");
  check(Math.abs(categoryRows.reduce((sum, row) => sum + row.sharePercent, 0) - 100) < 0.1, "Participacoes somam 100%");
  const parked = await request("/reports/products-without-movement");
  check(parked.length === 1 && parked[0].sku === "INF-003", "Cabo HDMI nao tem movimentacao");

  const statuses = await Promise.all(["OK", "LOW", "OUT"].map(value => request(`/reports/products?stockStatus=${value}`)));
  assert.deepEqual(statuses.map(report => report.pagination.total), [7, 4, 1]);
  checks += 1;
  const noCategory = await request("/reports/products?withoutCategory=true");
  check(noCategory.rows.length === 1 && noCategory.rows[0].sku === "DIV-001", "Filtro sem categoria");
  const all = await request("/reports/products?withoutCategory=false");
  check(all.pagination.total === 12, "Booleano false nao ativa filtro");
  const page = await request("/reports/products?page=3&pageSize=5&sort=quantity&direction=desc");
  check(page.rows.length === 2 && page.pagination.totalPages === 3, "Ultima pagina correta");
  assert.deepEqual(page.totals, products.totals, "Totais independem da pagina");
  checks += 1;
  const selected = await request("/reports/products?search=INF-003");
  check(selected.rows.length === 1 && selected.totals.totalUnits === 15, "Totais respeitam o filtro");
  const empty = await request("/reports/products?search=naoexistevalidacao");
  check(empty.rows.length === 0 && empty.totals.totalCostValue === 0, "Selecao vazia tem soma zero");

  for (const query of ["sort=toString", "sort=p.name%3BDROP%20TABLE%20users", "direction=invalid", "page=0", "pageSize=201", "categoryId=-1", "stockStatus=talvez", "page=9007199254740992", "categoryId[]=1"]) {
    await request(`/reports/products?${query}`, { status: 400 });
  }
  for (const query of ["startDate=2026-02-31", "startDate=15%2F09%2F2026", "startDate=2026-09-16&endDate=2026-09-15", "type=invalid", "userId=-1"]) {
    await request(`/reports/movements?${query}`, { status: 400 });
  }
  await request("/reports/top-products?limit=101", { status: 400 });
  await request("/reports/top-products?minUnits=-1", { status: 400 });
  const day = await request("/reports/movements?startDate=2026-09-15&endDate=2026-09-15");
  check(day.pagination.total === 1 && day.totals.unitsOut === 20, "Dia final inclui movimentacao depois da meia noite");
  const period = await request("/reports/movements?startDate=2026-05-01&endDate=2026-06-30");
  check(period.totals.unitsIn === 154, "Totais do periodo conferem");
  const byUser = await request("/reports/movements-by-user?startDate=2026-09-15&endDate=2026-09-15");
  check(byUser.length === 1 && byUser[0].unitsOut === 20, "Agrupamento respeita periodo");
  const ranking = await request("/reports/top-products?startDate=2026-09-15&endDate=2026-09-15");
  check(ranking.length === 1 && ranking[0].unitsMoved === 20, "Ranking respeita periodo");
  const months = await request("/reports/movements-by-month");
  assert.deepEqual(months.map(row => row.period), months.map(row => row.period).sort());
  checks += 1;

  // Mais de um lote, incluindo caracteres especiais e um produto inativo.
  const fixtureRows = Array.from({ length: 205 }, (_, index) => [
    index === 0 ? 'Validacao "CSV"; produto' : `Validacao CSV ${index}`,
    `VALIDACAO-${index}`, 1.25, 2.5, 1, 0,
  ]);
  await pool.query("INSERT INTO products (name, sku, cost_price, sale_price, quantity, minimum_stock) VALUES ?", [fixtureRows]);
  await pool.query("UPDATE products SET active = FALSE WHERE sku = ?", ["VALIDACAO-204"]);
  const activeFixtures = await request("/reports/products?search=VALIDACAO-");
  check(activeFixtures.pagination.total === 204, "Inativos ficam fora por padrao");
  const includingInactive = await request("/reports/products?search=VALIDACAO-&onlyActive=false");
  check(includingInactive.pagination.total === 205, "Inclusao explicita de inativos");
  const csvResponse = await request("/reports/products?search=VALIDACAO-&format=csv&page=3&pageSize=5&sort=sku");
  check(csvResponse.headers.get("content-disposition").includes("attachment"), "CSV e anexo");
  const bytes = Buffer.from(await csvResponse.arrayBuffer());
  check(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), "CSV tem BOM UTF-8");
  const csv = bytes.toString("utf8");
  check(csv.split("\r\n").length === 205, "CSV exporta as 204 linhas filtradas, alem do primeiro lote");
  check(csv.includes('"Validacao ""CSV""; produto"'), "CSV escapa separador e aspas");
  check(csv.includes("1,25"), "CSV usa virgula decimal");

  const fixtureProduct = await request("/products", {
    method: "POST", status: 201,
    body: { name: "Produto para validar movimento", sku: "VALIDACAO-MOV", quantity: 0, costPrice: 1, salePrice: 2 },
  });
  const created = await request("/movements", {
    method: "POST", status: 201,
    body: { productId: fixtureProduct.id, type: "IN", quantity: 3, userId: 999999, note: 'Validacao; "responsavel"' },
  });
  const stored = await request(`/reports/movements?productId=${fixtureProduct.id}`);
  check(stored.rows[0].userId === login.user.id && stored.rows[0].id === created.id, "Responsavel vem do token, ignorando corpo");
  const failedStock = await request("/movements", {
    method: "POST", status: 400,
    body: { productId: fixtureProduct.id, type: "OUT", quantity: 4 },
  });
  check(failedStock.error.includes("insuficiente"), "Saida sem saldo e recusada");
  const currentProduct = await request(`/products/${fixtureProduct.id}`);
  check(currentProduct.quantity === 3, "Transacao preserva saldo apos erro");
  const movementCsv = await request(`/reports/movements?productId=${fixtureProduct.id}&format=csv`);
  check((await movementCsv.text()).includes('"Validacao; ""responsavel"""'), "CSV de movimentos escapa observacao");

  // Sem dados ativos: agregacoes e ABC precisam continuar validos.
  await pool.query("UPDATE products SET active = FALSE");
  const zeroSummary = await request("/reports/stock-summary");
  check(zeroSummary.productCount === 0 && zeroSummary.totalCostValue === 0 && zeroSummary.outOfStockCount === 0, "Resumo vazio nao devolve null");
  const noAbc = await request("/reports/abc-curve");
  check(noAbc.length === 0, "ABC sem produtos ativos");
  await pool.query("UPDATE products SET active = TRUE, cost_price = 0");
  const zeroAbc = await request("/reports/abc-curve");
  check(zeroAbc.every(row => row.sharePercent === 0 && row.abcClass === "C"), "ABC com custo total zero nao divide por zero");

  for (const path of ["/categories", "/products", "/movements", "/dashboard"]) await request(path);
  console.log(`Validacao concluida: ${checks} verificacoes aprovadas.`);
} finally {
  await new Promise(resolve => server.close(resolve));
  await pool.end();
}
