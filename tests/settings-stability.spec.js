const { test, expect } = require('@playwright/test');
const { openSettings } = require('./helpers/settings-page');

async function open(page, kind) {
  await openSettings(page, { kind, channel: 'develop' });
}

test('calendar disclosure preserves its entry and editor scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await open(page, 'schedule');
  await page.locator('#calendarDataToggle').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const read = () => page.evaluate(() => ({ scroll: document.querySelector('.settings-sheet').scrollTop, top: document.querySelector('#calendarDataToggle').getBoundingClientRect().top }));
  const before = await read();
  for (let i = 0; i < 4; i++) {
    await page.locator('#calendarDataToggle').dispatchEvent('click');
    await page.waitForTimeout(350);
    const after = await read();
    expect(Math.abs(after.scroll - before.scroll)).toBeLessThan(1);
    expect(Math.abs(after.top - before.top)).toBeLessThan(1);
  }
});

test('visible invalid income stays anchored while errors appear and clear', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await open(page, 'income');
  const input = page.locator('#incomeAmountInput');
  await input.fill('0');
  const before = await input.boundingBox();
  const scroll = await page.locator('.settings-sheet').evaluate(element => element.scrollTop);
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  const after = await input.boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  expect(Math.abs(await page.locator('.settings-sheet').evaluate(element => element.scrollTop) - scroll)).toBeLessThan(1);
  await input.fill('7296.70');
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  expect(Math.abs((await input.boundingBox()).y - before.y)).toBeLessThan(1);
});

