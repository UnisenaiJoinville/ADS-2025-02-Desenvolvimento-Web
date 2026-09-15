import { Router } from "express";

import { categoryRoutes } from "../modules/categories/category-routes.js";

export const routes = Router();

routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

routes.use("/categories", categoryRoutes);
