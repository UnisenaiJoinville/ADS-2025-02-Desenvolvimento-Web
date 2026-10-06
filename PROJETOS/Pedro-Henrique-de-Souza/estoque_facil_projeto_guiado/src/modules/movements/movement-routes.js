import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./movement-controller.js";

export const movementRoutes = Router();

movementRoutes.get("/", asyncHandler(controller.index));
movementRoutes.post("/", asyncHandler(controller.store));
