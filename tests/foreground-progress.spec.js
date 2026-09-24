const { test, expect } = require('@playwright/test');
const { writeFile } = require('node:fs/promises');

const channels = process.env.DEVELOP_PREVIEW === '1' ? ['Develop'] : ['Develop', 'Push'];
for (const channel of channels) {
for (const [label, startTime, hours, width, theme] of [
  ['across lunch', '02:30:00', 5, 1440, 'light'],
  ['mobile dark across lunch', '02:30:00', 5, 390, 'dark'],
  ['next morning reverse', '07:30:00', 19, 1440, 'dark'],
  ['resume during lunch', '02:30:00', 2, 390, 'light'],
]) {
  test(`${channel}: ${label} recovery keeps rails ordered and cursor at fill edge`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: theme });
    await page.clock.install({ time: new Date(`2026-09-07T${startTime}Z`) });
    await page.goto(`/Income-per-sed-${channel}.html`);
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(hours * 3600000);
    await page.evaluate(() => {
      window.progressFrames = [];
      const start = performance.now();
      function sample() {
        const track = document.querySelector('#progressTrack');
        const fills = [...track.querySelectorAll('.segment-fill')];
        const segments = fills.map(el => el.parentElement.getBoundingClientRect());
        const bounds = fills.map(el => el.getBoundingClientRect());
        const marker = track.querySelector('.timeline-handoff-marker').getBoundingClientRect();
        window.progressFrames.push({
          t: performance.now() - start,
          active: document.body.classList.contains('foreground-catchup-active'),
          ratios: fills.map(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
          cursor: marker.x + marker.width / 2,
          ends: bounds.map(r => r.right),
          gapStart: segments[0].right, gapEnd: segments[1].left,
        });
        if (performance.now() - start < 3500) requestAnimationFrame(sample);
      }
      delete document.hidden;
      delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
      requestAnimationFrame(sample);
    });
    await page.waitForTimeout(3700);
    const frames = await page.evaluate(() => window.progressFrames);
    await writeFile(testInfo.outputPath('progress-frames.json'), JSON.stringify(frames));
    await testInfo.attach('progress-frames.json', { body: JSON.stringify(frames), contentType: 'application/json' });
    await testInfo.attach('recovered.png', { body: await page.screenshot({ path: testInfo.outputPath('recovered.png') }), contentType: 'image/png' });
    const active = frames.filter(f => f.active);
    const simultaneous = active.filter(f => f.ratios[0] < .999 && f.ratios[1] > .001);
    const offsets = active.map(f => f.ratios[1] > .001 ? Math.abs(f.cursor - f.ends[1])
      : f.ratios[0] < .999 ? Math.abs(f.cursor - f.ends[0])
      : Math.max(0, f.gapStart - f.cursor, f.cursor - f.gapEnd));
    console.log(JSON.stringify({ channel, frames: active.length, simultaneous: simultaneous.length, maxOffset: Math.max(...offsets) }));
    expect(active.length).toBeGreaterThan(10);
    expect(simultaneous).toHaveLength(0);
    expect(Math.max(...offsets)).toBeLessThan(2.5);
    expect(frames.at(-1).active).toBe(false);
    const last = frames.at(-1);
    expect(Math.abs(last.cursor - last.ends[last.ratios[1] > .001 ? 1 : 0])).toBeLessThan(2.5);
    expect(errors).toEqual([]);
  });
}
}
