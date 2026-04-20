import { NextFunction, Request, Response } from "express";

import { AppError } from "../../shared/errors";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication is required."));
    return;
  }

  next();
};
