const { test, expect } = require('@playwright/test');

async function open(page, date = '2026-09-07T06:30:00Z') {
  await page.clock.install({ time: new Date(date) });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1600);
}
const seek = page => page.evaluate(() => window.__incomeClockDiagnostics.getHistoricalSeekState());

test('settings consistency: equal opening and closing timing with synchronized backdrop', async ({ page }, testInfo) => {
  await open(page);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()+100)));
  const records = [];
  for (const kind of ['income', 'schedule']) {
    const card = page.locator(`#${kind}SettingsCard`);
    await card.scrollIntoViewIfNeeded();
    await card.focus();
    await card.dispatchEvent('click');
    const samples = { kind, opening: [], closing: [] };
    for (const direction of ['opening', 'closing']) {
      if(direction === 'closing') await page.keyboard.press('Escape');
      for(let elapsed=16; elapsed<=528; elapsed+=16) {
        await page.clock.runFor(16);
        samples[direction].push(await page.evaluate(elapsed => {
          const shell = document.querySelector('.income-shared-shell');
          const skin = shell?.querySelectorAll('.income-shared-skin')[1];
          const backdrop = document.querySelector('.settings-backdrop');
          return { elapsed, shell: Boolean(shell), material: skin ? Number(skin.style.opacity) : null, backdrop: Number(getComputedStyle(backdrop).opacity) };
        }, elapsed));
      }
      const active = samples[direction].filter(frame => frame.shell);
      const duration = direction === 'closing' ? 480 : 360;
      expect(active.at(-1).elapsed).toBeGreaterThanOrEqual(duration-24);
      expect(active.at(-1).elapsed).toBeLessThanOrEqual(duration+8);
      for(const frame of active) expect(Math.abs(frame.material-frame.backdrop)).toBeLessThan(.001);
    }
    records.push(samples);
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await expect(card).toBeFocused();
  }
  for(const direction of ['opening','closing']) {
    expect(records[0][direction].filter(f=>f.shell).length).toBe(records[1][direction].filter(f=>f.shell).length);
    for(let i=0;i<20;i++) expect(Math.abs(records[0][direction][i].material-records[1][direction][i].material)).toBeLessThan(.05);
  }
  await testInfo.attach('settings-timing.json', {body:JSON.stringify(records),contentType:'application/json'});
});

test('both settings cards land with a bounded rebound that reopening can take over', async ({ page }) => {
  await open(page);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()+1000)));
  for (const kind of ['income', 'schedule']) {
    const card = page.locator(`#${kind}SettingsCard`);
    await card.scrollIntoViewIfNeeded();
    await card.focus();
    await card.dispatchEvent('click');
    await page.clock.runFor(420);
    const origin = await card.boundingBox();
    await page.keyboard.press('Escape');
    await page.clock.runFor(384);
    const landed = await page.locator('.income-shared-shell').boundingBox();
    expect(Math.abs(landed.y-origin.y)).toBeLessThan(3);
    await page.clock.runFor(40);
    const compressed = await page.locator('.income-shared-shell').boundingBox();
    expect(compressed.y-landed.y).toBeGreaterThan(1);
    expect(compressed.y-landed.y).toBeLessThanOrEqual(2.1);
    expect(landed.width-compressed.width).toBeGreaterThan(1);
    await card.dispatchEvent('click');
    const resumed = await page.locator('.income-shared-shell').boundingBox();
    for(const key of ['x','y','width','height']) expect(Math.abs(resumed[key]-compressed[key])).toBeLessThan(.1);
    await page.clock.runFor(500);
    await expect(page.locator('#settingsDialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.clock.runFor(520);
    await expect(page.locator('.income-shared-shell, .income-shared-origin')).toHaveCount(0);
    await expect(card).toBeFocused();
  }
});

for (const [width, theme] of [[1440, 'light'], [1440, 'dark'], [390, 'light'], [390, 'dark']]) {
test(`timeline expansion leads vertically and reverses continuously: ${width} ${theme}`, async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
  await open(page);
  const card = page.locator('#scheduleSettingsCard');
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  const origin = await card.boundingBox();
  await card.dispatchEvent('click');
  await page.clock.runFor(32);
  const early = await page.locator('.income-shared-shell').boundingBox();
  expect(early.height).toBeGreaterThan(origin.height);
  expect(Math.abs(early.width - origin.width)).toBeLessThan(.1);
  await page.clock.runFor(112);
  await page.screenshot({ path: testInfo.outputPath(`timeline-${width}-${theme}-opening.png`) });
  const before = await page.locator('.income-shared-shell').boundingBox();
  await page.keyboard.press('Escape');
  const reversed = await page.locator('.income-shared-shell').boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(before[key] - reversed[key])).toBeLessThan(.1);
  await page.clock.runFor(32);
  await card.dispatchEvent('click');
  await page.setViewportSize({ width, height: width === 390 ? 740 : 950 });
  await page.clock.runFor(500);
  await expect(page.locator('.income-shared-shell, .income-shared-origin')).toHaveCount(0);
  await expect(page.locator('#scheduleWheelGrid .time-wheel-card')).toHaveCount(4);
  const sheet = await page.locator('.settings-sheet').boundingBox();
  expect(sheet.x).toBeGreaterThanOrEqual(0);
  expect(sheet.x + sheet.width).toBeLessThanOrEqual(width + 1);
  expect(sheet.y + sheet.height).toBeLessThanOrEqual((width === 390 ? 740 : 950) + 1);
  await page.screenshot({ path: testInfo.outputPath(`timeline-${width}-${theme}-opened.png`) });
  const wheel = page.locator('[data-time-key="morningStart"] [data-unit="hour"]');
  await wheel.press('ArrowUp');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  await page.clock.runFor(720);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(card).toBeFocused();
  expect(await page.evaluate(() => window.__incomeClockDiagnostics.getSettings().schedule.morningStart)).toBe('08:00');
  expect(errors).toEqual([]);
});
}

