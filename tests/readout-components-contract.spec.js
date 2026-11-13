const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { fullDisplay, settingsReady } = require('./helpers/display-state');

const root = path.resolve(__dirname, '..');
const read = (name, file) => fs.readFileSync(path.join(root, 'src/components', name, file), 'utf8');

async function mountFixture(page) {
  await page.setContent(`<div id="workA">${read('work-summary', 'view.html')}</div><div id="workB">${read('work-summary', 'view.html')}</div><div id="monthA">${read('month-summary', 'view.html')}</div><div id="monthB">${read('month-summary', 'view.html')}</div><div id="unrelated">unchanged</div>`);
  await page.addScriptTag({ content: read('work-summary', 'index.js') + '\n' + read('month-summary', 'index.js') });
  await page.evaluate(() => {
    const writeText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
    const writeAttribute = (node, key, value) => { if (node.getAttribute(key) !== value) node.setAttribute(key, value); };
    const formatDuration = seconds => `${Math.floor(seconds / 3600)}时${Math.floor(seconds / 60) % 60}分${seconds % 60}秒`;
    const formatCurrency = value => `¥${value.toFixed(2)}`;
    for (const name of ['workA', 'workB']) {
      window[name] = createWorkSummary({ root: document.querySelector(`#${name}>section`), writeText, formatDuration });
      window[name].mount();
    }
    for (const name of ['monthA', 'monthB']) {
      window[name] = createMonthSummary({ root: document.querySelector(`#${name}>section`), writeText, writeAttribute, formatCurrency });
      window[name].mount();
    }
    window.workSample = { wholeWork: 5400, remain: 18000, totalWork: 23400, morningWork: 9000, status: 'working', dayLabel: '今日' };
    window.monthSample = { projection: 7296.7, progress: { todayIsWorkday: true, currentWorkdayIndex: 10, completedBeforeToday: 9 }, totalWorkdays: 18 };
  });
}

test('work summary preserves start, working, lunch, completion and rest-day copy', async ({ page }) => {
  await mountFixture(page);
  for (const [sample, worked, remaining] of [
    [{ wholeWork: 0, remain: 23400, status: 'not-started' }, '0时0分0秒', '全天待完成 6时30分0秒'],
    [{ wholeWork: 0, remain: 23400, status: 'working' }, '0时0分0秒', '剩余 6时30分0秒'],
    [{ wholeWork: 5400, remain: 18000, status: 'working' }, '1时30分0秒', '剩余 5时0分0秒'],
    [{ wholeWork: 9000, remain: 14400, status: 'break' }, '2时30分0秒', '午休后剩余 4时0分0秒'],
    [{ wholeWork: 23400, remain: 0, status: 'ended' }, '6时30分0秒', '已完成全天工作'],
    [{ wholeWork: 23400, remain: 0, status: 'day-off', dayLabel: '当日' }, '6时30分0秒', '当日不计工作收入'],
  ]) {
    await page.evaluate(sample => workA.update({ ...workSample, ...sample }), sample);
    await expect(page.locator('#workA #workedTime')).toHaveText(worked);
    await expect(page.locator('#workA #workedSub')).toHaveText(remaining);
  }
  await expect(page.locator('#workB #workedSub')).toHaveText('正在计算…');
  await expect(page.locator('#unrelated')).toHaveText('unchanged');
});

test('work summary owns its context and can stop and remount without duplicate nodes', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => { workA.mount(); workA.update(workSample); workA.setContext(false); workB.setContext(true); workA.destroy(); workA.update({ ...workSample, wholeWork: 0 }); workA.setContext(true); });
  await expect(page.locator('#workA #workedTime')).toHaveText('1时30分0秒');
  await expect(page.locator('#workA #workedTimeLabel')).toHaveText('所选日期已工作');
  await expect(page.locator('#workB #workedTimeLabel')).toHaveText('今日已工作');
  await page.evaluate(() => { workA.mount(); workA.mount(); workA.update({ ...workSample, wholeWork: 0, remain: 23400 }); workA.setContext(true); });
  await expect(page.locator('#workA #workedTime')).toHaveText('0时0分0秒');
  await expect(page.locator('#workA>section')).toHaveCount(1);
});

test('month summary keeps accumulated income separate from projection and workday detail', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => { monthA.updateIncome(405.37); monthA.updateSummary(monthSample); monthB.updateIncome(25); });
  await expect(page.locator('#monthA #monthIncome')).toHaveText('¥405.37');
  await expect(page.locator('#monthA #estMonth')).toHaveText('¥7296.70');
  await expect(page.locator('#monthA #monthDetail')).toHaveText('第 10 / 18 个工作日');
  await page.evaluate(() => monthA.updateSummary({ ...monthSample, progress: { todayIsWorkday: false, completedBeforeToday: 7 } }));
  await expect(page.locator('#monthA #monthDetail')).toHaveText('已完成 7 / 18 个工作日');
  await expect(page.locator('#monthA #monthIncome')).toHaveText('¥405.37');
  await expect(page.locator('#monthB #monthIncome')).toHaveText('¥25.00');
});

test('month summary owns both historical labels and the accessible month name', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => { monthA.setContext(false, { year: 2027, month: 1 }); monthB.setContext(true, { year: 2026, month: 10 }); });
  await expect(page.locator('#monthA #monthIncomeLabel')).toHaveText('所在月份累计收入');
  await expect(page.locator('#monthA #estMonthLabel')).toHaveText('该月预计');
  await expect(page.locator('#monthA>section')).toHaveAttribute('aria-label', '2027 年 1 月累计收入');
  await expect(page.locator('#monthB>section')).toHaveAttribute('aria-label', '本月累计收入');
  await page.evaluate(() => monthA.setContext(true, { year: 2026, month: 10 }));
  await expect(page.locator('#monthA #monthIncomeLabel')).toHaveText('本月累计收入');
  await expect(page.locator('#monthA #estMonthLabel')).toHaveText('本月预计');
});

