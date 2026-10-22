const { fullDisplay } = require('./helpers/display-state');
const { test, expect } = require('@playwright/test');

async function prepareFixedReadouts(page, date) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date(date) });
  await page.clock.pauseAt(new Date(Date.parse(date) + 1000));
  await page.goto('/Income-per-sed-Develop.html');
  await page.clock.runFor(2200);
  await fullDisplay(page, { paused: true });
  await page.clock.setFixedTime(new Date(date));
  await page.clock.runFor(1800);
}

test('whole-second readouts invalidate for status and saved schedule changes', async ({ page }) => {
  await prepareFixedReadouts(page, '2026-10-20T08:59:59+08:00');
  await expect(page.locator('#workedTime')).toHaveText('0时0分0秒');
  await expect(page.locator('#workedSub')).toHaveText('全天待完成 6时30分0秒');
  await page.clock.setFixedTime(new Date('2026-10-20T09:00:00+08:00'));
  await page.clock.runFor(1200);
  await expect(page.locator('#workedTime')).toHaveText('0时0分0秒');
  await expect(page.locator('#workedSub')).toHaveText('剩余 6时30分0秒');
  await page.clock.setFixedTime(new Date('2026-10-20T10:30:00+08:00'));
  await page.clock.runFor(2200);
  await expect(page.locator('#workedTime')).toHaveText('1时30分0秒');
  await expect(page.locator('#workedSub')).toHaveText('剩余 5时0分0秒');
  await page.locator('#scheduleSettingsCard').dispatchEvent('click');
  await page.clock.runFor(600);
  await expect(page.locator('#scheduleSettingsPanel')).not.toHaveAttribute('data-settings-unready');
  const hour = page.locator('[data-time-key="morningEnd"] [data-unit="hour"]');
  await expect(hour).toHaveAttribute('aria-valuenow', '11');
  await hour.press('ArrowDown');
  await page.clock.runFor(300);
  await expect(hour).toHaveAttribute('aria-valuenow', '12');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  await page.clock.runFor(2200);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('#workedTime')).toHaveText('1时30分0秒');
  await expect(page.locator('#workedSub')).toHaveText('剩余 6时0分0秒');
});

test('return to the same live second refreshes readouts and reopens fresh history controls', async ({ page }) => {
  await prepareFixedReadouts(page, '2026-10-20T10:30:00+08:00');
  const initial = await page.locator('#monthIncome').textContent();
  await page.locator('#historyQuickOpen').dispatchEvent('click');
  await page.clock.runFor(600);
  await page.locator('[data-history-seconds="-3600"]').dispatchEvent('click');
  await page.clock.runFor(2200);
  await expect(page.locator('#workedTime')).toHaveText('0时30分0秒');
  await expect(page.locator('#historyQuickClock')).toHaveText('09:30:00');
  await expect(page.locator('#historyQuickPlay')).toBeEnabled();
  await page.locator('#historyQuickClose').dispatchEvent('click');
  await page.clock.runFor(600);
  await expect(page.locator('#historyQuickOpen')).toHaveAttribute('aria-label', '打开快速回溯，当前 2026-10-20 09:30:00');
  await page.locator('#liveAnchor').dispatchEvent('click');
  await page.clock.runFor(5000);
  expect(await page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).toBe('LIVE');
  await expect(page.locator('#workedTime')).toHaveText('1时30分0秒');
  await expect(page.locator('#workedSub')).toHaveText('剩余 5时0分0秒');
  await expect(page.locator('#monthIncome')).toHaveText(initial);
  await expect(page.locator('#historyQuickOpen')).toHaveAttribute('aria-label', '打开快速回溯');
  await page.clock.setFixedTime(new Date('2026-10-20T10:31:00+08:00'));
  await page.clock.runFor(1500);
  await page.locator('#historyQuickOpen').dispatchEvent('click');
  await expect(page.locator('#historyQuickClock')).toHaveText('10:31:00');
  await expect(page.locator('#historyQuickPlay')).toBeDisabled();
  await expect(page.locator('[data-history-seconds="900"]')).toBeDisabled();
  await page.clock.runFor(600);
  await page.locator('#historyQuickClose').dispatchEvent('click');
  await page.clock.runFor(600);
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
});

test('work, remaining and month readouts share live and recovery frames', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-09-07T02:30:00Z') });
  await page.goto('/Income-per-sed-Develop.html');
  await fullDisplay(page);
  await page.waitForTimeout(1800);
  const sample = () => {
    const duration = id => {
      const parts = document.querySelector(id).textContent.match(/(\d+)时(\d+)分(\d+)秒/);
      return parts ? Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3]) : NaN;
    };
    return { worked: duration('#workedTime'), remaining: duration('#workedSub'),
      mainTarget: window.__incomeClockDiagnostics.getUnifiedMotionState().displayed.mainAngle,
      month: Number(document.querySelector('#monthIncome').textContent.replace(/[^\d.]/g, '')),
      income: window.__incomeClockDiagnostics.getUnifiedMotionState().displayed.income,
      hourly: Number(document.querySelector('#hourlyRateDisplay').textContent.replace(/[^\d.]/g, '')),
      active: document.body.classList.contains('foreground-catchup-active') };
  };
  const initial = await page.evaluate(sample);
  expect(initial.worked + initial.remaining).toBe(23400);
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(40);
    const live = await page.evaluate(sample);
    expect(live.worked + live.remaining).toBe(23400);
    expect(live.worked).toBe(Math.round(live.mainTarget / 6));
  }
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(5 * 3600000);
  await page.evaluate(() => {
    delete document.hidden; delete document.visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const samples = [];
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(40);
    samples.push(await page.evaluate(sample));
  }
  await testInfo.attach('readouts.json', { body: JSON.stringify(samples), contentType: 'application/json' });
  const active = samples.filter(s => s.active);
  expect(active.length).toBeGreaterThan(5);
  const dailyBase = initial.month - initial.worked * initial.hourly / 3600;
  for (const s of active) {
    expect(s.worked + s.remaining).toBe(23400);
    expect(Math.abs(s.worked - s.income / (s.hourly / 3600))).toBeLessThan(3);
    expect(Math.abs(s.month - dailyBase - s.income)).toBeLessThan(.1);
  }
});
