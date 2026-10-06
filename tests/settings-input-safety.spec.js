const { test, expect } = require('@playwright/test');
const { settingsPage, openSettings } = require('./helpers/settings-page');
test.use({ viewport: { width: 390, height: 700 }, hasTouch: true });
const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(pageErrors.get(page)).toEqual([]));

async function open(page, kind = 'schedule') {
  await openSettings(page, { kind });
}

test('keyboard focus on a wheel keeps its per-column outline unmasked', async ({ page }) => {
  await open(page);
  const columns = page.locator('.time-wheel-column');
  await expect(page.locator('#settingsDialog')).not.toHaveClass(/income-shared-active/);
  for (let index = 0; index < 15; index++) {
    await page.keyboard.press('Tab');
    if (await columns.first().evaluate(el => el === document.activeElement)) break;
  }
  const focused = await columns.first().evaluate(el => ({ visible: el.matches(':focus-visible'), mask: getComputedStyle(el).maskImage, outline: getComputedStyle(el).outlineStyle }));
  expect(focused.visible).toBe(true);
  expect(focused.mask).toBe('none');
  expect(focused.outline).not.toBe('none');
  await page.keyboard.press('Tab');
  expect(await columns.first().evaluate(el => getComputedStyle(el).maskImage)).toContain('linear-gradient');
  expect(await columns.nth(1).evaluate(el => getComputedStyle(el).maskImage)).toBe('none');
});

test('invisible opening fields and save cannot act; close stays immediately available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto(settingsPage);
  await page.waitForTimeout(1000);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.clock.runFor(80);
  expect(await page.locator('#incomeSettingsPanel').evaluate(element => Number(getComputedStyle(element).opacity))).toBe(0);
  await page.locator('[data-income-mode="fixed-daily"]').dispatchEvent('click');
  await expect(page.locator('[data-income-mode="fixed-monthly"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  await expect(page.locator('#settingsSaveButton')).not.toHaveAttribute('data-save-state', /.+/);
  await page.locator('#incomeAmountInput').evaluate(element => element.focus());
  await expect(page.locator('#incomeAmountInput')).not.toBeFocused();
  await page.locator('[data-settings-close-kind="header"]').dispatchEvent('click');
  await page.clock.runFor(600);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.clock.runFor(80);
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.clock.runFor(500);
  expect(await page.locator('#incomeSettingsPanel').evaluate(element => element.inert)).toBe(false);
  expect(await page.locator('#settingsSaveButton').evaluate(element => element.inert)).toBe(false);
});

async function touch(page, locator, startBand, dx, dy, cancel = false) {
  const box = await locator.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + (startBand === 'center' ? box.height / 2 : 12);
  const cdp = await page.context().newCDPSession(page);
  const point = (x, y) => [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(x, y) });
  await page.waitForTimeout(20);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x + dx / 2, y + dy / 2) });
  await page.waitForTimeout(20);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x + dx, y + dy) });
  await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await page.waitForTimeout(500);
}

for (const scenario of [{ name: 'diagonal center gesture', band: 'center', dx: 50, dy: -35 }, { name: 'vertical faded-row gesture', band: 'edge', dx: 0, dy: -50 }]) {
  test(`${scenario.name} scrolls the panel rather than changing time`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Native touch injection uses Chromium CDP; simulated touch cases also cover WebKit.');
    await open(page);
    const wheel = page.locator('.time-wheel-column').first();
    const before = await wheel.getAttribute('aria-valuenow');
    await touch(page, wheel, scenario.band, scenario.dx, scenario.dy);
    await expect(wheel).toHaveAttribute('aria-valuenow', before);
    expect(await page.locator('.settings-sheet').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  });
}

test('summary changes visually immediately but has a single settled announcement', async ({ page }) => {
  await open(page);
  await expect(page.locator('#scheduleCalibrationSummary')).not.toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveCount(1);
  await page.evaluate(() => {
    window.__summaryAnnouncements = [];
    new MutationObserver(() => window.__summaryAnnouncements.push(document.querySelector('#scheduleCalibrationAnnouncement').textContent)).observe(document.querySelector('#scheduleCalibrationAnnouncement'), { childList: true, subtree: true, characterData: true });
  });
  const minute = page.locator('[data-time-key="morningEnd"] .time-wheel-column[data-unit="minute"]');
  for (let i = 0; i < 6; i++) {
    await minute.dispatchEvent('keydown', { key: 'ArrowDown' });
    await page.waitForTimeout(30);
  }
  await expect(page.locator('#scheduleMorningDuration')).toHaveText('2小时36分');
  await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveText(/6小时36分/);
  expect(await page.evaluate(() => window.__summaryAnnouncements.filter(Boolean).length)).toBe(1);
  await minute.dispatchEvent('keydown', { key: 'ArrowDown' });
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveText('');
});

