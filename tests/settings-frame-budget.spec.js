const { test, expect } = require('@playwright/test');

test('settings motion samples real frame intervals and layout cost', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1800);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name,m.value]));
  await page.evaluate(() => {
    window.__settingsFrameProbe={intervals:[],last:0,stop:false};
    const sample=t=>{
      const p=window.__settingsFrameProbe;
      if(p.stop) return;
      if(document.querySelector('.income-shared-shell')) {
        if(p.last) p.intervals.push(t-p.last);
        p.last=t;
      } else p.last=0;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  const before=await metrics();
  for(let i=0;i<4;i++) for(const kind of ['income','schedule']) {
    await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
    await page.waitForTimeout(450);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(550);
  }
  const after=await metrics();
  const intervals=await page.evaluate(()=>{window.__settingsFrameProbe.stop=true;return window.__settingsFrameProbe.intervals;});
  const sorted=[...intervals].sort((a,b)=>a-b);
  const report={frames:intervals.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over34ms:intervals.filter(n=>n>34).length,metrics:Object.fromEntries(['LayoutCount','LayoutDuration','RecalcStyleCount','RecalcStyleDuration','TaskDuration'].map(k=>[k,after[k]-before[k]]))};
  console.log(JSON.stringify(report));
  await testInfo.attach('frame-budget.json',{body:JSON.stringify(report,null,2),contentType:'application/json'});
  expect(intervals.length).toBeGreaterThan(0);
  await expect(page.locator('.income-shared-shell')).toHaveCount(0);
});
