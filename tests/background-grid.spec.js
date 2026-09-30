const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const APP_PATH = '/Income-per-sed-Push.html';

test('release source keeps the elastic grid without a center particle motif', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'Income-per-sed-Develop.html'), 'utf8');
  expect(source).not.toMatch(/ambientFishBackdrop|burstFish|koi-particles|ambientRelicBackdrop|ambientFluidBackdrop|ambientFlowBackdrop/);
  expect(source).toContain("ambientBackdrop: 'harness-elastic-square-grid-66-flat-idle-no-koi-v3'");
  expect(source).toContain('const spacing = 66;');
  expect(source).toContain('pointerEngaged: false');
  expect(source).toContain('const pointerActive = state.pointerEngaged && finePointerQuery.matches && !reducedMotionQuery.matches;');
  expect(source).toContain('function applyPointerForce(');
  expect(source).toContain('state.pointerSpeed = Math.hypot(state.pointerVX, state.pointerVY)');
  expect(source).toContain("root.addEventListener('pointerleave', resetPointer, { passive: true });");
});

test.describe('Harness-inspired elastic square grid', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('responds to a fine pointer without moving or blocking the dashboard', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript(() => {
      localStorage.setItem('income-per-sed-theme-v1', 'light');
      const clearRect = CanvasRenderingContext2D.prototype.clearRect;
      window.__ambientGridClearCount = 0;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas?.id === 'ambientGridBackdrop') window.__ambientGridClearCount += 1;
        return clearRect.apply(this, args);
      };
    });
    await page.goto(APP_PATH, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const gridCanvas = page.locator('#ambientGridBackdrop');
    const hero = page.locator('#incomeMainCard');
    await expect(gridCanvas).toBeVisible();
    await expect(hero).toBeVisible();
    await expect(page.locator('#ambientFishBackdrop')).toHaveCount(0);
    await page.waitForTimeout(600);

    const idleDrawCount = await page.evaluate(() => window.__ambientGridClearCount);
    await page.waitForTimeout(800);
    const settledDrawCount = await page.evaluate(() => window.__ambientGridClearCount);
    expect(settledDrawCount - idleDrawCount).toBeLessThanOrEqual(3);

    const gridState = await gridCanvas.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      return {
        cssWidth: Math.round(rect.width),
        cssHeight: Math.round(rect.height),
        bitmapWidth: element.width,
        bitmapHeight: element.height,
        pointerEvents: styles.pointerEvents,
        position: styles.position,
      };
    });
    expect(gridState).toMatchObject({
      cssWidth: 1440,
      cssHeight: 1000,
      pointerEvents: 'none',
      position: 'fixed',
    });
    expect(gridState.bitmapWidth).toBeGreaterThanOrEqual(1440);
    expect(gridState.bitmapHeight).toBeGreaterThanOrEqual(1000);

    const heroBefore = await hero.boundingBox();
    const gridBefore = await gridCanvas.screenshot();
    const canvasBefore = await gridCanvas.evaluate(canvas => canvas.toDataURL());
    await page.mouse.move(910, 820);
    await page.mouse.move(1110, 820, { steps: 12 });
    await page.waitForTimeout(100);
    const gridAfter = await gridCanvas.screenshot();
    const heroAfter = await hero.boundingBox();

    expect(gridAfter.equals(gridBefore)).toBe(false);
    expect(await gridCanvas.evaluate(canvas => canvas.toDataURL())).not.toBe(canvasBefore);
    expect(heroAfter).toEqual(heroBefore);
    expect(pageErrors).toEqual([]);
  });

  test('yields to critical performance mode', async ({ page }) => {
    await page.goto(APP_PATH, { waitUntil: 'load' });
    const gridCanvas = page.locator('#ambientGridBackdrop');
    await expect(gridCanvas).toBeVisible();
    await page.evaluate(() => document.body.classList.add('performance-critical'));
    await expect(gridCanvas).toBeHidden();
    await page.evaluate(() => document.body.classList.remove('performance-critical'));
    await expect(gridCanvas).toBeVisible();
  });

  test('unchanged and unrelated body classes do not wake a settled grid', async ({ page }) => {
    await page.addInitScript(() => {
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      window.__idleDraws = 0;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.id === 'ambientGridBackdrop') window.__idleDraws++;
        return clear.apply(this, args);
      };
    });
    await page.goto(APP_PATH);
    await page.waitForTimeout(1400);
    const before = await page.evaluate(() => window.__idleDraws);
    // Canvas screenshots include the changing dashboard underneath its transparency.
    const pixelsBefore = await page.locator('#ambientGridBackdrop').evaluate(canvas => canvas.toDataURL());
    await page.evaluate(() => {
      for (let i = 0; i < 100; i++) {
        document.body.className = document.body.className;
        document.body.classList.toggle('unrelated-grid-test', i % 2 === 0);
      }
      document.body.classList.remove('unrelated-grid-test');
    });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__idleDraws)).toBe(before);
    expect(await page.locator('#ambientGridBackdrop').evaluate(canvas => canvas.toDataURL())).toBe(pixelsBefore);
  });

  for (const appPath of ['/Income-per-sed-Develop.html', APP_PATH]) {
  test(`repeated foreground recovery keeps one grid loop and settles again: ${appPath}`, async ({ page }, testInfo) => {
    test.setTimeout(60000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      const pending = new Map();
      const gridCallbacks = new Set();
      let executing = null;
      let draws = 0;
      let maxPending = 0;
      window.requestAnimationFrame = callback => {
        const id = request(timestamp => {
          pending.delete(id);
          executing = callback;
          try { callback(timestamp); } finally { executing = null; }
        });
        pending.set(id, callback);
        maxPending = Math.max(maxPending,
          [...pending.values()].filter(fn => gridCallbacks.has(fn)).length);
        return id;
      };
      window.cancelAnimationFrame = id => {
        pending.delete(id);
        cancel(id);
      };
      // Discover the grid callback from its own canvas, not minified function names.
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.id === 'ambientGridBackdrop') {
          draws++;
          if (executing) gridCallbacks.add(executing);
        }
        return clear.apply(this, args);
      };
      window.__gridLoopProbe = () => ({
        draws, maxPending,
        pending: [...pending.values()].filter(fn => gridCallbacks.has(fn)).length,
        callbackCount: gridCallbacks.size,
      });
    });
    await page.goto(appPath);
    await expect.poll(() => page.evaluate(() => window.__gridLoopProbe().draws)).toBeGreaterThan(0);
    for (let cycle = 0; cycle < 10; cycle++) {
      await page.mouse.move(1000 + cycle * 8, 820, { steps: 3 });
      const hiddenDraws = await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        for (let i = 0; i < 5; i++) document.dispatchEvent(new Event('visibilitychange'));
        return window.__gridLoopProbe().draws;
      });
      await page.waitForTimeout(80);
      expect(await page.evaluate(() => window.__gridLoopProbe().pending)).toBe(0);
      expect(await page.evaluate(() => window.__gridLoopProbe().draws)).toBe(hiddenDraws);
      await page.evaluate(() => {
        delete document.hidden;
        delete document.visibilityState;
        for (let i = 0; i < 5; i++) {
          document.dispatchEvent(new Event('visibilitychange'));
          window.dispatchEvent(new Event('resize'));
        }
      });
      await expect.poll(() => page.evaluate(() => window.__gridLoopProbe().draws)).toBeGreaterThan(hiddenDraws);
    }
    const canvas = page.locator('#ambientGridBackdrop');
    const before = await canvas.evaluate(element => element.toDataURL());
    await page.mouse.move(1200, 850, { steps: 12 });
    await expect.poll(() => canvas.evaluate(element => element.toDataURL())).not.toBe(before);
    await page.evaluate(() => document.documentElement.dispatchEvent(new Event('pointerleave')));
    const settleStarted = Date.now();
    // Observe the existing elastic return; this is not a new animation deadline.
    await expect.poll(() => page.evaluate(() => window.__gridLoopProbe().pending), { timeout: 20000 }).toBe(0);
    const settled = await page.evaluate(() => window.__gridLoopProbe());
    await testInfo.attach('grid-recovery-loop.json', {
      body: Buffer.from(JSON.stringify({ appPath, simulatedCycles: 10,
        settleObservationMs: Date.now() - settleStarted, ...settled }, null, 2)),
      contentType: 'application/json',
    });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__gridLoopProbe().draws)).toBe(settled.draws);
    expect(settled.callbackCount).toBe(1);
    expect(settled.maxPending).toBe(1);
    expect(errors).toEqual([]);
  });
  }
});
