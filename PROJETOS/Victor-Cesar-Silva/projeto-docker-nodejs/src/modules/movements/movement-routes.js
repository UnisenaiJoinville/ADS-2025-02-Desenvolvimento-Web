import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./movement-controller.js";

export const movementRoutes = Router();

// Sem PUT nem DELETE: movimentacao e registro historico.
// Erro se corrige com movimentacao compensatoria, nao apagando.
movementRoutes.get("/", asyncHandler(controller.index));
movementRoutes.post("/", asyncHandler(controller.store));
