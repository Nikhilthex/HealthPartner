import { defineConfig } from '@playwright/test';

const testPort = 4300;

export default defineConfig({
  testDir: './tests/api',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  globalSetup: './tests/global-setup.ts',
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${testPort}`
  },
  webServer: {
    command: 'npm run test:server',
    cwd: '.',
    port: testPort,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'test',
      PORT: String(testPort),
      DATABASE_URL: 'file:../data/healthpartner-test.db',
      UPLOAD_DIR: './uploads-test',
      DEFAULT_TIMEZONE: 'UTC',
      SINGLE_USER_ID: '1'
    }
  }
});
