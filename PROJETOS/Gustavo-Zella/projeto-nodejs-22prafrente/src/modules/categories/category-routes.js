import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth-middleware.js";

import * as controller from "./category-controller.js";

export const categoryRoutes = Router();

// Leitura e publica; escrita exige login (Exercicio 3.1).
categoryRoutes.get("/", asyncHandler(controller.index));
categoryRoutes.get("/:id", asyncHandler(controller.show));
categoryRoutes.post("/", requireAuth, asyncHandler(controller.store));
categoryRoutes.put("/:id", requireAuth, asyncHandler(controller.update));
categoryRoutes.delete("/:id", requireAuth, asyncHandler(controller.destroy));
