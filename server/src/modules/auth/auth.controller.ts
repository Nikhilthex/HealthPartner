import { NextFunction, Request, Response } from "express";

import { sendSuccess } from "../../shared/http/response";
import { parseSchema } from "../../shared/http/validation";
import { AuthService } from "./auth.service";
import { loginSchema } from "./auth.schemas";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = parseSchema(loginSchema, req.body);
      const user = await this.authService.authenticate(payload);
      req.session.regenerate((error) => {
        if (error) {
          next(error);
          return;
        }

        req.session.userId = user.id;
        sendSuccess(res, { user });
      });
    } catch (error) {
      next(error);
    }
  };

  logout = (req: Request, res: Response, next: NextFunction) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }

      res.clearCookie(req.app.get("sessionCookieName"));
      sendSuccess(res, { success: true });
    });
  };

  me = (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = this.authService.getCurrentUser(req.session.userId as number);
      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  };
}
