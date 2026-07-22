import { defineConfig, devices } from '@playwright/test';

/**
 * Real-browser smoke tests (Chromium + WebKit). They serve the repo statically
 * and drive the built editor the way a user would — catching regressions the
 * jsdom unit tests can't (contenteditable, real layout, framework mounts).
 * Requires `npm run build` first (for /dist) — CI does that before this step.
 */
export default defineConfig({
  testDir: './test/browser',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  webServer: {
    command: 'python3 -m http.server 5173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:5173/lib/styles.min.css',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  use: { baseURL: 'http://127.0.0.1:5173' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
