const { expect } = require('@playwright/test');

async function fullDisplay(page, { paused = false } = {}) {
  if (paused) await page.clock.runFor(1200);
  await expect(page.locator('#currentTime')).not.toHaveText('--:--:--');
  if (await page.locator('#focusToggle').getAttribute('aria-pressed') === 'true') {
    await page.locator('#focusToggle').click();
    if (paused) await page.clock.runFor(700);
  }
  if (await page.locator('#privacyToggle').getAttribute('aria-pressed') === 'true') {
    await page.locator('#privacyToggle').click();
    await page.locator('#privacyKeepVisible').click();
  }
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-focus-restoring'));
}

async function settingsReady(page) {
  await page.waitForFunction(() => !document.getElementById('settingsDialog').hidden
    && !document.querySelector('[data-settings-unready],.income-shared-shell'));
}

async function discardSettings(page, { paused = false } = {}) {
  const directEntry = await page.locator('.time-wheel-direct').count() > 0;
  await page.keyboard.press('Escape');
  if (directEntry && await page.locator('#settingsDialog').isVisible() && await page.locator('#settingsDiscardConfirm').isHidden()) {
    await page.keyboard.press('Escape');
  }
  if (await page.locator('#settingsDiscardConfirm').isVisible()) {
    await page.locator('#settingsDiscardChanges').click();
  }
  if (paused) await page.clock.runFor(600);
  await expect(page.locator('#settingsDialog')).toBeHidden();
}

async function selectTheme(page, mode) {
  const control = page.locator('#themeCycle');
  await control.press(mode === 'system' ? 'Home' : 'End');
  if (mode === 'light') await control.press('ArrowUp');
}

module.exports = { fullDisplay, settingsReady, discardSettings, selectTheme };
