const { test, expect } = require('@playwright/test');

const DEVELOP_PATH = '/Income-per-sed-Develop.html';

async function openDevelop(page, viewport) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    localStorage.setItem('income-per-sed-theme-v1', 'light');
  });
  await page.goto(DEVELOP_PATH, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#currentTime')).toBeVisible();
}

test('traditional wheel input locks the discrete wheel profile', async ({ page }) => {
  await openDevelop(page, { width: 1440, height: 1000 });
  const time = page.locator('#currentTime');
  await time.hover();
  for (let index = 0; index < 3; index += 1) {
    await time.dispatchEvent('wheel', { deltaY: 120, deltaMode: 0, bubbles: true, cancelable: true });
    await page.waitForTimeout(32);
  }
  const profile = await page.evaluate(() => window.__incomeClockDiagnostics.getHistoryInputProfile());
  expect(profile.profile).toBe('wheel');
  expect(profile.sequenceLocked).toBe(true);
  expect(await page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).not.toBe('live');
});

test('touchpad-style reverse input stays finite and keeps one sequence profile', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await openDevelop(page, { width: 1440, height: 1000 });
  const time = page.locator('#currentTime');
  await time.hover();
  for (const deltaY of [12.5, 10.25, 8.75, -9.5, 8.5, -7.5, 6.5]) {
    await time.dispatchEvent('wheel', { deltaY, deltaMode: 0, bubbles: true, cancelable: true });
    await page.waitForTimeout(10);
  }
  await page.waitForTimeout(420);
  const result = await page.evaluate(() => ({
    profile: window.__incomeClockDiagnostics.getHistoryInputProfile(),
    seek: window.__incomeClockDiagnostics.getHistoricalSeekState(),
  }));
  expect(result.profile.profile).toBe('touchpad');
  expect(result.profile.sequenceLocked).toBe(true);
  for (const value of [
    result.seek.mainAngle,
    result.seek.mainVelocity,
    result.seek.minuteAngle,
    result.seek.hourAngle,
    result.seek.timeVelocity,
    result.seek.timeAcceleration,
  ]) expect(Number.isFinite(value)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('touch drag enters history without leaving the mobile viewport', async ({ page }) => {
  await openDevelop(page, { width: 390, height: 844 });
  const time = page.locator('#currentTime');
  const box = await time.boundingBox();
  expect(box).not.toBeNull();
  const startX = box.x + box.width * 0.35;
  const startY = box.y + box.height * 0.5;
  await time.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', button: 0, clientX: startX, clientY: startY, bubbles: true });
  for (const offset of [14, 30, 52, 78]) {
    await time.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'touch', clientX: startX + offset, clientY: startY + 1, bubbles: true, cancelable: true });
    await page.waitForTimeout(18);
  }
  await time.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', button: 0, clientX: startX + 78, clientY: startY + 1, bubbles: true });
  await page.waitForTimeout(900);

  expect(await page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).not.toBe('live');
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test('60Hz and 120Hz subhand integration reaches the same terminal state', async ({ page }) => {
  await openDevelop(page, { width: 1440, height: 1000 });
  const result = await page.evaluate(() => window.__incomeClockDiagnostics.runAllRegressionChecks());
  expect(result.passed, result.failures.join('\n')).toBe(true);
  const cadence = result.sections.motionConsistency.cadence;
  expect(Math.abs(cadence.hz60.angle - cadence.hz120.angle)).toBeLessThanOrEqual(0.03);
  expect(Math.abs(cadence.hz60.velocity - cadence.hz120.velocity)).toBeLessThanOrEqual(0.18);
  expect(Math.abs(cadence.hz60.acceleration - cadence.hz120.acceleration)).toBeLessThanOrEqual(4);
});
