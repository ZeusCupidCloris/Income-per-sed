const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady } = require('./helpers/display-state');

const read = name => fs.readFileSync(path.resolve(__dirname, '../src/components/hourly-summary', name), 'utf8');

async function mountFixture(page) {
  const view = read('view.html');
  await page.setContent(`<div id="first">${view}</div><div id="second">${view}</div>`);
  await page.addScriptTag({ content: read('index.js') });
  await page.evaluate(() => {
    const writeText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
    const formatCurrency = value => `¥${value.toFixed(2)}`;
    window.cards = ['first', 'second'].map(id => createHourlySummary({
      root: document.querySelector(`#${id} > section`), writeText, formatCurrency,
    }));
    cards.forEach(card => card.mount());
  });
}

test('hourly summary formats supplied amounts and pay modes only inside its root', async ({ page }) => {
  await mountFixture(page);
  for (const modeLabel of ['固定月薪', '全年均摊', '固定日薪']) {
    await page.evaluate(modeLabel => cards[0].update({ hourly: 50, daily: 325, modeLabel }), modeLabel);
    await expect(page.locator('#first #hourlyRateDisplay')).toHaveText('¥50.00');
    await expect(page.locator('#first #dailyRateDisplay')).toHaveText(`日均 ¥325.00 · ${modeLabel}`);
  }
  await expect(page.locator('#second #hourlyRateDisplay')).toHaveText('¥0.00');
  await expect(page.locator('#second #dailyRateDisplay')).toHaveText('日均 ¥0.00 · 固定月薪');
});

test('hourly summary owns a single edit binding and releases it before remount', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => {
    window.calls = [];
    window.bindActivation = (root, callback) => {
      root.addEventListener('click', callback);
      return () => root.removeEventListener('click', callback);
    };
    cards[0].bindEdit(bindActivation, () => calls.push('obsolete'));
    cards[0].bindEdit(bindActivation, () => calls.push('first'));
    cards[1].bindEdit(bindActivation, () => calls.push('second'));
  });
  const first = page.locator('#first > section');
  const second = page.locator('#second > section');
  await first.click();
  await page.evaluate(() => {
    cards[0].destroy();
    cards[0].update({ hourly: 100, daily: 650, modeLabel: '固定日薪' });
    cards[0].bindEdit(bindActivation, () => calls.push('unmounted'));
  });
  await first.click();
  await second.click();
  await expect(page.locator('#first #hourlyRateDisplay')).toHaveText('¥0.00');
  await page.evaluate(() => {
    cards[0].mount();
    cards[0].mount();
    cards[0].bindEdit(bindActivation, () => calls.push('remounted'));
  });
  await first.click();
  expect(await page.evaluate(() => calls)).toEqual(['first', 'second', 'remounted']);
});

for (const channel of ['Develop', 'Push']) {
  test(`${channel}: hourly edit opens with pointer or keyboard and restores its source`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-20T10:30:00+08:00'));
    await page.goto(`/Income-per-sed-${channel}.html`);
    await fullDisplay(page);
    const card = page.getByRole('button', { name: '修改收入计算方式和工资金额', exact: true });
    const hourly = page.locator('#hourlyRateDisplay');
    await expect(hourly).toHaveText('¥62.36');
    await expect(hourly.locator('.readout-unit')).toHaveText('¥');
    await expect(hourly.locator('.readout-number')).toHaveText('62.36');
    await expect(page.locator('#dailyRateDisplay')).toHaveText('日均 ¥405.37 · 固定月薪');
    for (const key of [null, 'Enter', 'Space']) {
      if (key) await card.press(key);
      else await card.click();
      await settingsReady(page);
      await expect(page.locator('#incomeSettingsPanel')).toBeVisible();
      await expect(page.locator('#scheduleSettingsPanel')).toBeHidden();
      await expect(page.locator('#incomeSettingsCard')).toBeHidden();
      await page.keyboard.press('Escape');
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await expect(card).toBeFocused();
    }
    await expect(hourly).toHaveText('¥62.36');
    expect(errors).toEqual([]);
  });
}
