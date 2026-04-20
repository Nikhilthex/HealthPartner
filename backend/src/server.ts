import { createServer, type Server } from 'node:http';
import type { Express } from 'express';
import { env, ensureRuntimeDirectories } from './config/env';
import { createApp } from './app';
import { logger } from './shared/logger';
import { prisma } from './shared/prisma/client';
import { initializeDatabase } from '../prisma/init';
import { seedDefaultData } from '../prisma/seed-data';

async function listenWithPortFallback(app: Express, preferredPort: number, maxRetries = 20): Promise<{ server: Server; port: number }> {
  for (let offset = 0; offset <= maxRetries; offset += 1) {
    const candidatePort = preferredPort + offset;
    const server = createServer(app);

    const started = await new Promise<boolean>((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException): void => {
        server.off('listening', onListening);
        if (error.code === 'EADDRINUSE') {
          resolve(false);
          return;
        }
        reject(error);
      };

      const onListening = (): void => {
        server.off('error', onError);
        resolve(true);
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(candidatePort);
    });

    if (started) {
      return {
        server,
        port: candidatePort
      };
    }
  }

  throw new Error(`No open port found starting from ${preferredPort}.`);
}

export async function startServer(): Promise<Server> {
  ensureRuntimeDirectories();
  await initializeDatabase(prisma);
  await seedDefaultData(prisma);
  const app = createApp();
  const { server, port } = await listenWithPortFallback(app, env.PORT);

  logger.info('server_started', {
    port,
    preferredPort: env.PORT,
    nodeEnv: env.NODE_ENV
  });

  return server;
}

if (require.main === module) {
  startServer().catch((error: unknown) => {
    logger.error('server_start_failed', {
      message: error instanceof Error ? error.message : 'unknown_error'
    });
    process.exitCode = 1;
  });
}
