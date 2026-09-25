const { test, expect } = require('@playwright/test');

async function open(page, date = '2026-09-07T06:30:00Z') {
  await page.clock.install({ time: new Date(date) });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1600);
}
const seek = page => page.evaluate(() => window.__incomeClockDiagnostics.getHistoricalSeekState());

test('save commits once, confirms in place, and Escape cancels stale close', async ({ page }) => {
  await open(page);
  await page.locator('#incomeSettingsCard').click();
  await page.locator('#incomeAmountInput').fill('12345');
  await page.locator('#settingsSaveButton').evaluate(button => { button.click(); button.click(); });
  await expect(page.locator('#settingsSaveButton')).toHaveAttribute('data-save-state', 'saved');
  expect(await page.evaluate(() => window.__incomeClockDiagnostics.getSettings().monthlyIncome)).toBe(12345);
  await page.keyboard.press('Escape');
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.waitForTimeout(450);
  await expect(page.locator('#settingsDialog')).toBeVisible();
  await expect(page.locator('#settingsSaveButton')).toHaveText('保存');
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('#incomeSettingsCard')).toBeFocused();
});

test('failed persistence keeps the editor open without a success check', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Denied', 'SecurityError'); };
  });
  await page.locator('#incomeSettingsCard').click();
  await page.locator('#incomeAmountInput').fill('23456');
  await page.locator('#settingsSaveButton').click();
  await page.waitForTimeout(450);
  await expect(page.locator('#settingsDialog')).toBeVisible();
  await expect(page.locator('#settingsSaveButton')).toBeEnabled();
  await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-save-state');
});

test('known field errors block saving until valid and preserve button position', async ({ page }) => {
  await open(page);
  await page.locator('#incomeSettingsCard').click();
  await page.locator('#incomeAmountInput').fill('-1');
  await expect(page.locator('.settings-sheet')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  const before = await page.locator('#settingsSaveButton').boundingBox();
  await page.locator('#settingsSaveButton').click();
  await expect(page.locator('#settingsSaveButton')).toBeDisabled();
  const invalid = await page.locator('#settingsSaveButton').boundingBox();
  expect(Math.abs(invalid.y - before.y)).toBeLessThan(2);
  await page.screenshot({ path: test.info().outputPath('settings-error.png') });
  await page.locator('#incomeAmountInput').fill('-2');
  await expect(page.locator('#settingsSaveButton')).toBeDisabled();
  await page.locator('#incomeAmountInput').fill('9000');
  await expect(page.locator('#settingsSaveButton')).toBeEnabled();
  const after = await page.locator('#settingsSaveButton').boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
});

test('ten interrupted settings opens do not execute an obsolete hide', async ({ page }) => {
  await open(page);
  for (let i = 0; i < 10; i++) {
    await page.locator('#incomeSettingsCard').dispatchEvent('click');
    await page.waitForTimeout(35);
    await page.locator('#settingsDialog').dispatchEvent('keydown', { key: 'Escape', bubbles: true });
  }
  await page.locator('#scheduleSettingsCard').dispatchEvent('click');
  await page.waitForTimeout(400);
  await expect(page.locator('#scheduleSettingsPanel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsDialog')).toBeHidden();
});

test('quick panel reversals and cumulative forward/reverse steps retain the latest target', async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 10; i++) await page.locator('#historyQuickOpen').dispatchEvent('click');
  await page.locator('#historyQuickOpen').dispatchEvent('click');
  await page.waitForTimeout(300);
  await expect(page.locator('#historyQuickPanel')).toBeVisible();
  await page.locator('[data-history-seconds="-3600"]').dispatchEvent('click');
  const first = (await seek(page)).targetTimeMs;
  await page.waitForTimeout(40);
  await page.locator('[data-history-seconds="-3600"]').dispatchEvent('click');
  await page.locator('[data-history-seconds="-3600"]').dispatchEvent('click');
  expect((await seek(page)).targetTimeMs).toBe(first - 7200000);
  await page.waitForTimeout(40);
  const before = await seek(page);
  await page.locator('[data-history-seconds="3600"]').dispatchEvent('click');
  const after = await seek(page);
  expect(after.targetTimeMs).toBe(first - 3600000);
  expect(after.timeVelocity * before.timeVelocity).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
});

test('task pause freezes accounting immediately and supports resume and reset during settling', async ({ page }) => {
  await open(page);
  await page.locator('#taskStopwatch').click();
  await page.waitForTimeout(350);
  await page.locator('#taskStopwatch').dispatchEvent('click');
  const paused = await page.evaluate(() => window.__incomeClockDiagnostics.getTaskStopwatchState());
  await page.waitForTimeout(50);
  const later = await page.evaluate(() => window.__incomeClockDiagnostics.getTaskStopwatchState());
  expect(later.elapsedMs).toBe(paused.elapsedMs);
  await page.locator('#taskStopwatch').dispatchEvent('click');
  await page.waitForTimeout(80);
  expect((await page.evaluate(() => window.__incomeClockDiagnostics.getTaskStopwatchState())).elapsedMs).toBeGreaterThan(paused.elapsedMs);
  await page.locator('#taskStopwatch').dispatchEvent('click');
  await page.locator('#taskStopwatchCrown').dispatchEvent('click');
  await page.waitForTimeout(700);
  const reset = await page.evaluate(() => window.__incomeClockDiagnostics.getTaskStopwatchState());
  expect(reset.elapsedMs).toBe(0);
  expect(reset.pausing).toBe(false);
  expect(reset.displayedIncome).toBe(0);
});

