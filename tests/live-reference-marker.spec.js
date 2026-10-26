const {test, expect} = require('@playwright/test');
const {fullDisplay} = require('./helpers/display-state');

async function openHistory(page) {
  await page.locator('#historyQuickOpen').click();
  await page.clock.runFor(700);
  await page.waitForFunction(() => {
    const panel = document.getElementById('historyQuickPanel');
    return !panel.inert && !panel.hasAttribute('data-entry-animating');
  });
}

for (const version of ['Develop', 'Push']) {
  for (const theme of ['light', 'dark']) {
    for (const width of [1440, 390]) {
      test(`${version} ${theme} ${width}: historical live reference retains its color and lifecycle`, async ({page}) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({width, height: width === 390 ? 844 : 1000});
        await page.emulateMedia({colorScheme: theme, reducedMotion: 'no-preference'});
        await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
        await page.clock.install({time: new Date('2026-10-20T07:44:00.000Z')});
        await page.goto(`/Income-per-sed-${version}.html`);
        await fullDisplay(page);
        await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
        await page.clock.runFor(1200);
        const reference = page.locator('#dialRealMarker');
        const mark = reference.locator('span');
        await expect(reference).toHaveCSS('opacity', '0');
        await openHistory(page);
        await page.locator('#historyDialTime').fill('10:00:00');
        await page.locator('#historyDialTime').press('Enter');
        for (let elapsed = 0; elapsed < 5000 && await page.locator('body').getAttribute('data-timeline-state') !== 'history-hold'; elapsed += 200) await page.clock.runFor(200);
        await expect(page.locator('body')).toHaveAttribute('data-timeline-state', 'history-hold');
        await page.locator('#historyQuickClose').click();
        await page.clock.runFor(700);
        await expect(reference).toHaveCSS('opacity', '0.2');
        await expect(mark).toHaveCSS('border-top-style', 'solid');
        await expect(mark).toHaveCSS('border-top-width', '1px');
        await expect(mark).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        expect(await mark.evaluate(node => getComputedStyle(node).getPropertyValue('--needle-red').trim())).not.toBe('');
        const heldText = await page.locator('#currentTime').textContent();
        const angle = await reference.evaluate(node => node.style.transform);
        await page.clock.runFor(1400);
        await expect(page.locator('#currentTime')).toHaveText(heldText);
        expect(await reference.evaluate(node => node.style.transform)).not.toBe(angle);
        await openHistory(page);
        await page.locator('#historyQuickPanel [data-history-action="live"]').click();
        for (let elapsed = 0; elapsed < 5000 && await page.locator('body').getAttribute('data-timeline-state') !== 'live'; elapsed += 200) await page.clock.runFor(200);
        await expect(page.locator('body')).toHaveAttribute('data-timeline-state', 'live');
        await expect(reference).toHaveCSS('opacity', '0');
        expect(errors).toEqual([]);
      });
    }
  }
}
