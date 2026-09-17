import { app } from "./app.js";
import { connectWithRetry, pool } from "./config/database.js";
import { env } from "./config/env.js";

async function start() {
  await connectWithRetry();

  const server = app.listen(env.port, () => {
    console.log(`Servidor rodando em http://localhost:${env.port}`);
  });

  // Encerramento gracioso: fecha o servidor e o pool de conexoes.
  const shutdown = async (signal) => {
    console.log(`\nRecebido ${signal}. Encerrando...`);

    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("Falha ao iniciar a aplicacao:", error.message);
  process.exit(1);
});
