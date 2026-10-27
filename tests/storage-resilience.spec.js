const { fullDisplay, settingsReady } = require('./helpers/display-state');
const { test, expect } = require('@playwright/test');
const { backupChecksum, exportSettingsBackup, uploadSettingsBackup } = require('./helpers/settings-backup');

const APP_PATH = '/Income-per-sed-Push.html';

async function expectUsablePage(page, pageErrors) {
  await page.goto(APP_PATH, { waitUntil: 'load' });
  await fullDisplay(page);
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
const CALENDAR_KEY = 'income-per-sed-calendar-data-v1';
const TASK_KEY = 'income-per-sed-task-stopwatch';
const PRESERVED_KEYS = [SETTINGS_KEY, TEMP_KEY, CALENDAR_KEY, TASK_KEY, 'income-per-sed-privacy-v1', 'income-per-sed-focus-v1'];
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SETTINGS_KEY);

const calendarContents = calendar => ({ coverage: calendar.coverage, holidays: calendar.holidays, specialWorkdays: calendar.specialWorkdays });
const backupState = page => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), PRESERVED_KEYS);

function expectBackupContents(actual, expected) {
  expect(actual.payload.settings).toEqual(expected.payload.settings);
  expect(calendarContents(actual.payload.calendar)).toEqual(calendarContents(expected.payload.calendar));
}

function changedBackup(original) {
  const backup = structuredClone(original);
  Object.assign(backup.payload.settings, {
    incomeMode: 'fixed-daily', monthlyIncome: 9876.54, dailyIncome: 321.09, annualWorkDays: 241,
    schedule: { morningStart: '08:00', morningEnd: '11:30', afternoonStart: '13:00', afternoonEnd: '17:15' },
  });
  const calendar = backup.payload.calendar;
  const holiday = '2026-10-29';
  expect(calendar.coverage.start <= holiday && holiday <= calendar.coverage.end).toBe(true);
  calendar.holidays = [...new Set([...calendar.holidays, holiday])].sort();
  calendar.specialWorkdays = calendar.specialWorkdays.filter(day => day !== holiday);
  Object.assign(calendar.coverage, { label: 'Synthetic changed calendar', version: 'backup-regression-v2' });
  calendar.origin = 'imported';
  calendar.checksum = backupChecksum(calendarContents(calendar));
  backup.checksum = backupChecksum(backup.payload);
  return backup;
}

async function prepareBackupState(page, artifact, hasCalendar) {
  await page.goto(`/Income-per-sed-${artifact}.html`);
  await page.evaluate(({ settingsKey, calendarKey, hasCalendar }) => {
    localStorage.setItem(settingsKey, JSON.stringify({
      incomeMode: 'fixed-monthly', monthlyIncome: 12345.67, dailyIncome: 420.12, annualWorkDays: 242,
      schedule: { morningStart: '08:10', morningEnd: '11:40', afternoonStart: '13:10', afternoonEnd: '17:20' },
    }));
    if (hasCalendar) localStorage.setItem(calendarKey, JSON.stringify({
      schemaVersion: 1, savedAt: '2026-10-27T00:00:00.000Z',
      calendarData: {
        coverage: { start: '2026-01-01', end: '2026-12-31', label: 'Synthetic original calendar', version: 'backup-regression-v1', timeZone: 'Asia/Shanghai', generatedAt: '2026-10-27', source: 'Storage regression fixture' },
        holidays: ['2026-10-28'], specialWorkdays: ['2026-10-31'],
      },
    }));
    else localStorage.removeItem(calendarKey);
  }, { settingsKey: SETTINGS_KEY, calendarKey: CALENDAR_KEY, hasCalendar });
  // Seed once through the current page, never through an init script that could reseed after restore.
  await page.reload();
  await fullDisplay(page);
  await page.locator('#taskStopwatch').click();
  await expect(page.locator('#taskStopwatchState')).toHaveText('计时中');
  await page.waitForTimeout(120);
  await page.locator('#taskStopwatch').click();
  await expect(page.locator('#taskStopwatchState')).toHaveText('已暂停');
  await openIncome(page);
  await settingsReady(page);
}

