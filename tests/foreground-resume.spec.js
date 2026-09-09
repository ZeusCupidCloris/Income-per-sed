const { test, expect } = require('@playwright/test');

for (const [label, gap] of [['same-day', 4500000], ['next-day', 86400000], ['next-afternoon', 100800000]]) {
  test(`${label} foreground recovery is continuous without replaying midnight`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install({ time: new Date('2026-09-07T02:30:00Z') });
    await page.goto('/Income-per-sed-Develop.html');
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(gap);
    await page.evaluate(() => {
      window.resumeFrames = [];
      const start = performance.now();
      function sample() {
        window.resumeFrames.push({ t: performance.now() - start,
          ...window.__incomeClockDiagnostics.getUnifiedMotionState().displayed,
          midnight: document.body.classList.contains('midnight-reset-active'),
          catchup: document.body.classList.contains('foreground-catchup-active') });
        if (performance.now() - start < 5000) requestAnimationFrame(sample);
      }
      sample();
      delete document.hidden;
      delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(5200);
    const frames = await page.evaluate(() => window.resumeFrames);
    await testInfo.attach('resume-frames.json', { body: JSON.stringify(frames), contentType: 'application/json' });
    await testInfo.attach('resumed.png', { body: await page.screenshot(), contentType: 'image/png' });
    expect(frames.some(f => f.midnight)).toBe(false);
    expect(frames.some(f => f.catchup)).toBe(true);
    const delta = (a, b) => ((a - b + 540) % 360) - 180;
    const active = frames.filter(f => f.catchup);
    for (let i = 1; i < active.length; i++) {
      expect(delta(active[i].minuteAngle, active[i - 1].minuteAngle)).toBeGreaterThanOrEqual(-0.01);
    }
    expect(frames.at(-1).catchup).toBe(false);
    expect(errors).toEqual([]);
    const speeds = active.slice(1).map((f, i) => Math.abs(delta(f.minuteAngle, active[i].minuteAngle)) / Math.max(1, f.t - active[i].t));
    // Decelerate to the minute hand's LIVE speed (0.1 deg/s), not to zero.
    const excess = speeds.map(speed => Math.abs(speed - 0.0001));
    expect(excess.at(-1)).toBeLessThan(Math.max(...excess) * 0.25);
  });
}
