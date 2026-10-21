const { test, expect } = require('@playwright/test');
const { fullDisplay } = require('./helpers/display-state');

async function readSheet(page) {
  return page.locator('.settings-sheet').evaluate(sheet => {
    const style = getComputedStyle(sheet);
    const thumb = getComputedStyle(sheet, '::-webkit-scrollbar-thumb');
    const track = getComputedStyle(sheet, '::-webkit-scrollbar-track');
    return {
      active: sheet.closest('.settings-dialog').classList.contains('income-shared-active'),
      scrollbar: style.scrollbarColor,
      thumb: thumb.backgroundColor,
      track: track.backgroundColor,
      width: sheet.clientWidth,
      height: sheet.clientHeight,
      scrollHeight: sheet.scrollHeight,
      overflow: style.overflowY,
    };
  });
}

for (const kind of ['schedule', 'income']) {
  for (const viewport of [{ width: 390, height: 640 }, { width: 1440, height: 640 }]) {
    test(`${kind}: complete panel stays scrollbar-free through handoff at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.clock.install({ time: new Date('2026-10-05T06:00:00Z') });
      await page.goto('/Income-per-sed-Develop.html');
      await fullDisplay(page);
      await page.locator(`#${kind}SettingsCard`).focus();
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      let moving;
      for (const elapsed of [48, 100, 120]) {
        await page.clock.runFor(elapsed);
        moving = await readSheet(page);
        expect(moving.active).toBe(true);
        expect(moving.overflow).toBe(kind === 'schedule' ? 'auto' : 'hidden');
        expect(moving.scrollHeight).toBeLessThanOrEqual(moving.height + 1);
      }
      await page.clock.runFor(400);
      const settled = await readSheet(page);
      expect(settled.active).toBe(false);
      expect(settled.width).toBe(moving.width);
      expect(settled.height).toBe(moving.height);
      expect(settled.scrollHeight).toBeLessThanOrEqual(settled.height + 1);
      await expect(page.locator('#settingsSaveButton')).toBeInViewport();
      if (kind === 'schedule') {
        await expect(page.locator('[data-time-key]')).toHaveCount(4);
        await expect(page.locator('#calendarDataSection')).toBeInViewport();
      }
      await page.keyboard.press('Escape');
      await page.clock.runFor(100);
      expect((await readSheet(page)).overflow).toBe(kind === 'schedule' ? 'auto' : 'hidden');
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      await page.clock.runFor(600);
      expect((await readSheet(page)).active).toBe(false);
      await expect(page.locator('.income-shared-shell')).toHaveCount(0);
    });
  }
}

test('reduced motion exposes the complete schedule without scrolling or disclosures', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Income-per-sed-Develop.html');
  await fullDisplay(page);
  await page.locator('#scheduleSettingsCard').click();
  const sheet = await readSheet(page);
  expect(sheet.active).toBe(false);
  expect(sheet.overflow).toBe('auto');
  expect(sheet.scrollHeight).toBeLessThanOrEqual(sheet.height + 1);
  await expect(page.locator('#scheduleSettingsPanel details')).toHaveCount(0);
  await expect(page.locator('#settingsSaveButton')).toBeInViewport();
  await expect(page.locator('#calendarDataSection')).toBeInViewport();
});
