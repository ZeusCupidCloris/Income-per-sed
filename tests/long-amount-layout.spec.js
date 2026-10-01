const { test, expect } = require('@playwright/test');

for (const channel of ['Develop', 'Push']) {
  for (const width of [390, 1440]) {
    for (const theme of ['light', 'dark']) {
      test(`${channel}: long amounts remain inside windows at ${width} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.clock.setFixedTime(new Date('2026-09-07T10:00:00Z'));
        await page.goto(`/Income-per-sed-${channel}.html`);
        for (const sample of [
          { mode: 'fixed-daily', amount: '10000000', expected: '10,000,000.00' },
          { mode: 'fixed-daily', amount: '100000000', expected: '100,000,000.00' },
          { mode: 'annual-average', amount: '1000000000', days: '12', expected: '1,000,000,000.00' },
        ]) {
          await page.locator('#incomeSettingsCard').click();
          await page.locator(`[data-income-mode="${sample.mode}"]`).click();
          await page.locator('#incomeAmountInput').fill(sample.amount);
          if (sample.days) await page.locator('#annualWorkDaysInput').fill(sample.days);
          await page.locator('#settingsSaveButton').click();
          await expect(page.locator('#settingsDialog')).not.toBeVisible();
          await expect(page.locator('#incomeAccessible')).toContainText(sample.expected, { timeout: 10000 });
          await page.waitForTimeout(600);
          const bounds = await page.locator('#flipContainer').evaluate(el => {
            const box = el.getBoundingClientRect();
            const panel = el.closest('#incomeValuePanel').getBoundingClientRect();
            return {
              left: box.left, right: box.right, panelLeft: panel.left, panelRight: panel.right,
              cells: [...el.querySelectorAll('.flip-digit-container')].map(cell => {
                const r = cell.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width };
              }),
              documentOverflow: document.documentElement.scrollWidth - innerWidth,
            };
          });
          expect(bounds.cells.length).toBeGreaterThanOrEqual(10);
          expect(bounds.documentOverflow).toBeLessThanOrEqual(1);
          for (const cell of bounds.cells) {
            expect(cell.width).toBeGreaterThan(8);
            expect(cell.left).toBeGreaterThanOrEqual(bounds.panelLeft - 1);
            expect(cell.right).toBeLessThanOrEqual(bounds.panelRight + 1);
          }
        }
      });
    }
  }
}
