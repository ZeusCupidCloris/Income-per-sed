const { test, expect } = require('@playwright/test');
const { prepareRecovery, resumeAt, setHidden, readRecovery, sampleRecovery, expectedMonth } = require('./helpers/background-recovery');

for (const channel of process.env.DEVELOP_PREVIEW === '1' ? ['Develop'] : ['Develop', 'Push']) {
 for (const mode of ['fixed-monthly', 'annual-average', 'fixed-daily']) {
  for (const action of ['hide again', 'history takeover']) {
    test(`${channel}: ${mode} cross-date recovery supports ${action}`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await prepareRecovery(page, channel, mode, '2026-09-07T07:30:00Z');
      await resumeAt(page, '2026-09-08T02:30:00Z');
      await page.clock.runFor(320);
      const before = await page.evaluate(readRecovery);
      expect(before.active).toBe(true);
      if (action === 'hide again') {
        await setHidden(page, true);
        await page.clock.fastForward(60000);
        await setHidden(page, false);
        const immediate = await page.evaluate(readRecovery);
        await testInfo.attach('second-resume.json', { body: JSON.stringify({ before, immediate }), contentType: 'application/json' });
        expect(Math.abs(immediate.month - before.month)).toBeLessThan(.02);
      } else {
        await page.locator('#currentTime').dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        const immediate = await page.evaluate(readRecovery);
        expect(immediate.historyActive).toBe(true);
        expect(immediate.state).not.toBe('live');
        expect(immediate.active).toBe(false);
        await page.clock.runFor(1200);
        expect((await page.evaluate(readRecovery)).historyActive).toBe(true);
        await page.locator('#liveAnchor').dispatchEvent('click');
      }
      const frames = await sampleRecovery(page, 4400);
      await testInfo.attach('interrupted-background-recovery.json', { body: JSON.stringify({ before, frames }), contentType: 'application/json' });
      const last = frames.at(-1);
      expect(last.active).toBe(false);
      expect(last.history).toBe(false);
      expect(last.historyActive).toBe(false);
      expect(last.state).toBe('live');
      expect(last.returning).toBe(false);
      expect(frames.some(f => f.midnight)).toBe(false);
      const target = expectedMonth(last.now, mode, 5, 22);
      expect(Math.abs(last.month - target.income)).toBeLessThan(.02);
      expect(Math.abs(last.progress - target.progress)).toBeLessThan(.11);
      if (action === 'hide again') {
        for (let i = 1; i < frames.length; i++) expect(frames[i].month).toBeGreaterThanOrEqual(frames[i - 1].month - .02);
        expect(Math.max(...frames.map(f => f.month))).toBeLessThanOrEqual(last.month + .02);
      }
      expect(errors).toEqual([]);
    });
  }
 }
}
