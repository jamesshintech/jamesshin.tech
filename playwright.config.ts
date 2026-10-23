import { defineConfig } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local into the test process so tests have access to secrets
// (Next.js loads .env.local for the dev server, but not for the Playwright runner)
try {
  const envFile = resolve(__dirname, ".env.local");
  const content = readFileSync(envFile, "utf8");
  for (const line of content.split("\n")) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const key = match[1];
      const val = match[2].replace(/^["']|["']$/g, "");
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
} catch {
  // .env.local not present (CI will set env vars directly)
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "pnpm dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
