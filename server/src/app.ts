import express from "express";
import session from "express-session";
import Database from "better-sqlite3";

import { AppConfig, loadConfig } from "./config/env";
import { createDatabaseConnection } from "./db/connection";
import { runMigrations } from "./db/migrations";
import { SqliteSessionStore } from "./db/session-store";
import { AuthController } from "./modules/auth/auth.controller";
import { AuthRepository } from "./modules/auth/auth.repository";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler";

export type AppContext = {
  app: ReturnType<typeof express>;
  config: AppConfig;
  db: Database.Database;
  authService: AuthService;
};

type CreateAppOptions = {
  configOverrides?: Partial<NodeJS.ProcessEnv>;
  db?: Database.Database;
};

export const createApp = async (options: CreateAppOptions = {}): Promise<AppContext> => {
  const config = loadConfig(options.configOverrides);
  const db = options.db ?? createDatabaseConnection(config.databasePath);

  runMigrations(db);

  const authRepository = new AuthRepository(db);
  const authService = new AuthService(authRepository, config);
  await authService.ensureSeedUser();

  const authController = new AuthController(authService);
  const app = express();
  const sessionStore = new SqliteSessionStore(db);

  app.set("sessionCookieName", config.sessionCookieName);
  app.use(express.json());
  app.use(
    session({
      name: config.sessionCookieName,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.nodeEnv === "production",
        maxAge: 1000 * 60 * 60 * 24
      }
    })
  );

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ data: { status: "ok" } });
  });
  app.use("/api/auth", createAuthRouter(authController));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return {
    app,
    config,
    db,
    authService
  };
};
