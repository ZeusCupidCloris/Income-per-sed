const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady, discardSettings } = require('./helpers/display-state');

for (const variant of ['Develop', 'Push']) {
  for (const width of [1200, 390]) {
    for (const theme of ['light', 'dark']) {
      test(`${variant}: income rate summary at ${width}px in ${theme}`, async ({ page }, info) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width, height: 900 });
        await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
        await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
        await page.goto(`/Income-per-sed-${variant}.html`);
        await fullDisplay(page);
        const openIncome = async () => {
          await page.locator('#incomeSettingsCard').click();
          await settingsReady(page);
        };
        await openIncome();
        const summary = page.locator('.income-rate-summary');
        const hourly = summary.locator('#incomeCalculationHourly');
        const daily = summary.locator('#incomeCalculationDaily');
        const context = summary.locator('#incomeCalculationDate');
        const amount = page.locator('#incomeAmountInput');
        const days = page.locator('#annualWorkDaysInput');
        const expectRates = async (hourlyText, dailyText) => {
          await expect(hourly).toHaveText(hourlyText);
          await expect(daily).toHaveText(dailyText);
          await expect(context).toHaveText('2026 年 10 月 · 每天 6.5 小时');
        };
        await expect(summary).toHaveAttribute('aria-label', '折算收入');
        await expect(summary.locator('[data-private-readout]')).toHaveCount(2);
        await expect(page.locator('#monthlyWorkDaysValue')).toHaveText('18');
        await expectRates('¥62.36', '¥405.37');
        for (const [mode, value] of [['fixed-monthly', '11700'], ['annual-average', '13000'], ['fixed-daily', '650']]) {
          const button = page.locator(`[data-income-mode="${mode}"]`);
          await button.click();
          await amount.fill(value);
          if (mode !== 'fixed-monthly') await days.fill('240');
          await expectRates('¥100.00', '¥650.00');
          await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥62.36');
          await summary.screenshot({ path: info.outputPath(`summary-${mode}.png`), animations: 'disabled' });
          const layout = await summary.evaluate(root => [root, ...root.querySelectorAll('*')].map(node => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return { tag: node.tagName, id: node.id, text: node.children.length ? null : node.textContent,
              bounds: [rect.x, rect.y, rect.width, rect.height],
              font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight],
              display: style.display, color: style.color };
          }));
          await info.attach(`summary-layout-${mode}`, { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
          await amount.fill('');
          await expectRates('—', '—');
          await amount.fill(value);
          await expectRates('¥100.00', '¥650.00');
          if (mode !== 'fixed-monthly') {
            await days.fill('0');
            await expectRates('—', '—');
            await days.fill('240');
            await expectRates('¥100.00', '¥650.00');
          }
          await button.click();
          await expect(amount).toHaveValue(value);
          await expectRates('¥100.00', '¥650.00');
        }
        await discardSettings(page);
        await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥62.36');
        await openIncome();
        await expectRates('¥62.36', '¥405.37');
        await amount.fill('11700');
        await page.locator('#settingsSaveButton').click();
        await expect(page.locator('#settingsDialog')).toBeHidden();
        await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥100.00');
        await page.reload();
        await fullDisplay(page);
        await openIncome();
        await expectRates('¥100.00', '¥650.00');
        await discardSettings(page);
        expect(errors).toEqual([]);
      });
    }
  }
}
