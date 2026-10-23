const { test, expect } = require('@playwright/test');
const { fullDisplay } = require('./helpers/display-state');
const START = new Date('2026-10-22T15:45:30+08:00');
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

async function open(page, version) {
  await page.setViewportSize({ width: 854, height: 892 });
  await page.clock.install({ time: START });
  await page.goto(`/Income-per-sed-${version}.html`);
  await fullDisplay(page);
  await page.locator('#historyQuickOpen').click();
  await page.waitForFunction(() => {
    const panel = document.querySelector('#historyQuickPanel');
    return !panel.inert && !panel.hasAttribute('data-entry-animating');
  });
}
const mode = page => page.locator('body').getAttribute('data-timeline-state').then(value => value.toUpperCase().replaceAll('-', '_'));
async function hold(page) {
  await expect.poll(() => mode(page)).toBe('HISTORY_HOLD');
  await expect.poll(() => page.locator('#currentTime').textContent()).toBe(await page.locator('#historyQuickClock').textContent());
}
async function seek(page, text = '10:00:00') {
  await page.locator('#historyDialTime').fill(text);
  await page.locator('#historyDialTime').press('Enter');
  await hold(page);
}
async function visibility(page, hidden) {
  await page.evaluate(hidden => {
    if (hidden) {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    } else {
      delete document.hidden;
      delete document.visibilityState;
    }
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test.beforeEach(async ({ page }) => {
  page.__errors = [];
  page.on('pageerror', error => page.__errors.push(error.message));
});
test.afterEach(async ({ page }) => { expect(page.__errors).toEqual([]); });

for (const version of ['Develop', 'Push']) {
  test.describe(version, () => {
    for (const action of ['blur', 'Enter', 'Tab', 'date-submit']) {
      test(`invalid time survives ${action} until corrected`, async ({ page }) => {
        await open(page, version);
        await page.locator('#historySeekWheels [data-date-part="day"]').press('ArrowUp');
        const input = page.locator('#historyDialTime');
        await input.fill('25:00');
        if (action === 'blur') await page.locator('.history-quick-title').click();
        else if (action === 'date-submit') await page.locator('#historySeekSubmit').click();
        else await input.press(action);
        await expect(input).toHaveValue('25:00');
        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await expect(page.locator('#historySeekError')).toBeVisible();
        expect(await mode(page)).toBe('LIVE');
        await page.clock.runFor(1200);
        await expect(input).toHaveValue('25:00');
        await page.locator('#historySeekSubmit').click();
        expect(await mode(page)).toBe('LIVE');
        await input.fill('10:00:15');
        await page.locator('#historySeekSubmit').click();
        await hold(page);
        await expect(page.locator('#historyDialDate')).toHaveText('2026-10-21');
        await expect(input).toHaveValue('10:00:15');
        await expect(input).not.toHaveAttribute('aria-invalid');
        await expect(page.locator('#historySeekError')).toBeHidden();
      });
    }
    test('invalid edit survives changing the date and blocks playback', async ({ page }) => {
      await open(page, version);
      await seek(page);
      const input = page.locator('#historyDialTime');
      await input.fill('25:00');
      await input.press('Tab');
      await page.locator('#historySeekWheels [data-date-part="day"]').press('ArrowUp');
      await expect(page.locator('#historySeekError')).toBeVisible();
      await page.locator('#historyQuickPlay').click();
      expect(await mode(page)).toBe('HISTORY_HOLD');
      await expect(input).toHaveValue('25:00');
      await input.press('Escape');
      await expect(input).toHaveValue('10:00:00');
      await expect(page.locator('#historySeekError')).toBeHidden();
      await expect(page.locator('#historyQuickPanel')).toBeVisible();
    });
    test('valid late time uses selected past date', async ({ page }) => {
      await open(page, version);
      await page.locator('#historySeekWheels [data-date-part="day"]').press('ArrowUp');
      await page.locator('#historyDialTime').fill('23:30:15');
      await page.locator('#historySeekSubmit').click();
      await hold(page);
      await expect(page.locator('#historyDialDate')).toHaveText('2026-10-21');
      await expect(page.locator('#historyDialTime')).toHaveValue('23:30:15');
      await expect(page.locator('#historySeekError')).toBeHidden();
    });
    test('future and malformed values stay editable and Escape discards', async ({ page }) => {
      await open(page, version);
      const input = page.locator('#historyDialTime');
      for (const text of ['23:59:59', '12:60', 'abc', '']) {
        await input.fill(text);
        await input.press('Enter');
        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await expect(input).toHaveValue(text);
        await input.press('Escape');
        await expect(input).not.toHaveAttribute('aria-invalid');
        await expect(page.locator('#historySeekError')).toBeHidden();
        expect(await mode(page)).toBe('LIVE');
      }
    });
    test('explicit return to live discards invalid draft', async ({ page }) => {
      await open(page, version);
      await seek(page);
      await page.locator('#historyDialTime').fill('25:00');
      await page.locator('[data-history-action="live"]').click();
      await expect.poll(() => mode(page)).toBe('LIVE');
      await expect(page.locator('#historyDialTime')).not.toHaveAttribute('aria-invalid');
      await expect(page.locator('#historySeekError')).toBeHidden();
    });
    for (const entry of ['quick-button', 'clock-click', 'clock-keyboard', 'global-keyboard']) {
      test(`play and return use bounded response via ${entry}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await open(page, version);
        await seek(page);
        if (entry === 'quick-button') await page.locator('#historyQuickPlay').click();
        else {
          await page.locator('#historyQuickClose').click();
          await expect(page.locator('#historyQuickPanel')).toBeHidden();
          if (entry === 'clock-click') await page.locator('#currentTime').click();
          if (entry === 'clock-keyboard') await page.locator('#currentTime').press('Enter');
          if (entry === 'global-keyboard') {
            await page.locator('#statusLabelMain').click();
            expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
            await page.keyboard.press('Space');
          }
        }
        await expect.poll(() => mode(page), { timeout: 700, intervals: [16, 32] }).toBe('HISTORY_PLAY');
        if (entry === 'quick-button') await page.locator('[data-history-action="live"]').click();
        if (entry === 'clock-click') await page.locator('#liveAnchor').click();
        if (entry === 'clock-keyboard') await page.locator('#currentTime').press('Home');
        if (entry === 'global-keyboard') await page.keyboard.press('Escape');
        await expect.poll(() => mode(page), { timeout: 700, intervals: [16, 32] }).toBe('LIVE');
      });
    }
    test('drag caches geometry and invalidates it after viewport movement', async ({ page }) => {
      await open(page, version);
      const track = page.locator('#historyDialTrack');
      const box = await track.boundingBox();
      const point = hour => ({ x: box.x + box.width / 2 + Math.sin(hour / 24 * Math.PI * 2) * box.width * .4, y: box.y + box.height / 2 - Math.cos(hour / 24 * Math.PI * 2) * box.height * .4 });
      await track.evaluate(node => {
        window.__geometryReads = 0;
        const original = node.getBoundingClientRect.bind(node);
        node.getBoundingClientRect = () => { window.__geometryReads++; return original(); };
      });
      const start = point(8);
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      for (let step = 1; step <= 30; step++) { const p = point(8 + step / 10); await page.mouse.move(p.x, p.y); }
      const reads = await page.evaluate(() => window.__geometryReads);
      expect(reads).toBeLessThanOrEqual(3);
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      const end = point(11.2);
      await page.mouse.move(end.x, end.y);
      const after = await page.evaluate(() => window.__geometryReads);
      expect(after).toBe(reads + 1);
      await page.mouse.up();
      await hold(page);
      await expect(track).not.toHaveAttribute('data-dragging');
      await test.info().attach('geometry', { body: JSON.stringify({ moves: 30, reads, afterResize: after }), contentType: 'application/json' });
    });
    for (const playing of [false, true]) {
      test(`simulated twelve-hour background preserves ${playing ? 'playback' : 'pause'}`, async ({ page }) => {
        await open(page, version);
        await page.locator('#historySeekWheels [data-date-part="day"]').press('ArrowUp');
        await page.locator('#historyDialTime').fill('10:00:00');
        await page.locator('#historySeekSubmit').click();
        await hold(page);
        if (playing) {
          await page.locator('#historyQuickPlay').click();
          await expect.poll(() => mode(page)).toBe('HISTORY_PLAY');
        }
        const before = await page.locator('#historyQuickClock').evaluate(node => new Date(node.dateTime).getTime());
        await visibility(page, true);
        if (version === 'Develop') expect(await page.evaluate(() => window.__incomeClockDiagnostics.getSchedulerState().rafActive)).toBe(false);
        await page.clock.fastForward(TWELVE_HOURS);
        await visibility(page, false);
        await expect.poll(() => mode(page)).toBe(playing ? 'HISTORY_PLAY' : 'HISTORY_HOLD');
        await page.locator('#historyQuickOpen').click();
        await expect(page.locator('#historyQuickPanel')).toBeVisible();
        const after = await page.locator('#historyQuickClock').evaluate(node => new Date(node.dateTime).getTime());
        expect(Math.abs(after - before - (playing ? TWELVE_HOURS : 0))).toBeLessThan(2500);
      });
    }
  });
}
