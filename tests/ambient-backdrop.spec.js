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
    await page.mouse.move(910, 820);
    await page.mouse.move(1110, 820, { steps: 12 });
    await page.waitForTimeout(100);
    const gridAfter = await gridCanvas.screenshot();
    const heroAfter = await hero.boundingBox();

    expect(gridAfter.equals(gridBefore)).toBe(false);
    expect(heroAfter).toEqual(heroBefore);
    expect(pageErrors).toEqual([]);
  });

  test('yields to critical performance mode', async ({ page }) => {
    await page.goto(APP_PATH, { waitUntil: 'load' });
    const gridCanvas = page.locator('#ambientGridBackdrop');
    await expect(gridCanvas).toBeVisible();
    await page.evaluate(() => document.body.classList.add('performance-critical'));
    await expect(gridCanvas).toBeHidden();
  });
});
