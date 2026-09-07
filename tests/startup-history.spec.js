const { test, expect } = require('@playwright/test');

async function openRunningClock(page, hour = 10) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date(`2026-09-07T${String(hour - 8).padStart(2, '0')}:30:00Z`) });
  await page.goto('/Income-per-sed-Develop.html');
}

async function collectStartup(page, hour = 10) {
  await page.addInitScript(() => {
    window.startupSamples = [];
    function sample(t) {
      const diagnostics = window.__incomeClockDiagnostics;
      const track = document.querySelector('#progressTrack');
      const marker = document.querySelector('.timeline-handoff-marker');
      if (diagnostics && track && marker) {
        const motion = diagnostics.getUnifiedMotionState();
        const tr = track.getBoundingClientRect();
        const mr = marker.getBoundingClientRect();
        window.startupSamples.push({
          t, startup: motion.startup, displayed: motion.displayed,
          error: Math.abs(mr.x + mr.width / 2 - tr.x - parseFloat(track.style.getPropertyValue('--timeline-cursor-x'))),
          integerTransforms: [...document.querySelectorAll('#flipContainer .flip-digit-list')].slice(0, 3).map(el => el.style.transform),
        });
      }
      if (t < 3000) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await openRunningClock(page, hour);
  await page.reload();
  await page.waitForTimeout(1600);
  return page.evaluate(() => window.startupSamples);
}

test('refresh places the progress cursor at the displayed endpoint during startup', async ({ page }) => {
  const frames = await collectStartup(page, 14);
  const startup = frames.filter(f => f.startup?.progress > 0.05 && f.startup.progress < 0.95);
  expect(startup.length).toBeGreaterThan(5);
  expect(Math.max(...startup.map(f => f.error))).toBeLessThan(2.5);
});

test('startup does not rebase integer tracks by a whole cycle at live handoff', async ({ page }) => {
  const frames = await collectStartup(page);
  const positions = frames.filter(f => f.startup?.progress > 0.15 || !f.startup);
  expect(positions.length).toBeGreaterThan(10);
  expect(positions[0].integerTransforms).toHaveLength(3);
  const y = transform => Number(transform.match(/,\s*(-?[\d.]+)em/)[1]);
  const jumps = positions.slice(1).flatMap((f, i) => f.integerTransforms.map((value, digit) => Math.abs(y(value) - y(positions[i].integerTransforms[digit]))));
  // The original silky reels move fractionally even without an integer carry.
  // Reject whole-cycle resets, not that intentional small continuous movement.
  expect(Math.max(...jumps)).toBeLessThan(0.05);
});

test('startup joins live income without a catch-up plateau or fractional dial stop', async ({ page }) => {
  const frames = await collectStartup(page);
  const index = frames.findIndex((f, i) => i > 0 && !f.startup && frames[i - 1].startup);
  expect(index).toBeGreaterThan(0);
  expect(Math.abs(frames[index].displayed.mainAngle / 6 - Math.round(frames[index].displayed.mainAngle / 6))).toBeLessThan(0.001);
  const after = frames.slice(index).filter(f => f.t - frames[index].t < 400);
  let longest = 0, flatAt = after[0].t;
  for (let i = 1; i < after.length; i++) {
    if (after[i].displayed.income > after[i - 1].displayed.income + 1e-7) flatAt = after[i].t;
    longest = Math.max(longest, after[i].t - flatAt);
  }
  expect(longest).toBeLessThan(100);
});

async function quickSeek(page, seconds) {
  // Quick presets are a mobile-only UI; use the visible control, not a forced click.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#historyQuickOpen').click();
  await page.locator(`[data-history-seconds="${seconds}"]`).click();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).toBe('HISTORY_HOLD');
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getHistoricalSeekState().active)).toBe(false);
}

