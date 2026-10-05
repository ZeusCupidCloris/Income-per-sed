const { test, expect } = require('@playwright/test');

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
    test(`${kind}: scrollbar paint waits for shell handoff at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.clock.install({ time: new Date('2026-10-05T06:00:00Z') });
      await page.goto('/Income-per-sed-Develop.html');
      await page.waitForTimeout(1200);
      await page.locator(`#${kind}SettingsCard`).focus();
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      let moving;
      for (const elapsed of [48, 100, 120]) {
        await page.clock.runFor(elapsed);
        moving = await readSheet(page);
        expect(moving.active).toBe(true);
        expect(moving.overflow).toBe('auto');
        if (moving.scrollbar !== undefined) expect(moving.scrollbar).toBe('rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)');
        expect(moving.thumb).toBe('rgba(0, 0, 0, 0)');
        expect(moving.track).toBe('rgba(0, 0, 0, 0)');
      }
      if (kind === 'schedule') expect(moving.scrollHeight).toBeGreaterThan(moving.height);
      await page.clock.runFor(400);
      const settled = await readSheet(page);
      expect(settled.active).toBe(false);
      if (settled.scrollbar !== undefined) expect(settled.scrollbar).not.toBe(moving.scrollbar);
      expect(settled.thumb).not.toBe(moving.thumb);
      expect(settled.width).toBe(moving.width);
      expect(settled.height).toBe(moving.height);
      if (kind === 'schedule') {
        const scrollTop = await page.locator('.settings-sheet').evaluate(sheet => {
          sheet.scrollTop = 80;
          return sheet.scrollTop;
        });
        expect(scrollTop).toBeGreaterThan(0);
      }
      await page.keyboard.press('Escape');
      await page.clock.runFor(100);
      expect((await readSheet(page)).thumb).toBe(moving.thumb);
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      await page.clock.runFor(600);
      expect((await readSheet(page)).active).toBe(false);
      await expect(page.locator('.income-shared-shell')).toHaveCount(0);
    });
  }
}

test('reduced motion keeps the settled scrollbar and scroll container', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.locator('#scheduleSettingsCard').click();
  const sheet = await readSheet(page);
  expect(sheet.active).toBe(false);
  expect(sheet.overflow).toBe('auto');
  expect(sheet.scrollHeight).toBeGreaterThan(sheet.height);
  expect(sheet.scrollbar).not.toBe('rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)');
  expect(sheet.thumb).not.toBe('rgba(0, 0, 0, 0)');
});
