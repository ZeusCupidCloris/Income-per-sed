const { test, expect } = require('@playwright/test');

test('work, remaining and month readouts share live and recovery frames', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-09-07T02:30:00Z') });
  await page.goto('/Income-per-sed-Develop.html');
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
