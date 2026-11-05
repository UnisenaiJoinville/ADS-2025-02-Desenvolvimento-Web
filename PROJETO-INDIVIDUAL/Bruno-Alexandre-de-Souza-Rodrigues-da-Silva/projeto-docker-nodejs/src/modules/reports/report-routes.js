import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./report-controller.js";

export const reportRoutes = Router();

// Todas estas rotas ja estao protegidas: o ensureAuthenticated do
// routes/index.js roda antes de qualquer uma delas (Aula 27).

// --- Relatorios de produtos e estoque ---
reportRoutes.get("/products", asyncHandler(controller.products));
reportRoutes.get("/stock-summary", asyncHandler(controller.stockSummary));
reportRoutes.get("/stock-by-category", asyncHandler(controller.stockByCategory));
reportRoutes.get("/products-without-movement", asyncHandler(controller.productsWithoutMovement));
reportRoutes.get("/abc-curve", asyncHandler(controller.abcCurve));

// --- Relatorios de movimentacoes ---
reportRoutes.get("/movements", asyncHandler(controller.movements));
reportRoutes.get("/movements-by-user", asyncHandler(controller.movementsByUser));
reportRoutes.get("/movements-by-month", asyncHandler(controller.movementsByMonth));
reportRoutes.get("/top-products", asyncHandler(controller.topProducts));
