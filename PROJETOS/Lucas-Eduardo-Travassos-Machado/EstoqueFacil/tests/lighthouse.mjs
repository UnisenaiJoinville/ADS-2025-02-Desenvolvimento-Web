import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { installCdnCache } from "./cdn-cache.mjs";
const base = process.env.VALIDATION_URL ?? "http://127.0.0.1:3019";
const response = await fetch(base + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "professor@estoquefacil.com",
    password: "123456",
  }),
});
if (!response.ok)
  throw new Error(
    "Login falhou. Reinicie somente a API de validacao se estiver bloqueada.",
  );
const session = await response.json();
const chrome = await launch({
  chromeFlags: ["--headless=new", "--no-first-run"],
});
let browser;
try {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
  await installCdnCache(browser.contexts()[0]);
  const page = await browser.contexts()[0].newPage();
  await page.goto(base + "/login.html");
  await page.evaluate((session) => {
    localStorage.setItem("estoque-facil:token", session.token);
    localStorage.setItem("estoque-facil:user", JSON.stringify(session.user));
  }, session);
  await page.goto(base + "/produtos.html");
  await page.locator("[data-edit]").first().waitFor();
  const result = await lighthouse(base + "/produtos.html", {
    port: chrome.port,
    onlyCategories: ["accessibility"],
    disableStorageReset: true,
    output: "html",
    logLevel: "error",
  });
  if (result.lhr.finalDisplayedUrl.includes("login.html"))
    throw new Error("Lighthouse perdeu a sessao");
  mkdirSync(".validation", { recursive: true });
  writeFileSync(".validation/lighthouse.html", result.report);
  writeFileSync(
    ".validation/lighthouse.json",
    JSON.stringify(result.lhr, null, 2),
  );
  console.log(
    "Lighthouse Accessibility Produtos: " +
      result.lhr.categories.accessibility.score * 100,
  );
  for (const [id, audit] of Object.entries(result.lhr.audits))
    if (audit.score === 0) console.log(id + ": " + audit.title);
} finally {
  if (browser) await browser.close();
  await chrome.kill();
}
