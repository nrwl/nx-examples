import { test, expect } from '@playwright/test';

test('renders messages from both APIs', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toHaveText('readiness-rspack');
  await expect(page.getByTestId('api-node')).toHaveText('Hello from node');
  await expect(page.getByTestId('api-tsx')).toHaveText('Hello from tsx');
});
