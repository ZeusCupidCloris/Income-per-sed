const { test, expect } = require('@playwright/test');
const appPath = process.env.SETTINGS_RELEASE_CHANNEL === 'push' ? '/Income-per-sed-Push.html' : '/Income-per-sed-Develop.html';

test('quick sheet return is continuous and a new drag can take over', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(appPath);
  await page.locator('#historyQuickOpen').click();
  await page.waitForTimeout(300);
  const sample = await page.evaluate(() => {
    const panel = document.querySelector('#historyQuickPanel');
    const grabber = document.querySelector('#historyQuickGrabber');
    const backdrop = document.querySelector('#historyQuickBackdrop');
    const event = (type, y, id = 21) => new PointerEvent(type, { pointerId: id, pointerType: 'touch', button: 0, clientX: 180, clientY: y, bubbles: true });
    grabber.dispatchEvent(event('pointerdown', 500));
    panel.dispatchEvent(event('pointermove', 540));
    const drag = { y: new DOMMatrix(getComputedStyle(panel).transform).m42, opacity: Number(getComputedStyle(backdrop).opacity) };
    panel.dispatchEvent(event('pointercancel', 540));
    const animation = panel.getAnimations()[0];
    animation.pause(); animation.currentTime = 0;
    backdrop.getAnimations()[0].pause(); backdrop.getAnimations()[0].currentTime = 0;
    const release = new DOMMatrix(getComputedStyle(panel).transform).m42;
    animation.currentTime = 64;
    const returning = new DOMMatrix(getComputedStyle(panel).transform).m42;
    grabber.dispatchEvent(event('pointerdown', 540, 22));
    const takeover = new DOMMatrix(getComputedStyle(panel).transform).m42;
    panel.dispatchEvent(event('pointermove', 740, 22));
    panel.dispatchEvent(event('pointerup', 740, 22));
    return { drag, release, returning, takeover };
  });
  expect(sample.drag.y).toBeCloseTo(40, 1);
  expect(sample.drag.opacity).toBeLessThan(1);
  expect(sample.release).toBeCloseTo(sample.drag.y, 1);
  expect(sample.returning).toBeGreaterThan(0);
  expect(sample.returning).toBeLessThan(sample.release);
  expect(sample.takeover).toBeCloseTo(sample.returning, 1);
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/history-quick-sheet-(returning|dragging)/);
  await page.locator('#historyQuickOpen').click();
  await page.waitForTimeout(300);
  expect(await page.locator('#historyQuickPanel').evaluate(panel => new DOMMatrix(getComputedStyle(panel).transform).m42)).toBeCloseTo(0, 1);
});

test('quick action retains its source without delaying or stacking feedback', async ({ page }) => {
  await open(page, 'income');
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await page.locator('#historyQuickOpen').dispatchEvent('click');
  await page.clock.runFor(300);
  const back = page.locator('[data-history-seconds="-900"]');
  await back.dispatchEvent('click');
  await expect(back).toHaveClass(/is-recent-source/);
  await page.clock.runFor(300);
  await back.dispatchEvent('click');
  await page.clock.runFor(200);
  await expect(back).toHaveClass(/is-recent-source/);
  const forward = page.locator('[data-history-seconds="900"]');
  await forward.dispatchEvent('click');
  await expect(page.locator('.is-recent-source')).toHaveCount(1);
  await expect(forward).toHaveClass(/is-recent-source/);
  await page.clock.runFor(440);
  await expect(page.locator('.is-recent-source')).toHaveCount(0);
});

test('saved readouts hand off only after closing without moving the card', async ({ page }) => {
  await open(page, 'income');
  const card = page.locator('#incomeSettingsCard');
  const before = await card.boundingBox();
  await page.locator('#incomeAmountInput').fill('12345');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  expect(await page.locator('#hourlyRateDisplay').evaluate(node => node.getAnimations().length)).toBe(0);
  await page.clock.runFor(700);
  await expect(page.locator('#settingsDialog')).toBeHidden();
  const feedback = await page.locator('#hourlyRateDisplay').evaluate(node => {
    const animation = node.getAnimations()[0];
    if (!animation) return null;
    animation.pause(); animation.currentTime = 80;
    return { duration: animation.effect.getTiming().duration, opacity: Number(getComputedStyle(node).opacity) };
  });
  expect(feedback?.duration).toBe(200);
  expect(feedback.opacity).toBeGreaterThan(.62);
  expect(feedback.opacity).toBeLessThan(1);
  const after = await card.boundingBox();
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);
  await card.dispatchEvent('click');
  expect(await page.locator('#hourlyRateDisplay').evaluate(node => node.getAnimations().length)).toBe(0);
});

