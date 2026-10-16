import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./category-controller.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", asyncHandler(controller.index));
categoryRoutes.get("/:id", asyncHandler(controller.show));
categoryRoutes.post("/", asyncHandler(controller.store));
categoryRoutes.put("/:id", asyncHandler(controller.update));
categoryRoutes.delete("/:id", asyncHandler(controller.destroy));
