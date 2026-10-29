const { test, expect } = require('@playwright/test');
const { backupChecksum, exportSettingsBackup, uploadSettingsBackup } = require('./helpers/settings-backup');
async function fullDisplay(page) {
  await expect(page.locator('#currentTime')).not.toHaveText('--:--:--');
  if (await page.locator('#focusToggle').getAttribute('aria-pressed') === 'true') await page.locator('#focusToggle').click();
  if (await page.locator('#privacyToggle').getAttribute('aria-pressed') === 'true') {
    await page.locator('#privacyToggle').click();
    await page.locator('#privacyKeepVisible').click();
  }
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-focus-restoring'));
}
async function settingsReady(page) {
  await page.waitForFunction(() => !document.getElementById('settingsDialog').hidden && !document.querySelector('[data-settings-unready],.income-shared-shell'));
}
async function hidden(page, value) {
  await page.evaluate(value => {
    if (value) {
      Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
      Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
    } else { delete document.hidden; delete document.visibilityState; }
    document.dispatchEvent(new Event('visibilitychange'));
  }, value);
}
for (const version of ['Develop','Push']) {
  test(`${version}: completes startup without script errors`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-20T07:44:10Z'));
    await page.goto(`/Income-per-sed-${version}.html`);
    await expect(page.locator('#currentTime')).toHaveText('15:44:10');
    await expect(page.locator('body')).not.toHaveClass(/startup-presentation-active/);
    await expect(page.locator('#workedTime')).toHaveText('4时44分10秒');
    expect(errors).toEqual([]);
  });
  test(`${version}: valid preset and date seeks work without development hooks`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-20T07:44:10Z'));
    await page.goto(`/Income-per-sed-${version}.html`); await fullDisplay(page);
    await page.locator('#historyQuickOpen').click();
    await page.locator('[data-history-seconds="-900"]').click();
    await expect(page.locator('#historyQuickClock')).toHaveText('15:29:10');
    await page.evaluate(() => {
      document.getElementById('historySeekDateInput').value = '2026-10-19';
      document.getElementById('historySeekTimeInput').value = '10:30';
      document.getElementById('historySeekForm').requestSubmit();
    });
    await expect(page.locator('#historyQuickClock')).toHaveText('10:30:00');
    await expect(page.locator('#historySeekError')).toBeHidden();
    expect(errors).toEqual([]);
  });
  test(`${version}: both shared settings trajectories survive release generation`, async ({page}) => {
    const errors=[]; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width:390,height:844});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.clock.install({time:new Date('2026-09-07T06:30:00Z')});
    await page.goto(`/Income-per-sed-${version}.html`);
    await page.waitForTimeout(1600);
    await fullDisplay(page);
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()+1000)));
    for (const kind of ['income','schedule']) {
      const card=page.locator(`#${kind}SettingsCard`);
      await card.scrollIntoViewIfNeeded();
      await card.focus();
      const origin=await card.boundingBox();
      await card.dispatchEvent('click');
      await page.clock.runFor(32);
      const early=await page.locator('.income-shared-shell').boundingBox();
      expect(early.height).toBeGreaterThan(origin.height);
      if(kind==='schedule') expect(Math.abs(early.width-origin.width)).toBeLessThan(.1);
      else expect(Math.abs(early.width-origin.width)).toBeGreaterThan(.1);
      await page.clock.runFor(450);
      await expect(page.locator(`#${kind}SettingsPanel`)).toBeVisible();
      await expect(page.locator('.income-shared-shell')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await page.clock.runFor(520);
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await expect(page.locator('.income-shared-shell, .income-shared-origin')).toHaveCount(0);
      await expect(card).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
  for (const mode of ['fixed-monthly','annual-average','fixed-daily']) {
    test(`${version}: settings persist for ${mode}`, async ({page}) => {
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.clock.setFixedTime(new Date('2026-09-07T06:30:00Z'));
      await page.goto(`/Income-per-sed-${version}.html`);
      await fullDisplay(page);
      await page.locator('#incomeSettingsCard').click();
      await settingsReady(page);
      await page.locator(`[data-income-mode="${mode}"]`).click();
      await expect(page.locator(`[data-income-mode="${mode}"]`)).toHaveAttribute('aria-pressed','true');
      await page.locator('#incomeAmountInput').fill('2600');
      await page.locator('#settingsSaveButton').click();
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await page.reload();
      await fullDisplay(page);
      await page.locator('#incomeSettingsCard').click();
      await settingsReady(page);
      await expect(page.locator('#incomeAmountInput')).toHaveValue('2600.00');
      await expect(page.locator(`[data-income-mode="${mode}"]`)).toHaveAttribute('aria-pressed','true');
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('income-per-sed-settings')));
      expect(saved.payload.settings.incomeMode).toBe(mode);
      await page.keyboard.press('Escape');
      expect(Number(await page.locator('#progressTrack').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
      expect(errors).toEqual([]);
      await expect(page.locator('#settingsDialog')).toBeHidden();
    });
  }
  test(`${version}: mobile history, return and repeated recovery remain usable`,async({page})=>{
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width:390,height:844});
    await page.clock.install({time:new Date('2026-09-07T06:30:00Z')});
    await page.goto(`/Income-per-sed-${version}.html`);
    await fullDisplay(page);
    await page.locator('#historyQuickOpen').click();
    const box=await page.locator('#historyQuickPanel').boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y+box.height).toBeLessThanOrEqual(845);
    await page.locator('[data-history-seconds="-14400"]').click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1400);
    const past=await page.locator('#currentTime').textContent();
    await page.locator('#currentTime').click();
    await hidden(page,true); await page.clock.fastForward(60000); await hidden(page,false);
    await page.waitForTimeout(1600);
    expect(await page.locator('#currentTime').textContent()).not.toBe(past);
    await page.locator('#historyQuickOpen').click();
    await page.locator('#historyQuickPanel [data-history-action="live"]').click();
    await page.locator('#historyQuickClose').click();
    await page.waitForTimeout(2000);
    for(let i=0;i<10;i++){await hidden(page,true);await page.clock.fastForward(1000);await hidden(page,false);}
    await page.waitForTimeout(2000);
    await expect(page.locator('#currentTime')).toContainText('14:31');
    expect(errors).toEqual([]);
  });
  test(`${version}: a delayed backup cannot overwrite a newly entered draft`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-20T07:44:10Z'));
    await page.goto(`/Income-per-sed-${version}.html`);
    await fullDisplay(page);
    await page.locator('#incomeSettingsCard').click(); await settingsReady(page);
    const before = await page.evaluate(() => localStorage.getItem('income-per-sed-settings'));
    const backup = await exportSettingsBackup(page);
    backup.payload.settings.monthlyIncome = 8800;
    backup.checksum = backupChecksum(backup.payload);
    await page.evaluate(() => {
      const original = File.prototype.text;
      File.prototype.text = async function () {
        const text = await original.call(this);
        return new Promise(resolve => { window.releaseBackupRead = () => resolve(text); });
      };
    });
    await uploadSettingsBackup(page, backup);
    await page.waitForFunction(() => typeof window.releaseBackupRead === 'function');
    await page.locator('#incomeAmountInput').fill('9100');
    await page.evaluate(() => window.releaseBackupRead());
    await expect(page.locator('#settingsSafetyTitle')).toHaveText('未导入设置');
    await expect(page.locator('#settingsSafetyText')).toContainText('草稿');
    await page.locator('#settingsSafetyAccept').click();
    await expect(page.locator('#incomeAmountInput')).toHaveValue('9100');
    expect(await page.evaluate(() => localStorage.getItem('income-per-sed-settings'))).toBe(before);
  });
  test(`${version}: reopening history clears an obsolete date error`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-20T07:44:10Z'));
    await page.goto(`/Income-per-sed-${version}.html`);
    await fullDisplay(page);
    await page.locator('#historyQuickOpen').click();
    await page.waitForFunction(() => !document.getElementById('historyQuickPanel').dataset.entryAnimating);
    await page.evaluate(() => {
      document.getElementById('historySeekDateInput').value = '2026-10-21';
      document.getElementById('historySeekForm').requestSubmit();
    });
    await expect(page.locator('#historySeekWheels')).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#historyQuickClose').click();
    await expect(page.locator('#historyQuickPanel')).toBeHidden();
    await page.locator('#historyQuickOpen').click();
    await expect(page.locator('#historySeekError')).toBeHidden();
    await expect(page.locator('#historySeekWheels')).not.toHaveAttribute('aria-invalid', 'true');
  });
}
test('Develop and Push expose equal calculation results for work and rest dates',async({browser})=>{
  test.setTimeout(90000);
  const results=[];
  for(const version of ['Develop','Push']){
    const context=await browser.newContext({timezoneId:'Asia/Shanghai',reducedMotion:'reduce'});
    const page=await context.newPage(); const rows=[];
    try {
      for(const date of ['2026-09-07T06:30:00Z','2026-10-01T06:30:00Z']){
        await page.clock.setFixedTime(new Date(date));
        await page.goto(`http://127.0.0.1:4173/Income-per-sed-${version}.html`);
        await fullDisplay(page);
        for(const mode of ['fixed-monthly','annual-average','fixed-daily']){
          await page.locator('#incomeSettingsCard').click();
          await settingsReady(page);
          await page.locator(`[data-income-mode="${mode}"]`).click();
          await page.locator('#incomeAmountInput').fill('2600');
          await page.locator('#settingsSaveButton').click();
          await page.waitForTimeout(1500);
          rows.push(await page.evaluate(()=>({income:document.querySelector('#incomeAccessible').textContent,
            month:document.querySelector('#monthIncome').textContent,progress:document.querySelector('#progressTrack').getAttribute('aria-valuenow')})));
        }
      }
    }finally{await context.close();}
    results.push(rows);
  }
  expect(results[0]).toEqual(results[1]);
  expect(results[0].every(row=>row.income.length>0)).toBe(true);
});

