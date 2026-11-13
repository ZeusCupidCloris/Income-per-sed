const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady, selectTheme } = require('./helpers/display-state');

for (const variant of ['Develop', 'Push']) {
  const entry = `/Income-per-sed-${variant}.html`;

  test(`${variant}: fun layout ignores hidden widths and recovers from real content pressure`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const time = Date.parse('2026-08-03T02:39:00Z');
    await page.clock.install({ time });
    await page.clock.pauseAt(time + 1000);
    await page.goto(entry);
    await fullDisplay(page, { paused: true });
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator('#funSummaryCard');
    const list = page.locator('#funFact');
    const state = async (level, gap) => {
      await page.clock.runFor(2300);
      await expect(card).toHaveAttribute('data-content-pressure', level);
      await expect(list).toHaveCSS('row-gap', gap);
      const fits = await list.evaluate(element => {
        const { left, right } = element.getBoundingClientRect();
        return [...element.children].every(item => {
          const rect = item.getBoundingClientRect();
          return rect.left >= left - 1 && rect.right <= right + 1;
        });
      });
      expect(fits).toBe(true);
    };
    await state('normal', '8px');
    await page.locator('#focusToggle').click();
    await page.clock.runFor(2800);
    await expect(card).toBeHidden();
    await expect(card).toHaveAttribute('data-content-pressure', 'normal');
    await fullDisplay(page, { paused: true });
    await state('normal', '8px');

    // Reduce the real measurement budget without forcing any pressure state.
    await list.evaluate(node => { node.style.inlineSize = '120px'; });
    await state('critical', '5px');
    await list.evaluate(node => { node.style.removeProperty('inline-size'); });
    await state('normal', '8px');
    await expect(list.locator('.fun-count')).toHaveCount(4);
  });

  test(`${variant}: five components agree after a saved schedule, cross-date seek and theme change`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-01T00:30:00+08:00'));
    await page.goto(entry);
    await fullDisplay(page);
    const scheduleCard = page.locator('#scheduleSettingsCard');
    await scheduleCard.click();
    await settingsReady(page);
    const hour = page.locator('[data-time-key="morningStart"] [data-unit="hour"]');
    await expect(hour).toHaveAttribute('aria-valuenow', '9');
    await hour.press('ArrowUp');
    await expect(hour).toHaveAttribute('aria-valuenow', '8');
    await page.locator('#settingsSaveButton').click();
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await expect(page.locator('#scheduleStart')).toHaveText('8:00');
    await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥54.05');

    await page.locator('#historyQuickOpen').click();
    await page.waitForFunction(() => !document.getElementById('historyQuickPanel').dataset.entryAnimating);
    await page.locator('[data-history-seconds="-14400"]').click();
    const assertHistorical = async () => {
      await expect(page.locator('#statusLabelMain')).toHaveText('当日工作结束');
      await expect(page.locator('#statusLabel')).toHaveAttribute('aria-label', '当日工作结束');
      await expect(page.locator('#currentTime')).toHaveText('20:30:00');
      await expect(page.locator('#currentTime')).toHaveAttribute('datetime', '2026-09-30T12:30:00.000Z');
      await expect(page.locator('#workedTimeLabel')).toHaveText('所选日期已工作');
      await expect(page.locator('#workedTime')).toHaveText('7时30分0秒');
      await expect(page.locator('#workedSub')).toHaveText('已完成全天工作');
      await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥44.22');
      await expect(page.locator('#progressContextLabel')).toHaveText('当日工作进度');
      await expect(page.locator('#progressPercent')).toHaveText('100.0%');
      await expect(page.locator('#progressTrack')).toHaveAttribute('aria-valuenow', '100.0');
      await expect(page.locator('#monthSummaryCard')).toHaveAttribute('aria-label', '2026 年 9 月累计收入');
      await expect(page.locator('#monthIncome')).toHaveText('¥7,296.70');
      await expect(page.locator('#funContextLabel')).toHaveText('当日已赚可买…');
      await expect.poll(() => page.locator('#funFact .fun-count').allTextContents()).toEqual(['33', '82', '8', '4']);
    };
    await assertHistorical();
    await page.locator('#historyQuickClose').click();
    await expect(page.locator('#historyQuickPanel')).toBeHidden();
    await selectTheme(page, 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await assertHistorical();

    await page.locator('#historyQuickOpen').click();
    await page.locator('#historyQuickPanel [data-history-action="live"]').click();
    await expect(page.locator('#statusLabelMain')).toHaveText('休息日');
    await expect(page.locator('#statusLabel')).toHaveAttribute('aria-label', '休息日 · 好好生活');
    await expect(page.locator('#currentTime')).toHaveText('00:30:00');
    await expect(page.locator('#currentTime')).toHaveAttribute('datetime', '2026-09-30T16:30:00.000Z');
    await expect(page.locator('#workedTimeLabel')).toHaveText('今日已工作');
    await expect(page.locator('#workedTime')).toHaveText('0时0分0秒');
    await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥54.05');
    await expect(page.locator('#progressContextLabel')).toHaveText('今日工作进度');
    await expect(page.locator('#progressPercent')).toHaveText('0.0%');
    await expect(page.locator('#monthSummaryCard')).toHaveAttribute('aria-label', '本月累计收入');
    await expect(page.locator('#monthIncome')).toHaveText('¥0.00');
    await expect(page.locator('#funContextLabel')).toHaveText('今日已赚可买…');
    await expect.poll(() => page.locator('#funFact .fun-count').allTextContents()).toEqual(['0', '0', '0', '0']);
    expect(errors).toEqual([]);
  });
}
