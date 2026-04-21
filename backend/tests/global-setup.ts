import { execSync } from 'node:child_process';
import path from 'node:path';
import type { FullConfig } from '@playwright/test';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const projectRoot = path.resolve(__dirname, '..');

  execSync('npm run db:reset', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'file:../data/healthpartner-test.db',
      UPLOAD_DIR: './uploads-test',
      SINGLE_USER_ID: '1'
    }
  });
}