const timezoneWorkdays = ['2026-03-08', '2026-03-29', '2026-10-25', '2026-11-01'];
const timezoneScenarios = [
  ['Shanghai control', 'Asia/Shanghai', '2026-03-08', '02:30:00'],
  ['UTC control', 'UTC', '2026-03-08', '02:30:00'],
  ['New York spring gap', 'America/New_York', '2026-03-08', '02:30:00'],
  ['Berlin spring gap', 'Europe/Berlin', '2026-03-29', '02:30:00'],
  ['New York autumn overlap', 'America/New_York', '2026-11-01', '01:30:00'],
  ['Berlin autumn overlap', 'Europe/Berlin', '2026-10-25', '02:30:00'],
  ['New York Beijing month boundary', 'America/New_York', '2026-04-01', '00:05:00'],
  ['Berlin Beijing month boundary', 'Europe/Berlin', '2026-04-01', '00:05:00'],
];
const timezoneSeconds = clock => clock.split(':').reduce((total, part) => total * 60 + Number(part), 0);
const timezoneDuration = seconds => `${Math.floor(seconds / 3600)}时${Math.floor(seconds % 3600 / 60)}分${seconds % 60}秒`;
const timezoneCurrency = value => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
function timezoneMonthIncome(day, seconds) {
  const [year, month, today] = day.split('-').map(Number);
  let completed = 0;
  for (let date = 1; date < today; date++) {
    const value = new Date(Date.UTC(year, month - 1, date));
    if (timezoneWorkdays.includes(value.toISOString().slice(0, 10)) || ![0, 6].includes(value.getUTCDay())) completed++;
  }
  return completed * 100 + seconds / 18000 * 100;
}
for (const artifact of ['Develop', 'Push']) for (const [label, timezoneId, day, clock] of timezoneScenarios) {
  test(`${artifact}: Beijing accounting and date entry ignore device timezone: ${label}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, timezoneId, reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
    try {
      await context.addInitScript(workdays => {
        localStorage.setItem('income-per-sed-settings', JSON.stringify({
          incomeMode: 'fixed-daily', monthlyIncome: 10000, dailyIncome: 100, annualWorkDays: 250,
          schedule: { morningStart: '00:00', morningEnd: '04:00', afternoonStart: '05:00', afternoonEnd: '06:00' },
        }));
        localStorage.setItem('income-per-sed-calendar-data-v1', JSON.stringify({ schemaVersion: 1, savedAt: '2026-01-01T00:00:00Z', calendarData: {
          coverage: { start: '2026-01-01', end: '2026-12-31', label: 'Synthetic timezone regression', version: 'timezone-v1', timeZone: 'Asia/Shanghai', generatedAt: '2026-01-01', source: 'Synthetic regression fixture' },
          holidays: [], specialWorkdays: workdays,
        } }));
      }, timezoneWorkdays);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const instant = new Date(`${day}T${clock}+08:00`);
      await page.clock.setFixedTime(instant);
      await page.goto(`/Income-per-sed-${artifact}.html`);
      await fullDisplay(page);
      const seconds = timezoneSeconds(clock);
      await expect(page.locator('#currentTime')).toHaveText(clock);
      await expect(page.locator('#currentTime')).toHaveAttribute('datetime', instant.toISOString());
      await expect(page.locator('#workedTime')).toHaveText(timezoneDuration(seconds));
      await expect(page.locator('#incomeAccessible')).toContainText(timezoneCurrency(seconds / 18000 * 100));
      await expect(page.locator('#monthIncome')).toHaveText(timezoneCurrency(timezoneMonthIncome(day, seconds)));
      await page.locator('#historyQuickOpen').click();
      await expect(page.locator('#historyQuickPanel')).not.toHaveAttribute('data-entry-animating');
      await expect(page.locator('#historyDialDate')).toHaveText(day);
      const seekClock = seconds < 3600 ? '00:04:00' : clock.startsWith('01') ? '01:15:00' : '02:15:00';
      await page.locator('#historyDialTime').fill(seekClock);
      await page.locator('#historyDialTime').press('Enter');
      await expect(page.locator('body')).toHaveAttribute('data-timeline-state', 'history-hold');
      await expect(page.locator('#currentTime')).toHaveText(seekClock);
      await expect(page.locator('#historySeekError')).toBeHidden();
      await page.locator('#historySeekSubmit').click();
      await expect(page.locator('#historySeekError')).toBeHidden();
      await expect(page.locator('#historyQuickClock')).toHaveAttribute('datetime', new Date(`${day}T${seekClock}+08:00`).toISOString());
      await expect(page.locator('#workedTime')).toHaveText(timezoneDuration(timezoneSeconds(seekClock)));
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}
