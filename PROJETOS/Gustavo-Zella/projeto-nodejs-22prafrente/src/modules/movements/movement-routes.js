import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth-middleware.js";

import * as controller from "./movement-controller.js";

export const movementRoutes = Router();

// Leitura e publica; registrar movimentacao exige login (Exercicio 3.1).
movementRoutes.get("/", asyncHandler(controller.index));
movementRoutes.post("/", requireAuth, asyncHandler(controller.store));
