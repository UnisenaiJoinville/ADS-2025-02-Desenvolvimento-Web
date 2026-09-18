import { Router } from "express";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", (request, response) => {
  response.json({ /* dados do dashboard */ });
});