import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5173"
  },
  webServer: [
    {
      command:
        "powershell -NoProfile -Command \"$env:SESSION_SECRET='change-me-in-production'; npm run dev\"",
      cwd: "../server",
      url: "http://127.0.0.1:4000/api/health",
      reuseExistingServer: true,
      timeout: 120000
    },
    {
      command: "npm run dev -- --host 127.0.0.1",
      cwd: ".",
      url: "http://127.0.0.1:5173/login",
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