async function confirmBackupImport(page, backup) {
  await uploadSettingsBackup(page, backup);
  await expect(page.locator('#settingsSafetyTitle')).toHaveText('核对导入变更');
  await page.locator('#settingsSafetyAccept').click();
  await expect(page.locator('#settingsSafetyConfirm')).toBeHidden();
  await page.waitForFunction(() => document.getElementById('settingsBackupFile').value === '');
  await settingsReady(page);
}

async function openIncome(page, amount) {
  if (await page.locator('#settingsDialog').isHidden()) await fullDisplay(page);
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await expect(page.locator('#incomeSettingsPanel')).toBeVisible();
  await expect(page.locator('#incomeSettingsPanel')).not.toHaveAttribute('data-settings-unready');
  await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-settings-unready');
  if (amount !== undefined) await page.locator('#incomeAmountInput').fill(String(amount));
}

for (const artifact of ['Develop', 'Push']) {
  for (const hasCalendar of [false, true]) {
    for (const failureKey of [TEMP_KEY, SETTINGS_KEY]) {
      test(`${artifact}: backup ${failureKey} failure rolls back ${hasCalendar ? 'existing' : 'absent'} calendar and permits retry`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await prepareBackupState(page, artifact, hasCalendar);
        const before = await backupState(page);
        expect(before[CALENDAR_KEY] !== null).toBe(hasCalendar);
        const original = await exportSettingsBackup(page);
        const incoming = changedBackup(original);
        await page.evaluate(({ calendarKey, failureKey }) => {
          const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
          window.backupWriteProbe = { events: [], set, remove };
          Storage.prototype.setItem = function (key, value) {
            if (key === failureKey) {
              window.backupWriteProbe.events.push({ operation: 'fail', key });
              throw new DOMException('Synthetic backup write failure', 'QuotaExceededError');
            }
            const result = set.call(this, key, value);
            if (key === calendarKey) window.backupWriteProbe.events.push({ operation: 'set', key, value });
            return result;
          };
          Storage.prototype.removeItem = function (key) {
            const result = remove.call(this, key);
            if (key === calendarKey) window.backupWriteProbe.events.push({ operation: 'remove', key });
            return result;
          };
        }, { calendarKey: CALENDAR_KEY, failureKey });
        try {
          await uploadSettingsBackup(page, incoming);
          await expect(page.locator('#settingsSafetyTitle')).toHaveText('核对导入变更');
          expect(await backupState(page)).toEqual(before);
          await page.locator('#settingsSafetyAccept').click();
          await expect(page.locator('#settingsSafetyTitle')).toHaveText('未导入设置');
          await expect(page.locator('#settingsSafetyText')).toContainText('原设置已保留');
          const writes = await page.evaluate(() => window.backupWriteProbe.events);
          expect(writes).toHaveLength(3);
          expect(writes[0]).toMatchObject({ operation: 'set', key: CALENDAR_KEY });
          expect(writes[0].value).not.toBe(before[CALENDAR_KEY]);
          expect(JSON.parse(writes[0].value).calendarData.coverage.version).toBe(incoming.payload.calendar.coverage.version);
          expect(writes[1]).toEqual({ operation: 'fail', key: failureKey });
          expect(writes[2]).toEqual(hasCalendar
            ? { operation: 'set', key: CALENDAR_KEY, value: before[CALENDAR_KEY] }
            : { operation: 'remove', key: CALENDAR_KEY });
          await page.locator('#settingsSafetyAccept').click();
          await expect(page.locator('#settingsSafetyConfirm')).toBeHidden();
          await page.waitForFunction(() => document.getElementById('settingsBackupFile').value === '');
          expect(await backupState(page)).toEqual(before);
          expectBackupContents(await exportSettingsBackup(page), original);
        } finally {
          await page.evaluate(() => {
            Storage.prototype.setItem = window.backupWriteProbe.set;
            Storage.prototype.removeItem = window.backupWriteProbe.remove;
            delete window.backupWriteProbe;
          });
        }
        await confirmBackupImport(page, incoming);
        expectBackupContents(await exportSettingsBackup(page), incoming);
        expect(errors).toEqual([]);
      });
    }
  }

  test(`${artifact}: restoring a real backup survives reload without losing paused task or privacy`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await prepareBackupState(page, artifact, true);
    const before = await backupState(page);
    const original = await exportSettingsBackup(page);
    const changed = changedBackup(original);
    await confirmBackupImport(page, changed);
    expectBackupContents(await exportSettingsBackup(page), changed);
    const changedState = await backupState(page);
    expect(JSON.parse(changedState[SETTINGS_KEY]).payload.settings).toMatchObject({
      incomeMode: 'fixed-daily', monthlyIncome: 9876.54, dailyIncome: 321.09, annualWorkDays: 241,
      schedule: changed.payload.settings.schedule,
    });
    expect(calendarContents(JSON.parse(changedState[CALENDAR_KEY]).calendarData)).toEqual(calendarContents(changed.payload.calendar));
    expect(changedState[SETTINGS_KEY]).not.toBe(before[SETTINGS_KEY]);
    expect(changedState[CALENDAR_KEY]).not.toBe(before[CALENDAR_KEY]);
    await confirmBackupImport(page, original);
    expectBackupContents(await exportSettingsBackup(page), original);
    await page.locator('#settingsDialog .settings-close').click();
    await expect(page.locator('#settingsDialog')).toBeHidden();
    const restored = await backupState(page);
    const expectedSettings = { ...original.payload.settings };
    // This legacy compatibility flag belongs to backup files, not the saved settings model.
    delete expectedSettings.incomeConfigured;
    expect(JSON.parse(restored[SETTINGS_KEY]).payload.settings).toMatchObject(expectedSettings);
    expect(calendarContents(JSON.parse(restored[CALENDAR_KEY]).calendarData)).toEqual(calendarContents(original.payload.calendar));
    for (const key of [TASK_KEY, 'income-per-sed-privacy-v1', 'income-per-sed-focus-v1']) expect(restored[key]).toBe(before[key]);
    await page.reload();
    await fullDisplay(page);
    const reloaded = await backupState(page);
    expect(reloaded[SETTINGS_KEY]).toBe(restored[SETTINGS_KEY]);
    expect(reloaded[CALENDAR_KEY]).toBe(restored[CALENDAR_KEY]);
    expect(reloaded[TEMP_KEY]).toBeNull();
    for (const key of ['income-per-sed-privacy-v1', 'income-per-sed-focus-v1']) expect(reloaded[key]).toBe(before[key]);
    const taskContents = raw => {
      const parsed = JSON.parse(raw), task = parsed.payload || parsed;
      return { mode: task.mode, accumulatedMs: task.accumulatedMs, lockedSecondly: task.lockedSecondly };
    };
    // A reload may checkpoint the task again; preserve its meaning rather than its transaction timestamp.
    expect(taskContents(reloaded[TASK_KEY])).toEqual(taskContents(before[TASK_KEY]));
    await expect(page.locator('#taskStopwatchState')).toHaveText('已暂停');
    await openIncome(page);
    await settingsReady(page);
    await expect(page.locator('#incomeAmountInput')).toHaveValue('12345.67');
    expectBackupContents(await exportSettingsBackup(page), original);
    expect(errors).toEqual([]);
  });

  for (const failureKey of [TEMP_KEY, SETTINGS_KEY]) {
    test(`${artifact}: failed ${failureKey} preserves old settings and can retry`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`/Income-per-sed-${artifact}.html`);
      await fullDisplay(page);
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
        await fullDisplay(page);
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
    await fullDisplay(page);
    const other = await context.newPage();
    await other.goto(`/Income-per-sed-${artifact}.html`);
    await fullDisplay(other);
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
