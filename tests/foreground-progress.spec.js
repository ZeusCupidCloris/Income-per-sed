const { fullDisplay } = require('./helpers/display-state');
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
    await fullDisplay(page);
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
          second: ((Date.now() / 1000 + 8 * 3600) % 86400 + 86400) % 86400,
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
    const lunch = last.ratios[0] > .999 && last.ratios[1] < .001 && last.second >= 11.5 * 3600 && last.second <= 13.5 * 3600;
    const endpoint = lunch
      ? last.gapStart + (last.gapEnd - last.gapStart) * (last.second - 11.5 * 3600) / 7200
      : last.ends[last.ratios[1] > .001 ? 1 : 0];
    expect(Math.abs(last.cursor - endpoint)).toBeLessThan(2.5);
    expect(errors).toEqual([]);
  });
}
}

const returnCases = [
  ['morning through lunch', '10:30:00'],
  ['lunch start', '11:30:00'],
  ['lunch middle', '12:00:00'],
  ['lunch end', '13:30:00'],
  ['afternoon', '14:30:00'],
  ['hidden lunch resize', '12:00:00', 'hidden'],
  ['return viewport resize', '12:00:00', 'returning'],
];

for (const channel of channels) {
  for (const width of [1440, 390]) {
    for (const [label, selectedTime, resize] of returnCases) {
      test(`${channel} ${width} ${label}: history return keeps the cursor on one progress route`, async ({page}, testInfo) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({width, height: 1000});
        await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: width === 390 ? 'dark' : 'light'});
        if (resize === 'hidden') await page.addInitScript(() => { delete window.ResizeObserver; });
        await page.clock.install({time: new Date('2026-10-20T06:44:00Z')});
        await page.clock.pauseAt(new Date('2026-10-20T07:44:00Z'));
        await page.goto(`/Income-per-sed-${channel}.html`);
        await fullDisplay(page, {paused: true});
        await page.clock.runFor(2400);
        await page.locator('#historyQuickOpen').dispatchEvent('click');
        await page.clock.runFor(700);
        await page.waitForFunction(() => !document.getElementById('historyQuickPanel').dataset.entryAnimating);
        await page.locator('#historyDialTime').fill(selectedTime);
        await page.locator('#historyDialTime').press('Enter');
        await page.clock.runFor(2000);
        await expect(page.locator('body')).toHaveAttribute('data-timeline-state', 'history-hold');
        await page.locator('#historyQuickClose').dispatchEvent('click');
        await page.clock.runFor(700);
        if (resize === 'hidden') {
          const resized = await page.evaluate(() => {
            Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
            Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'});
            document.dispatchEvent(new Event('visibilitychange'));
            const track = document.getElementById('progressTrack'), before = track.offsetWidth;
            track.style.width = '80%';
            const after = track.offsetWidth;
            delete document.hidden;
            delete document.visibilityState;
            document.dispatchEvent(new Event('visibilitychange'));
            return {before, after, hasObserver: 'ResizeObserver' in window};
          });
          expect(resized.hasObserver).toBe(false);
          expect(resized.before - resized.after).toBeGreaterThan(10);
        }
        const heldRoute = await page.evaluate(() => {
          const track = document.getElementById('progressTrack').getBoundingClientRect();
          const cursor = document.querySelector('.timeline-handoff-marker').getBoundingClientRect();
          return (cursor.left + cursor.width / 2 - track.left) / track.width;
        });
        await page.evaluate(() => {
          window.historyReturnFrames = [];
          const start = performance.now();
          function sample() {
            const track = document.getElementById('progressTrack'), rect = track.getBoundingClientRect();
            const fills = [...track.querySelectorAll('.segment-fill')];
            const segments = fills.map(fill => fill.parentElement.getBoundingClientRect());
            const marker = track.querySelector('.timeline-handoff-marker').getBoundingClientRect();
            window.historyReturnFrames.push({
              t: performance.now() - start, state: document.body.dataset.timelineState,
              active: document.body.classList.contains('foreground-catchup-active'),
              ratios: fills.map(fill => new DOMMatrixReadOnly(getComputedStyle(fill).transform).a),
              ends: fills.map(fill => fill.getBoundingClientRect().right),
              cursor: marker.left + marker.width / 2,
              route: (marker.left + marker.width / 2 - rect.left) / rect.width,
              gapStart: segments[0].right, gapEnd: segments[1].left,
              overflow: document.documentElement.scrollWidth - innerWidth,
            });
            if (performance.now() - start < 1800) requestAnimationFrame(sample);
          }
          document.getElementById('liveAnchor').dispatchEvent(new MouseEvent('click', {bubbles: true}));
          requestAnimationFrame(sample);
        });
        await page.clock.runFor(64);
        if (resize === 'returning') await page.setViewportSize({width: width === 1440 ? 1100 : 430, height: 1000});
        await page.clock.runFor(1900);
        const frames = await page.evaluate(() => window.historyReturnFrames);
        await testInfo.attach('history-return-route.json', {body: JSON.stringify({heldRoute, frames}), contentType: 'application/json'});
        const active = frames.filter(frame => frame.state === 'returning-live');
        expect(active.length).toBeGreaterThan(10);
        for (const frame of frames) {
          expect(frame.ratios[0] < .999 && frame.ratios[1] > .001).toBe(false);
          const offset = frame.ratios[1] > .001 ? Math.abs(frame.cursor - frame.ends[1])
            : frame.ratios[0] < .999 ? Math.abs(frame.cursor - frame.ends[0])
            : Math.max(0, frame.gapStart - frame.cursor, frame.cursor - frame.gapEnd);
          expect(offset).toBeLessThan(2.5);
          expect(frame.overflow).toBeLessThanOrEqual(1);
        }
        if (!resize) {
          expect(active[0].route).toBeGreaterThanOrEqual(heldRoute - .005);
          for (let index = 1; index < active.length; index++) expect(active[index].route).toBeGreaterThanOrEqual(active[index - 1].route - .005);
        }
        const last = frames.at(-1);
        expect(last.state).toBe('live');
        expect(last.active).toBe(false);
        const daySecond = await page.evaluate(() => ((Date.now() / 1000 + 8 * 3600) % 86400 + 86400) % 86400);
        expect(last.ratios[0]).toBeCloseTo(1, 3);
        expect(Math.abs(last.ratios[1] - (daySecond - 13.5 * 3600) / (4 * 3600))).toBeLessThan(.001);
        expect(errors).toEqual([]);
      });
    }
  }
}
