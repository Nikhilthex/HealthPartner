import bcrypt from "bcryptjs";

import { AppConfig } from "../../config/env";
import { AppError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import { LoginInput } from "./auth.schemas";
import { AuthRepository, UserRecord } from "./auth.repository";

export type AuthUser = {
  id: number;
  username: string;
};

const toAuthUser = (user: UserRecord): AuthUser => ({
  id: user.id,
  username: user.username
});

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly config: Pick<AppConfig, "authSeedEnabled" | "authSeedUsername" | "authSeedPassword">
  ) {}

  async ensureSeedUser() {
    if (!this.config.authSeedEnabled) {
      return;
    }

    const existing = this.repository.findByUsername(this.config.authSeedUsername);

    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(this.config.authSeedPassword, 12);
    const created = this.repository.createUser(this.config.authSeedUsername, passwordHash);

    logger.info("Created local development seed user.", { userId: created.id, username: created.username });
  }

  async authenticate(input: LoginInput): Promise<AuthUser> {
    const user = this.repository.findByUsername(input.username);

    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Username or password is incorrect.");
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);

    if (!matches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Username or password is incorrect.");
    }

    return toAuthUser(user);
  }

  getCurrentUser(userId: number): AuthUser {
    const user = this.repository.findById(userId);

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    return toAuthUser(user);
  }
}