test('history playback advances during simulated background suspension and stays historical on resume', async ({ page }) => {
  await openRunningClock(page, 14);
  await page.waitForTimeout(800);
  await quickSeek(page, -3600);
  await page.locator('#currentTime').click();
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).toBe('HISTORY_PLAY');
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getHistoricalSeekState().playHandoffActive)).toBe(false);
  const before = await page.evaluate(() => window.__incomeClockDiagnostics.getHistoricalSeekState().displayedTimeMs);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getSchedulerState().rafActive)).toBe(false);
  await page.clock.fastForward(120000);
  await page.evaluate(() => {
    delete document.hidden;
    delete document.visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).toBe('HISTORY_PLAY');
  const after = await page.evaluate(() => window.__incomeClockDiagnostics.getHistoricalSeekState().displayedTimeMs);
  expect(after - before).toBeGreaterThanOrEqual(119000);
  expect(after - before).toBeLessThan(123000);
  await page.locator('#liveAnchor').click();
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState()), { timeout: 10000 }).toBe('LIVE');
});

test('return from before lunch advances the two rails as one ordered path', async ({ page }) => {
  await openRunningClock(page, 14);
  await page.waitForTimeout(800);
  await quickSeek(page, -14400);
  await page.evaluate(() => {
    window.railSamples = [];
    function sample() {
      const track = document.querySelector('#progressTrack');
      window.railSamples.push({
        state: window.__incomeClockDiagnostics.getTimelineState(),
        x: parseFloat(track.style.getPropertyValue('--timeline-cursor-x')),
        fills: [...track.querySelectorAll('.segment-fill')].map(el => parseFloat(el.style.getPropertyValue('--progress-scale'))),
      });
      if (window.railSamples.length < 250) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.locator('#liveAnchor').click();
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState()), { timeout: 10000 }).toBe('LIVE');
  const frames = await page.evaluate(() => window.railSamples);
  const returning = frames.filter(f => f.state === 'RETURNING_LIVE');
  expect(returning.length).toBeGreaterThan(5);
  expect(returning.some(f => f.fills[0] < .99)).toBe(true);
  expect(returning.some(f => f.fills[1] > .01)).toBe(true);
  for (let i = 1; i < returning.length; i++) {
    expect(returning[i].x).toBeGreaterThanOrEqual(returning[i - 1].x - 1);
    if (returning[i].fills[1] > .001) expect(returning[i].fills[0]).toBeGreaterThan(.999);
  }
});

test('rapid wheel reversals remain continuous and a new seek takes ownership', async ({ page }) => {
  await openRunningClock(page, 14);
  await page.waitForTimeout(800);
  await quickSeek(page, -3600);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const time = page.locator('#currentTime');
  await time.hover();
  const frames = [];
  for (const delta of Array.from({ length: 24 }, (_, i) => i % 2 ? -120 : 120)) {
    await time.dispatchEvent('wheel', { deltaY: delta, deltaMode: 0, bubbles: true, cancelable: true });
    await page.waitForTimeout(16);
    frames.push(await page.evaluate(() => window.__incomeClockDiagnostics.getHistoricalSeekState()));
  }
  for (let i = 1; i < frames.length; i++) {
    for (const key of ['minuteAngle', 'hourAngle', 'minuteMotionVelocity', 'hourMotionVelocity', 'timeVelocity']) expect(Number.isFinite(frames[i][key])).toBe(true);
    const delta = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
    expect(delta(frames[i].minuteAngle, frames[i - 1].minuteAngle)).toBeLessThan(45);
    expect(delta(frames[i].hourAngle, frames[i - 1].hourAngle)).toBeLessThan(15);
  }
  await page.locator('#liveAnchor').click();
  await time.dispatchEvent('wheel', { deltaY: 120, deltaMode: 0, bubbles: true, cancelable: true });
  // Input state changes before the coalesced visual frame claims the roller.
  // Sample both together and require the completed handoff, not a lucky frame.
  await expect.poll(() => page.evaluate(() => {
    const d = window.__incomeClockDiagnostics;
    return ['SCRUBBING', 'HISTORY_HOLD'].includes(d.getTimelineState()) && d.getRollerOwner() === 'HISTORY';
  }), { timeout: 1500, intervals: [16, 32, 50] }).toBe(true);
});
