const { test, expect } = require('@playwright/test');
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
  test(`${version}: settings persist across all income modes`, async ({page}) => {
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-09-07T06:30:00Z'));
    await page.goto(`/Income-per-sed-${version}.html`);
    for(const mode of ['fixed-monthly','annual-average','fixed-daily']) {
      await page.locator('#incomeSettingsCard').click();
      await page.locator(`[data-income-mode="${mode}"]`).click();
      await page.locator('#incomeAmountInput').fill('2600');
      await page.locator('#settingsSaveButton').click();
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await page.reload();
      await page.locator('#incomeSettingsCard').click();
      await expect(page.locator('#incomeAmountInput')).toHaveValue('2600.00');
      await page.keyboard.press('Escape');
      expect(Number(await page.locator('#progressTrack').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  });
  test(`${version}: mobile history, return and repeated recovery remain usable`,async({page})=>{
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width:390,height:844});
    await page.clock.install({time:new Date('2026-09-07T06:30:00Z')});
    await page.goto(`/Income-per-sed-${version}.html`);
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
    await page.locator('#liveAnchor').click();
    await page.waitForTimeout(2000);
    for(let i=0;i<10;i++){await hidden(page,true);await page.clock.fastForward(1000);await hidden(page,false);}
    await page.waitForTimeout(2000);
    await expect(page.locator('#currentTime')).toContainText('14:31');
    expect(errors).toEqual([]);
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
        for(const mode of ['fixed-monthly','annual-average','fixed-daily']){
          await page.locator('#incomeSettingsCard').click();
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
