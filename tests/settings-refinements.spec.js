const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady, discardSettings } = require('./helpers/display-state');
const appPath = process.env.SETTINGS_RELEASE_CHANNEL === 'push' ? '/Income-per-sed-Push.html' : '/Income-per-sed-Develop.html';
const calendarFixture = {
  coverage: { start: '2026-01-01', end: '2027-12-31', label: 'Calendar status test', version: 'calendar-status-fixture', timeZone: 'Asia/Shanghai' },
  holidays: ['2026-10-29'],
  specialWorkdays: ['2026-10-31'],
};
const calendarStorageKey = 'income-per-sed-calendar-data-v1';
const calendarRaw = page => page.evaluate(key => localStorage.getItem(key), calendarStorageKey);
const calendarFile = (data = calendarFixture) => ({
  name: 'calendar-status.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)),
});

async function openCalendarSettings(page) {
  await page.locator('#scheduleSettingsCard').click();
  await settingsReady(page);
}

async function uploadCalendar(page, data) {
  await page.locator('#calendarImportInput').setInputFiles(calendarFile(data));
}

const defaultScheduleTimes = {
  morningStart: '09:00', morningEnd: '11:30', afternoonStart: '13:30', afternoonEnd: '17:30',
};

async function expectScheduleWheels(grid, times) {
  const expected = Object.entries(times).flatMap(([key, time]) => time.split(':').map((value, index) =>
    [key, index === 0 ? 'hour' : 'minute', String(Number(value))]));
  await expect(grid.locator('.time-wheel-card')).toHaveCount(4);
  await expect.poll(() => grid.getByRole('spinbutton').evaluateAll(nodes => nodes.map(node =>
    [node.closest('[data-time-key]').dataset.timeKey, node.dataset.unit, node.getAttribute('aria-valuenow')]))).toEqual(expected);
}

for (const [variant, width, height] of [['Develop', 1200, 900], ['Push', 390, 676]]) {
  test(`${variant}: schedule validation defers errors and accepts adjoining periods after correction`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    await openCalendarSettings(page);
    const dialog = page.locator('#settingsDialog');
    const grid = dialog.locator('#scheduleWheelGrid');
    const morningEnd = grid.locator('[data-time-key="morningEnd"]');
    const afternoonStart = grid.locator('[data-time-key="afternoonStart"]');
    const error = dialog.locator('#scheduleSettingsError');
    const total = dialog.locator('#scheduleCalibrationTotal');
    const save = dialog.locator('#settingsSaveButton');
    const readSaved = () => page.evaluate(() => localStorage.getItem('income-per-sed-settings'));
    const original = await readSaved();
    const setEnd = async (unit, value) => {
      await morningEnd.locator(`[data-unit="${unit}"]`).press('Enter');
      const input = grid.locator('.time-wheel-direct input');
      await input.fill(value);
      await input.press('Enter');
    };
    await expectScheduleWheels(grid, defaultScheduleTimes);
    await setEnd('hour', '09');
    await setEnd('minute', '00');
    await expect(total).toHaveText('等待校准');
    await expect(error).toBeHidden();
    await expect(grid).not.toHaveAttribute('aria-invalid');
    await expect(save).toBeEnabled();

    await save.click();
    await expect(error).toHaveText('上午结束必须晚于上午开始。');
    await expect(grid).toHaveAttribute('aria-invalid', 'true');
    await expect(morningEnd).toHaveAttribute('aria-invalid', 'true');
    await expect(morningEnd.locator('[data-unit="hour"]')).toBeFocused();
    await expect(save).toBeDisabled();
    expect(await readSaved()).toBe(original);

    await setEnd('hour', '13');
    await setEnd('minute', '30');
    await expect(total).toHaveText('8小时30分');
    await expect(error).toBeHidden();
    await expect(save).toBeEnabled();
    const endMinutes = morningEnd.locator('[data-unit="minute"]');
    await endMinutes.press('ArrowDown');
    await expect(error).toHaveText('下午开始不能早于上午结束。');
    await expect(afternoonStart).toHaveAttribute('aria-invalid', 'true');
    await expect(endMinutes).toBeFocused();
    await expect(save).toBeDisabled();

    await endMinutes.press('ArrowUp');
    await expect(grid).not.toHaveAttribute('aria-invalid');
    await expect(afternoonStart).not.toHaveAttribute('aria-invalid');
    await expect(error).toBeHidden();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(dialog).toBeHidden();
    expect(await readSaved()).not.toBe(original);

    await page.reload();
    await fullDisplay(page);
    await openCalendarSettings(page);
    await expectScheduleWheels(grid, { ...defaultScheduleTimes, morningEnd: '13:30' });
    await expect(total).toHaveText('8小时30分');
    await expect(error).toBeHidden();
    expect(errors).toEqual([]);
  });
}

