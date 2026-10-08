import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth-middleware.js";

import * as controller from "./auth-controller.js";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(controller.register));
authRoutes.post("/login", asyncHandler(controller.login));
authRoutes.get("/me", requireAuth, asyncHandler(controller.me));
