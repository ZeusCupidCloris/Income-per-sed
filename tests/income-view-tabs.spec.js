const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady, discardSettings } = require('./helpers/display-state');

for (const variant of ['Develop', 'Push']) {
  for (const width of [1200, 390]) {
    test(`${variant}: income view tabs keep drafts and date at ${width}px`, async ({ page }, info) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
      await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), width === 390 ? 'dark' : 'light');
      await page.goto(`/Income-per-sed-${variant}.html`);
      await fullDisplay(page);
      const open = async () => {
        await page.locator('#incomeSettingsCard').click();
        await settingsReady(page);
      };
      await open();
      const bar = page.getByRole('tablist', { name: '收入设置视图' });
      const config = bar.locator('#incomeTabConfig');
      const estimate = bar.locator('#incomeTabEstimate');
      const configView = page.locator('#incomeConfigView');
      const estimateView = page.locator('#incomeEstimateView');
      const amount = page.locator('#incomeAmountInput');
      const save = page.locator('#settingsSaveButton');
      const expectView = async (view, focus = false) => {
        const isConfig = view === 'config';
        const activeTab = isConfig ? config : estimate;
        const inactiveTab = isConfig ? estimate : config;
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
        await expect(activeTab).toHaveJSProperty('tabIndex', 0);
        await expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
        await expect(inactiveTab).toHaveJSProperty('tabIndex', -1);
        await expect(isConfig ? configView : estimateView).toBeVisible();
        await expect(isConfig ? estimateView : configView).toBeHidden();
        if (isConfig) await expect(save).toBeVisible();
        else await expect(save).toBeHidden();
        if (focus) await expect(activeTab).toBeFocused();
      };
      await expect(config).toHaveAttribute('aria-controls', 'incomeConfigView');
      await expect(estimate).toHaveAttribute('aria-controls', 'incomeEstimateView');
      await expect(configView).toHaveAttribute('aria-labelledby', 'incomeTabConfig');
      await expect(estimateView).toHaveAttribute('aria-labelledby', 'incomeTabEstimate');
      await expectView('config');
      await config.press('Tab');
      await expect(configView.locator(':focus')).toHaveCount(1);
      await amount.fill('11700');
      await expect(page.locator('#incomeCalculationHourly')).toHaveText('¥100.00');
      await config.press('ArrowLeft');
      await expectView('estimate', true);
      await expect(page.locator('#historyDateInput')).toHaveValue('2026-10-22');
      await estimate.press('ArrowRight');
      await expectView('config', true);
      await expect(amount).toHaveValue('11700');
      await config.press('End');
      await expectView('estimate', true);
      await bar.screenshot({ path: info.outputPath('income-tabs.png'), animations: 'disabled' });
      const layout = await bar.evaluate(root => [root, ...root.querySelectorAll('[role="tab"]')].map(node => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return { id: node.id, text: node.textContent, selected: node.getAttribute('aria-selected'),
          tabIndex: node.tabIndex, focused: node === document.activeElement,
          bounds: [rect.x, rect.y, rect.width, rect.height],
          font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight],
          display: style.display, color: style.color };
      }));
      await info.attach('income-tabs-layout', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
      await expect(page.locator('#historyDateInput')).toHaveValue('2026-10-22');
      await expect(page.locator('#historyTimeInput')).toHaveValue('15:30');
      await page.locator('#incomeEstimateWheels [data-date-part="day"]').press('ArrowUp');
      await page.locator('#historyDateSubmit').click();
      await expect(page.locator('#historyDateHeading')).toHaveText('2026-10-21');
      await expect(page.locator('#historyDateIncome')).toHaveText('¥280.64');
      await estimate.press('Home');
      await expectView('config', true);
      await expect(amount).toHaveValue('11700');
      await estimate.click();
      await expectView('estimate');
      await expect(page.locator('#historyDateInput')).toHaveValue('2026-10-21');
      await expect(page.locator('#historyTimeInput')).toHaveValue('15:30');
      await page.locator('#historyDateSubmit').click();
      await expect(page.locator('#historyDateIncome')).toHaveText('¥280.64');
      await config.click();
      await expectView('config');
      await expect(amount).toHaveValue('11700');
      await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥62.36');
      await save.click();
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥100.00');
      await open();
      await expectView('config');
      await expect(amount).toHaveValue('11700.00');
      await discardSettings(page);
      expect(errors).toEqual([]);
    });
  }

  test(`${variant}: hidden estimate wheel ignores a pending scroll commit`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.clock.install({ time: new Date('2026-10-22T15:30:00+08:00') });
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    await page.locator('#incomeSettingsCard').click();
    await settingsReady(page);
    const estimate = page.locator('#incomeTabEstimate');
    const dateInput = page.locator('#historyDateInput');
    const timeInput = page.locator('#historyTimeInput');
    const host = page.locator('#incomeEstimateWheels');
    const day = host.locator('[data-date-part="day"]');
    await estimate.click();
    await expect(day).toHaveAttribute('aria-valuetext', '22');
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    await page.clock.runFor(160);

    // Queue the native scroll handler, then remove its layout before the debounce commits.
    const scroll = await host.evaluate(root => {
      const day = root.querySelector('[data-date-part="day"]');
      const before = day.scrollTop;
      for (const wheel of root.querySelectorAll('[data-date-part]')) wheel.dispatchEvent(new Event('scroll'));
      document.getElementById('incomeTabConfig').click();
      return { before, after: day.scrollTop, height: day.clientHeight };
    });
    expect(scroll.before).toBeGreaterThan(0);
    expect(scroll.after).toBe(0);
    expect(scroll.height).toBe(0);
    await page.clock.runFor(100);
    expect(await dateInput.inputValue()).toBe('2026-10-22');
    expect(await timeInput.inputValue()).toBe('15:30');
    await expect(day).toHaveAttribute('aria-valuetext', '22');

    await estimate.evaluate(tab => tab.click());
    await page.clock.runFor(160);
    await expect(day).toBeVisible();
    await day.evaluate(wheel => { wheel.scrollTop = 0; });
    // Native scroll delivery can restart the debounce after the virtual clock advances.
    await expect.poll(async () => {
      await page.clock.runFor(100);
      return dateInput.inputValue();
    }).toBe('2026-10-01');
    expect(await timeInput.inputValue()).toBe('15:30');
    await expect(day).toHaveAttribute('aria-valuetext', '01');
  });
}
