const {test, expect} = require('@playwright/test');
const {fullDisplay, settingsReady} = require('./helpers/display-state');

const SETTINGS_KEY = 'income-per-sed-settings';

async function prepare(page, artifact) {
  await page.clock.install();
  await page.goto(`/Income-per-sed-${artifact}.html`);
  await fullDisplay(page);
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.clock.runFor(1200);
}

async function openIncome(page) {
  await page.locator('#incomeSettingsCard').click();
  await page.clock.runFor(650);
  await settingsReady(page);
  if (await page.locator('#incomePrivacyUnlock').isVisible()) {
    await page.locator('#incomePrivacyUnlock').click();
  }
}

test.beforeEach(async ({page}) => {
  page.__feedbackErrors = [];
  page.on('pageerror', error => page.__feedbackErrors.push(error.message));
});
test.afterEach(async ({page}) => expect(page.__feedbackErrors).toEqual([]));

for (const artifact of ['Develop', 'Push']) {
  for (const kind of ['success', 'warning']) {
    test(`${artifact}: ${kind} storage notice enters, settles and hides`, async ({page}) => {
      await page.emulateMedia({colorScheme: kind === 'success' ? 'light' : 'dark', reducedMotion: 'no-preference'});
      await page.setViewportSize({width: 390, height: 844});
      await prepare(page, artifact);
      await openIncome(page);
      await page.locator('#incomeAmountInput').fill('8123.45');
      if (kind === 'warning') await page.evaluate(key => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (name, value) {
          if (name === key) throw new DOMException('Feedback regression fixture', 'QuotaExceededError');
          return original.call(this, name, value);
        };
      }, SETTINGS_KEY);
      const toast = page.locator('#storageWarning');
      await toast.evaluate(element => {
        window.__feedbackStates = [];
        const record = () => window.__feedbackStates.push({hidden: element.hidden, visible: element.classList.contains('is-visible'), settling: element.classList.contains('is-settling')});
        new MutationObserver(record).observe(element, {attributes: true, attributeFilter: ['hidden', 'class']});
        record();
      });
      await page.locator('#settingsSaveButton').dispatchEvent('click');
      await page.clock.runFor(700);
      await expect(toast).toHaveAttribute('data-kind', kind);
      await expect(toast).toHaveClass(/is-visible/);
      await expect(toast).toHaveCSS('opacity', '1');
      await expect(toast).toHaveAttribute('role', 'status');
      await expect(toast).toHaveAttribute('aria-live', 'polite');
      const bounds = await toast.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      await page.clock.runFor(8000);
      await expect(toast).toBeHidden();
      const states = await page.evaluate(() => window.__feedbackStates);
      expect(states.some(state => state.visible && !state.hidden)).toBe(true);
      expect(states.some(state => state.settling && !state.hidden)).toBe(true);
      expect(states.at(-1).hidden).toBe(true);
      if (kind === 'warning') await expect(page.locator('#settingsDialog')).toBeVisible();
      else await expect(page.locator('#settingsDialog')).toBeHidden();
    });
  }

  test(`${artifact}: editable cards preserve keyboard and high-contrast focus`, async ({page}) => {
    await prepare(page, artifact);
    await page.keyboard.press('Tab');
    for (const id of ['incomeSettingsCard', 'scheduleSettingsCard']) {
      const card = page.locator(`#${id}`);
      await card.focus();
      expect(await card.evaluate(element => element.matches(':focus-visible'))).toBe(true);
      await expect(card).toHaveCSS('outline-style', 'solid');
      await expect(card).toHaveCSS('outline-width', '2px');
      await expect(card).toHaveCSS('outline-offset', '3px');
      await card.press('Enter');
      await page.clock.runFor(650);
      await settingsReady(page);
      await page.keyboard.press('Escape');
      await page.clock.runFor(650);
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await expect(card).toBeFocused();
    }
    await page.emulateMedia({forcedColors: 'active'});
    const card = page.locator('#incomeSettingsCard');
    await card.focus();
    await expect(card).toHaveCSS('outline-style', 'solid');
    expect(parseFloat(await card.evaluate(element => getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);
  });

  test.describe(`${artifact} coarse pointer`, () => {
    test.use({hasTouch: true, viewport: {width: 390, height: 844}});
    test('privacy unlock retains its target size and resets after closing', async ({page}) => {
      await prepare(page, artifact);
      await page.locator('#privacyToggle').click();
      await page.clock.runFor(300);
      await page.locator('#incomeSettingsCard').click();
      await page.clock.runFor(650);
      await settingsReady(page);
      const unlock = page.locator('#incomePrivacyUnlock');
      const input = page.locator('#incomeAmountInput');
      await expect(unlock).toBeVisible();
      await expect(input).toBeHidden();
      const box = await unlock.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await unlock.focus();
      await unlock.press('Enter');
      await expect(input).toBeVisible();
      await expect(input).toBeEditable();
      await page.keyboard.press('Escape');
      await page.clock.runFor(650);
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await page.locator('#incomeSettingsCard').click();
      await page.clock.runFor(650);
      await settingsReady(page);
      await expect(unlock).toBeVisible();
      await expect(input).toBeHidden();
    });
  });
}