test('wheel edges fade without changing the income roller or wheel geometry', async ({ page }) => {
  await open(page, 'schedule');
  const column = page.locator('.time-wheel-column').first();
  const mask = await column.evaluate(node => getComputedStyle(node).maskImage || getComputedStyle(node).webkitMaskImage);
  expect(mask).toContain('linear-gradient');
  expect(mask).toContain('14%');
  const amountMask = await page.locator('#flipContainer').evaluate(node => getComputedStyle(node).maskImage || getComputedStyle(node).webkitMaskImage);
  expect(amountMask).not.toBe(mask);
  await expect(column).toHaveAttribute('role', 'spinbutton');
});

test('scroll edge hints disappear at the boundary and after closing', async ({ page }) => {
  await open(page, 'schedule');
  const sheet = page.locator('.settings-sheet');
  await sheet.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
  await page.clock.runFor(32);
  await expect(sheet).not.toHaveClass(/has-scroll-above/);
  await expect(sheet).toHaveClass(/has-scroll-below/);
  await sheet.evaluate(node => { node.scrollTop = node.scrollHeight; node.dispatchEvent(new Event('scroll')); });
  await page.clock.runFor(32);
  await expect(sheet).toHaveClass(/has-scroll-above/);
  await expect(sheet).not.toHaveClass(/has-scroll-below/);
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await expect(sheet).not.toHaveClass(/has-scroll-(above|below)/);
});

async function open(page, kind) {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-10-05T06:00:00Z') });
  await page.goto(appPath);
  await page.waitForTimeout(1200);
  await page.locator(`#${kind}SettingsCard`).focus();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
  await page.clock.runFor(600);
}

test('scrollbar reveal runs after handoff without changing the gutter', async ({ page }) => {
  await open(page, 'schedule');
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await page.locator('#scheduleSettingsCard').dispatchEvent('click');
  await page.clock.runFor(300);
  const read = () => page.locator('.settings-sheet').evaluate(sheet => ({ reveal: Number(getComputedStyle(sheet).getPropertyValue('--settings-scrollbar-reveal')), width: sheet.clientWidth }));
  const early = await read();
  expect(early.reveal).toBe(0);
  await page.clock.runFor(80);
  await page.locator('.settings-sheet').evaluate(sheet => {
    const animation = sheet.getAnimations().find(item => item.transitionProperty === '--settings-scrollbar-reveal');
    if (!animation) throw new Error('Scrollbar reveal transition missing');
    animation.pause();
    animation.currentTime = 64;
  });
  const middle = await read();
  expect(middle.reveal).toBeGreaterThan(0);
  expect(middle.reveal).toBeLessThan(1);
  await page.locator('.settings-sheet').evaluate(sheet => sheet.getAnimations().forEach(animation => animation.finish()));
  const end = await read();
  expect(end.reveal).toBe(1);
  expect(end.width).toBe(early.width);
});

