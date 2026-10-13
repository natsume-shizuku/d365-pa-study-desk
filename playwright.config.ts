import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4174',
    headless: true,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{
    name: 'edge',
    use: { ...devices['Desktop Edge'], channel: 'msedge' },
  }],
  // Build separately before running: never touch the canonical origin on 4173.
  webServer: {
    command: 'npm run preview -- --port 4174',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
  },
});