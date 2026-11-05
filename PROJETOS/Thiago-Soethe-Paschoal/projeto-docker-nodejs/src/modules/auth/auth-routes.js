import { Router } from "express";

import { ensureAuthenticated } from "../../shared/auth/ensure-authenticated.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { loginLimiter, registerLimiter } from "../../shared/http/rate-limit.js";

import * as controller from "./auth-controller.js";

export const authRoutes = Router();

// Rotas publicas: sao as que mais precisam de limite (Aula 67).
authRoutes.post("/register", registerLimiter, asyncHandler(controller.register));
authRoutes.post("/login", loginLimiter, asyncHandler(controller.login));
authRoutes.get("/me", ensureAuthenticated, asyncHandler(controller.profile));
