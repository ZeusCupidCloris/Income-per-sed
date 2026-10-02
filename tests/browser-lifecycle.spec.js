const { test, expect } = require('@playwright/test');

// Playwright normally disables BFCache. Restore the browser's real cache behavior.
test.use({ launchOptions: { ignoreDefaultArgs: ['--disable-back-forward-cache'] }, reducedMotion: 'no-preference' });
const channels = process.env.DEVELOP_PREVIEW === '1' ? ['Develop'] : ['Develop', 'Push'];

async function prepare(page, channel, sleepGap = 0) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(({ sleepGap }) => {
    const NativeDate = Date;
    const epoch = NativeDate.now();
    const initial = NativeDate.parse('2026-09-07T02:30:00Z');
    let gap = 0;
    window.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [initial + NativeDate.now() - epoch + gap])); }
      static now() { return initial + NativeDate.now() - epoch + gap; }
    };
    window.__lifecycleProbe = { id: Math.random(), ticks: 0, events: [], resumeTicks: [], frozenTicks: [] };
    setInterval(() => window.__lifecycleProbe.ticks++, 25);
    document.addEventListener('freeze', () => {
      window.__lifecycleProbe.frozenTicks.push(window.__lifecycleProbe.ticks);
      window.__lifecycleProbe.events.push('freeze');
    });
    document.addEventListener('resume', () => {
      gap += sleepGap;
      window.__lifecycleProbe.resumeTicks.push(window.__lifecycleProbe.ticks);
      window.__lifecycleProbe.events.push('resume');
    });
    window.addEventListener('pageshow', (event) => window.__lifecycleProbe.events.push(`pageshow:${event.persisted}`));
  }, { sleepGap });
  await page.goto(`/Income-per-sed-${channel}.html`);
  await page.waitForTimeout(2200);
  return errors;
}

async function checkRecovery(page, testInfo, expectCatchup = false) {
  const frames = await page.evaluate(async () => {
    const frames = [];
    const start = performance.now();
    await new Promise((resolve) => {
      function sample() {
        const track = document.querySelector('#progressTrack');
        const fills = [...track.querySelectorAll('.segment-fill')];
        const segments = fills.map((el) => el.parentElement.getBoundingClientRect());
        const bounds = fills.map((el) => el.getBoundingClientRect());
        const marker = track.querySelector('.timeline-handoff-marker').getBoundingClientRect();
        frames.push({
          ratios: fills.map((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
          ends: bounds.map((rect) => rect.right), cursor: marker.x + marker.width / 2,
          gapStart: segments[0].right, gapEnd: segments[1].left,
          midnight: document.body.classList.contains('midnight-reset-active'),
          catchup: document.body.classList.contains('foreground-catchup-active'),
        });
        if (performance.now() - start < 4500) requestAnimationFrame(sample);
        else resolve();
      }
      requestAnimationFrame(sample);
    });
    return frames;
  });
  await testInfo.attach('lifecycle-recovery.json', { body: JSON.stringify(frames), contentType: 'application/json' });
  expect(frames.length).toBeGreaterThan(30);
  expect(frames.some((frame) => frame.midnight)).toBe(false);
  expect(frames.filter((frame) => frame.ratios[0] < .999 && frame.ratios[1] > .001)).toHaveLength(0);
  const offsets = frames.map((frame) => frame.ratios[1] > .001 ? Math.abs(frame.cursor - frame.ends[1])
    : frame.ratios[0] < .999 ? Math.abs(frame.cursor - frame.ends[0])
      : Math.max(0, frame.gapStart - frame.cursor, frame.cursor - frame.gapEnd));
  expect(Math.max(...offsets)).toBeLessThan(2.5);
  expect(frames.at(-1).catchup).toBe(false);
  if (expectCatchup) expect(frames.filter((frame) => frame.catchup).length).toBeGreaterThan(10);
  await expect(page.locator('#currentTime')).toHaveText(/15:30:|10:30:/);
}

for (const channel of channels) {
  test(`${channel}: actual BFCache freeze stops timers and repeated recovery stays aligned`, async ({ page }, testInfo) => {
    const errors = await prepare(page, channel);
    const identity = await page.evaluate(() => window.__lifecycleProbe.id);
    for (let round = 0; round < 3; round++) {
      await page.goto('/SHA256SUMS.txt');
      await new Promise((resolve) => setTimeout(resolve, 700));
      await page.goBack({ waitUntil: 'commit' });
      await expect.poll(() => page.evaluate(() => window.__lifecycleProbe.resumeTicks.length)).toBe(round + 1);
      const probe = await page.evaluate(() => window.__lifecycleProbe);
      expect(probe.id).toBe(identity);
      expect(probe.resumeTicks.at(-1)).toBe(probe.frozenTicks.at(-1));
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => window.__lifecycleProbe.ticks)).toBeGreaterThan(probe.frozenTicks.at(-1));
    }
    expect(await page.evaluate(() => window.__lifecycleProbe.events.filter((event) => event === 'freeze').length)).toBe(3);
    await checkRecovery(page, testInfo);
    expect(errors).toEqual([]);
  });

  test(`${channel}: real cache freeze with simulated five-hour sleep clock gap recovers across lunch`, async ({ page }, testInfo) => {
    const errors = await prepare(page, channel, 5 * 3600_000);
    await page.goto('/SHA256SUMS.txt');
    await new Promise((resolve) => setTimeout(resolve, 700));
    await page.goBack({ waitUntil: 'commit' });
    await expect.poll(() => page.evaluate(() => window.__lifecycleProbe.events.includes('pageshow:true'))).toBe(true);
    await checkRecovery(page, testInfo, true);
    await expect(page.locator('#progressTrack')).toHaveAttribute('aria-valuenow', /69\./);
    expect(errors).toEqual([]);
  });

  test(`${channel}: genuine BFCache return preserves document and resumes timers`, async ({ page }, testInfo) => {
    const errors = await prepare(page, channel);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Page.enable');
    cdp.on('Page.backForwardCacheNotUsed', (event) => console.log('BFCache not used:', JSON.stringify(event)));
    const before = await page.evaluate(() => ({ ...window.__lifecycleProbe }));
    // A second app instance broadcasts messages and legitimately evicts cached pages.
    await page.goto('/SHA256SUMS.txt');
    await page.goBack({ waitUntil: 'commit' });
    await expect.poll(() => page.evaluate(() => window.__lifecycleProbe?.events.includes('pageshow:true'))).toBe(true);
    expect(await page.evaluate(() => window.__lifecycleProbe.id)).toBe(before.id);
    await expect.poll(() => page.evaluate(() => window.__lifecycleProbe.ticks)).toBeGreaterThan(before.ticks);
    if (channel === 'Develop') {
      const lifecycle = await page.evaluate(() => window.__incomeClockDiagnostics.getLifecycleState());
      expect(lifecycle.destroyed).toBe(false);
      expect(lifecycle.phase).toBe('active');
      expect(lifecycle.resumeCount).toBeGreaterThan(0);
    }
    await checkRecovery(page, testInfo);
    expect(errors).toEqual([]);
  });
}
