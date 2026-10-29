const { fullDisplay } = require('./helpers/display-state');
const { test, expect } = require('@playwright/test');

function committedRecoveryFrames(frames) {
  const committed = [];
  for (const frame of frames) {
    expect(Number.isFinite(frame.renderedAt)).toBe(true);
    if (frame.renderedAt < 0) continue;
    const previous = committed.at(-1);
    if (previous && frame.renderedAt === previous.renderedAt) {
      expect(frame.minuteAngle).toBe(previous.minuteAngle);
      continue;
    }
    if (previous) expect(frame.renderedAt).toBeGreaterThan(previous.renderedAt);
    committed.push(frame);
  }
  expect(committed.length).toBeGreaterThan(2);
  return committed;
}

test('recovery speed sampling pairs each angle with its committed frame time', () => {
  const frames = [
    { t: 10, renderedAt: 0, minuteAngle: 180 },
    { t: 26, renderedAt: 16, minuteAngle: 180.0032 },
    { t: 43, renderedAt: 33, minuteAngle: 180.00524 },
    { t: 56, renderedAt: 50, minuteAngle: 180.00694 },
  ];
  const excessFor = (rows, key) => rows.slice(1).map((frame, index) =>
    Math.abs(Math.abs(frame.minuteAngle - rows[index].minuteAngle) / Math.max(1, frame[key] - rows[index][key]) - 0.0001));
  const observerExcess = excessFor(frames, 't');
  expect(observerExcess.at(-1)).toBeGreaterThanOrEqual(Math.max(...observerExcess) * 0.25);
  const committed = committedRecoveryFrames(frames);
  const renderedExcess = excessFor(committed, 'renderedAt');
  expect(renderedExcess.at(-1)).toBeLessThan(Math.max(...renderedExcess) * 0.25);
  expect(committedRecoveryFrames([
    { t: 0, renderedAt: -16, minuteAngle: 179.9 },
    ...frames.slice(0, 3),
    { ...frames[2], t: 44 },
    frames[3],
  ])).toEqual(committed);
});

