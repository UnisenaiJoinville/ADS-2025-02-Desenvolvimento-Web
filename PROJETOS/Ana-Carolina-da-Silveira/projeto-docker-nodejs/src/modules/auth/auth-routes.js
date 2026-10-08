import { Router } from "express";

import { ensureAuthenticated } from "../../shared/auth/ensure-authenticated.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./auth-controller.js";

export const authRoutes = Router();

// Rotas PUBLICAS: quem ainda nao tem conta precisa poder chegar aqui.
authRoutes.post("/register", asyncHandler(controller.register));
authRoutes.post("/login", asyncHandler(controller.login));

// Rota PROTEGIDA: serve para o front perguntar "meu token ainda vale?".
authRoutes.get("/me", ensureAuthenticated, asyncHandler(controller.profile));