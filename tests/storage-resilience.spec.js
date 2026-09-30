const { test, expect } = require('@playwright/test');

const APP_PATH = '/Income-per-sed-Push.html';

async function expectUsablePage(page, pageErrors) {
  await page.goto(APP_PATH, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#incomeMainCard')).toBeVisible();
  await expect(page.locator('#incomeSettingsCard')).toBeVisible();
  expect(pageErrors).toEqual([]);
}

test('page remains usable when local storage is unavailable', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const unavailable = () => {
      throw new DOMException('Storage disabled for regression test', 'SecurityError');
    };
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        value: unavailable,
      });
    }
  });
  await expectUsablePage(page, pageErrors);
});

test('page recovers from malformed persisted data', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    for (const key of [
      'income-per-sed-settings',
      'income-per-sed-settings-last-good',
      'income-per-sed-calendar-data-v1',
      'income-per-sed-task-stopwatch',
      'income-per-sed-task-stopwatch-last-good',
    ]) {
      localStorage.setItem(key, '{ malformed json');
    }
  });
  await expectUsablePage(page, pageErrors);
});
