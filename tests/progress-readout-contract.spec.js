const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady } = require('./helpers/display-state');

const read = name => fs.readFileSync(path.resolve(__dirname, '../src/components/progress-readout', name), 'utf8');

async function mountFixture(page) {
  const card = id => `<section id="${id}">${read('view.html')}<div role="progressbar"></div></section>`;
  await page.setContent(card('first') + card('second'));
  await page.addScriptTag({ content: read('index.js') });
  await page.evaluate(() => {
    window.readouts = ['first', 'second'].map(id => {
      const root = document.getElementById(id);
      const component = createProgressReadout({
        root,
        track: root.querySelector('[role=progressbar]'),
        writeText: (node, value) => { if (node.textContent !== value) node.textContent = value; },
        writeAttribute: (node, key, value) => { if (node.getAttribute(key) !== value) node.setAttribute(key, value); },
        formatDuration: seconds => `${seconds / 3600}小时`,
      });
      component.mount();
      return component;
    });
  });
}

test('progress readout displays all phases and preserves the rest-day accessible explanation', async ({ page }) => {
  await mountFixture(page);
  const first = page.locator('#first');
  const track = first.getByRole('progressbar');
  for (const [status, isMorning, phase, remaining] of [
    ['not-started', false, '等待开始', '全天 4小时'],
    ['working', true, '上午班次', '剩余 4小时'],
    ['break', false, '午间停表', '剩余 4小时'],
    ['working', false, '下午班次', '剩余 4小时'],
    ['ended', false, '当日完成', '工时已落袋'],
    ['day-off', false, '当日休息', '当日休息'],
  ]) {
    await page.evaluate(([status, isMorning]) => readouts[0].updateStatus(status, 14400, '当日', isMorning), [status, isMorning]);
    await expect(first.locator('#progressPhase')).toHaveText(phase);
    await expect(first.locator('#progressRemaining')).toHaveText(remaining);
    await expect(first).toHaveAttribute('data-work-status', status);
    await expect(track).toHaveAttribute('aria-valuetext', status === 'day-off'
      ? '当日休息，显示已设置的工作时段，不计工作进度'
      : `${phase}，${remaining}`);
  }
  await expect(page.locator('#second #progressRemaining')).toHaveText('全天待完成');
});

test('progress readout keeps percent and aria together, resets immediately and releases edit binding', async ({ page }) => {
  await mountFixture(page);
  const first = page.locator('#first');
  const track = first.getByRole('progressbar');
  await page.evaluate(() => {
    window.editCalls = [];
    window.bindActivation = (node, open) => {
      node.addEventListener('click', open);
      return () => node.removeEventListener('click', open);
    };
    readouts[0].setContext(false, '2026-09-30');
    readouts[0].setPercent('38.5');
    readouts[0].bindEdit(bindActivation, () => editCalls.push('obsolete'));
    readouts[0].bindEdit(bindActivation, () => editCalls.push('active'));
  });
  await expect(first.locator('#progressContextLabel')).toHaveText('当日工作进度');
  await expect(track).toHaveAttribute('aria-label', '2026-09-30 当日工作进度');
  await expect(first.locator('#progressReadout')).toHaveAttribute('aria-label', '2026-09-30 当日工作进度读数');
  await expect(first.locator('#progressPercent')).toHaveText('38.5%');
  await expect(track).toHaveAttribute('aria-valuenow', '38.5');
  await first.click();
  const reset = await page.evaluate(() => {
    readouts[0].resetPercent();
    readouts[0].destroy();
    readouts[0].setPercent('99.9');
    const root = document.getElementById('first');
    return [root.querySelector('#progressPercent').textContent, root.querySelector('[role=progressbar]').getAttribute('aria-valuenow')];
  });
  expect(reset).toEqual(['0.0%', '0.0']);
  await first.click();
  await page.evaluate(() => {
    readouts[0].mount();
    readouts[0].setContext(true);
    readouts[0].bindEdit(bindActivation, () => editCalls.push('remounted'));
  });
  await first.click();
  await expect(track).toHaveAttribute('aria-label', '今日工作进度');
  expect(await page.evaluate(() => editCalls)).toEqual(['active', 'remounted']);
});

for (const variant of ['Develop', 'Push']) {
  test(`${variant}: progress readout follows lunch, history and the schedule edit entry`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-20T12:30:00+08:00'));
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    const track = page.locator('#progressTrack');
    const percent = page.locator('#progressPercent');
    const title = page.locator('#progressContextLabel');
    await expect(title).toHaveText('今日工作进度');
    await expect(percent).toHaveText('38.5%');
    await expect(track).toHaveAttribute('aria-valuenow', '38.5');
    await expect(track).toHaveAttribute('aria-valuetext', /午间停表，剩余/);
    await page.locator('#historyQuickOpen').click();
    await page.waitForFunction(() => !document.getElementById('historyQuickPanel').dataset.entryAnimating);
    await page.locator('[data-history-seconds="-14400"]').click();
    await expect(title).toHaveText('当日工作进度');
    await expect(track).toHaveAttribute('aria-label', '2026-10-20 当日工作进度');
    await expect(percent).toHaveText('0.0%');
    await expect(track).toHaveAttribute('aria-valuenow', '0.0');
    await page.locator('#historyQuickPanel [data-history-action="live"]').click();
    await expect(title).toHaveText('今日工作进度');
    await expect(percent).toHaveText('38.5%');
    const history = page.locator('#historyQuickPanel');
    if (await history.isVisible()) await page.locator('#historyQuickClose').click();
    await expect(history).toBeHidden();
    const card = page.getByRole('button', { name: '修改上午、午休和下午工作时间', exact: true });
    for (const key of [null, 'Enter', 'Space']) {
      if (key) await card.press(key);
      else await card.click();
      await settingsReady(page);
      await expect(page.locator('#scheduleSettingsPanel')).toBeVisible();
      await expect(page.locator('#incomeSettingsPanel')).toBeHidden();
      await expect(page.locator('#scheduleSettingsCard')).toBeHidden();
      await page.keyboard.press('Escape');
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await expect(card).toBeFocused();
    }
    await expect(percent).toHaveText('38.5%');
    expect(errors).toEqual([]);
  });
}
