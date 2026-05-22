import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'npm run dev',
    cwd: path.resolve('./'),
    port: 5174,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
