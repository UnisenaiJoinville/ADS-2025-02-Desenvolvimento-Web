import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "..", "public");

export const app = express();

app.use(express.json());

app.use((request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
});

app.use(express.static(publicDir));
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
