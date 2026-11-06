import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "part9.browser.spec.mjs",
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [
    ["line"],
    ["json", { outputFile: ".validation/browser-results.json" }],
  ],
  use: {
    baseURL: process.env.VALIDATION_URL ?? "http://127.0.0.1:3019",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
