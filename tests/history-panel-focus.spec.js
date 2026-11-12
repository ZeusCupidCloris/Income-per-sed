const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady } = require('./helpers/display-state');

const time = new Date('2026-10-22T15:45:30+08:00');

async function load(page, channel, width) {
  await page.setViewportSize({ width, height: 892 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.setFixedTime(time);
  await page.goto(`/Income-per-sed-${channel}.html`);
  await fullDisplay(page);
}

async function open(page) {
  await page.locator('#historyQuickOpen').click();
  const panel = page.locator('#historyQuickPanel');
  await expect(panel).toBeVisible();
  await expect(panel).not.toHaveAttribute('data-entry-animating');
  await expect(panel).toBeFocused();
  return panel;
}

test.beforeEach(async ({ page }) => {
  page.__focusErrors = [];
  page.on('pageerror', error => page.__focusErrors.push(error.message));
  page.on('crash', () => page.__focusErrors.push('page crashed'));
});
test.afterEach(async ({ page }) => { expect(page.__focusErrors).toEqual([]); });

for (const channel of ['Develop', 'Push']) {
  test(`${channel}: panel focus returns after narrow close button and backdrop`, async ({ page }) => {
    await load(page, channel, 390);
    for (const action of ['button', 'backdrop']) {
      const panel = await open(page);
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      if (action === 'button') await page.locator('#historyQuickClose').click();
      // Isolate backdrop click handling from the outside-pointer close path.
      else await page.locator('#historyQuickBackdrop').dispatchEvent('click');
      await expect(panel).toBeHidden();
      await expect(page.locator('#historyQuickOpen')).toBeFocused();
    }
  });

  test(`${channel}: panel focus preserves an outside pointer target on desktop`, async ({ page }) => {
    await load(page, channel, 854);
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'outsideFocusTarget';
      input.setAttribute('aria-label', 'outside focus target');
      Object.assign(input.style, { position: 'fixed', left: '0', top: '0', width: '80px', height: '30px', zIndex: '20000' });
      document.body.appendChild(input);
    });
    const panel = await open(page);
    await expect(panel).toHaveAttribute('aria-modal', 'false');
    await page.locator('#outsideFocusTarget').click();
    await expect(panel).toBeHidden();
    await expect(page.locator('#outsideFocusTarget')).toBeFocused();
  });

  test(`${channel}: panel focus does not steal focus from newly opened settings`, async ({ page }) => {
    await load(page, channel, 854);
    const panel = await open(page);
    const card = page.getByRole('button', { name: '\u4fee\u6539\u6536\u5165\u8ba1\u7b97\u65b9\u5f0f\u548c\u5de5\u8d44\u91d1\u989d', exact: true });
    await card.focus();
    await card.press('Enter');
    await settingsReady(page);
    await expect(panel).toBeHidden();
    expect(await page.evaluate(() => document.getElementById('settingsDialog').contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await expect(card).toBeFocused();
  });

  test(`${channel}: panel focus consumes history shortcuts until Escape closes`, async ({ page }) => {
    await load(page, channel, 390);
    const panel = await open(page);
    await page.locator('[data-history-seconds="-900"]').click();
    const body = page.locator('body');
    await expect(body).toHaveAttribute('data-timeline-state', 'history-hold');
    await panel.focus();
    const selected = await page.locator('#historyDialTime').inputValue();
    for (const key of ['Home', 'ArrowLeft', 'ArrowRight', 'End']) {
      await page.keyboard.press(key);
      await expect(body).toHaveAttribute('data-timeline-state', 'history-hold');
      await expect(page.locator('#historyDialTime')).toHaveValue(selected);
    }
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page.locator('#historyQuickOpen')).toBeFocused();
    await expect(body).toHaveAttribute('data-timeline-state', 'history-hold');
    await page.keyboard.press('Home');
    await expect(body).toHaveAttribute('data-timeline-state', 'live');
  });

  test(`${channel}: panel focus survives close-to-open reversal`, async ({ page }) => {
    await load(page, channel, 390);
    const panel = await open(page);
    await page.evaluate(() => {
      document.getElementById('historyQuickClose').click();
      document.getElementById('historyQuickOpen').click();
    });
    await expect(page.locator('#historyQuickOpen')).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).not.toHaveAttribute('data-entry-animating');
    await expect(panel).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page.locator('#historyQuickOpen')).toBeFocused();
  });
}
