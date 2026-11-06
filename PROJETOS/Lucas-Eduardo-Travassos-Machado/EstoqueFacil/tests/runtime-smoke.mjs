// Smoke em Node 22 dentro da imagem Docker, sem escrever no banco.
import assert from "node:assert/strict";
import { once } from "node:events";
if (!/^estoque_[a-z_]+_validation$/.test(process.env.DB_NAME ?? ""))
  throw new Error("Banco de validacao obrigatorio");
const { app } = await import("/app/src/app.js");
const { pool } = await import("/app/src/config/database.js");
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
try {
  assert.equal((await fetch(base + "/api/health")).status, 200);
  const css = await fetch(base + "/css/app.css");
  assert.equal(css.status, 200);
  assert.ok((await css.text()).length > 10000);
  assert.equal((await fetch(base + "/login.html")).status, 200);
  assert.equal((await fetch(base + "/api/products")).status, 401);
  const login = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "professor@estoquefacil.com",
      password: "123456",
    }),
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  for (const path of [
    "/api/dashboard",
    "/api/dashboard/movements-by-day?days=7",
    "/api/products?pageSize=3",
    "/api/products/search?q=caf",
    "/api/reports/products?format=csv",
    "/api/reports/movements?format=csv",
  ]) {
    const response = await fetch(base + path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200, path);
  }
  console.log(
    `Smoke Docker aprovado em ${process.version}: HTTP, CSS, JWT, MySQL, busca, paginacao, dashboard e CSV.`,
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
}
