import { env as processEnv } from "node:process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: processEnv.VITE_API_PROXY_TARGET || "http://127.0.0.1:4000",
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    globals: true,
    exclude: ["tests/e2e/**", "node_modules/**", ".git/**"]
  }
});
