import { Router } from "express";

import { authRoutes } from "../modules/auth/auth-routes.js";
import { categoryRoutes } from "../modules/categories/category-routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard-routes.js";
import { movementRoutes } from "../modules/movements/movement-routes.js";
import { productRoutes } from "../modules/products/product-routes.js";
import { ensureAuthenticated } from "../shared/auth/ensure-authenticated.js";

export const routes = Router();

// --- Rotas publicas -------------------------------------------------
routes.get("/health", (request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

routes.use("/auth", authRoutes);

// --- A partir daqui, tudo exige token -------------------------------
// Este middleware roda para TODA rota declarada abaixo dele.
// A ordem das linhas neste arquivo e a regra de seguranca do sistema.
routes.use(ensureAuthenticated);

routes.use("/categories", categoryRoutes);
routes.use("/products", productRoutes);
routes.use("/movements", movementRoutes);
routes.use("/dashboard", dashboardRoutes);