test('timeline expansion preserves error space and background cleanup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.locator('#scheduleSettingsCard').click();
  await page.waitForTimeout(450);
  const wheel = page.locator('[data-time-key="morningEnd"] [data-unit="hour"]');
  for (let i = 0; i < 3; i++) await wheel.press('ArrowDown');
  await page.locator('#settingsSaveButton').click();
  await expect(page.locator('#settingsSaveButton')).toBeDisabled();
  await expect(page.locator('#scheduleSettingsError')).toBeVisible();
  for (let i = 0; i < 3; i++) await wheel.press('ArrowUp');
  await expect(page.locator('#settingsSaveButton')).toBeEnabled();
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('.income-shared-shell, .income-shared-origin')).toHaveCount(0);
});

test('timeline expansion respects reduced motion', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#scheduleSettingsCard').click();
  await expect(page.locator('.income-shared-shell')).toHaveCount(0);
  await expect(page.locator('#scheduleSettingsPanel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsDialog')).toBeHidden();
});

async function sharedFrame(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('.income-shared-shell');
    const origin = document.querySelector('#incomeSettingsCard');
    const sheet = document.querySelector('.settings-sheet');
    const rect = shell?.getBoundingClientRect();
    const originRect = origin.getBoundingClientRect();
    return {
      shell: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      origin: { x: originRect.x, y: originRect.y, width: originRect.width, height: originRect.height },
      originVisible: getComputedStyle(origin).visibility !== 'hidden',
      sheetOpacity: Number(getComputedStyle(sheet).opacity),
      dialogHidden: document.querySelector('#settingsDialog').hidden,
      origins: document.querySelectorAll('.income-shared-origin').length,
    };
  });
}

test('shared inspection: resize during expansion and focused-input viewport shrink', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.clock.runFor(110);
  const before = await sharedFrame(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const after = await sharedFrame(page);
  expect(Math.abs(after.shell.x - before.shell.x)).toBeLessThan(.1);
  expect(Math.abs(after.shell.width - before.shell.width)).toBeLessThan(.1);
  await page.clock.runFor(500);
  await page.locator('#incomeAmountInput').focus();
  await page.setViewportSize({ width: 390, height: 500 });
  await page.clock.runFor(400);
  const bounds = await page.locator('.settings-sheet').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(501);
  await expect(page.locator('#incomeAmountInput')).toBeFocused();
  await expect(page.locator('#settingsSaveButton')).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('focused-input-short-viewport.png') });
  await page.keyboard.press('Escape');
  await page.clock.runFor(500);
  await expect(page.locator('.income-shared-shell, .income-shared-origin')).toHaveCount(0);
});

test('shared inspection: saving returns updated card without overlapping shells', async ({ page }, testInfo) => {
  await open(page);
  const originalText = await page.locator('#incomeSettingsCard').innerText();
  await page.locator('#incomeSettingsCard').click();
  await page.waitForTimeout(450);
  await page.locator('#incomeAmountInput').fill('12345');
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  expect(await page.evaluate(() => window.__incomeClockDiagnostics.getSettings().monthlyIncome)).toBe(12345);
  const frames = [];
  for (let i = 0; i < 48; i++) {
    frames.push(await sharedFrame(page));
    await page.clock.runFor(16);
  }
  await testInfo.attach('save-return-frames.json', { body: JSON.stringify(frames), contentType: 'application/json' });
  expect(frames.some(frame => frame.shell)).toBe(true);
  expect(frames.filter(frame => frame.shell && frame.originVisible)).toHaveLength(0);
  expect(frames.at(-1).dialogHidden).toBe(true);
  expect(frames.at(-1).originVisible).toBe(true);
  expect(frames.at(-1).origins).toBe(0);
  const lastShell = frames.filter(frame => frame.shell).at(-1);
  for (const key of ['x', 'y', 'width', 'height']) {
    expect(Math.abs(lastShell.shell[key] - lastShell.origin[key])).toBeLessThan(3);
  }
  await expect(page.locator('#incomeSettingsCard')).toBeFocused();
  expect(await page.locator('#incomeSettingsCard').innerText()).not.toBe(originalText);
});