test('month coverage presentation stays inside its root without changing app state', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => monthA.updateCoverage(false, 2027));
  await expect(page.locator('#monthA #calendarWarning')).toBeVisible();
  await expect(page.locator('#monthA #calendarWarningText')).toHaveText('2027 年节假日数据尚未更新，暂按周一至周五估算。');
  await expect(page.locator('#monthB #calendarWarning')).toBeHidden();
  expect(await page.locator('body').getAttribute('class')).toBeNull();
  await page.evaluate(() => monthA.updateCoverage(true));
  await expect(page.locator('#monthA #calendarWarning')).toBeHidden();
});

test('calendar action binds once, preserves its origin and releases on destroy', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => {
    window.calendarCalls = [];
    window.listen = (node, type, callback) => { node.addEventListener(type, callback); return () => node.removeEventListener(type, callback); };
    window.openCalendar = node => calendarCalls.push(node.closest('section').parentElement.id);
    monthA.updateCoverage(false, 2027); monthB.updateCoverage(false, 2027);
    monthA.bindCalendarAction(listen, openCalendar); monthA.bindCalendarAction(listen, openCalendar);
    monthB.bindCalendarAction(listen, openCalendar);
  });
  await page.locator('#monthA #calendarWarningSettings').click();
  expect(await page.evaluate(() => calendarCalls)).toEqual(['monthA']);
  await page.evaluate(() => { monthA.destroy(); monthA.updateIncome(100); monthA.setContext(false, { year: 2027, month: 2 }); });
  await page.locator('#monthA #calendarWarningSettings').click();
  await page.locator('#monthB #calendarWarningSettings').click();
  expect(await page.evaluate(() => calendarCalls)).toEqual(['monthA', 'monthB']);
  await expect(page.locator('#monthA #monthIncome')).toHaveText('¥0.00');
  await page.evaluate(() => { monthA.mount(); monthA.bindCalendarAction(listen, openCalendar); monthA.updateIncome(50); });
  await page.locator('#monthA #calendarWarningSettings').click();
  expect(await page.evaluate(() => calendarCalls)).toEqual(['monthA', 'monthB', 'monthA']);
  await expect(page.locator('#monthA #monthIncome')).toHaveText('¥50.00');
});

test('readout components reuse the supplied same-value writers without extra caches', async ({ page }) => {
  await mountFixture(page);
  const changes = await page.evaluate(async () => {
    const update = () => { workA.update(workSample); workA.setContext(true); monthA.updateIncome(405.37); monthA.updateSummary(monthSample); monthA.setContext(true, { year: 2026, month: 10 }); };
    update();
    const records = [];
    const observer = new MutationObserver(items => records.push(...items));
    for (const id of ['workA', 'monthA']) observer.observe(document.getElementById(id), { subtree: true, attributes: true, characterData: true, childList: true });
    for (let index = 0; index < 10; index++) update();
    await Promise.resolve();
    observer.disconnect();
    return records.length;
  });
  expect(changes).toBe(0);
});

for (const channel of ['Develop', 'Push']) {
  test(`${channel}: both readout cards follow a cross-month seek and return without losing unit spans`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-01T00:30:00+08:00'));
    await page.goto(`/Income-per-sed-${channel}.html`);
    await fullDisplay(page);
    await page.locator('#historyQuickOpen').click();
    await page.waitForFunction(() => !document.getElementById('historyQuickPanel').dataset.entryAnimating);
    await page.locator('[data-history-seconds="-14400"]').click();
    await expect(page.locator('#workedTimeLabel')).toHaveText('所选日期已工作');
    await expect(page.locator('#monthIncomeLabel')).toHaveText('所在月份累计收入');
    await expect(page.locator('#estMonthLabel')).toHaveText('该月预计');
    await expect(page.locator('#monthSummaryCard')).toHaveAttribute('aria-label', '2026 年 9 月累计收入');
    await expect(page.locator('#workedTime')).toHaveText('6时30分0秒');
    await expect(page.locator('#workedTime .readout-number')).toHaveCount(3);
    await expect(page.locator('#workedTime .readout-unit')).toHaveCount(3);
    await page.locator('#historyQuickPanel [data-history-action="live"]').click();
    await expect(page.locator('#workedTimeLabel')).toHaveText('今日已工作');
    await expect(page.locator('#monthIncomeLabel')).toHaveText('本月累计收入');
    await expect(page.locator('#estMonthLabel')).toHaveText('本月预计');
    await expect(page.locator('#monthSummaryCard')).toHaveAttribute('aria-label', '本月累计收入');
    await expect(page.locator('#workedSub')).toHaveText('今日不计工作收入');
    expect(errors).toEqual([]);
  });

  test(`${channel}: month calendar warning opens settings and restores focus to its own action`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2027-07-05T10:30:00+08:00'));
    await page.goto(`/Income-per-sed-${channel}.html`);
    await fullDisplay(page);
    await expect(page.locator('#calendarWarningText')).toHaveText('2027 年节假日数据尚未更新，暂按周一至周五估算。');
    const amount = await page.locator('#monthIncome').textContent();
    await page.locator('#calendarWarningSettings').click();
    await settingsReady(page);
    await expect(page.locator('#scheduleSettingsPanel')).toBeVisible();
    await expect(page.locator('#calendarImportButton')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await expect(page.locator('#calendarWarningSettings')).toBeFocused();
    await expect(page.locator('#monthIncome')).toHaveText(amount);
    expect(errors).toEqual([]);
  });
}
