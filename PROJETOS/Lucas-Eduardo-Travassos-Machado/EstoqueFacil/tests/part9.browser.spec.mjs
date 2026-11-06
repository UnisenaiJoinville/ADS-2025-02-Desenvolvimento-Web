import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { installCdnCache } from "./cdn-cache.mjs";
test.beforeEach(async ({ page }) => installCdnCache(page));
const credentials = { email: "professor@estoquefacil.com", password: "123456" };
async function authenticate(page, request) {
  const response = await request.post("/api/auth/login", { data: credentials });
  expect(response.ok()).toBeTruthy();
  const session = await response.json();
  await page.addInitScript((session) => {
    localStorage.setItem("estoque-facil:token", session.token);
    localStorage.setItem("estoque-facil:user", JSON.stringify(session.user));
  }, session);
  return { Authorization: `Bearer ${session.token}` };
}
async function product(request, headers, data) {
  const response = await request.post("/api/products", {
    headers,
    data: { costPrice: 1, salePrice: 2, ...data },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
test("01-05: senha, Caps Lock, credenciais invalidas e Lucide indisponivel", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login.html");
  const password = page.locator("#auth-password"),
    eye = page.getByRole("button", { name: "Mostrar senha", exact: true });
  await password.fill("123456");
  for (let i = 0; i < 8; i++) {
    await page.locator("button[aria-pressed]").click();
    await expect(password).toHaveAttribute(
      "type",
      i % 2 === 0 ? "text" : "password",
    );
    await expect(page.locator("button[aria-pressed] svg")).toHaveCount(1);
  }
  await eye.focus();
  await page.keyboard.press("Enter");
  await expect(password).toHaveAttribute("type", "text");
  await password.dispatchEvent("keydown", { key: "A", modifierCapsLock: true });
  await expect(page.getByText("Caps Lock ativado")).toBeVisible();
  await password.dispatchEvent("keyup", { key: "a", modifierCapsLock: false });
  await expect(page.getByText("Caps Lock ativado")).toHaveCount(0);
  await page.locator('input[type="email"]').fill(credentials.email);
  await password.fill("errada");
  let navigations = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navigations++;
  });
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("E-mail ou senha invalidos")).toBeVisible();
  expect(navigations).toBe(0);
  await page.route("**/lucide.min.js", (route) => route.abort());
  await page.reload();
  await password.fill("abc123");
  await page
    .getByRole("button", { name: "Mostrar senha", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "text");
  expect(errors).toEqual([]);
});
test("cadastro Vue: olho controla as duas senhas e cadastro real funciona", async ({
  page,
}) => {
  await page.goto("/cadastro.html");
  await page.locator('input[autocomplete="name"]').fill("Validacao navegador");
  await page
    .locator('input[type="email"]')
    .fill(`navegador${Date.now()}@example.test`);
  await page
    .locator('input[autocomplete="new-password"]')
    .nth(0)
    .fill("Validacao123!");
  await page
    .locator('input[autocomplete="new-password"]')
    .nth(1)
    .fill("Validacao123!");
  await page
    .getByRole("button", { name: "Mostrar senhas", exact: true })
    .click();
  await expect(
    page.locator('input[autocomplete="new-password"][type="text"]'),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/login.html\?cadastro=ok/);
  await expect(
    page.getByText("Conta criada com sucesso! Agora e so entrar."),
  ).toBeVisible();
});
test("03,06-08,30-31: navegacao, Axios, relatórios e CSV completo", async ({
  page,
  request,
}) => {
  await authenticate(page, request);
  const errors = [],
    warnings = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.text().includes("cdn.tailwindcss.com")) warnings.push(m.text());
  });
  for (const path of [
    "index",
    "produtos",
    "movimentacoes",
    "categorias",
    "relatorios",
  ]) {
    await page.goto(`/${path}.html`);
    await expect(page.locator('nav [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator("nav svg")).toHaveCount(5);
    const style = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(style).toBe("rgb(241, 245, 249)");
  }
  const invalid = await page.evaluate(async () => {
    const { api } = await import("/js/api.js");
    try {
      await api.getProduct(99999999);
    } catch (e) {
      return { message: e.message, status: e.status };
    }
  });
  expect(invalid).toEqual({ message: "Produto nao encontrado", status: 404 });
  const authRequest = page.waitForRequest(
    (r) =>
      r.url().includes("/api/reports/products") &&
      Boolean(r.headers().authorization),
  );
  await page.reload();
  await authRequest;
  for (const name of ["Movimentacoes", "Resumos", "Analises", "Produtos"])
    await page.getByRole("button", { name, exact: true }).click();
  const csv = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Exportar CSV/ })
    .first()
    .click();
  const download = await csv;
  const content = fs.readFileSync(await download.path());
  expect(content.subarray(0, 3)).toEqual(Buffer.from([239, 187, 191]));
  await page
    .getByRole("button", { name: "Movimentacoes", exact: true })
    .click();
  const csv2 = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).last().click();
  await csv2;
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});
test("09-13,22: autocomplete, teclado, mouse, cancelamento real e envio unico", async ({
  page,
  request,
  context,
}) => {
  const headers = await authenticate(page, request);
  const term = "Browser cafe " + Date.now();
  const fixture = await product(request, headers, {
    name: term + " <img src=x onerror=alert(1)>",
    sku: "BROWSER-MOVE-" + Date.now(),
    quantity: 10,
  });
  await page.goto("/movimentacoes.html");
  const search = page.getByRole("combobox");
  await search.fill(term);
  await expect(page.locator('[role="option"] mark').first()).toHaveText(term);
  await expect(page.locator('[role="option"] img')).toHaveCount(0);
  await search.press("ArrowDown");
  await search.press("ArrowUp");
  await search.press("Enter");
  await expect(page.locator('[name="productId"]')).toHaveValue(
    String(fixture.id),
  );
  await expect(page.locator("[data-stock-hint]")).toContainText("10 unidade");
  await page.locator('[name="type"][value="OUT"]').check({ force: true });
  await page.locator('[name="quantity"]').fill("99");
  await expect(page.locator("[data-submit]")).toBeDisabled();
  await expect(page.locator("[data-stock-hint]")).toContainText("Saida maior");
  await page.locator('[name="quantity"]').fill("1");
  await expect(page.locator("[data-submit]")).toBeEnabled();
  await page.getByRole("button", { name: "Limpar produto" }).click();
  await search.fill(term);
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.getByRole("option").first().click();
  await expect(page.locator('[name="productId"]')).toHaveValue(
    String(fixture.id),
  );
  await search.fill("caf");
  await search.press("Tab");
  await page.waitForTimeout(450);
  await expect(search).toHaveAttribute("aria-expanded", "false");
  await search.focus();
  await search.fill("caf");
  await search.press("Escape");
  await page.waitForTimeout(450);
  await expect(search).toHaveAttribute("aria-expanded", "false");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 600,
    downloadThroughput: 50000,
    uploadThroughput: 50000,
  });
  const aborted = [];
  page.on("requestfailed", (r) => {
    if (r.url().includes("/products/search"))
      aborted.push(r.failure()?.errorText);
  });
  await search.fill("c");
  await page.waitForRequest((r) => r.url().includes("/products/search?q=c&"));
  await search.fill(term);
  await expect(page.getByRole("option").first()).toContainText(term);
  expect(aborted.some((s) => /ABORTED/.test(s))).toBeTruthy();
  await search.press("Enter");
  await page.locator('[name="type"][value="IN"]').check({ force: true });
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/api/movements")) posts++;
  });
  await page.locator("[data-form]").evaluate((form) => {
    for (let i = 0; i < 3; i++) form.requestSubmit();
  });
  await expect(
    page.getByText("Entrada registrada", { exact: true }),
  ).toBeVisible();
  expect(posts).toBe(1);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  const stored = await request.get(`/api/products/${fixture.id}`, { headers });
  expect((await stored.json()).quantity).toBe(11);
});
test("14-17,23-25: paginacao, debounce, exclusao da ultima pagina e foco", async ({
  page,
  request,
}) => {
  const headers = await authenticate(page, request),
    prefix = "P9PAGE" + Date.now();
  for (let i = 0; i < 11; i++)
    await product(request, headers, {
      name: prefix + " " + String(i).padStart(2, "0"),
      sku: prefix + "-" + i,
    });
  await page.goto("/produtos.html");
  await expect(page.locator("[data-edit]").first()).toBeVisible();
  let searches = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/products?")) searches++;
  });
  const search = page.getByRole("searchbox");
  await search.fill(prefix);
  await expect(page.locator("[data-page-info]")).toContainText("de 11");
  expect(searches).toBe(1);
  await expect(page.locator("[data-page-prev]")).toBeDisabled();
  await page.locator("[data-page-next] svg").click();
  await expect(page.locator("[data-page-label]")).toHaveText("2 / 2");
  await expect(page.locator("[data-page-next]")).toBeDisabled();
  const edit = page.locator("[data-edit]").first();
  await edit.focus();
  await edit.locator("svg").click();
  await expect(page.locator('[name="name"]')).toBeFocused();
  await page.getByText("Preco de venda", { exact: true }).click();
  await expect(page.locator('[name="salePrice"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(edit).toBeFocused();
  await page.locator("[data-delete] svg").first().click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancelar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.locator("[data-delete]").first().click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.locator("[data-page-label]")).toHaveText("1 / 1");
  await expect(page.locator("[data-page-info]")).toContainText("de 10");
});
test("18-21: exclusao com historico oferece inativar e preserva relatorios", async ({
  page,
  request,
}) => {
  const headers = await authenticate(page, request);
  await page.goto("/produtos.html");
  await page.getByRole("searchbox").fill("BEB-001");
  await expect(page.locator("[data-edit]")).toHaveCount(1);
  await page.locator("[data-delete] svg").click();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-delete]")).toBeFocused();
  await page.locator("[data-delete]").click();
  await page.mouse.click(2, 2);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.locator("[data-delete]").click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("historico");
  await page.getByRole("button", { name: "Inativar produto" }).click();
  await expect(page.locator("[data-rows]")).toContainText("Inativo");
  const inactive = await request.get("/api/products/search?q=BEB-001", {
    headers,
  });
  expect(await inactive.json()).toEqual([]);
  const history = await request.get("/api/reports/movements?productId=1", {
    headers,
  });
  expect((await history.json()).pagination.total).toBeGreaterThan(0);
  const product = await (
    await request.get("/api/products/1", { headers })
  ).json();
  const rejected = await request.post("/api/movements", {
    headers,
    data: { productId: 1, type: "IN", quantity: 1 },
  });
  expect(rejected.status()).toBe(400);
  await request.put("/api/products/1", {
    headers,
    data: { ...product, active: true },
  });
});
test("29: grafico 7/30/90, instancia unica, resumo e falha isolada", async ({
  page,
  request,
}) => {
  await authenticate(page, request);
  await page.goto("/index.html");
  await expect(page.locator("[data-chart-summary]")).toContainText("30 dias");
  const id = await page
    .locator("canvas")
    .evaluate((canvas) => window.Chart.getChart(canvas).id);
  for (const days of [7, 90, 30]) {
    await page.locator(`[data-days="${days}"]`).click();
    await expect(page.locator("[data-chart-summary]")).toContainText(
      `${days} dias`,
    );
    expect(
      await page
        .locator("canvas")
        .evaluate((canvas) => window.Chart.getChart(canvas).id),
    ).toBe(id);
    expect(
      await page
        .locator("canvas")
        .evaluate((canvas) => window.Chart.getChart(canvas).data.labels.length),
    ).toBe(days);
  }
  await page.locator("canvas").hover();
  await page.route("**/chart.umd.js", (route) => route.abort());
  await page.reload();
  await expect(page.locator("[data-chart-summary]")).toBeVisible();
  await expect(page.locator("[data-chart-summary]")).toContainText(
    "Nao foi possivel carregar",
  );
  await expect(page.locator("[data-cards]")).toContainText("Produtos ativos");
});
test("celular 390px: todas as telas sem transbordamento, sessao expirada e erros recuperaveis", async ({
  page,
  request,
}) => {
  await authenticate(page, request);
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "index",
    "produtos",
    "movimentacoes",
    "categorias",
    "relatorios",
  ]) {
    await page.goto(`/${path}.html`);
    await page.waitForTimeout(400);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `.validation/mobile-${path}.png`,
      fullPage: true,
    });
  }
  await page.goto("/produtos.html");
  await page.route("**/api/products?**", (route) => route.abort());
  await page.getByRole("searchbox").fill("falha");
  await expect(page.locator("[data-rows]")).toContainText("Nao foi possivel");
  await page.unroute("**/api/products?**");
  await page.getByRole("searchbox").fill("caf");
  await expect(page.locator("[data-rows]")).toContainText("Cafe");
  await page.evaluate(() =>
    localStorage.setItem("estoque-facil:token", "invalido"),
  );
  await page.evaluate(async () => {
    const { api } = await import("/js/api.js");
    try {
      await api.getProduct(1);
    } catch {}
  });
  await expect(page).toHaveURL(/login.html/);
  expect(errors).toEqual([]);
});
test("estados de carga e respostas fora de ordem", async ({
  page,
  request,
}) => {
  await authenticate(page, request);
  await page.route("**/api/products?**", async (route) => {
    const response = await route.fetch();
    await new Promise((r) => setTimeout(r, 650));
    try {
      await route.fulfill({ response });
    } catch {}
  });
  await page.goto("/produtos.html");
  await expect(
    page.locator("[data-rows] .animate-pulse").first(),
  ).toBeVisible();
  await expect(page.locator("[data-edit]").first()).toBeVisible();
  await page.getByRole("searchbox").fill("naoexistep9");
  await expect(page.locator("[data-rows]")).toHaveClass(/opacity-50/);
  await expect(page.locator("[data-rows]")).toContainText(
    "Nenhum produto encontrado",
  );
  await page.goto("/movimentacoes.html");
  await page.route("**/api/products/search?**", async (route) => {
    const q = new URL(route.request().url()).searchParams.get("q");
    await new Promise((r) => setTimeout(r, q === "lenta" ? 900 : 50));
    try {
      await route.fulfill({
        json: [
          {
            id: q === "lenta" ? 1 : 2,
            name: q === "lenta" ? "Resposta antiga" : "Resposta nova",
            sku: "P9",
            quantity: 10,
            minimumStock: 1,
            active: true,
          },
        ],
      });
    } catch {}
  });
  const input = page.getByRole("combobox");
  await input.fill("lenta");
  await page.waitForRequest((r) => r.url().includes("q=lenta"));
  await input.fill("rapida");
  await expect(page.getByRole("option")).toContainText("Resposta nova");
  await page.waitForTimeout(1100);
  await expect(page.getByRole("option")).toContainText("Resposta nova");
  await input.press("Enter");
  await expect(page.locator('[name="productId"]')).toHaveValue("2");
});
test("CRUD em formularios: produto e categoria, cliques repetidos e erros", async ({
  page,
  request,
}) => {
  await authenticate(page, request);
  const suffix = String(Date.now()),
    name = "Produto UI " + suffix,
    sku = "UI-" + suffix;
  await page.goto("/produtos.html");
  await page.getByRole("button", { name: /Novo produto/ }).click();
  await page.locator("#product-name").fill(name);
  await page.locator("#product-sku").fill(sku);
  await page.locator("#product-cost").fill("1");
  await page.locator("#product-sale").fill("2");
  await page.locator("[data-form]").evaluate((f) => {
    for (let i = 0; i < 3; i++) f.requestSubmit();
  });
  await expect(page.locator("[data-modal]")).toBeHidden();
  await page.getByRole("searchbox").fill(sku);
  await expect(page.locator("[data-edit]")).toHaveCount(1);
  await page.locator("[data-edit]").click();
  await expect(page.locator("#product-quantity")).toHaveAttribute(
    "readonly",
    "",
  );
  await page.locator("#product-name").fill(name + " editado");
  await page.locator("[data-save]").click();
  await expect(page.locator("[data-rows]")).toContainText(name + " editado");
  await page.locator("[data-delete]").click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.locator("[data-page-info]")).toHaveText("Nenhum produto");
  await page.goto("/categorias.html");
  const category = "Categoria UI " + suffix;
  await page.locator("#category-name").fill(category);
  await page.locator("[data-form]").evaluate((f) => {
    for (let i = 0; i < 3; i++) f.requestSubmit();
  });
  const row = page.locator("tr").filter({ hasText: category });
  await expect(row).toHaveCount(1);
  await row.locator("[data-edit] svg").click();
  await page.locator("#category-name").fill(category + " editada");
  await page.locator("[data-save]").click();
  await expect(row).toContainText("editada");
  await row.locator("[data-delete] svg").click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(row).toHaveCount(0);
});
test("26-28: limite real de login e mensagem na tela", async ({
  page,
  request,
}) => {
  // Uma falha foi enviada no primeiro cenario: quatro completam as cinco.
  for (let i = 0; i < 4; i++)
    expect(
      (
        await request.post("/api/auth/login", {
          data: { ...credentials, password: "errada" },
        })
      ).status(),
    ).toBe(401);
  const blocked = await request.post("/api/auth/login", { data: credentials });
  expect(blocked.status()).toBe(429);
  expect(blocked.headers()["ratelimit"]).toContain("remaining=0");
  await page.goto("/login.html");
  await page.locator('input[type="email"]').fill(credentials.email);
  await page.locator("#auth-password").fill(credentials.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText(/Muitas tentativas de login/)).toBeVisible();
});
