const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
  await page.clock.install({time:new Date('2026-09-07T06:30:00Z')});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1600);
});
test('settings cancel and theme changes do not interrupt foreground ownership',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const settings=await page.evaluate(()=>localStorage.getItem('income-per-sed-settings'));
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(60000);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.locator('#incomeSettingsCard').click();
  await page.locator('#incomeAmountInput').fill('12345');
  await page.keyboard.press('Escape');
  await page.locator('[data-theme-mode="dark"]').click();
  await page.locator('[data-theme-mode="light"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__incomeClockDiagnostics.getTimelineState())).toBe('LIVE');
  expect(await page.evaluate(()=>localStorage.getItem('income-per-sed-settings'))).toBe(settings);
  expect(await page.evaluate(()=>window.__incomeClockDiagnostics.getUnifiedMotionState().displayed.income)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
test('saving work hours during history preserves playback and updates duration',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.locator('#historyQuickOpen').click();
  await page.locator('[data-history-seconds="-3600"]').click();
  await page.keyboard.press('Escape');
  await expect.poll(()=>page.evaluate(()=>window.__incomeClockDiagnostics.getTimelineState())).toBe('HISTORY_HOLD');
  await page.locator('#currentTime').click();
  await page.getByRole('button',{name:'修改上午、午休和下午工作时间',exact:true}).click();
  const wheel=page.locator('[data-time-key="morningStart"] [data-unit="hour"]');
  await wheel.press('ArrowUp');
  const selected=await wheel.getAttribute('aria-valuenow');
  expect(selected).not.toBe('9');
  await page.locator('#settingsSaveButton').click();
  await expect(page.locator('#settingsDialog')).toBeHidden();
  expect(await page.evaluate(()=>window.__incomeClockDiagnostics.getTimelineState())).toBe('HISTORY_PLAY');
  await page.getByRole('button',{name:'修改上午、午休和下午工作时间',exact:true}).click();
  await expect(wheel).toHaveAttribute('aria-valuenow',selected);
  await page.keyboard.press('Escape');
});
test('running task retains elapsed time across midnight',async({page})=>{
  await page.clock.setSystemTime(new Date('2026-09-07T15:59:58Z'));
  await page.locator('#taskStopwatch').click();
  const before=await page.evaluate(()=>window.__incomeClockDiagnostics.getTaskStopwatchState());
  await page.clock.fastForward(5000);
  const after=await page.evaluate(()=>window.__incomeClockDiagnostics.getTaskStopwatchState());
  expect(after.elapsedMs-before.elapsedMs).toBeGreaterThanOrEqual(4900);
  expect(after.mode).toBe(before.mode);
  expect(after.elapsedMs).toBeGreaterThan(before.elapsedMs);
});