test('editable hover is delayed, leaves cleanly, and focus stays immediate', async ({ page }) => {
  await open(page);
  const card = page.locator('#incomeSettingsCard');
  await card.dispatchEvent('pointerenter', { pointerType: 'mouse' });
  await card.dispatchEvent('pointerleave', { pointerType: 'mouse' });
  await page.waitForTimeout(90);
  await expect(card).not.toHaveClass(/is-hovered/);
  await card.hover();
  await expect(card).toHaveClass(/is-hovered/);
  await page.mouse.move(0, 0);
  await expect(card).not.toHaveClass(/is-hovered/);
  await card.focus();
  expect(await card.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
});

test('snap experiment defaults off and does not persist across reload', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.__incomeClockDiagnostics.setMotionDebugEnabled(true));
  const toggle = page.locator('[data-debug-action="snap"]');
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await page.reload();
  await page.evaluate(() => window.__incomeClockDiagnostics.setMotionDebugEnabled(true));
  await expect(toggle).not.toBeChecked();
});

test('reduced motion preserves successful saving and static hover', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#incomeSettingsCard').click();
  await page.locator('#incomeAmountInput').fill('4567');
  await page.locator('#settingsSaveButton').click();
  await expect(page.locator('#settingsDialog')).toBeHidden();
  expect(await page.evaluate(() => window.__incomeClockDiagnostics.getSettings().monthlyIncome)).toBe(4567);
});

for (const scenario of [
  { name: 'inside threshold', seed: '2026-09-07T03:31:00Z', snap: true },
  { name: 'outside threshold', seed: '2026-09-07T03:32:00Z', snap: false },
  { name: 'rest day', date: '2026-09-06T06:30:00Z', seed: '2026-09-06T03:31:00Z', snap: false },
  { name: 'future node', date: '2026-09-07T03:29:30Z', seed: '2026-09-07T03:29:20Z', snap: false },
]) {
  test(`snap pointer release: ${scenario.name}`, async ({ page }) => {
    await open(page, scenario.date);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.__incomeClockDiagnostics.setMotionDebugEnabled(true));
    await page.locator('[data-debug-action="snap"]').check();
    await page.evaluate(() => window.__incomeClockDiagnostics.setMotionDebugEnabled(false));
    await page.locator('#historyQuickOpen').click();
    await page.locator('[data-history-seconds="-3600"]').evaluate((button, seed) => {
      button.dataset.historySeconds = String((Date.parse(seed) - Date.now()) / 1000);
      button.click();
    }, scenario.seed);
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await seek(page)).active).toBe(false);
    const time = page.locator('#currentTime');
    const pointer = { pointerId: 99, pointerType: 'touch', button: 0, clientX: 100, clientY: 100, bubbles: true };
    await time.dispatchEvent('pointerdown', pointer);
    await time.dispatchEvent('pointermove', { ...pointer, clientX: 108 });
    await time.dispatchEvent('pointerup', { ...pointer, clientX: 108 });
    const result = await seek(page);
    const target = Date.parse(scenario.seed.slice(0, 10) + 'T03:30:00Z');
    if (scenario.snap) {
      expect(result.targetTimeMs).toBe(target);
      await time.dispatchEvent('wheel', { deltaY: 120, deltaMode: 0, bubbles: true, cancelable: true });
      expect(await page.evaluate(() => window.__incomeClockDiagnostics.getTimelineState())).toBe('SCRUBBING');
      // A single notch can select the same existing work detent. A larger step must leave it.
      await time.dispatchEvent('wheel', { deltaY: 300, deltaMode: 0, bubbles: true, cancelable: true });
      await expect.poll(async () => (await seek(page)).targetTimeMs).not.toBe(target);
    } else {
      expect(Math.abs(result.targetTimeMs - target)).toBeGreaterThan(1000);
    }
  });
}

test('follower save reports submitted rather than saved', async ({ page, context }) => {
  await open(page);
  const other = await context.newPage();
  await open(other);
  await expect.poll(async () => {
    const roles = await Promise.all([page, other].map(p => p.evaluate(() => window.__incomeClockDiagnostics.getMultiWindowState().role)));
    return roles.includes('follower') && roles.includes('writer');
  }).toBe(true);
  const follower = await page.evaluate(() => window.__incomeClockDiagnostics.getMultiWindowState().role) === 'follower' ? page : other;
  await follower.locator('#incomeSettingsCard').click();
  await follower.locator('#incomeAmountInput').fill('45678');
  const feedback = await follower.locator('#settingsSaveButton').evaluate(button => {
    button.click();
    return { text: button.textContent, state: button.dataset.saveState };
  });
  expect(feedback).toEqual({ text: '已提交', state: 'submitted' });
  await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getSettings().monthlyIncome)).toBe(45678);
  await other.close();
});

test('mobile sheet drag closes without stale focus or out-of-bounds content', async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#historyQuickOpen').click();
  await page.waitForTimeout(260);
  const grabber = page.locator('#historyQuickGrabber');
  const pointer = { pointerId: 11, pointerType: 'touch', button: 0, clientX: 180, clientY: 500, bubbles: true };
  await grabber.dispatchEvent('pointerdown', pointer);
  await page.locator('#historyQuickPanel').dispatchEvent('pointermove', { ...pointer, clientY: 700 });
  await page.locator('#historyQuickPanel').dispatchEvent('pointerup', { ...pointer, clientY: 700 });
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
  await page.locator('#historyQuickOpen').click();
  await page.waitForTimeout(260);
  const bounds = await page.locator('#historyQuickPanel').boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(845);
  await page.screenshot({ path: test.info().outputPath('mobile-quick.png') });
});
