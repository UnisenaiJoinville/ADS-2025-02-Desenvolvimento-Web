import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth-middleware.js";

import * as controller from "./product-controller.js";

export const productRoutes = Router();

// "/export" precisa vir ANTES de "/:id", senao o Express tentaria
// interpretar "export" como um id.
productRoutes.get("/export", asyncHandler(controller.exportCsv));

// Leitura e publica; escrita exige login (Exercicio 3.1).
productRoutes.get("/", asyncHandler(controller.index));
productRoutes.get("/:id", asyncHandler(controller.show));
productRoutes.post("/", requireAuth, asyncHandler(controller.store));
productRoutes.put("/:id", requireAuth, asyncHandler(controller.update));
productRoutes.delete("/:id", requireAuth, asyncHandler(controller.destroy));
productRoutes.patch("/:id/reactivate", requireAuth, asyncHandler(controller.reactivate));
