const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady } = require('./helpers/display-state');
const { exportSettingsBackup, uploadSettingsBackup } = require('./helpers/settings-backup');

for (const variant of ['Develop', 'Push']) {
  test(`${variant}: saved wage survives reload, backup restore, date seek and return to live`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-22T10:30:00+08:00'));
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    const settings = page.locator('#settingsDialog');
    const hourly = page.locator('#hourlyRateDisplay');
    const openIncome = async () => {
      await page.locator('#incomeSettingsCard').click();
      await settingsReady(page);
    };
    const saveIncome = async (amount, expected) => {
      await openIncome();
      await page.locator('#incomeAmountInput').fill(amount);
      await page.locator('#settingsSaveButton').click();
      await expect(settings).toBeHidden();
      await expect(hourly).toHaveText(expected);
    };
    await saveIncome('11700', '¥100.00');
    await page.reload();
    await fullDisplay(page);
    await expect(hourly).toHaveText('¥100.00');
    await openIncome();
    const backup = await exportSettingsBackup(page);
    await page.keyboard.press('Escape');
    await expect(settings).toBeHidden();
    await saveIncome('14040', '¥120.00');
    await openIncome();
    await uploadSettingsBackup(page, backup);
    await expect(page.locator('#settingsSafetyTitle')).toHaveText('核对导入变更');
    await page.locator('#settingsSafetyAccept').click();
    await expect(page.locator('#settingsSafetyConfirm')).toBeHidden();
    await page.waitForFunction(() => document.getElementById('settingsBackupFile').value === '');
    await settingsReady(page);
    expect((await exportSettingsBackup(page)).payload).toEqual(backup.payload);
    await page.reload();
    await fullDisplay(page);
    await expect(hourly).toHaveText('¥100.00');

    await page.locator('#historyQuickOpen').click();
    await page.waitForFunction(() => !document.getElementById('historyQuickPanel').dataset.entryAnimating);
    await expect(page.locator('#historyDialDate')).toHaveText('2026-10-22');
    await page.locator('#historySeekWheels [data-date-part="day"]').press('ArrowUp');
    await page.locator('#historyDialTime').fill('09:30:00');
    await page.locator('#historySeekSubmit').click();
    await expect(page.locator('#historyDialDate')).toHaveText('2026-10-21');
    await expect(page.locator('#currentTime')).toHaveAttribute('datetime', '2026-10-21T01:30:00.000Z');
    await expect(page.locator('#workedTime')).toHaveText('0时30分0秒');
    await expect(page.locator('#progressPercent')).toHaveText('7.7%');
    await expect(hourly).toHaveText('¥100.00');
    await expect.poll(() => page.locator('#funFact .fun-count').allTextContents()).toEqual(['5', '12', '1', '0']);

    await page.locator('#historyQuickPanel [data-history-action="live"]').click();
    await expect(page.locator('#currentTime')).toHaveAttribute('datetime', '2026-10-22T02:30:00.000Z');
    await expect(page.locator('#workedTimeLabel')).toHaveText('今日已工作');
    await expect(page.locator('#workedTime')).toHaveText('1时30分0秒');
    await expect(page.locator('#progressPercent')).toHaveText('23.1%');
    await expect(hourly).toHaveText('¥100.00');
    expect(errors).toEqual([]);
  });
}

