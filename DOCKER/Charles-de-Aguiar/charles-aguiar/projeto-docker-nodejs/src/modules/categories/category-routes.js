import { Router } from "express";

import { ensureRole } from "../../shared/auth/ensure-role.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import * as controller from "./category-controller.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", asyncHandler(controller.index));
categoryRoutes.post("/", asyncHandler(controller.store));
categoryRoutes.put("/:id", asyncHandler(controller.update));

// Apenas administradores podem deletar categorias
categoryRoutes.delete("/:id", ensureRole("ADMIN"), asyncHandler(controller.destroy));
