import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.js";

import * as controller from "./dashboard-controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", asyncHandler(controller.index));
