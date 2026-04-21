import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:4173"
  },
  webServer: [
    {
      command:
        "powershell -NoProfile -Command \"$env:PORT='4100'; $env:SESSION_SECRET='change-me-in-production'; npm run test:server\"",
      cwd: "../backend",
      url: "http://127.0.0.1:4100/api/health",
      reuseExistingServer: true,
      timeout: 120000
    },
    {
      command:
        "powershell -NoProfile -Command \"$env:VITE_API_PROXY_TARGET='http://127.0.0.1:4100'; npx vite --host 127.0.0.1 --port 4173\"",
      cwd: ".",
      url: "http://127.0.0.1:4173/login",
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
