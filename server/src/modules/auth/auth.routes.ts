import { Router } from "express";

import { AuthController } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

export const createAuthRouter = (controller: AuthController) => {
  const router = Router();

  router.post("/login", controller.login);
  router.post("/logout", requireAuth, controller.logout);
  router.get("/me", requireAuth, controller.me);

  return router;
};
