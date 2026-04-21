import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma/client';
import { AppError } from '../../shared/errors';
import type { LoginBody } from './schemas';

export type AuthUser = {
  id: number;
  username: string;
};

function toAuthUser(user: { id: number; username: string }): AuthUser {
  return {
    id: user.id,
    username: user.username
  };
}

export async function authenticateUser(input: LoginBody): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: {
      username: input.username
    }
  });

  if (!user) {
    throw new AppError({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      category: 'validation',
      message: 'Username or password is incorrect.'
    });
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      category: 'validation',
      message: 'Username or password is incorrect.'
    });
  }

  return toAuthUser(user);
}

export async function getUserById(userId: number): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    throw new AppError({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      category: 'validation',
      message: 'Authentication is required.'
    });
  }

  return toAuthUser(user);
}
