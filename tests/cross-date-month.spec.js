const { test, expect } = require('@playwright/test');

for (const channel of ['Develop', 'Push']) {
  for (const [label, start, end, sameMonth] of [
    ['next working day', '2026-09-07T07:30:00Z', '2026-09-08T02:30:00Z', true],
    ['holiday month boundary', '2026-09-30T07:30:00Z', '2026-10-01T02:30:00Z', false],
    ['working month boundary', '2026-08-31T07:30:00Z', '2026-09-01T02:30:00Z', false],
  ]) {
    test(`${channel}: month recovery ${label} never double counts the previous day`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.clock.install({ time: new Date(start) });
      await page.goto(`/Income-per-sed-${channel}.html`);
      await page.waitForTimeout(2200);
      const read = () => ({ month: Number(document.querySelector('#monthIncome').textContent.replace(/[^\d.]/g, '')),
        active: document.body.classList.contains('foreground-catchup-active') });
      const before = await page.evaluate(read);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.clock.fastForward(new Date(end) - new Date(start));
      await page.evaluate(() => {
        delete document.hidden; delete document.visibilityState;
        document.dispatchEvent(new Event('visibilitychange'));
      });
      const frames = [];
      for (let i = 0; i < 65; i++) {
        await page.waitForTimeout(40);
        frames.push(await page.evaluate(read));
      }
      await testInfo.attach('month-recovery.json', { body: JSON.stringify({ before, frames }), contentType: 'application/json' });
      expect(frames.filter(f => f.active).length).toBeGreaterThan(5);
      expect(frames.at(-1).active).toBe(false);
      const from = sameMonth ? before.month : 0;
      const target = frames.at(-1).month;
      for (const f of frames) {
        expect(f.month).toBeGreaterThanOrEqual(Math.min(from, target) - .02);
        expect(f.month).toBeLessThanOrEqual(Math.max(from, target) + .02);
      }
      for (let i = 1; i < frames.length; i++) expect(frames[i].month).toBeGreaterThanOrEqual(frames[i - 1].month - .02);
      await page.reload();
      await page.waitForTimeout(2200);
      expect(Math.abs((await page.evaluate(read)).month - target)).toBeLessThan(.15);
    });
  }
}
