const { test, expect } = require('@playwright/test');
const { prepareRecovery, resumeAt, sampleRecovery, expectedMonth } = require('./helpers/recovery');

for (const channel of process.env.DEVELOP_PREVIEW === '1' ? ['Develop'] : ['Develop', 'Push']) {
 for (const mode of ['fixed-monthly', 'annual-average', 'fixed-daily']) {
  for (const [label, start, end, sameMonth, completedDays, restDay] of [
    ['next working day', '2026-09-07T07:30:00Z', '2026-09-08T02:30:00Z', true, 5, false],
    ['holiday month boundary', '2026-09-30T07:30:00Z', '2026-10-01T02:30:00Z', false, 0, true],
    ['working month boundary', '2026-08-31T07:30:00Z', '2026-09-01T02:30:00Z', false, 0, false],
  ]) {
    test(`${channel}: ${mode} month recovery ${label} never double counts the previous day`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await prepareRecovery(page, channel, mode, start);
      const before = (await sampleRecovery(page, 0))[0];
      await resumeAt(page, end);
      const frames = await sampleRecovery(page);
      await testInfo.attach('month-recovery.json', { body: JSON.stringify({ before, frames }), contentType: 'application/json' });
      expect(frames.filter(f => f.active).length).toBeGreaterThan(5);
      expect(frames.at(-1).active).toBe(false);
      const from = sameMonth ? before.month : 0;
      const target = frames.at(-1).month;
      const expected = expectedMonth(frames.at(-1).now, mode, completedDays, 22, restDay);
      expect(Math.abs(target - expected.income)).toBeLessThan(.02);
      expect(Math.abs(frames.at(-1).progress - expected.progress)).toBeLessThan(.11);
      for (const f of frames) {
        expect(f.month).toBeGreaterThanOrEqual(Math.min(from, target) - .02);
        expect(f.month).toBeLessThanOrEqual(Math.max(from, target) + .02);
      }
      for (let i = 1; i < frames.length; i++) expect(frames[i].month).toBeGreaterThanOrEqual(frames[i - 1].month - .02);
      expect(frames.some(f => f.midnight)).toBe(false);
      expect(errors).toEqual([]);
    });
  }
 }
}
