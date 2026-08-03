const { test, expect } = require('@playwright/test');

const APP_PATH = '/Income-per-sed-Push.html';
const FIXED_TIME = new Date('2026-08-03T02:39:00.000Z');

async function openApp(page, theme = 'light') {
  await page.clock.setFixedTime(FIXED_TIME);
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('income-per-sed-theme-v1', selectedTheme);
  }, theme);
  await page.goto(APP_PATH, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#incomeMainCard')).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function setLifecycleState(page, state) {
  const session = await page.context().newCDPSession(page);
  await session.send('Page.setWebLifecycleState', { state });
  await session.detach();
}

async function settleAndFreeze(page) {
  await page.waitForTimeout(1800);
  await setLifecycleState(page, 'frozen');
}

test('desktop light visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page, 'light');
  await expectNoHorizontalOverflow(page);
  await settleAndFreeze(page);
  await expect(page).toHaveScreenshot('desktop-light.png', { fullPage: true });
});

test('desktop dark visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoHorizontalOverflow(page);
  await settleAndFreeze(page);
  await expect(page).toHaveScreenshot('desktop-dark.png', { fullPage: true });
});

test('mobile page and quick history panel stay inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page, 'light');
  await expectNoHorizontalOverflow(page);
  await settleAndFreeze(page);
  await expect(page).toHaveScreenshot('mobile-light.png', { fullPage: true });

  await setLifecycleState(page, 'active');
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
  await settleAndFreeze(page);
  await expect(page).toHaveScreenshot('mobile-history-panel.png', { fullPage: false });
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
