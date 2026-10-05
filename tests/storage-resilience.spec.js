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

const SETTINGS_KEY = 'income-per-sed-settings';
const TEMP_KEY = 'income-per-sed-settings-transaction-temp';
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SETTINGS_KEY);

async function openIncome(page, amount) {
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await expect(page.locator('#incomeSettingsPanel')).toBeVisible();
  await expect(page.locator('#incomeSettingsPanel')).not.toHaveAttribute('data-settings-unready');
  await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-settings-unready');
  if (amount !== undefined) await page.locator('#incomeAmountInput').fill(String(amount));
}

for (const artifact of ['Develop', 'Push']) {
  for (const failureKey of [TEMP_KEY, SETTINGS_KEY]) {
    test(`${artifact}: failed ${failureKey} preserves old settings and can retry`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`/Income-per-sed-${artifact}.html`);
      await openIncome(page, 8123);
      await page.locator('#settingsSaveButton').dispatchEvent('click');
      await expect(page.locator('#settingsDialog')).toBeHidden();
      const before = await stored(page);
      await page.evaluate(key => {
        window.restoreSettingsWrite = Storage.prototype.setItem;
        Storage.prototype.setItem = function (name, value) {
          if (name === key) throw new DOMException('Test quota exhausted', 'QuotaExceededError');
          return window.restoreSettingsWrite.call(this, name, value);
        };
      }, failureKey);
      await openIncome(page, 9345);
      await page.locator('#settingsSaveButton').dispatchEvent('click');
      await page.waitForTimeout(500);
      await expect(page.locator('#settingsDialog')).toBeVisible();
      await expect(page.locator('#settingsSaveButton')).toBeEnabled();
      await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-save-state');
      expect(await stored(page)).toEqual(before);
      expect(await page.evaluate(key => localStorage.getItem(key), TEMP_KEY)).toBeNull();
      await page.evaluate(() => { Storage.prototype.setItem = window.restoreSettingsWrite; delete window.restoreSettingsWrite; });
      await page.locator('#settingsSaveButton').dispatchEvent('click');
      await expect(page.locator('#settingsDialog')).toBeHidden();
      expect((await stored(page)).payload.settings.monthlyIncome).toBe(9345);
      await page.reload();
      await openIncome(page);
      await expect(page.locator('#incomeAmountInput')).toHaveValue('9345.00');
      expect(errors).toEqual([]);
    });
  }

  for (const kind of ['income', 'schedule']) {
    for (const interruption of ['close', 'background']) {
      test(`${artifact}: ${kind} save survives immediate ${interruption} without stale feedback`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(`/Income-per-sed-${artifact}.html`);
        if (kind === 'income') await openIncome(page, 12345);
        else {
          await page.locator('#scheduleSettingsCard').dispatchEvent('click');
          await expect(page.locator('#scheduleSettingsPanel')).not.toHaveAttribute('data-settings-unready');
          await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-settings-unready');
          await page.locator('[data-time-key="morningStart"] [role="spinbutton"]').last().press('ArrowDown');
        }
        const saved = await page.evaluate(({ key, interruption }) => {
          document.querySelector('#settingsSaveButton').click();
          const result = { feedback: document.querySelector('#settingsSaveButton').dataset.saveState, raw: localStorage.getItem(key) };
          if (interruption === 'close') document.querySelector('#settingsDialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          else {
            Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
            document.dispatchEvent(new Event('visibilitychange'));
          }
          return result;
        }, { key: SETTINGS_KEY, interruption });
        expect(saved.feedback).toBe('saved');
        const settings = JSON.parse(saved.raw).payload.settings;
        if (kind === 'income') expect(settings.monthlyIncome).toBe(12345);
        else expect(settings.schedule.morningStart).toBe('09:01');
        await page.waitForTimeout(350);
        if (interruption === 'background') await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
        await page.waitForTimeout(600);
        await expect(page.locator('#settingsDialog')).toBeHidden();
        await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
        await page.waitForTimeout(600);
        await expect(page.locator('#settingsDialog')).toBeVisible();
        await expect(page.locator('#settingsSaveButton')).toHaveText('保存');
        await expect(page.locator('#settingsSaveButton')).toBeEnabled();
        expect((await stored(page)).payload.settings).toEqual(settings);
        await page.reload();
        expect((await stored(page)).payload.settings).toEqual(settings);
        expect(errors).toEqual([]);
      });
    }
  }

  test(`${artifact}: simultaneous income and schedule saves preserve both fields`, async ({ page, context }) => {
    await page.goto(`/Income-per-sed-${artifact}.html`);
    const other = await context.newPage();
    await other.goto(`/Income-per-sed-${artifact}.html`);
    await page.waitForTimeout(800);
    await openIncome(page, 24680);
    await other.locator('#scheduleSettingsCard').dispatchEvent('click');
    await expect(other.locator('#scheduleSettingsPanel')).not.toHaveAttribute('data-settings-unready');
    await expect(other.locator('#settingsSaveButton')).not.toHaveAttribute('data-settings-unready');
    await other.locator('[data-time-key="morningStart"] [role="spinbutton"]').last().press('ArrowDown');
    await Promise.all([
      page.locator('#settingsSaveButton').dispatchEvent('click'),
      other.locator('#settingsSaveButton').dispatchEvent('click'),
    ]);
    await expect.poll(async () => {
      const result = await stored(page);
      return { amount: result?.payload?.settings?.monthlyIncome, start: result?.payload?.settings?.schedule?.morningStart };
    }).toEqual({ amount: 24680, start: '09:01' });
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await expect(other.locator('#settingsDialog')).toBeHidden();
    await other.close();
    await page.reload();
    const settings = (await stored(page)).payload.settings;
    expect(settings.monthlyIncome).toBe(24680);
    expect(settings.schedule.morningStart).toBe('09:01');
  });
}