for (const width of [320, 390, 1440]) {
  test(`schedule summary has stable readout boxes and accurate wheel-linked values: ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page, 'schedule');
    const read = () => page.evaluate(() => {
      const box = id => {
        const element = document.getElementById(id);
        return { text: element.textContent, rect: element.getBoundingClientRect().toJSON() };
      };
      return { total: box('scheduleCalibrationTotal'), morning: box('scheduleMorningDuration'), afternoon: box('scheduleAfternoonDuration') };
    });
    const before = await read();
    expect(await page.locator('#scheduleCalibrationSummary').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`schedule-${width}.png`) });
    await page.locator('[data-time-key="morningEnd"] .time-wheel-column[data-unit="minute"]').dispatchEvent('keydown', { key: 'Home' });
    const after = await read();
    await testInfo.attach('summary-geometry.json', { body: JSON.stringify({ before, after }, null, 2), contentType: 'application/json' });
    expect(after.morning.text).toBe('2小时');
    expect(after.total.text).toBe('6小时');
    expect(after.afternoon.text).toBe('4小时');
    for (const key of ['total', 'morning', 'afternoon']) {
      for (const dimension of ['x', 'y', 'width', 'height']) expect(Math.abs(after[key].rect[dimension] - before[key].rect[dimension]), `${key}.${dimension}`).toBeLessThan(1);
    }
    await page.locator('[data-time-key="morningEnd"] .time-wheel-column[data-unit="hour"]').dispatchEvent('keydown', { key: 'Home' });
    await expect(page.locator('#scheduleCalibrationTotal')).toHaveText('等待校准');
    const invalid = await read();
    expect(Math.abs(invalid.total.rect.height - before.total.rect.height)).toBeLessThan(1);
    expect(Math.abs(invalid.afternoon.rect.x - before.afternoon.rect.x)).toBeLessThan(1);
  });
}

test('rapid local operations leave no copy, layer, scroll or focus residue', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'income');
  for (let round = 0; round < 6; round++) {
    for (const mode of ['fixed-daily', 'fixed-monthly', 'annual-average']) {
      await page.locator(`[data-income-mode="${mode}"]`).dispatchEvent('click');
      await page.waitForTimeout(25);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(40);
    await page.locator('#incomeSettingsCard').dispatchEvent('click');
    await page.waitForTimeout(400);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('.income-mode-previous, .income-shared-shell, .income-shared-origin')).toHaveCount(0);
  expect(await page.locator('[style*="--settings-layer-opacity"]').count()).toBe(0);
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(false);
  expect(errors).toEqual([]);
  await open(page, 'schedule');
  for (let i = 0; i < 10; i++) {
    await page.locator('#calendarDataToggle').dispatchEvent('click');
    await page.waitForTimeout(25);
  }
  await page.waitForTimeout(350);
  await expect(page.locator('#calendarDataToggle')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.locator('#calendarDataContent').evaluate(element => ({ height: element.clientHeight, inert: element.inert }))).toEqual({ height: 0, inert: true });
});

test('cached wheel styles still match every original distance formula after resize', async ({ page }) => {
  await open(page, 'schedule');
  for (const width of [1440, 320, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const value of [9.25, 10.75, 9.25]) {
      const mismatches = await page.locator('.time-wheel-column').first().evaluate((column, value) => {
        column.scrollTop = value * 44;
        column.dispatchEvent(new Event('scroll'));
        return new Promise(resolve => requestAnimationFrame(() => {
          const center = column.scrollTop + column.clientHeight / 2;
          const failures = [];
          for (const item of column.children) {
            const distance = (item.offsetTop + item.offsetHeight / 2 - center) / 44;
            const absolute = Math.abs(distance);
            const expected = {
              '--wheel-angle': `${(Math.max(-3.25, Math.min(3.25, distance)) * -19).toFixed(2)}deg`,
              '--wheel-depth': `${(-Math.min(38, absolute * 12)).toFixed(2)}px`,
              '--wheel-scale': Math.max(.76, 1 - absolute * .075).toFixed(3),
              '--wheel-opacity': (.10 + .90 * Math.exp(-absolute * absolute * .65)).toFixed(3),
              '--wheel-shade': Math.min(1, absolute / 3).toFixed(3)
            };
            for (const [property, value] of Object.entries(expected)) {
              if (item.style.getPropertyValue(property) !== value) failures.push({ item: item.dataset.value, property, expected: value, actual: item.style.getPropertyValue(property) });
            }
          }
          resolve(failures);
        }));
      }, value);
      expect(mismatches).toEqual([]);
    }
  }
});

test('combined motion observes frame cost and wheel geometry read/write ordering', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'CDP cost samples require Chromium; correctness tests also run on WebKit.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const NativeDate = Date;
    const start = NativeDate.now();
    const base = NativeDate.parse('2026-09-07T06:30:00Z');
    window.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [base + NativeDate.now() - start])); }
      static now() { return base + NativeDate.now() - start; }
    };
    window.__localCost = { readAfterWrite: 0, reads: 0, writes: 0, wrote: false, frames: [], last: 0, stop: false, gridDraws: 0 };
    const top = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
    const height = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', { ...top, get() {
      if (this.classList.contains('time-wheel-item')) {
        const audit = window.__localCost;
        audit.reads++;
        if (audit.wrote) audit.readAfterWrite++;
      }
      return top.get.call(this);
    } });
    Object.defineProperty(Element.prototype, 'clientHeight', { ...height, get() {
      if (this.classList.contains('time-wheel-column')) window.__localCost.wrote = false;
      return height.get.call(this);
    } });
    const write = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(name, ...args) {
      if (name.startsWith('--wheel-')) { window.__localCost.writes++; window.__localCost.wrote = true; }
      return write.call(this, name, ...args);
    };
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) {
      if (this.canvas.id === 'ambientGridBackdrop') window.__localCost.gridDraws++;
      return clear.apply(this, args);
    };
  });
  await open(page, 'schedule');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(entry => [entry.name, entry.value]));
  const before = await metrics();
  const incomeBefore = await page.locator('#incomeDial').getAttribute('aria-label');
  await page.evaluate(() => {
    Object.assign(window.__localCost, { readAfterWrite: 0, reads: 0, writes: 0, gridDraws: 0 });
    const sample = time => {
      const audit = window.__localCost;
      if (audit.stop) return;
      if (audit.last) audit.frames.push(time - audit.last);
      audit.last = time;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  const minute = page.locator('[data-time-key="morningEnd"] .time-wheel-column[data-unit="minute"]');
  for (let i = 0; i < 24; i++) {
    await page.mouse.move(200 + i * 20, 180 + (i % 5) * 65);
    await minute.dispatchEvent('keydown', { key: i < 12 ? 'ArrowDown' : 'ArrowUp' });
    if (i === 8 || i === 16) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(70);
      await page.locator('#scheduleSettingsCard').dispatchEvent('click');
    }
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(500);
  const after = await metrics();
  const audit = await page.evaluate(() => { window.__localCost.stop = true; return window.__localCost; });
  const frames = [...audit.frames].sort((a, b) => a - b);
  const report = { browser: page.context().browser().version(), reads: audit.reads, writes: audit.writes, readAfterWrite: audit.readAfterWrite, gridDraws: audit.gridDraws, frameCount: frames.length, medianMs: frames[Math.floor(frames.length * .5)], p95Ms: frames[Math.floor(frames.length * .95)], over34ms: frames.filter(value => value > 34).length, metrics: Object.fromEntries(['LayoutCount', 'LayoutDuration', 'RecalcStyleCount', 'RecalcStyleDuration', 'TaskDuration'].map(key => [key, after[key] - before[key]])), incomeBefore, incomeAfter: await page.locator('#incomeDial').getAttribute('aria-label') };
  console.log(JSON.stringify(report));
  await testInfo.attach('combined-cost.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  expect(report.frameCount).toBeGreaterThan(0);
  expect(report.gridDraws).toBeGreaterThan(0);
  expect(report.incomeAfter).not.toBe(report.incomeBefore);
  expect(report.readAfterWrite).toBe(0);
  expect(report.writes / report.reads).toBeLessThan(1);
});
