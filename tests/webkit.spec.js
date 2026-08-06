const { test, expect } = require('@playwright/test');

const APP_PATH = '/Income-per-sed-Push.html';

test('WebKit opens the dashboard without runtime errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(APP_PATH, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#incomeMainCard')).toBeVisible();
  await expect(page.locator('#incomeSettingsCard')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('WebKit keeps the mobile history panel inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(APP_PATH, { waitUntil: 'load' });
  await page.locator('#historyQuickOpen').click();
  const panel = page.locator('#historyQuickPanel');
  await expect(panel).toBeVisible();
  const bounds = await panel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
  expect(bounds.y).toBeGreaterThanOrEqual(-1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(845);
});