for (const artifact of ['Develop', 'Push']) {
  test(`${artifact}: invalid draft clears stale speech and identical recovery announces again`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/Income-per-sed-${artifact}.html`);
    await page.locator('#scheduleSettingsCard').dispatchEvent('click');
    await expect(page.locator('#scheduleSettingsPanel')).not.toHaveAttribute('data-settings-unready');
    const announcement = page.locator('#scheduleCalibrationAnnouncement');
    const minute = page.locator('[data-time-key="morningEnd"] [data-unit="minute"]');
    const hour = page.locator('[data-time-key="morningEnd"] [data-unit="hour"]');
    await page.evaluate(() => {
      window.__recoveredAnnouncements = [];
      const region = document.querySelector('#scheduleCalibrationAnnouncement');
      new MutationObserver(() => window.__recoveredAnnouncements.push(region.textContent))
        .observe(region, { childList: true, subtree: true, characterData: true });
    });
    await minute.dispatchEvent('keydown', { key: 'ArrowDown' });
    await expect(announcement).toHaveText(/当日工时/);
    const original = await announcement.textContent();
    for (let i = 0; i < 3; i++) await hour.dispatchEvent('keydown', { key: 'ArrowUp' });
    await expect(page.locator('#scheduleCalibrationSummary')).toHaveAttribute('data-valid', 'false');
    await expect(announcement).toHaveText('');
    await page.waitForTimeout(500);
    await expect(announcement).toHaveText('');
    for (let i = 0; i < 3; i++) await hour.dispatchEvent('keydown', { key: 'ArrowDown' });
    await expect(announcement).toHaveText(original);
    expect(await page.evaluate(text => window.__recoveredAnnouncements.filter(value => value === text).length, original)).toBe(2);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__recoveredAnnouncements.filter(Boolean).length)).toBe(2);
  });
}

test('reduced motion has no invisible interaction gate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(settingsPage);
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.locator('#incomeAmountInput').fill('7000');
  await expect(page.locator('#incomeAmountInput')).toHaveValue('7000');
  expect(await page.locator('#incomeSettingsPanel').evaluate(element => element.inert)).toBe(false);
});

for (const scenario of [
  { name: 'short touch', dx: 2, dy: -3, changed: false },
  { name: 'diagonal touch', dx: 40, dy: -30, changed: false },
  { name: 'outer row panel scroll', dx: 0, dy: -40, edge: true, changed: false },
  { name: 'center vertical wheel drag', dx: 0, dy: -44, changed: true },
  { name: 'pointer cancellation has no fling', dx: 0, dy: -44, cancel: true, changed: true, exact: '10' },
  { name: 'leaving column stops wheel and transfers gesture', dx: 100, dy: -44, leave: true, changed: true, exact: '10' }
]) {
  test(`simulated pointer intent: ${scenario.name}`, async ({ page }) => {
    await open(page);
    const wheel = page.locator('.time-wheel-column').first();
    await wheel.evaluate((element, scenario) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + (scenario.edge ? 12 : rect.height / 2);
      const send = (type, dx, dy) => element.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 47, pointerType: 'touch', button: 0, clientX: x + dx, clientY: y + dy }));
      send('pointerdown', 0, 0);
      if (scenario.leave) send('pointermove', 0, -44);
      send('pointermove', scenario.dx, scenario.dy);
      send(scenario.cancel ? 'pointercancel' : 'pointerup', scenario.dx, scenario.dy);
    }, scenario);
    await page.waitForTimeout(550);
    if (!scenario.changed) await expect(wheel).toHaveAttribute('aria-valuenow', '9');
    else if (scenario.exact) await expect(wheel).toHaveAttribute('aria-valuenow', scenario.exact);
    else expect(Number(await wheel.getAttribute('aria-valuenow'))).toBeGreaterThan(9);
    expect(await wheel.evaluate(element => element.classList.contains('dragging'))).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveText('');
  });
}

test('background discards pending summary speech without replay on return', async ({ page }) => {
  await open(page);
  await page.locator('.time-wheel-column').first().dispatchEvent('keydown', { key: 'ArrowDown' });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);
  await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveText('');
  await page.locator('.time-wheel-column').first().dispatchEvent('keydown', { key: 'ArrowDown' });
  await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveText(/当日工时/);
});

test('settled announcement never replaces timely submitted error feedback', async ({ page }) => {
  await open(page);
  const end = page.locator('[data-time-key="morningEnd"] .time-wheel-column[data-unit="hour"]');
  for (let i = 0; i < 3; i++) await end.dispatchEvent('keydown', { key: 'ArrowUp' });
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  await expect(page.locator('#scheduleSettingsError')).toHaveText(/请修正/);
  await expect(page.locator('#settingsSaveButton')).toBeDisabled();
  await page.waitForTimeout(500);
  await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveText('');
  await end.dispatchEvent('keydown', { key: 'ArrowDown' });
  await end.dispatchEvent('keydown', { key: 'ArrowDown' });
  await expect(page.locator('#settingsSaveButton')).toBeEnabled();
  await expect(page.locator('#scheduleSettingsError')).toHaveText('');
  await expect(page.locator('#scheduleCalibrationAnnouncement')).toHaveText(/当日工时/);
});
