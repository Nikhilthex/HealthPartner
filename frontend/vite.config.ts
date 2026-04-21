import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const authApiTarget = env.VITE_AUTH_API_TARGET ?? 'http://127.0.0.1:4001';
  const appApiTarget = env.VITE_APP_API_TARGET ?? 'http://127.0.0.1:4000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/auth': {
          target: authApiTarget,
          changeOrigin: true
        },
        '/api': {
          target: appApiTarget,
          changeOrigin: true
        }
      }
    },
    test: {
      environment: 'jsdom',
      setupFiles: './tests/support/setup.ts',
      globals: true
    }
  };
});
