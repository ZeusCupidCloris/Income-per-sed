const { test, expect } = require('@playwright/test');

for (const scenario of ['foreground', 'playback', 'return']) {
  test(`wheel takes ownership during ${scenario}`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install({ time: new Date('2026-09-07T06:30:00Z') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/Income-per-sed-Develop.html');
    await page.waitForTimeout(1800);
    if (scenario === 'foreground') {
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.clock.fastForward(60000);
      await page.evaluate(() => {
        delete document.hidden; delete document.visibilityState;
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect(page.locator('body')).toHaveClass(/foreground-catchup-active/);
    } else {
      await page.locator('#historyQuickOpen').click();
      await page.locator('[data-history-seconds="-3600"]').click();
      await page.keyboard.press('Escape');
      await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).toBe('HISTORY_HOLD');
      await page.locator(scenario === 'playback' ? '#currentTime' : '#liveAnchor').click();
      await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState()))
        .toBe(scenario === 'playback' ? 'HISTORY_PLAY' : 'RETURNING_LIVE');
    }
    const samples = await page.evaluate(() => {
      const d = window.__incomeClockDiagnostics;
      const before = d.getUnifiedMotionState().displayed;
      document.querySelector('#currentTime').dispatchEvent(new WheelEvent('wheel', {
        deltaY: 120, bubbles: true, cancelable: true
      }));
      return { before, after: d.getUnifiedMotionState().displayed, state: d.getTimelineState() };
    });
    expect(samples.state).not.toBe('LIVE');
    expect(samples.state).not.toBe('RETURNING_LIVE');
    for (const key of ['mainAngle', 'minuteAngle', 'hourAngle', 'income']) {
      expect(Number.isFinite(samples.after[key])).toBe(true);
      expect(samples.after[key], key).toBeCloseTo(samples.before[key], 5);
    }
    await testInfo.attach('handoff.json', { body: JSON.stringify(samples), contentType: 'application/json' });
    await page.waitForTimeout(600);
    await page.locator('#liveAnchor').click();
    await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState()), { timeout: 10000 }).toBe('LIVE');
    expect(errors).toEqual([]);
  });
}