for (const [variant, width, height] of [['Develop', 1200, 900], ['Push', 390, 676]]) {
  test(`${variant}: schedule wheel lifecycle keeps four editable times across reopening`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    const dialog = page.locator('#settingsDialog');
    const grid = dialog.locator('#scheduleWheelGrid');
    const minute = key => grid.locator(`[data-time-key="${key}"] [data-unit="minute"]`);
    const editor = grid.locator('.time-wheel-direct input');
    const cancel = dialog.locator('[data-settings-close-kind="cancel"]');

    await openCalendarSettings(page);
    await expectScheduleWheels(grid, defaultScheduleTimes);
    const previousWheel = await minute('morningStart').elementHandle();
    const edited = { morningStart: '09:05', morningEnd: '11:40', afternoonStart: '13:35', afternoonEnd: '17:45' };
    for (const [key, time] of Object.entries(edited)) {
      await minute(key).press('Enter');
      await editor.fill(time.slice(-2));
      await editor.press('Enter');
      await expect(editor).toHaveCount(0);
    }
    await expectScheduleWheels(grid, edited);
    await expect(dialog.locator('#scheduleCalibrationTotal')).toHaveText('6小时45分');
    await minute('afternoonEnd').press('Enter');
    await editor.fill('99');
    await cancel.click();
    await expect(dialog).toBeHidden();
    await expect(grid.locator('.time-wheel-card, .time-wheel-column, .time-wheel-direct')).toHaveCount(0);

    await openCalendarSettings(page);
    await expectScheduleWheels(grid, defaultScheduleTimes);
    expect(await previousWheel.evaluate(node => !node.isConnected && node.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })))).toBe(true);
    await previousWheel.dispose();
    await minute('afternoonEnd').press('ArrowDown');
    await expectScheduleWheels(grid, { ...defaultScheduleTimes, afternoonEnd: '17:31' });
    await dialog.locator('#settingsSaveButton').click();
    await expect(dialog).toBeHidden();
    await expect(grid.locator('.time-wheel-card, .time-wheel-column, .time-wheel-direct')).toHaveCount(0);

    await openCalendarSettings(page);
    await expectScheduleWheels(grid, { ...defaultScheduleTimes, afternoonEnd: '17:31' });
    await cancel.click();
    await expect(dialog).toBeHidden();
    await expect(grid.locator('.time-wheel-card, .time-wheel-column, .time-wheel-direct')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const deferFirstFocus of [false, true]) {
  const suffix = deferFirstFocus ? ' when initial focus is refused' : '';
  test(`Push: schedule wheel lifecycle rebuilds a restored draft with its pending editor${suffix}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 676 });
    if (deferFirstFocus) await page.addInitScript(() => {
      let defer = false;
      document.addEventListener('click', event => {
        if (event.target.id !== 'settingsSafetyAccept') return;
        defer = true;
        requestAnimationFrame(() => { defer = false; });
      }, { capture: true });
      const focus = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (...args) {
        if (defer && this.matches('#scheduleWheelGrid .time-wheel-direct input')) {
          this.dataset.initialFocusRefused = 'true';
          return;
        }
        return focus.apply(this, args);
      };
    });
    await page.goto('/Income-per-sed-Push.html');
    await fullDisplay(page);
    const dialog = page.locator('#settingsDialog');
    const grid = dialog.locator('#scheduleWheelGrid');
    const minute = key => grid.locator(`[data-time-key="${key}"] [data-unit="minute"]`);
    const editor = grid.locator('.time-wheel-direct input');
    await openCalendarSettings(page);
    await minute('morningEnd').press('ArrowDown');
    await expect(minute('morningEnd')).toHaveAttribute('aria-valuenow', '31');
    await minute('afternoonEnd').press('Enter');
    await editor.fill('42');
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('income-per-sed-settings-draft-v1'))?.panels?.schedule))
      .toMatchObject({ schedule: { morningEnd: '11:31' }, editor: { key: 'afternoonEnd', unit: 'minute', text: '42' } });

    await page.reload();
    await fullDisplay(page);
    await page.locator('#draftReview').click();
    await expect(dialog.locator('#settingsSafetyTitle')).toHaveText('恢复未保存的草稿？');
    const initialWheel = await minute('afternoonEnd').elementHandle();
    await dialog.locator('#settingsSafetyAccept').click();
    await expectScheduleWheels(grid, { ...defaultScheduleTimes, morningEnd: '11:31' });
    await expect(editor).toHaveValue('42');
    if (deferFirstFocus) await expect(editor).toHaveAttribute('data-initial-focus-refused', 'true');
    try {
      await expect(editor).toBeFocused();
    } catch (error) {
      const focus = await page.evaluate(() => {
        const editor = document.querySelector('#scheduleWheelGrid .time-wheel-direct input');
        const active = document.activeElement;
        return { editorActive: editor === active, documentFocused: document.hasFocus(),
          activeTag: active?.tagName, activeId: active?.id, editorInert: Boolean(editor?.closest('[inert]')) };
      });
      error.message += `\nRestored editor focus state: ${JSON.stringify(focus)}`;
      throw error;
    }
    expect(await initialWheel.evaluate(node => node.isConnected)).toBe(false);
    await initialWheel.dispose();
    await page.keyboard.press('Enter');
    await expectScheduleWheels(grid, { ...defaultScheduleTimes, morningEnd: '11:31', afternoonEnd: '17:42' });
    await dialog.locator('[data-settings-close-kind="cancel"]').click();
    await expect(dialog).toBeHidden();
    await expect(grid.locator('.time-wheel-card, .time-wheel-column, .time-wheel-direct')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const [variant, width, height] of [['Develop', 1200, 900], ['Push', 390, 676]]) {
  test(`${variant}: schedule settings entry cancels or saves hours and calendar together`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    const dialog = page.locator('#settingsDialog');
    const summary = dialog.locator('#scheduleCalibrationTotal');
    const badge = dialog.locator('#calendarDataBadge');
    const status = dialog.locator('#calendarDataStatus');
    const stored = () => page.evaluate(key => ({
      calendar: localStorage.getItem(key),
      settings: localStorage.getItem('income-per-sed-settings'),
    }), calendarStorageKey);
    const initial = await stored();

    const editBoth = async () => {
      await openCalendarSettings(page);
      await expect(summary).toHaveText('6小时30分');
      await expect(badge).toHaveText('内置');
      await expect(status).toBeHidden();
      await dialog.locator('[data-time-key="morningEnd"] [data-unit="minute"]').press('ArrowDown');
      await expect(summary).toHaveText('6小时31分');
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        dialog.locator('#calendarImportButton').click(),
      ]);
      await chooser.setFiles(calendarFile());
      await expect(status).toHaveText('已载入日历，保存后生效。');
      await expect(badge).toHaveText('已导入');
      await expect(summary).toHaveText('6小时31分');
      expect(await stored()).toEqual(initial);
    };

    await editBoth();
    await dialog.locator('[data-settings-close-kind="cancel"]').click();
    await expect(dialog).toBeHidden();
    expect(await stored()).toEqual(initial);
    await page.reload();
    await fullDisplay(page);
    await editBoth();

    await dialog.locator('#settingsSaveButton').click();
    await expect(dialog).toBeHidden();
    const saved = await stored();
    expect(saved.settings).not.toBe(initial.settings);
    expect(JSON.parse(saved.calendar).calendarData.coverage.version).toBe(calendarFixture.coverage.version);
    await page.reload();
    await fullDisplay(page);
    expect(await stored()).toEqual(saved);
    await openCalendarSettings(page);
    await expect(summary).toHaveText('6小时31分');
    await expect(badge).toHaveText('已导入');
    await expect(dialog.locator('#calendarDataMeta')).toHaveText('2026—2027 年');
    await expect(status).toBeHidden();
    expect(errors).toEqual([]);
  });
}

for (const variant of ['Develop', 'Push']) {
  const path = `/Income-per-sed-${variant}.html`;
  for (const [width, height, theme] of [[1200, 900, 'light'], [390, 676, 'dark']]) {
    test(`${variant}: calendar status preserves draft and operation feedback at ${width}px`, async ({ page }, info) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height });
      await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
      await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
      await page.goto(path);
      await fullDisplay(page);
      await openCalendarSettings(page);
      const section = page.locator('#calendarDataSection');
      const badge = section.locator('#calendarDataBadge');
      const meta = section.locator('#calendarDataMeta');
      const status = section.locator('#calendarDataStatus');
      const before = await calendarRaw(page);
      const layouts = {};
      const capture = async name => {
        await section.screenshot({ path: info.outputPath(`calendar-status-${name}.png`), animations: 'disabled' });
        layouts[name] = await section.evaluate(root =>
          [root, ...root.querySelectorAll('.calendar-inline-heading, .calendar-inline-heading > *, #calendarDataStatus')].map(node => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return { id: node.id, text: node.textContent, label: node.getAttribute('aria-label'),
              bounds: [rect.x, rect.y, rect.width, rect.height],
              font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight], color: style.color };
          }));
      };
      await expect(badge).toHaveText('内置');
      await expect(meta).toHaveText('2026 年');
      await expect(status).toHaveAttribute('aria-live', 'polite');
      await expect(status).toBeHidden();
      await capture('builtin');

      await uploadCalendar(page);
      await expect(badge).toHaveText('已导入');
      await expect(meta).toHaveText('2026—2027 年');
      await expect(meta).toHaveAttribute('aria-label', 'Calendar status test，2026-01-01 至 2027-12-31，1 个休息日，1 个调休工作日');
      await expect(status).toHaveText('已载入日历，保存后生效。');
      await capture('imported');
      await info.attach('calendar-status-layout', { body: JSON.stringify(layouts, null, 2), contentType: 'application/json' });

      const downloading = page.waitForEvent('download');
      await section.locator('#calendarExportButton').click();
      expect((await downloading).suggestedFilename()).toBe('Income-per-sed-calendar-calendar-status-fixture.json');
      await expect(status).toHaveText('已导出当前面板的日历。');
      await uploadCalendar(page, { ...calendarFixture, holidays: ['2028-01-01'] });
      await expect(status).toHaveText('导入失败：节假日日期 2028-01-01 超出覆盖区间。');
      await expect(badge).toHaveText('已导入');
      await expect(meta).toHaveText('2026—2027 年');
      expect(await calendarRaw(page)).toBe(before);

      await section.locator('#calendarResetButton').click();
      await expect(badge).toHaveText('内置');
      await expect(meta).toHaveText('2026 年');
      await expect(status).toHaveText('当前已是内置日历。');
      expect(await calendarRaw(page)).toBe(before);
      await discardSettings(page);
      expect(errors).toEqual([]);
    });
  }

  test(`${variant}: calendar status keeps the draft through save rollback and retry`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(path);
    await fullDisplay(page);
    await openCalendarSettings(page);
    expect(await calendarRaw(page)).toBeNull();
    await uploadCalendar(page);
    const badge = page.locator('#calendarDataBadge');
    const meta = page.locator('#calendarDataMeta');
    const status = page.locator('#calendarDataStatus');
    const save = page.locator('#settingsSaveButton');
    await expect(status).toHaveText('已载入日历，保存后生效。');
    await page.locator('[data-time-key="morningStart"] [data-unit="minute"]').press('ArrowDown');
    await page.evaluate(key => {
      const set = Storage.prototype.setItem;
      window.restoreCalendarTestWrite = () => { Storage.prototype.setItem = set; };
      Storage.prototype.setItem = function (name, value) {
        if (this === localStorage && name === 'income-per-sed-settings') {
          window.calendarAtFailedWrite = JSON.parse(localStorage.getItem(key))?.calendarData?.coverage?.version;
          throw new Error('Injected settings write failure');
        }
        return set.call(this, name, value);
      };
    }, calendarStorageKey);
    try {
      await save.click();
      await expect(page.locator('#scheduleSettingsError')).toHaveText('设置未能保存，请重试。草稿已保留。');
      expect(await page.evaluate(() => window.calendarAtFailedWrite)).toBe(calendarFixture.coverage.version);
      expect(await calendarRaw(page)).toBeNull();
      await expect(badge).toHaveText('已导入');
      await expect(meta).toHaveText('2026—2027 年');
      await expect(status).toHaveText('已载入日历，保存后生效。');
    } finally {
      await page.evaluate(() => window.restoreCalendarTestWrite());
    }
    await save.click();
    await expect(page.locator('#settingsDialog')).toBeHidden();
    const saved = await calendarRaw(page);
    expect(JSON.parse(saved).calendarData.coverage.version).toBe(calendarFixture.coverage.version);
    await page.reload();
    await fullDisplay(page);
    await openCalendarSettings(page);
    await expect(badge).toHaveText('已导入');
    await expect(meta).toHaveText('2026—2027 年');
    await expect(status).toBeHidden();
    await page.locator('#calendarResetButton').click();
    await expect(badge).toHaveText('内置');
    await expect(status).toHaveText('已选择内置日历，保存后生效。');
    expect(await calendarRaw(page)).toBe(saved);
    await discardSettings(page);
    expect(errors).toEqual([]);
  });
}

for (const variant of ['Develop', 'Push']) {
  for (const [width, height, theme] of [[1200, 900, 'light'], [390, 676, 'dark']]) {
    test(`${variant}: schedule summary presents draft hours at ${width}px`, async ({ page }, info) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height });
      await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
      await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
      await page.goto(`/Income-per-sed-${variant}.html`);
      await fullDisplay(page);
      await page.locator('#scheduleSettingsCard').click();
      await settingsReady(page);
      const panel = page.locator('#scheduleSettingsPanel');
      const total = panel.locator('#scheduleCalibrationTotal');
      const morning = panel.locator('#scheduleMorningDuration');
      const afternoon = panel.locator('#scheduleAfternoonDuration');
      const summary = panel.locator('#scheduleCalibrationSummary');
      const expectHours = async (totalText, morningText, valid) => {
        await expect(total).toHaveText(totalText);
        await expect(morning).toHaveText(morningText);
        await expect(afternoon).toHaveText('4小时');
        await expect(summary).toHaveAttribute('data-valid', String(valid));
      };
      await expectHours('6小时30分', '2小时30分', true);
      await panel.screenshot({ path: info.outputPath('schedule-summary.png'), animations: 'disabled' });
      const layout = await panel.evaluate(root =>
        [...root.querySelectorAll('#scheduleCalibrationSummary, #scheduleCalibrationSummary > *, .schedule-period-heading, .schedule-period-heading > *')].map(node => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return { id: node.id, text: node.textContent, bounds: [rect.x, rect.y, rect.width, rect.height],
            font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight], color: style.color };
        }));
      await info.attach('schedule-summary-layout', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });

      const end = panel.locator('[data-time-key="morningEnd"]');
      await end.locator('[data-unit="minute"]').press('ArrowDown');
      await expectHours('6小时31分', '2小时31分', true);
      for (let i = 0; i < 3; i++) await end.locator('[data-unit="hour"]').press('ArrowUp');
      await expectHours('等待校准', '—', false);
      await discardSettings(page);
      expect(errors).toEqual([]);
    });
  }
}

test('mobile quick history restores cancelled drags and supports explicit and swipe closing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(appPath);
  await fullDisplay(page);
  await page.locator('#historyQuickOpen').click();
  await expect(page.locator('#historyQuickPanel')).not.toHaveAttribute('data-entry-animating');
  const before = await page.locator('#historyQuickPanel').boundingBox();
  await page.evaluate(() => {
    const panel = document.querySelector('#historyQuickPanel');
    const grabber = document.querySelector('#historyQuickGrabber');
    const event = (type, y, id = 21) => new PointerEvent(type, { pointerId: id, pointerType: 'touch', button: 0, clientX: 180, clientY: y, bubbles: true });
    grabber.dispatchEvent(event('pointerdown', 500));
    panel.dispatchEvent(event('pointermove', 540));
    panel.dispatchEvent(event('pointercancel', 540));
  });
  await expect(page.locator('body')).not.toHaveClass(/history-quick-sheet-(returning|dragging)/);
  const after = await page.locator('#historyQuickPanel').boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(after[key] - before[key])).toBeLessThan(0.5);
  await expect(page.locator('#historyQuickPanel')).toBeVisible();
  await page.locator('#historyQuickClose').click();
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/history-quick-sheet-(returning|dragging)/);
  await page.locator('#historyQuickOpen').click();
  await expect(page.locator('#historyQuickPanel')).not.toHaveAttribute('data-entry-animating');
  await page.evaluate(() => {
    const panel = document.getElementById('historyQuickPanel');
    const event = (type, y) => new PointerEvent(type, { pointerId: 22, pointerType: 'touch', button: 0, clientX: 180, clientY: y, bubbles: true });
    document.getElementById('historyQuickGrabber').dispatchEvent(event('pointerdown', 540));
    panel.dispatchEvent(event('pointermove', 740));
    panel.dispatchEvent(event('pointerup', 740));
  });
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
  await expect(page.locator('#historyQuickOpen')).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/history-quick-sheet-(returning|dragging)/);
});

test('quick action retains its source without delaying or stacking feedback', async ({ page }) => {
  await open(page, 'income');
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await page.locator('#historyQuickOpen').dispatchEvent('click');
  await page.clock.runFor(600);
  const back = page.locator('[data-history-seconds="-900"]');
  await back.dispatchEvent('click');
  await expect(back).toHaveClass(/is-recent-source/);
  await page.clock.runFor(300);
  await back.dispatchEvent('click');
  await page.clock.runFor(200);
  await expect(back).toHaveClass(/is-recent-source/);
  const forward = page.locator('[data-history-seconds="900"]');
  await forward.dispatchEvent('click');
  await expect(page.locator('.is-recent-source')).toHaveCount(1);
  await expect(forward).toHaveClass(/is-recent-source/);
  await page.clock.runFor(440);
  await expect(page.locator('.is-recent-source')).toHaveCount(0);
});

test('saved readouts hand off only after closing without moving the card', async ({ page }) => {
  await open(page, 'income');
  const card = page.locator('#incomeSettingsCard');
  const before = await card.boundingBox();
  await page.locator('#incomeAmountInput').fill('12345');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  expect(await page.locator('#hourlyRateDisplay').evaluate(node => node.getAnimations().length)).toBe(0);
  await page.clock.runFor(700);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  const feedback = await page.locator('#hourlyRateDisplay').evaluate(node => {
    const animation = node.getAnimations()[0];
    if (!animation) return null;
    animation.pause(); animation.currentTime = 80;
    return { duration: animation.effect.getTiming().duration, opacity: Number(getComputedStyle(node).opacity) };
  });
  expect(feedback?.duration).toBe(200);
  expect(feedback.opacity).toBeGreaterThan(.62);
  expect(feedback.opacity).toBeLessThan(1);
  const after = await card.boundingBox();
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);
  await card.dispatchEvent('click');
  expect(await page.locator('#hourlyRateDisplay').evaluate(node => node.getAnimations().length)).toBe(0);
});

test('wheel edges fade without changing the income roller or wheel geometry', async ({ page }) => {
  await open(page, 'schedule');
  const column = page.locator('.time-wheel-column:not(:focus-visible)').first();
  const mask = await column.evaluate(node => getComputedStyle(node).maskImage || getComputedStyle(node).webkitMaskImage);
  expect(mask).toContain('linear-gradient');
  expect(mask).toContain('14%');
  const amountMask = await page.locator('#flipContainer').evaluate(node => getComputedStyle(node).maskImage || getComputedStyle(node).webkitMaskImage);
  expect(amountMask).not.toBe(mask);
  await expect(column).toHaveAttribute('role', 'spinbutton');
});

test('complete schedule stays inside its panel without scroll edge hints', async ({ page }) => {
  await open(page, 'schedule');
  const sheet = page.locator('.settings-sheet');
  await sheet.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
  await page.clock.runFor(32);
  await expect(sheet).not.toHaveClass(/has-scroll-above/);
  await expect(sheet).not.toHaveClass(/has-scroll-below/);
  expect(await sheet.evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
  await sheet.evaluate(node => { node.scrollTop = node.scrollHeight; node.dispatchEvent(new Event('scroll')); });
  await page.clock.runFor(32);
  await expect(sheet).not.toHaveClass(/has-scroll-above/);
  await expect(sheet).not.toHaveClass(/has-scroll-below/);
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await expect(sheet).not.toHaveClass(/has-scroll-(above|below)/);
});

async function open(page, kind) {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-10-05T06:00:00Z') });
  await page.goto(appPath);
  await fullDisplay(page);
  await page.locator(`#${kind}SettingsCard`).focus();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
  await page.clock.runFor(600);
}

test('schedule keeps all controls visible after shell handoff without a gutter', async ({ page }) => {
  await open(page, 'schedule');
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await page.locator('#scheduleSettingsCard').dispatchEvent('click');
  await page.clock.runFor(300);
  const read = () => page.locator('.settings-sheet').evaluate(sheet => ({ width: sheet.clientWidth, overflow: sheet.scrollHeight - sheet.clientHeight, scrollbar: getComputedStyle(sheet).scrollbarWidth }));
  const early = await read();
  expect(early.overflow).toBeLessThanOrEqual(1);
  expect(early.scrollbar).toBe('none');
  await page.clock.runFor(400);
  const end = await read();
  expect(end.overflow).toBeLessThanOrEqual(1);
  expect(end.scrollbar).toBe('none');
  expect(end.width).toBe(early.width);
  await expect(page.locator('#settingsSaveButton')).toBeInViewport();
  await expect(page.locator('#calendarDataSection')).toBeInViewport();
});

test('income selection reverses from the current position and keeps editor geometry', async ({ page }) => {
  await open(page, 'income');
  await page.locator('#incomeAmountInput').focus();
  const before = await page.locator('#incomeAmountInput').boundingBox();
  await page.locator('[data-income-mode="fixed-daily"]').dispatchEvent('click');
  await page.locator('.income-mode-indicator').evaluate(el => { const animation = el.getAnimations()[0]; animation.pause(); animation.currentTime = 64; });
  const left = () => page.locator('.income-mode-indicator').evaluate(el => el.getBoundingClientRect().left);
  const moving = await left();
  await page.evaluate(() => {
    document.querySelector('[data-income-mode="annual-average"]').click();
    const animation = document.querySelector('.income-mode-indicator').getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
  });
  expect(Math.abs(await left() - moving)).toBeLessThan(1);
  await page.locator('.income-mode-indicator').evaluate(el => el.getAnimations().forEach(animation => animation.finish()));
  await page.clock.runFor(220);
  const target = await page.locator('[data-income-mode="annual-average"]').boundingBox();
  expect(Math.abs(await left() - target.x)).toBeLessThan(1);
  await expect(page.locator('#incomeAmountInput')).toBeFocused();
  expect(await page.locator('#incomeAmountInput').boundingBox()).toEqual(before);
  expect(await page.locator('.income-mode-indicator').evaluate(el => el.getAnimations().length)).toBe(0);
});

test('inline calendar tools stay exposed without an arrow or height transition', async ({ page }) => {
  await open(page, 'schedule');
  const read = () => page.locator('#calendarDataSection').evaluate(section => {
    const content = section.querySelector('#calendarDataContent');
    return { height: content.getBoundingClientRect().height, full: content.firstElementChild.getBoundingClientRect().height, top: section.getBoundingClientRect().top, transform: getComputedStyle(content.firstElementChild).transform, inert: content.inert };
  });
  const before = await read();
  await expect(page.locator('#calendarDataToggle, .settings-data-chevron')).toHaveCount(0);
  for (const id of ['calendarExportButton', 'calendarImportButton', 'calendarResetButton']) {
    await page.locator(`#${id}`).focus();
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await page.clock.runFor(64);
    const during = await read();
    expect(during.inert).toBe(false);
    expect(during.transform).toBe('none');
    expect(Math.abs(during.top - before.top)).toBeLessThan(1);
    expect(Math.abs(during.height - during.full)).toBeLessThan(1);
  }
});

test('correcting an error preserves its icon and space until fade finishes', async ({ page }) => {
  await open(page, 'income');
  await page.locator('#incomeAmountInput').fill('0');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  const error = page.locator('#incomeAmountError');
  await expect(error).not.toHaveAttribute('hidden', '');
  await expect.poll(() => error.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  const before = await error.boundingBox();
  const during = await page.evaluate(() => {
    const el = document.querySelector('#incomeAmountError');
    const input = document.querySelector('#incomeAmountInput');
    input.value = '7500';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    getComputedStyle(el).opacity;
    const fade = el.getAnimations().find(animation => animation.transitionProperty === 'opacity');
    if (!fade) throw new Error('Error correction opacity transition was not created');
    fade.pause();
    fade.currentTime = 64;
    const sample = { opacity: Number(getComputedStyle(el).opacity), icon: getComputedStyle(el, '::before').content, height: el.getBoundingClientRect().height, text: el.textContent };
    fade.finish();
    return sample;
  });
  expect(during.opacity).toBeGreaterThan(0);
  expect(during.opacity).toBeLessThan(1);
  expect(during.icon).toBe('"!"');
  expect(during.height).toBeCloseTo(before.height, 1);
  expect(during.text).not.toBe('');
  await page.clock.runFor(180);
  await expect(error).toHaveText('');
  await expect(page.locator('#settingsSaveButton')).toBeEnabled();
});
