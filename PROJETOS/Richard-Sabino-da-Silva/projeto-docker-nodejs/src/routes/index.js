import { Router } from "express";

export const routes = Router();

routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});