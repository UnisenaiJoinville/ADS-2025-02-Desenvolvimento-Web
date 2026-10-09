import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./report-controller.js";

export const reportRoutes = Router();

reportRoutes.get("/products", asyncHandler(controller.products));
reportRoutes.get("/movements", asyncHandler(controller.movements));
reportRoutes.get("/stock-summary", asyncHandler(controller.stockSummary));
reportRoutes.get("/stock-by-category", asyncHandler(controller.stockByCategory));
reportRoutes.get(
  "/products-without-movement",
  asyncHandler(controller.productsWithoutMovement)
);
