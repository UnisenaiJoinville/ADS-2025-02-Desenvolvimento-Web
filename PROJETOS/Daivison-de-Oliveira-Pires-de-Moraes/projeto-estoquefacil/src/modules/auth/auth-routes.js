import {
  loginLimiter,
  registerLimiter,
  resetLimiter,
} from "../../shared/http/rate-limit.js";
import { env } from "../../config/env.js";
import { Router } from "express";

import { ensureAuthenticated } from "../../shared/auth/ensure-authenticated.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./auth-controller.js";

export const authRoutes = Router();

// Rotas PUBLICAS: quem ainda nao tem conta precisa poder chegar aqui.
authRoutes.post(
  "/register",
  (req, res, next) =>
    env.registrationOpen
      ? next()
      : res.status(403).json({ error: "Cadastro fechado" }),
  registerLimiter,
  asyncHandler(controller.register),
);
authRoutes.post("/login", loginLimiter, asyncHandler(controller.login));

// Rota PROTEGIDA: serve para o front perguntar "meu token ainda vale?".
authRoutes.get("/me", ensureAuthenticated, asyncHandler(controller.profile));

authRoutes.post("/refresh", asyncHandler(controller.refresh));
authRoutes.post("/logout", asyncHandler(controller.logout));
authRoutes.post(
  "/forgot-password",
  resetLimiter,
  asyncHandler(controller.forgot),
);
authRoutes.post(
  "/reset-password",
  resetLimiter,
  asyncHandler(controller.reset),
);
authRoutes.put(
  "/me",
  ensureAuthenticated,
  asyncHandler(controller.updateProfile),
);
authRoutes.put(
  "/password",
  ensureAuthenticated,
  asyncHandler(controller.password),
);
