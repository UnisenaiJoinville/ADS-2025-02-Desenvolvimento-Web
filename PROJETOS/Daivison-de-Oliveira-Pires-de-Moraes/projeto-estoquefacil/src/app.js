import helmet from "helmet";
import { env } from "./config/env.js";
import { invalidateReports } from "./shared/http/cache-version.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "..", "public");

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy ? 1 : false);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "'unsafe-eval'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "upgrade-insecure-requests": null,
      },
    },
    strictTransportSecurity: false,
  }),
);
app.use((req, res, next) => {
  res.on("finish", () => {
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      res.statusCode < 400
    )
      invalidateReports();
  });
  next();
});
app.get("/cadastro.html", (req, res, next) =>
  env.registrationOpen ? next() : res.status(403).send("Cadastro fechado"),
);

// Interpreta o corpo das requisicoes em JSON
app.use(express.json({ limit: "64kb" }));

// Log simples de cada requisicao (util em desenvolvimento)
app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
});

// Front-end estatico (HTML + Tailwind + JS)
app.use(express.static(publicDir));

// Todas as rotas da API ficam sob /api
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
