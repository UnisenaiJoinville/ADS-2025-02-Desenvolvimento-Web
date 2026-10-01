import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./product-controller.js";

export const productRoutes = Router();

productRoutes.get("/", asyncHandler(controller.index));
productRoutes.get("/:id", asyncHandler(controller.show));
productRoutes.post("/", asyncHandler(controller.store));
productRoutes.put("/:id", asyncHandler(controller.update));
productRoutes.delete("/:id", asyncHandler(controller.destroy));