for (const [label, gap, resumeAt] of [['same-day', 4500000], ['next-day', 86400000], ['next-afternoon', 100800000], ['morning-start', 86400000, '2026-09-08T00:59:59.500Z'], ['afternoon-start', 86400000, '2026-09-08T05:29:59.500Z'], ['afternoon-fractional', 86400000, '2026-09-08T05:29:59.517Z']]) {
  test(`${label} foreground recovery is continuous without replaying midnight`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install({ time: new Date('2026-09-07T02:30:00Z') });
    const deterministic = label === 'afternoon-fractional';
    if (deterministic) await page.clock.pauseAt(new Date('2026-09-07T02:30:01Z'));
    await page.goto('/Income-per-sed-Develop.html');
    await fullDisplay(page);
    if (deterministic) await page.clock.runFor(1500);
    else await page.waitForTimeout(1500);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(gap);
    if (resumeAt) await page.clock.setSystemTime(new Date(resumeAt));
    await page.evaluate(() => {
      window.resumeFrames = [];
      const start = performance.now();
      // The observer can run before the next render, so retain the committed frame's clock too.
      function sample(frameTime = performance.now()) {
        const diagnostics = window.__incomeClockDiagnostics;
        window.resumeFrames.push({ t: frameTime - start, sampledAt: performance.now() - start, now: Date.now(),
          renderedAt: diagnostics.getSchedulerState().lastSuccessfulRenderAt - start,
          ...diagnostics.getUnifiedMotionState().displayed,
          midnight: document.body.classList.contains('midnight-reset-active'),
          catchup: document.body.classList.contains('foreground-catchup-active') });
        if (frameTime - start < 5000) requestAnimationFrame(sample);
      }
      sample();
      delete document.hidden;
      delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    if (deterministic) await page.clock.runFor(5200);
    else await page.waitForTimeout(5200);
    const frames = await page.evaluate(() => window.resumeFrames);
    await testInfo.attach('resume-frames.json', { body: JSON.stringify(frames), contentType: 'application/json' });
    await testInfo.attach('resumed.png', { body: await page.screenshot(), contentType: 'image/png' });
    expect(frames.some(f => f.midnight)).toBe(false);
    expect(frames.some(f => f.catchup)).toBe(true);
    const delta = (a, b) => (((a - b + 180) % 360 + 360) % 360) - 180;
    const active = frames.filter(f => f.catchup);
    if (resumeAt) {
      const end = frames.findIndex((f, i) => i > 0 && !f.catchup && frames[i - 1].catchup);
      expect(end).toBeGreaterThan(0);
      expect(delta(frames[end].mainAngle, frames[end - 1].mainAngle),
        JSON.stringify({ before: frames[end - 1], after: frames[end] })).toBeGreaterThanOrEqual(-0.1);
    }
    for (let i = 1; i < active.length; i++) {
      expect(delta(active[i].minuteAngle, active[i - 1].minuteAngle)).toBeGreaterThanOrEqual(-0.01);
    }
    expect(frames.at(-1).catchup).toBe(false);
    expect(errors).toEqual([]);
    const committed = committedRecoveryFrames(active);
    const speeds = committed.slice(1).map((f, i) => Math.abs(delta(f.minuteAngle, committed[i].minuteAngle)) / Math.max(1, f.renderedAt - committed[i].renderedAt));
    // Decelerate to the minute hand's LIVE speed (0.1 deg/s), not to zero.
    const excess = speeds.map(speed => Math.abs(speed - 0.0001));
    expect(excess.at(-1)).toBeLessThan(Math.max(...excess) * 0.25);
  });
}

for (const channel of ['Develop', 'Push']) {
  test(`${channel}: quantized wall time at resume completion never rewinds the main hand`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install({ time: new Date('2026-09-07T02:30:00Z') });
    await page.clock.pauseAt(new Date('2026-09-07T02:30:01Z'));
    await page.goto(`/Income-per-sed-${channel}.html`);
    await fullDisplay(page, { paused: true });
    await page.clock.runFor(2400);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(86400000);
    await page.clock.setSystemTime(new Date('2026-09-08T05:29:59.500Z'));
    await page.evaluate(() => {
      window.quantizedResumeFrames = [];
      const hand = document.getElementById('dialHand');
      const start = performance.now();
      function sample() {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(hand).transform);
        window.quantizedResumeFrames.push({ t: performance.now() - start, now: Date.now(), angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, active: document.body.classList.contains('foreground-catchup-active') });
        if (performance.now() - start < 2200) requestAnimationFrame(sample);
      }
      sample();
      delete document.hidden;
      delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(1480);
    // Reproduce the captured wall-clock millisecond while rAF crosses its deadline.
    await page.clock.setFixedTime(new Date('2026-09-08T05:30:00.999Z'));
    await page.clock.runFor(96);
    const frames = await page.evaluate(() => window.quantizedResumeFrames);
    await testInfo.attach('quantized-resume-frames.json', { body: JSON.stringify(frames), contentType: 'application/json' });
    const end = frames.findIndex((frame, index) => index > 0 && !frame.active && frames[index - 1].active);
    expect(end).toBeGreaterThan(0);
    const delta = (frames[end].angle - frames[end - 1].angle + 540) % 360 - 180;
    expect(delta, JSON.stringify({ before: frames[end - 1], after: frames[end] })).toBeGreaterThanOrEqual(-0.1);
    await page.clock.setSystemTime(new Date('2026-09-08T05:30:01.064Z'));
    await page.clock.runFor(500);
    const settled = await page.locator('#dialHand').evaluate(hand => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(hand).transform);
      return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    });
    expect(Math.abs(settled - 6)).toBeLessThan(0.1);
    expect(await page.locator('body').evaluate(body => body.classList.contains('foreground-catchup-active'))).toBe(false);
    expect(errors).toEqual([]);
  });
}
