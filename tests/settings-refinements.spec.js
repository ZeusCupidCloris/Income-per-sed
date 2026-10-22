const { test, expect } = require('@playwright/test');
const { fullDisplay, discardSettings } = require('./helpers/display-state');
const appPath = process.env.SETTINGS_RELEASE_CHANNEL === 'push' ? '/Income-per-sed-Push.html' : '/Income-per-sed-Develop.html';

test('mobile quick history restores cancelled drags and supports explicit and swipe closing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(appPath);
  await fullDisplay(page);
  await page.locator('#historyQuickOpen').click();
  await expect(page.locator('#historyQuickPanel')).not.toHaveAttribute('data-entry-animating');
  const before = await page.locator('#historyQuickPanel').boundingBox();
  await page.evaluate(() => {
    const panel = document.querySelector('#historyQuickPanel');
    const grabber = document.querySelector('#historyQuickGrabber');
    const event = (type, y, id = 21) => new PointerEvent(type, { pointerId: id, pointerType: 'touch', button: 0, clientX: 180, clientY: y, bubbles: true });
    grabber.dispatchEvent(event('pointerdown', 500));
    panel.dispatchEvent(event('pointermove', 540));
    panel.dispatchEvent(event('pointercancel', 540));
  });
  await expect(page.locator('body')).not.toHaveClass(/history-quick-sheet-(returning|dragging)/);
  const after = await page.locator('#historyQuickPanel').boundingBox();
  for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(after[key] - before[key])).toBeLessThan(0.5);
  await expect(page.locator('#historyQuickPanel')).toBeVisible();
  await page.locator('#historyQuickClose').click();
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/history-quick-sheet-(returning|dragging)/);
  await page.locator('#historyQuickOpen').click();
  await expect(page.locator('#historyQuickPanel')).not.toHaveAttribute('data-entry-animating');
  await page.evaluate(() => {
    const panel = document.getElementById('historyQuickPanel');
    const event = (type, y) => new PointerEvent(type, { pointerId: 22, pointerType: 'touch', button: 0, clientX: 180, clientY: y, bubbles: true });
    document.getElementById('historyQuickGrabber').dispatchEvent(event('pointerdown', 540));
    panel.dispatchEvent(event('pointermove', 740));
    panel.dispatchEvent(event('pointerup', 740));
  });
  await expect(page.locator('#historyQuickPanel')).toBeHidden();
  await expect(page.locator('#historyQuickOpen')).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/history-quick-sheet-(returning|dragging)/);
});

test('quick action retains its source without delaying or stacking feedback', async ({ page }) => {
  await open(page, 'income');
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await page.locator('#historyQuickOpen').dispatchEvent('click');
  await page.clock.runFor(600);
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
  const column = page.locator('.time-wheel-column:not(:focus-visible)').first();
  const mask = await column.evaluate(node => getComputedStyle(node).maskImage || getComputedStyle(node).webkitMaskImage);
  expect(mask).toContain('linear-gradient');
  expect(mask).toContain('14%');
  const amountMask = await page.locator('#flipContainer').evaluate(node => getComputedStyle(node).maskImage || getComputedStyle(node).webkitMaskImage);
  expect(amountMask).not.toBe(mask);
  await expect(column).toHaveAttribute('role', 'spinbutton');
});

test('complete schedule stays inside its panel without scroll edge hints', async ({ page }) => {
  await open(page, 'schedule');
  const sheet = page.locator('.settings-sheet');
  await sheet.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
  await page.clock.runFor(32);
  await expect(sheet).not.toHaveClass(/has-scroll-above/);
  await expect(sheet).not.toHaveClass(/has-scroll-below/);
  expect(await sheet.evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
  await sheet.evaluate(node => { node.scrollTop = node.scrollHeight; node.dispatchEvent(new Event('scroll')); });
  await page.clock.runFor(32);
  await expect(sheet).not.toHaveClass(/has-scroll-above/);
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
  await fullDisplay(page);
  await page.locator(`#${kind}SettingsCard`).focus();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
  await page.clock.runFor(600);
}

test('schedule keeps all controls visible after shell handoff without a gutter', async ({ page }) => {
  await open(page, 'schedule');
  await page.keyboard.press('Escape');
  await page.clock.runFor(600);
  await page.locator('#scheduleSettingsCard').dispatchEvent('click');
  await page.clock.runFor(300);
  const read = () => page.locator('.settings-sheet').evaluate(sheet => ({ width: sheet.clientWidth, overflow: sheet.scrollHeight - sheet.clientHeight, scrollbar: getComputedStyle(sheet).scrollbarWidth }));
  const early = await read();
  expect(early.overflow).toBeLessThanOrEqual(1);
  expect(early.scrollbar).toBe('none');
  await page.clock.runFor(400);
  const end = await read();
  expect(end.overflow).toBeLessThanOrEqual(1);
  expect(end.scrollbar).toBe('none');
  expect(end.width).toBe(early.width);
  await expect(page.locator('#settingsSaveButton')).toBeInViewport();
  await expect(page.locator('#calendarDataSection')).toBeInViewport();
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

test('inline calendar tools stay exposed without an arrow or height transition', async ({ page }) => {
  await open(page, 'schedule');
  const read = () => page.locator('#calendarDataSection').evaluate(section => {
    const content = section.querySelector('#calendarDataContent');
    return { height: content.getBoundingClientRect().height, full: content.firstElementChild.getBoundingClientRect().height, top: section.getBoundingClientRect().top, transform: getComputedStyle(content.firstElementChild).transform, inert: content.inert };
  });
  const before = await read();
  await expect(page.locator('#calendarDataToggle, .settings-data-chevron')).toHaveCount(0);
  for (const id of ['calendarExportButton', 'calendarImportButton', 'calendarResetButton']) {
    await page.locator(`#${id}`).focus();
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await page.clock.runFor(64);
    const during = await read();
    expect(during.inert).toBe(false);
    expect(during.transform).toBe('none');
    expect(Math.abs(during.top - before.top)).toBeLessThan(1);
    expect(Math.abs(during.height - during.full)).toBeLessThan(1);
  }
});

test('correcting an error preserves its icon and space until fade finishes', async ({ page }) => {
  await open(page, 'income');
  await page.locator('#incomeAmountInput').fill('0');
  await page.locator('#settingsSaveButton').dispatchEvent('click');
  const error = page.locator('#incomeAmountError');
  await expect(error).not.toHaveAttribute('hidden', '');
  await expect.poll(() => error.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  const before = await error.boundingBox();
  const during = await page.evaluate(() => {
    const el = document.querySelector('#incomeAmountError');
    const input = document.querySelector('#incomeAmountInput');
    input.value = '7500';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    getComputedStyle(el).opacity;
    const fade = el.getAnimations().find(animation => animation.transitionProperty === 'opacity');
    if (!fade) throw new Error('Error correction opacity transition was not created');
    fade.pause();
    fade.currentTime = 64;
    const sample = { opacity: Number(getComputedStyle(el).opacity), icon: getComputedStyle(el, '::before').content, height: el.getBoundingClientRect().height, text: el.textContent };
    fade.finish();
    return sample;
  });
  expect(during.opacity).toBeGreaterThan(0);
  expect(during.opacity).toBeLessThan(1);
  expect(during.icon).toBe('"!"');
  expect(during.height).toBeCloseTo(before.height, 1);
  expect(during.text).not.toBe('');
  await page.clock.runFor(180);
  await expect(error).toHaveText('');
  await expect(page.locator('#settingsSaveButton')).toBeEnabled();
});
