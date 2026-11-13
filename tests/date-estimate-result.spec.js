const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady, discardSettings } = require('./helpers/display-state');

for (const variant of ['Develop', 'Push']) {
  for (const width of [1200, 390]) {
    for (const theme of ['light', 'dark']) {
      test(`${variant}: date estimate result at ${width}px in ${theme}`, async ({ page }, info) => {
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
        await page.locator('#incomeAmountInput').fill('11700');
        await page.locator('#settingsSaveButton').click();
        await expect(page.locator('#settingsDialog')).toBeHidden();
        await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥100.00');
        await openIncome();
        await page.locator('#incomeAmountInput').fill('23400');
        await page.locator('#incomeTabEstimate').click();
        await expect(page.locator('#incomeEstimateView')).toBeVisible();
        const result = page.locator('#historyDateResult');
        const submit = page.locator('#historyDateSubmit');
        const wheel = part => page.locator(`#incomeEstimateWheels [data-date-part="${part}"]`);
        await expect(result).toBeHidden();
        await submit.click();
        await expect(result).toBeVisible();
        await expect(result).toHaveAttribute('aria-labelledby', 'historyDateHeading');
        await expect(result.locator('[data-private-readout]')).toHaveCount(3);
        await expect(page.locator('#historyDateHeading')).toHaveText('2026-10-22');
        await expect(page.locator('#historyDateState')).toHaveText('截至 15:30 · 工作时段');
        await expect(page.locator('#historyDateIncome')).toHaveText('¥450.00');
        await expect(page.locator('#historyDateWork')).toHaveText('4时30分0秒');
        await expect(page.locator('#historyDateDaily')).toHaveText('¥650.00');
        await expect(page.locator('#historyDateMonth')).toHaveText('¥7,600.00');
        await result.screenshot({ path: info.outputPath('result.png'), animations: 'disabled' });
        const layout = await result.evaluate(root => [root, ...root.querySelectorAll('*')].map(node => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return { tag: node.tagName, id: node.id, text: node.children.length ? null : node.textContent,
            bounds: [rect.x, rect.y, rect.width, rect.height],
            font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight],
            display: style.display, color: style.color };
        }));
        await info.attach('result-layout', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });

        await wheel('day').press('ArrowUp');
        await expect(result).toBeHidden();
        for (let i = 0; i < 5; i++) await wheel('hour').press('ArrowUp');
        await submit.click();
        await expect(page.locator('#historyDateHeading')).toHaveText('2026-10-21');
        await expect(page.locator('#historyDateState')).toHaveText('截至 10:30 · 工作时段');
        await expect(page.locator('#historyDateIncome')).toHaveText('¥150.00');
        await expect(page.locator('#historyDateWork')).toHaveText('1时30分0秒');
        await expect(page.locator('#historyDateMonth')).toHaveText('¥6,650.00');
        for (let i = 0; i < 3; i++) await wheel('day').press('ArrowUp');
        await submit.click();
        await expect(page.locator('#historyDateState')).toHaveText('截至 10:30 · 休息日');
        await expect(page.locator('#historyDateIncome')).toHaveText('¥0.00');
        await expect(page.locator('#historyDateWork')).toHaveText('0时0分0秒');
        await expect(page.locator('#historyDateDaily')).toHaveText('¥0.00');
        await expect(page.locator('#historyDateMonth')).toHaveText('¥5,200.00');

        for (let i = 0; i < 5; i++) await wheel('day').press('ArrowDown');
        await submit.click();
        await expect(page.locator('#historyDateError')).toHaveText('不能选择尚未发生的时间。');
        await expect(result).toBeHidden();
        await expect(page.locator('#incomeEstimateWheels')).toHaveAttribute('aria-invalid', 'true');
        await wheel('day').press('ArrowUp');
        await expect(page.locator('#historyDateError')).toBeHidden();
        await expect(page.locator('#incomeEstimateWheels')).not.toHaveAttribute('aria-invalid');
        await submit.click();
        await expect(result).toBeVisible();
        await page.locator('#incomeTabConfig').click();
        await expect(page.locator('#incomeAmountInput')).toHaveValue('23400');
        await discardSettings(page);
        await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥100.00');
        expect(errors).toEqual([]);
      });
    }
  }
}
