import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.resolve(ROOT, '../tests/e2e');
const DEFAULT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const shouldStartServer = process.env.PLAYWRIGHT_START_WEB_SERVER === '1';

export default defineConfig({
  testDir: TEST_DIR,
  fullyParallel: true,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: DEFAULT_BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },
  webServer: shouldStartServer
    ? {
        command: 'npm run dev -- --host',
        url: DEFAULT_BASE_URL,
        reuseExistingServer: true,
        stdout: 'pipe',
        stderr: 'pipe'
      }
    : undefined
});
