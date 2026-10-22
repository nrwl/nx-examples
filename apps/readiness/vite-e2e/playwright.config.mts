import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { getReadyUrl, workspaceRoot } from '@nx/devkit';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// getReadyUrl moves the address to the port the dev server task reported.
const baseURL = getReadyUrl('http://localhost:4310');

export default defineConfig({
  ...nxE2EPreset(dirname(fileURLToPath(import.meta.url)), { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'yarn nx run readiness-vite:serve',
    url: baseURL,
    reuseExistingServer: true,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