test('income selection reverses from the current position and keeps editor geometry', async ({ page }) => {
  await open(page, 'income');
  await page.locator('#incomeAmountInput').focus();
  const before = await page.locator('#incomeAmountInput').boundingBox();
  await page.locator('[data-income-mode="fixed-daily"]').dispatchEvent('click');
  await page.locator('.income-mode-indicator').evaluate(el => { const animation = el.getAnimations()[0]; animation.pause(); animation.currentTime = 64; });
  const left = () => page.locator('.income-mode-indicator').evaluate(el => el.getBoundingClientRect().left);
  const moving = await left();
  await page.evaluate(() => {
    document.querySelector('[data-income-mode="annual-average"]').click();
    const animation = document.querySelector('.income-mode-indicator').getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
  });
  expect(Math.abs(await left() - moving)).toBeLessThan(1);
  await page.locator('.income-mode-indicator').evaluate(el => el.getAnimations().forEach(animation => animation.finish()));
  await page.clock.runFor(220);
  const target = await page.locator('[data-income-mode="annual-average"]').boundingBox();
  expect(Math.abs(await left() - target.x)).toBeLessThan(1);
  await expect(page.locator('#incomeAmountInput')).toBeFocused();
  expect(await page.locator('#incomeAmountInput').boundingBox()).toEqual(before);
  expect(await page.locator('.income-mode-indicator').evaluate(el => el.getAnimations().length)).toBe(0);
});

test('calendar height, opacity and arrow use one reversible progress', async ({ page }) => {
  await open(page, 'schedule');
  const toggle = page.locator('#calendarDataToggle');
  await toggle.dispatchEvent('click');
  await page.locator('#calendarDataSection').evaluate(el => { const animation = el.getAnimations()[0]; animation.pause(); animation.currentTime = 64; });
  const read = () => page.locator('#calendarDataSection').evaluate(section => {
    const content = section.querySelector('.settings-data-content');
    const arrow = section.querySelector('.settings-data-chevron');
    return { progress: Number(getComputedStyle(section).getPropertyValue('--calendar-reveal')), opacity: Number(getComputedStyle(content).opacity), height: content.getBoundingClientRect().height, full: content.firstElementChild.getBoundingClientRect().height, angle: Math.atan2(new DOMMatrix(getComputedStyle(arrow).transform).b, new DOMMatrix(getComputedStyle(arrow).transform).a) * 180 / Math.PI };
  });
  const before = await read();
  expect(before.progress).toBeGreaterThan(0);
  expect(before.progress).toBeLessThan(1);
  expect(before.opacity).toBeCloseTo(before.progress, 3);
  expect(before.height / before.full).toBeCloseTo(before.progress, 2);
  const angle = ((before.angle - 45 + 360) % 360) / 180;
  expect(angle).toBeCloseTo(before.progress, 2);
  await page.evaluate(() => {
    document.querySelector('#calendarDataToggle').click();
    const animation = document.querySelector('#calendarDataSection').getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
  });
  const reversed = await read();
  expect(reversed.progress).toBeCloseTo(before.progress, 3);
  await page.locator('#calendarDataSection').evaluate(el => el.getAnimations().forEach(animation => animation.finish()));
  await page.clock.runFor(400);
  expect((await read()).progress).toBe(0);
  await expect(page.locator('#calendarDataContent')).toHaveAttribute('aria-hidden', 'true');
  await toggle.dispatchEvent('click');
  await page.locator('#calendarDataSection').evaluate(el => el.getAnimations().forEach(animation => animation.finish()));
  await page.clock.runFor(400);
  expect((await read()).progress).toBe(1);
  const settled = await read();
  expect(Math.abs(settled.height - settled.full)).toBeLessThan(1);
});

test('correcting an error preserves its icon and space until fade finishes', async ({ page }) => {
  await open(page, 'income');
  await page.locator('#incomeAmountInput').fill('0');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  const error = page.locator('#incomeAmountError');
  await expect(error).not.toHaveAttribute('hidden', '');
  const before = await error.boundingBox();
  await page.locator('#incomeAmountInput').fill('7500');
  await page.clock.runFor(64);
  const during = await error.evaluate(el => ({ opacity: Number(getComputedStyle(el).opacity), icon: getComputedStyle(el, '::before').content, height: el.getBoundingClientRect().height, text: el.textContent }));
  expect(during.opacity).toBeGreaterThan(0);
  expect(during.opacity).toBeLessThan(1);
  expect(during.icon).toBe('"!"');
  expect(during.height).toBeCloseTo(before.height, 1);
  expect(during.text).not.toBe('');
  await page.clock.runFor(180);
  await expect(error).toHaveText('');
  await expect(page.locator('#settingsSaveButton')).toBeEnabled();
});
