import { Router } from "express";

import { ensureAuthenticated } from "../../shared/auth/ensure-authenticated.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./auth-controller.js";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(controller.register));
authRoutes.post("/login", asyncHandler(controller.login));
authRoutes.get("/me", ensureAuthenticated, asyncHandler(controller.profile));
