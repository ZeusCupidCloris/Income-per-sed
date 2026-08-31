const { test, expect } = require('@playwright/test');

const APP_PATH = '/Income-per-sed-Push.html';
const FIXED_TIME = new Date('2026-08-03T02:39:00.000Z');
const CLOCK_START = new Date(FIXED_TIME.getTime() - 60_000);

async function openApp(page, theme = 'light') {
  await page.clock.install({ time: CLOCK_START });
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('income-per-sed-theme-v1', selectedTheme);
  }, theme);
  await page.goto(APP_PATH, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#incomeMainCard')).toBeVisible();
  await page.clock.pauseAt(FIXED_TIME);
}

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function settle(page, duration = 1800) {
  await page.clock.runFor(duration);
  if (await page.locator('#visual-test-freeze').count() === 0) {
    await page.addStyleTag({
      id: 'visual-test-freeze',
      content: `
        *, *::before, *::after {
          animation: none !important;
          caret-color: transparent !important;
          transition: none !important;
        }
      `,
    });
  }
  await page.clock.runFor(34);
}

test('desktop light visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page, 'light');
  await expectNoHorizontalOverflow(page);
  await settle(page);
  await expect(page).toHaveScreenshot('desktop-light.png', { fullPage: true });
});

test('desktop dark visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoHorizontalOverflow(page);
  await settle(page);
  await expect(page).toHaveScreenshot('desktop-dark.png', { fullPage: true });
});

test('mobile page and quick history panel stay inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, 'light');
  await expectNoHorizontalOverflow(page);
  await settle(page);
  await expect(page).toHaveScreenshot('mobile-light.png', { fullPage: true });

  await page.locator('#historyQuickOpen').click();
  const panel = page.locator('#historyQuickPanel');
  await expect(panel).toBeVisible();
  await expect(page.locator('#historyQuickOpen')).toHaveAttribute('aria-expanded', 'true');

  const bounds = await panel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
  expect(bounds.y).toBeGreaterThanOrEqual(-1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(845);
  await settle(page, 320);
  await expect(page).toHaveScreenshot('mobile-history-panel.png', { fullPage: false });
});

test('quick history icon uses bounded one-shot motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, 'light');

  const historyButton = page.locator('#historyQuickOpen');
  await historyButton.click();
  await expect(historyButton).toHaveAttribute('aria-expanded', 'true');
  const historyMotion = await historyButton.evaluate((button) => ({
    source: button.querySelector('svg')?.dataset.iconSource,
    arrow: getComputedStyle(button.querySelector('.history-motion-arrow')).transform,
    minute: getComputedStyle(button.querySelector('.history-motion-minute')).transform,
    hourAnimation: getComputedStyle(button.querySelector('.history-motion-hour')).animationName,
  }));
  expect(historyMotion.source).toBe('lucide-animated-history');
  expect(historyMotion.arrow).not.toBe('none');
  expect(historyMotion.minute).not.toBe('none');
  expect(historyMotion.hourAnimation).toBe('history-motion-rewind');
});

test('calendar disclosure icon uses bounded one-shot motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page, 'light');
  await page.locator('#incomeSettingsCard').click();
  const calendarToggle = page.locator('#calendarDataToggle');
  await expect(calendarToggle).toBeVisible();
  await calendarToggle.click();
  await expect(calendarToggle).toHaveAttribute('aria-expanded', 'true');
  const calendarMotion = await calendarToggle.evaluate((button) => ({
    source: button.querySelector('[data-icon-source]')?.dataset.iconSource,
    bindings: getComputedStyle(button.querySelector('.iconsax-calendar-bindings')).transform,
    dots: getComputedStyle(button.querySelector('.iconsax-calendar-dots')).transform,
  }));
  expect(calendarMotion.source).toBe('iconsax-calendar-linear');
  expect(calendarMotion.bindings).not.toBe('none');
  expect(calendarMotion.dots).not.toBe('none');
});

test('editable card optics follow a fine pointer without changing layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page, 'light');

  const card = page.locator('#incomeSettingsCard');
  const before = await card.boundingBox();
  expect(before).not.toBeNull();
  await page.mouse.move(before.x + before.width * 0.72, before.y + before.height * 0.32);
  await expect(card).toHaveAttribute('data-kinetic-optic-active', 'true');
  await page.clock.runFor(34);

  const optics = await card.evaluate((element) => ({
    x: element.style.getPropertyValue('--editable-optic-x'),
    y: element.style.getPropertyValue('--editable-optic-y'),
  }));
  expect(Number.parseFloat(optics.x)).toBeGreaterThan(before.width * 0.65);
  expect(Number.parseFloat(optics.y)).toBeGreaterThan(0);

  const after = await card.boundingBox();
  expect(after.width).toBeCloseTo(before.width, 1);
  expect(after.height).toBeCloseTo(before.height, 1);
  await settle(page, 240);
  await expect(card).toHaveScreenshot('income-settings-pointer-optics.png');
});

for (const width of [390, 768, 1440, 2560]) {
  test(`layout remains centered without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 768 ? 1000 : 1440 });
    await openApp(page, 'light');
    await expectNoHorizontalOverflow(page);

    const card = await page.locator('#incomeMainCard').boundingBox();
    expect(card).not.toBeNull();
    const leftSpace = card.x;
    const rightSpace = width - card.x - card.width;
    expect(Math.abs(leftSpace - rightSpace)).toBeLessThanOrEqual(3);
  });
}