for (const [variant, width, height] of [['Develop', 1200, 900], ['Push', 390, 844]]) {
  test(`${variant}: saved work hours update the dashboard and full backup restores all settings`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.clock.setFixedTime(new Date('2026-10-22T12:30:00+08:00'));
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    const dialog = page.locator('#settingsDialog');
    const weekdaySchedule = { morningStart: '09:00', morningEnd: '11:30', afternoonStart: '13:30', afternoonEnd: '17:30' };
    const adjacentSchedule = { ...weekdaySchedule, morningEnd: '13:30' };
    const workingCalendar = {
      coverage: {
        start: '2026-01-01', end: '2026-12-31', label: 'Workflow working calendar',
        version: 'workflow-working', timeZone: 'Asia/Shanghai', generatedAt: '2026-01-01', source: 'Synthetic test calendar',
      },
      holidays: ['2026-10-29'], specialWorkdays: ['2026-10-31'],
    };
    const holidayCalendar = {
      ...workingCalendar,
      coverage: { ...workingCalendar.coverage, label: 'Workflow holiday calendar', version: 'workflow-holiday' },
      holidays: ['2026-10-22', '2026-10-29'],
    };
    const open = async kind => {
      await page.locator(`#${kind}SettingsCard`).click();
      await settingsReady(page);
    };
    const save = async () => {
      await dialog.locator('#settingsSaveButton').click();
      await expect(dialog).toBeHidden();
    };
    const setDailyWage = async amount => {
      await open('income');
      const daily = dialog.locator('[data-income-mode="fixed-daily"]');
      if (await daily.getAttribute('aria-pressed') !== 'true') await daily.click();
      await expect(daily).toHaveAttribute('aria-pressed', 'true');
      await dialog.locator('#incomeAmountInput').fill(amount);
      await save();
    };
    const saveHoursAndCalendar = async (hour, calendar, total) => {
      await dialog.locator('[data-time-key="morningEnd"] [data-unit="hour"]').press('Enter');
      const editor = dialog.locator('.time-wheel-direct input');
      await editor.fill(hour);
      await editor.press('Enter');
      await expect(dialog.locator('#scheduleCalibrationTotal')).toHaveText(total);
      await dialog.locator('#calendarImportInput').setInputFiles({
        name: 'synthetic-work-calendar.json', mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(calendar)),
      });
      await expect(dialog.locator('#calendarDataStatus')).toHaveText('已载入日历，保存后生效。');
      await save();
    };
    const expectDashboard = async (hourly, worked, progress) => {
      await expect(page.locator('#hourlyRateDisplay')).toHaveText(hourly);
      await expect(page.locator('#workedTime')).toHaveText(worked);
      await expect(page.locator('#progressPercent')).toHaveText(progress);
    };
    const readSaved = () => page.evaluate(() => ({
      settings: JSON.parse(localStorage.getItem('income-per-sed-settings'))?.payload?.settings,
      calendar: JSON.parse(localStorage.getItem('income-per-sed-calendar-data-v1'))?.calendarData,
    }));

    await setDailyWage('850');
    await expectDashboard('¥130.77', '2时30分0秒', '38.5%');
    await open('schedule');
    await saveHoursAndCalendar('13', workingCalendar, '8小时30分');
    await expectDashboard('¥100.00', '3时30分0秒', '41.2%');
    await open('schedule');
    const backup = await exportSettingsBackup(page);
    expect(backup.payload.settings).toMatchObject({ incomeMode: 'fixed-daily', dailyIncome: 850, schedule: adjacentSchedule });
    expect(backup.payload.calendar).toMatchObject(workingCalendar);

    await saveHoursAndCalendar('11', holidayCalendar, '6小时30分');
    await setDailyWage('520');
    await expectDashboard('¥80.00', '0时0分0秒', '0.0%');
    const changed = await readSaved();
    expect(changed.settings).toMatchObject({ dailyIncome: 520, schedule: weekdaySchedule });
    expect(changed.calendar).toMatchObject(holidayCalendar);

    await open('schedule');
    await uploadSettingsBackup(page, backup);
    await expect(dialog.locator('#settingsSafetyTitle')).toHaveText('核对导入变更');
    await dialog.locator('#settingsSafetyAccept').click();
    await expect(dialog.locator('#settingsSafetyConfirm')).toBeHidden();
    await page.waitForFunction(() => document.getElementById('settingsBackupFile').value === '');
    await settingsReady(page);
    await expect(dialog.locator('#scheduleCalibrationTotal')).toHaveText('8小时30分');
    await expect(dialog.locator('#calendarDataMeta')).toHaveAttribute('aria-label', /^Workflow working calendar/);
    await dialog.locator('[data-settings-close-kind="header"]').click();
    await expect(dialog).toBeHidden();
    await expectDashboard('¥100.00', '3时30分0秒', '41.2%');

    const expectedSettings = { ...backup.payload.settings };
    delete expectedSettings.incomeConfigured;
    const restored = await readSaved();
    expect(restored.settings).toMatchObject(expectedSettings);
    expect(restored.calendar).toEqual(backup.payload.calendar);
    await page.reload();
    await fullDisplay(page);
    await expectDashboard('¥100.00', '3时30分0秒', '41.2%');
    expect(await readSaved()).toEqual(restored);
    expect(errors).toEqual([]);
  });
}
