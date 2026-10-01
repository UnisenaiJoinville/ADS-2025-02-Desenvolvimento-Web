import { Router } from "express";

import { ensureRole } from "../../shared/auth/ensure-role.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import * as controller from "./product-controller.js";

export const productRoutes = Router();

productRoutes.get("/", asyncHandler(controller.index));
productRoutes.get("/:id", asyncHandler(controller.show));
productRoutes.post("/", asyncHandler(controller.store));
productRoutes.put("/:id", asyncHandler(controller.update));

// Apenas administradores podem deletar produtos
productRoutes.delete("/:id", ensureRole("ADMIN"), asyncHandler(controller.destroy));
