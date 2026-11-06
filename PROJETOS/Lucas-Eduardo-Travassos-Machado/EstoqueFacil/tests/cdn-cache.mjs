import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
const assets = {
  "https://cdn.jsdelivr.net/npm/axios@1.21.0/dist/esm/axios.min.js": "axios.js",
  "https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js": "lucide.js",
  "https://unpkg.com/vue@3/dist/vue.global.js": "vue.js",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.js": "chart.js",
};
// Cache opcional dos bytes oficiais. Nao substitui APIs nem bibliotecas por mocks.
// Rotas de falha registradas depois deste cache tem precedencia no Playwright.
export async function installCdnCache(target) {
  for (const [url, file] of Object.entries(assets)) {
    const path = `.validation/cdn/${file}`;
    if (existsSync(path))
      await target.route(
        (candidate) => candidate.href === url,
        (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/javascript",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: readFileSync(path),
          }),
      );
  }
}
if (process.argv.includes("--download")) {
  mkdirSync(".validation/cdn", { recursive: true });
  for (const [url, file] of Object.entries(assets)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha HTTP ${response.status}: ${url}`);
    writeFileSync(
      `.validation/cdn/${file}`,
      Buffer.from(await response.arrayBuffer()),
    );
  }
  console.log("Cache de scripts oficiais preparado em .validation/cdn");
}
