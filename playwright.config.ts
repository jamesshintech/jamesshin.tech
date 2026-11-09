import { defineConfig } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local into the test process (Next.js loads it for the server,
// not for the Playwright runner). Locally it supplies BANNED_PATTERNS.
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
  // No retries: a flaky test should fail loudly, not pass on its second try.
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // Headless Chromium has no GPU; SwiftShader gives it WebGL 2, so the
      // tests run the same room a visitor gets.
      use: { browserName: "chromium", launchOptions: { args: ["--enable-unsafe-swiftshader"] } },
    },
  ],
  // CI tests the production build (`pnpm build` runs first); locally, dev.
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
