import { chromium } from "playwright";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import { readFile, mkdir } from "node:fs/promises";
process.env.DB_HOST = process.env.TEST_DB_HOST ?? "127.0.0.1";
process.env.DB_PORT = process.env.TEST_DB_PORT ?? "3307";
process.env.DB_USER = process.env.TEST_DB_USER ?? "root";
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? "testpass";
process.env.DB_NAME = process.env.TEST_UI_DB_NAME ?? "estoque_browser_test";
process.env.JWT_SECRET =
  "teste-browser-local-segredo-de-pelo-menos-32-caracteres";
process.env.JWT_EXPIRES_IN = "15m";
process.env.REGISTRATION_OPEN = "true";
process.env.TRUST_PROXY = "false";
const name = process.env.DB_NAME;
if (!/^[a-z0-9_]+_test$/.test(name))
  throw new Error("O banco de UI deve terminar em _test");
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});
await db.query(
  `DROP DATABASE IF EXISTS \`${name}\`;CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;USE \`${name}\`;SET time_zone='-03:00';`,
);
await db.query(
  await readFile(new URL("../database/init.sql", import.meta.url), "utf8"),
);
const { app } = await import("../src/app.js");
const { pool } = await import("../src/config/database.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
let errors = [];
page.setDefaultTimeout(10000);
page.on("pageerror", (error) => errors.push(error.message));
let checks = 0;
async function check(label, fn) {
  await fn();
  checks++;
  console.log("OK UI:", label);
}
try {
  await check("telas internas redirecionam sem sessao", async () => {
    await page.goto(base + "/produtos.html");
    await page.waitForURL("**/login.html");
  });
  await check("senha visivel e erro de login sem reload", async () => {
    await page.locator("input[type=email]").fill("browser@example.com");
    await page
      .locator("input[autocomplete=current-password]")
      .fill("Errada123");
    await page
      .getByRole("button", { name: "Mostrar senha", exact: true })
      .click();
    assert.equal(
      await page
        .locator("input[autocomplete=current-password]")
        .getAttribute("type"),
      "text",
    );
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByText("E-mail ou senha invalidos", { exact: true })
      .waitFor();
    await page.getByText(/Restam 4 tentativas/).waitFor();
  });
  await check(
    "cadastro Vue entra direto e mostra dashboard e grafico",
    async () => {
      await page.goto(base + "/cadastro.html");
      const inputs = page.locator("input");
      await inputs.nth(0).fill("Administrador Browser");
      await inputs.nth(1).fill("browser@example.com");
      await inputs.nth(2).fill("SenhaBrowser123!");
      await inputs.nth(3).fill("SenhaBrowser123!");
      await page
        .getByRole("button", { name: "Criar conta", exact: true })
        .click();
      await page.waitForURL("**/index.html");
      await page.getByText("Preco medio de venda", { exact: true }).waitFor();
      await page
        .locator("[data-chart-summary]")
        .filter({ hasText: "7 dias:" })
        .waitFor();
      await page.locator("[data-chart-days]").selectOption("30");
      await page
        .locator("[data-chart-summary]")
        .filter({ hasText: "30 dias:" })
        .waitFor();
    },
  );
  await check(
    "produto completo, fornecedor, modal acessivel, foco preso",
    async () => {
      await page.goto(base + "/produtos.html");
      await page
        .locator("[data-page-info]")
        .filter({ hasText: "de 12" })
        .waitFor();
      await page.locator("[data-new]").click();
      const f = page.locator("[data-form]");
      await f.locator("[name=name]").fill("Produto Browser Especial");
      await f.locator("[name=sku]").fill("BROWSER-001");
      await f.locator("[name=supplier]").fill("Fornecedor Browser");
      await f.locator("[name=costPrice]").fill("10");
      await f.locator("[name=salePrice]").fill("20");
      await f.locator("[name=quantity]").fill("10");
      await f.getByRole("button", { name: "Salvar", exact: true }).focus();
      await page.keyboard.press("Tab");
      assert.ok(
        await page
          .locator("[data-modal]")
          .evaluate((el) => el.contains(document.activeElement)),
      );
      await f.getByRole("button", { name: "Salvar", exact: true }).click();
      await page.locator("[data-modal]").waitFor({ state: "hidden" });
      await page.locator("[name=search]").fill("Browser Especial");
      await page.waitForFunction(
        () =>
          new URL(location.href).searchParams.get("search") ===
          "Browser Especial",
      );
      await page
        .locator("[data-rows]")
        .getByText("Produto Browser Especial", { exact: true })
        .waitFor();
    },
  );
  await check(
    "editar pelo icone, saldo bloqueado e fornecedor persistido",
    async () => {
      await page
        .locator("tr")
        .filter({ hasText: "Produto Browser Especial" })
        .locator("[data-edit] svg")
        .click();
      await page.locator("[data-modal]:not(.hidden)").waitFor();
      assert.equal(
        await page.locator("[data-form] [name=supplier]").inputValue(),
        "Fornecedor Browser",
      );
      assert.ok(
        await page
          .locator("[data-form] [name=quantity]")
          .evaluate((e) => e.readOnly),
      );
      await page.keyboard.press("Escape");
      assert.ok(
        await page
          .locator("[data-modal]")
          .evaluate((e) => e.classList.contains("hidden")),
      );
    },
  );
  await check("paginacao na URL e recarregamento", async () => {
    await page.locator("[name=search]").fill("");
    await page.locator("[name=pageSize]").selectOption("5");
    await page
      .locator("[data-page-info]")
      .filter({ hasText: "de 13" })
      .waitFor();
    await page.locator("[data-next]").click();
    await page
      .locator("[data-page-number]")
      .filter({ hasText: "2 / 3" })
      .waitFor();
    await page.reload();
    await page
      .locator("[data-page-number]")
      .filter({ hasText: "2 / 3" })
      .waitFor();
    assert.ok(page.url().includes("page=2"));
  });
  await check(
    "autocomplete via teclado, bloqueio de saida e movimentacao unica",
    async () => {
      await page.goto(base + "/movimentacoes.html");
      const picker = page.getByRole("combobox");
      await picker.fill("BROWSER-001");
      await page.getByRole("option").first().waitFor();
      await picker.press("ArrowDown");
      await picker.press("Enter");
      await page.locator("input[name=type][value=OUT]").check({ force: true });
      await page.locator("[name=quantity]").fill("50");
      assert.ok(await page.locator("[data-form] button").isDisabled());
      await page.locator("input[name=type][value=IN]").check({ force: true });
      await page.locator("[name=quantity]").fill("3");
      await page.locator("[data-form] button").click();
      await page
        .locator("[data-rows] tr")
        .filter({ hasText: "Produto Browser Especial" })
        .waitFor();
      const [[r]] = await db.query(
        "SELECT COUNT(*) AS n FROM stock_movements m JOIN products p ON p.id=m.product_id WHERE p.sku='BROWSER-001'",
      );
      assert.equal(r.n, 1);
    },
  );
  await check("ajuste inventario zero e responsavel visivel", async () => {
    const picker = page.getByRole("combobox");
    await picker.fill("BROWSER-001");
    await page.getByRole("option").first().waitFor();
    await page.getByRole("option").first().click();
    await page.locator("input[name=type][value=ADJUST]").check({ force: true });
    await page.locator("[name=quantity]").fill("0");
    await page.locator("[name=note]").fill("Inventario browser");
    await page.locator("[data-form] button").click();
    await page
      .locator("[data-rows]")
      .getByText("Inventario browser", { exact: true })
      .waitFor();
    assert.ok(
      await page
        .locator("[data-rows]")
        .getByText("Administrador Browser", { exact: true })
        .count(),
    );
  });
  await check(
    "exclusao com historico oferece inativacao e preserva linhas",
    async () => {
      await page.goto(base + "/produtos.html?search=BROWSER-001");
      await page.locator("[data-delete] svg").click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Excluir", exact: true })
        .click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Inativar produto", exact: true })
        .click();
      await page
        .getByText("Nenhum produto encontrado", { exact: true })
        .waitFor();
      await page.locator("[name=includeInactive]").check();
      await page
        .locator("[data-rows]")
        .getByText("Inativo", { exact: true })
        .waitFor();
      const [[r]] = await db.query(
        "SELECT COUNT(*) AS n FROM stock_movements m JOIN products p ON p.id=m.product_id WHERE p.sku='BROWSER-001'",
      );
      assert.equal(r.n, 2);
    },
  );
  await check("CRUD categoria e confirmacao propria", async () => {
    await page.goto(base + "/categorias.html");
    await page.locator("[name=name]").fill("Categoria Browser");
    await page.locator("[data-form] button:not([type=button])").click();
    await page
      .locator("[data-rows]")
      .getByText("Categoria Browser", { exact: true })
      .waitFor();
    const row = page.locator("tr").filter({ hasText: "Categoria Browser" });
    await row.locator("[data-edit] svg").click();
    await page.locator("[name=name]").fill("Categoria Browser Editada");
    await page.locator("[data-form] button:not([type=button])").click();
    await page
      .getByText("Categoria Browser Editada", { exact: true })
      .waitFor();
    await page
      .locator("tr")
      .filter({ hasText: "Categoria Browser Editada" })
      .locator("[data-delete]")
      .click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Excluir", exact: true })
      .click();
    await page.getByText("Categoria excluida", { exact: true }).waitFor();
  });
  await check("relatorios Vue, abas e picker reutilizado", async () => {
    await page.goto(base + "/relatorios.html");
    await page
      .getByRole("button", { name: "Movimentacoes", exact: true })
      .click();
    await page.locator("[data-report-picker] input").fill("Cafe");
    await page.getByRole("option").first().waitFor();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Resumos", exact: true }).click();
    await page.getByText("Ferramentas", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Analises", exact: true }).click();
    await page.getByText("Curva ABC", { exact: false }).first().waitFor();
  });
  await check("CSV pelo navegador", async () => {
    await page.goto(base + "/produtos.html");
    const download = page.waitForEvent("download");
    await page.locator("[data-export]").click();
    const file = await download;
    assert.equal(file.suggestedFilename(), "produtos.csv");
  });
  await check("relatorios avancados e comparacao de meses", async () => {
    await page.goto(base + "/analises.html");
    await page.locator("[name=report]").selectOption("compare");
    await page.getByRole("button", { name: "Consultar", exact: true }).click();
    await page.locator("[data-analysis-result] table").waitFor();
    assert.ok(
      (await page.locator("[data-analysis-result]").textContent()).includes(
        "Entradas",
      ),
    );
  });
  await check(
    "modo escuro persiste; layout mobile; laboratorio Vue",
    async () => {
      await page.goto(base + "/index.html");
      await page.locator("[data-theme]").click();
      assert.ok(
        await page
          .locator("html")
          .evaluate((e) => e.classList.contains("dark")),
      );
      await page.reload();
      assert.ok(
        await page
          .locator("html")
          .evaluate((e) => e.classList.contains("dark")),
      );
      await mkdir("test-results", { recursive: true });
      await page.screenshot({
        path: "test-results/dashboard.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      for (const path of [
        "/produtos.html",
        "/movimentacoes.html",
        "/categorias.html",
        "/relatorios.html",
      ]) {
        await page.goto(base + path);
        await page.locator("[data-nav] nav").waitFor();
        assert.ok(
          await page.evaluate(
            () =>
              document.body.getBoundingClientRect().width <= innerWidth + 1 &&
              ![...document.querySelectorAll("body *")].some(
                (e) =>
                  e.getBoundingClientRect().right > innerWidth + 1 &&
                  !e.closest(".overflow-x-auto,.overflow-hidden"),
              ),
          ),
          path + " overflow",
        );
      }
      await page.screenshot({
        path: "test-results/mobile.png",
        fullPage: false,
      });
      await page.goto(base + "/vue-lab.html");
      await page.getByRole("button", { name: "+", exact: true }).click();
      await page.getByText("Contador: 1 · Dobro: 2", { exact: true }).waitFor();
    },
  );
  await check("perfil editavel e logout", async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/perfil.html");
    await page.locator("#profile-name").fill("Nome Browser Atualizado");
    await page
      .getByRole("button", { name: "Salvar nome", exact: true })
      .click();
    await page
      .locator("[data-nav]")
      .getByText("Nome Browser Atualizado", { exact: true })
      .waitFor();
    await page.locator("[data-logout]").click();
    await page.waitForURL("**/login.html");
  });
  assert.deepEqual(errors, [], "Erros JavaScript no navegador");
  console.log(`UI: ${checks} cenarios aprovados, sem erros JavaScript.`);
} catch (error) {
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/failure.png", fullPage: true });
  console.error("PAGE ERRORS", errors);
  console.error((await page.locator("body").innerText()).slice(-2500));
  throw error;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
  await pool.end();
  await db.end();
}