test('shared inspection: background interruption preserves focused editor and cancels stale return', async ({ page }) => {
  await open(page);
  await page.locator('#incomeSettingsCard').click();
  await page.waitForTimeout(450);
  await page.locator('#incomeAmountInput').fill('9999');
  await page.locator('#incomeAmountInput').focus();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#incomeAmountInput')).toHaveValue('9999');
  await expect(page.locator('#incomeAmountInput')).toBeFocused();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Escape');
    await page.clock.runFor(32);
    await page.locator('#incomeSettingsCard').dispatchEvent('click');
    await page.clock.runFor(32);
  }
  await page.clock.runFor(500);
  await expect(page.locator('#settingsDialog')).toBeVisible();
  await expect(page.locator('.income-shared-shell, .income-shared-origin')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.clock.runFor(500);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('#incomeSettingsCard')).toBeFocused();
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
});

test('shared income preview settles on background entry without leaking a shell', async ({ page }) => {
  await open(page);
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.income-shared-shell')).toHaveCount(0);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('#incomeSettingsPanel')).toBeVisible();
  await page.locator('#settingsDialog').dispatchEvent('keydown', { key: 'Escape', bubbles: true });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('.income-shared-origin')).toHaveCount(0);
});

for (const [width, theme] of [[1440, 'light'], [1440, 'dark'], [390, 'light'], [390, 'dark']]) {
test(`income shared shell stays continuous and interruptible: ${width} ${theme}`, async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
  await open(page);
  await page.locator('#incomeSettingsCard').scrollIntoViewIfNeeded();
  await page.locator('#incomeSettingsCard').focus();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  const origin = await page.locator('#incomeSettingsCard').boundingBox();
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  const start = await page.locator('.income-shared-shell').boundingBox();
  expect(Math.abs(start.x - origin.x)).toBeLessThan(2);
  expect(Math.abs(start.width - origin.width)).toBeLessThan(2);
  await page.clock.runFor(120);
  await page.screenshot({ path: testInfo.outputPath(`shared-${width}-${theme}-opening.png`) });
  const before = await page.locator('.income-shared-shell').boundingBox();
  await page.locator('#settingsDialog').dispatchEvent('keydown', { key: 'Escape', bubbles: true });
  const reversed = await page.locator('.income-shared-shell').boundingBox();
  expect(Math.abs(before.x - reversed.x)).toBeLessThan(.1);
  expect(Math.abs(before.width - reversed.width)).toBeLessThan(.1);
  await page.clock.runFor(40);
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.clock.runFor(450);
  await expect(page.locator('.income-shared-shell')).toHaveCount(0);
  await expect(page.locator('#incomeSettingsPanel')).toBeVisible();
  await expect(page.locator('.settings-sheet')).toHaveCSS('transform', 'none');
  const panel = await page.locator('.settings-sheet').boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(width + 1);
  expect(panel.y + panel.height).toBeLessThanOrEqual((width === 390 ? 844 : 1000) + 1);
  await page.screenshot({ path: testInfo.outputPath(`shared-${width}-${theme}-opened.png`) });
  await page.locator('#settingsDialog').dispatchEvent('keydown', { key: 'Escape', bubbles: true });
  await page.clock.runFor(100);
  await page.setViewportSize({ width: width - 20, height: 900 });
  await page.clock.runFor(520);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('.income-shared-shell')).toHaveCount(0);
  await expect(page.locator('#incomeSettingsCard')).toBeFocused();
  expect(errors).toEqual([]);
});
}

test('save commits once, confirms in place, and Escape cancels stale close', async ({ page }) => {
  await open(page);
  await page.locator('#incomeSettingsCard').click();
  await expect(page.locator('#incomeSettingsPanel')).not.toHaveAttribute('data-settings-unready');
  await page.locator('#incomeAmountInput').fill('12345');
  await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-settings-unready');
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
  await expect(page.locator('#incomeSettingsPanel')).not.toHaveAttribute('data-settings-unready');
  await page.locator('#incomeAmountInput').fill('-1');
  await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-settings-unready');
  await expect(page.locator('.settings-sheet')).toHaveCSS('transform', 'none');
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
  await expect(page.locator('.income-shared-shell')).toHaveCount(0);
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
  await expect(follower.locator('#incomeSettingsPanel')).not.toHaveAttribute('data-settings-unready');
  await follower.locator('#incomeAmountInput').fill('45678');
  await expect(follower.locator('#settingsSaveButton')).not.toHaveAttribute('data-settings-unready');
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
