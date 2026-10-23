const { test, expect } = require('@playwright/test');
const { fullDisplay } = require('./helpers/display-state');
test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

for (const version of ['Develop', 'Push']) {
  async function open(page) {
    await page.clock.install({ time: new Date('2026-10-22T15:45:30+08:00') });
    await page.goto(`/Income-per-sed-${version}.html`);
    await fullDisplay(page);
    await page.locator('#historyQuickOpen').click();
    await page.waitForFunction(() => !document.querySelector('#historyQuickPanel').hasAttribute('data-entry-animating'));
    return page.locator('#historyDialTrack').boundingBox();
  }
  const point = (box, hour) => ({ x: box.x + box.width / 2 + Math.sin(hour / 24 * Math.PI * 2) * box.width * .4, y: box.y + box.height / 2 - Math.cos(hour / 24 * Math.PI * 2) * box.height * .4 });
  test(`${version} emulated mobile native touch tap selects the event-mapped minute`, async ({ page }) => {
    const box = await open(page);
    const p = point(box, 10);
    await page.locator('#historyDialTrack').evaluate(node => {
      node.addEventListener('pointerdown', event => {
        const r = node.getBoundingClientRect();
        window.__touchPoint = { x: event.clientX, y: event.clientY, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
      }, { once: true });
    });
    await page.touchscreen.tap(p.x, p.y);
    const expected = await page.evaluate(() => {
      const { x, y, cx, cy } = window.__touchPoint;
      const turns = (Math.atan2(x - cx, cy - y) / (Math.PI * 2) + 1) % 1;
      const minutes = Math.min(1439, Math.round(turns * 1440));
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`;
    });
    await expect(page.locator('#historyDialTime')).toHaveValue(expected);
    await test.info().attach('native-point', { body: JSON.stringify(await page.evaluate(() => ({ ...window.__touchPoint, actual: document.querySelector('#historyDialTime').value }))), contentType: 'application/json' });
    await expect(page.locator('body')).toHaveAttribute('data-timeline-state', 'history-hold');
    await expect(page.locator('#historyDialTrack')).not.toHaveAttribute('data-dragging');
  });
  test(`${version} emulated mobile native touch drag is continuous`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Native multi-event touch dispatch requires the Chromium debugging protocol; a physical device is still unverified.');
    const box = await open(page);
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(box, 8)] });
      for (let i = 1; i <= 20; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(box, 8 + i * .15)] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(page.locator('#historyDialTime')).toHaveValue('11:00:00');
      await expect(page.locator('body')).toHaveAttribute('data-timeline-state', 'history-hold');
      await expect(page.locator('#historyDialTrack')).not.toHaveAttribute('data-dragging');
      expect(await page.evaluate(() => scrollY)).toBe(0);
    } finally { await cdp.detach(); }
  });
}
