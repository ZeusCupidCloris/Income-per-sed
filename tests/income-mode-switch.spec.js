const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady, discardSettings } = require('./helpers/display-state');

for (const variant of ['Develop', 'Push']) {
  for (const width of [1200, 390]) {
    test(`${variant}: income mode switch preserves drafts at ${width}px`, async ({ page }, info) => {
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
      const bar = page.getByRole('group', { name: '收入计算方式', exact: true });
      const button = mode => bar.locator(`[data-income-mode="${mode}"]`);
      const amount = page.locator('#incomeAmountInput');
      const days = page.locator('#annualWorkDaysInput');
      const fields = page.locator('#incomeSettingsFields');
      const fieldLayouts = {};
      const captureFields = async (mode, label, help, maximum) => {
        const monthly = mode === 'fixed-monthly';
        const annualField = fields.locator('#annualWorkDaysField');
        const monthlyField = fields.locator('#monthlyWorkDaysField');
        await expect(fields.getByLabel(label, { exact: true })).toHaveAttribute('id', 'incomeAmountInput');
        await expect(fields.locator('#incomeModeHelp')).toHaveText(help);
        await expect(amount).toHaveAttribute('min', '0.01');
        await expect(amount).toHaveAttribute('max', maximum);
        await expect(amount).toHaveAttribute('step', '0.01');
        if (monthly) {
          await expect(annualField).toBeHidden();
          await expect(monthlyField).toBeVisible();
          await expect(monthlyField.locator('output')).toHaveText('18');
        } else {
          await expect(annualField).toBeVisible();
          await expect(annualField.getByLabel('全年工作日', { exact: true })).toBeEditable();
          await expect(monthlyField).toBeHidden();
        }
        await fields.screenshot({ path: info.outputPath(`income-fields-${mode}.png`), animations: 'disabled' });
        fieldLayouts[mode] = await fields.evaluate(root =>
          [...root.querySelectorAll('#incomeModeHelp, .settings-field-row, label, input, output')].map(node => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return { id: node.id, text: node.textContent, value: node.value ?? null,
              bounds: [rect.x, rect.y, rect.width, rect.height], display: style.display,
              font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight] };
          }));
      };
      const choose = async (mode, key) => {
        if (key) { await button(mode).press(key); await expect(button(mode)).toBeFocused(); }
        else await button(mode).click();
        await expect(bar.locator('button.active')).toHaveCount(1);
        for (const candidate of ['fixed-monthly', 'annual-average', 'fixed-daily']) {
          await expect(button(candidate)).toHaveAttribute('aria-pressed', String(candidate === mode));
        }
      };
      await expect(bar.locator('.income-mode-indicator')).toHaveCount(1);
      await amount.fill('11700');
      await choose('fixed-monthly', 'Enter');
      await expect(amount).toHaveValue('11700');
      await captureFields('fixed-monthly', '月薪到手', '按当月工作日折算', '1000000000');
      await choose('annual-average', 'Space');
      await amount.fill('13000');
      await days.fill('240');
      await captureFields('annual-average', '月薪到手', '按全年工作日均摊', '1000000000');
      await choose('fixed-daily');
      await amount.fill('650');
      await days.fill('260');
      await captureFields('fixed-daily', '日薪到手', '每个工作日固定计薪', '100000000');
      await info.attach('income-fields-layout', { body: JSON.stringify(fieldLayouts, null, 2), contentType: 'application/json' });
      await choose('fixed-monthly', 'Enter');
      await expect(amount).toHaveValue('11700');
      await choose('annual-average');
      await expect(amount).toHaveValue('13000');
      await expect(days).toHaveValue('240');
      await choose('fixed-daily', 'Space');
      await expect(amount).toHaveValue('650');
      await expect(days).toHaveValue('260');
      await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥62.36');
      for (const mode of ['fixed-monthly', 'annual-average', 'fixed-daily']) {
        await expect(button(mode)).not.toHaveClass(/is-kinetic-pressed/);
      }
      await bar.screenshot({ path: info.outputPath('mode-switch.png'), animations: 'disabled' });
      const layout = await bar.evaluate(root => [root, ...root.querySelectorAll('*')].map(node => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return { tag: node.tagName, mode: node.dataset.incomeMode || null,
          text: node.textContent, pressed: node.getAttribute('aria-pressed'),
          bounds: [rect.x, rect.y, rect.width, rect.height],
          font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight],
          display: style.display, color: style.color };
      }));
      await info.attach('mode-switch-layout', { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
      await amount.fill('');
      await days.fill('0');
      await choose('fixed-daily', 'Enter');
      await expect(amount).toHaveValue('');
      await expect(days).toHaveValue('0');
      await choose('annual-average');
      await choose('fixed-daily');
      await expect(amount).toHaveValue('');
      await expect(days).toHaveValue('0');
      await expect(page.locator('#incomeCalculationHourly')).toHaveText('—');
      await discardSettings(page);
      await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥62.36');
      await open();
      await expect(amount).toHaveValue('7296.70');
      await expect(button('fixed-monthly')).toHaveAttribute('aria-pressed', 'true');
      await amount.fill('11700');
      await page.locator('#settingsSaveButton').click();
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥100.00');
      expect(errors).toEqual([]);
    });
  }

  test(`${variant}: wage drafts restore on refresh and clear on cancel`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 900 });
    await page.clock.setFixedTime(new Date('2026-10-22T15:30:00+08:00'));
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    const dialog = page.locator('#settingsDialog');
    const amount = dialog.locator('#incomeAmountInput');
    const days = dialog.locator('#annualWorkDaysInput');
    const button = mode => dialog.locator(`[data-income-mode="${mode}"]`);
    const draft = () => page.evaluate(() => {
      const data = JSON.parse(sessionStorage.getItem('income-per-sed-settings-draft-v1'));
      return data?.panels?.income ?? null;
    });
    const saved = () => page.evaluate(() => localStorage.getItem('income-per-sed-settings'));
    const open = async () => {
      await page.locator('#incomeSettingsCard').click();
      await settingsReady(page);
    };
    const savedBefore = await saved();
    await open();
    await amount.fill('11700');
    await button('annual-average').click();
    await amount.fill('13000');
    await days.fill('240');
    await button('fixed-daily').click();
    await amount.fill('650');
    await days.fill('250');
    await expect.poll(draft).toMatchObject({
      mode: 'fixed-daily',
      modes: {
        'fixed-monthly': { amount: '11700', days: '260' },
        'annual-average': { amount: '13000', days: '240' },
        'fixed-daily': { amount: '650', days: '250' },
      },
    });

    await page.reload();
    await fullDisplay(page);
    await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥62.36');
    await open();
    await expect(dialog.locator('#settingsSafetyTitle')).toHaveText('恢复未保存的草稿？');
    await expect(dialog.locator('#settingsSafetyConfirm')).toBeVisible();
    await dialog.locator('#settingsSafetyAccept').click();
    await expect(dialog.locator('#settingsSafetyConfirm')).toBeHidden();
    await expect(button('fixed-daily')).toHaveAttribute('aria-pressed', 'true');
    await expect(amount).toHaveValue('650');
    await expect(days).toHaveValue('250');
    await button('annual-average').click();
    await expect(amount).toHaveValue('13000');
    await expect(days).toHaveValue('240');
    await button('fixed-monthly').click();
    await expect(amount).toHaveValue('11700');
    await expect(page.locator('#hourlyRateDisplay')).toHaveText('¥62.36');
    await dialog.locator('[data-settings-close-kind="cancel"]').click();
    await expect(dialog).toBeHidden();
    expect(await draft()).toBeNull();
    expect(await saved()).toBe(savedBefore);
    await open();
    await expect(dialog.locator('#settingsSafetyConfirm')).toBeHidden();
    await expect(amount).toHaveValue('7296.70');
    await discardSettings(page);
    expect(errors).toEqual([]);
  });
}
