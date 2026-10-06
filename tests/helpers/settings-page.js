const { expect } = require('@playwright/test');

const settingsPage = process.env.SETTINGS_RELEASE_CHANNEL === 'push' ? '/Income-per-sed-Push.html' : '/Income-per-sed-Develop.html';

async function openSettings(page, { kind = 'income', motion = 'no-preference', channel, settleMs = 550, verifyShell = false } = {}) {
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto(channel === 'develop' ? '/Income-per-sed-Develop.html' : settingsPage);
  await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
  if (verifyShell) await expect(page.locator(`#${kind}SettingsPanel`)).toBeVisible();
  await page.waitForTimeout(settleMs);
  if (verifyShell) await expect(page.locator('.income-shared-shell')).toHaveCount(0);
}

module.exports = { settingsPage, openSettings };
