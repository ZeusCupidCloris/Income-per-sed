const { test, expect } = require('@playwright/test');

test('settings text retains layout when the shared shell returns to its card', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-09-07T06:30:00Z') });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1600);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()+1000)));
  const records=[];
  for(const kind of ['income','schedule']) {
    const card=page.locator(`#${kind}SettingsCard`);
    await card.scrollIntoViewIfNeeded();
    await card.dispatchEvent('click');
    await page.clock.runFor(420);
    await page.keyboard.press('Escape');
    await page.clock.runFor(384);
    records.push(await page.evaluate(kind => {
      const original=document.querySelector(`#${kind}SettingsCard`);
      const mirror=document.querySelector('.income-shared-mirror');
      const measure=root=>{
        const rect=root.getBoundingClientRect();
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        const texts=[];
        while(walker.nextNode()) {
          const node=walker.currentNode;
          if(!node.textContent.trim()) continue;
          const range=document.createRange();range.selectNodeContents(node);
          const r=range.getBoundingClientRect();
          if(!r.width || !r.height) continue;
          texts.push({text:node.textContent.trim(),x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height});
        }
        return {display:getComputedStyle(root).display,texts};
      };
      return {kind,original:measure(original),mirror:measure(mirror)};
    },kind));
    await page.clock.runFor(160);
  }
  await testInfo.attach('text-layout.json',{body:JSON.stringify(records,null,2),contentType:'application/json'});
  for(const record of records) {
    expect(record.mirror.display).toBe(record.original.display);
    expect(record.mirror.texts.length).toBe(record.original.texts.length);
    for(let i=0;i<record.original.texts.length;i++) {
      expect(record.mirror.texts[i].text).toBe(record.original.texts[i].text);
      for(const key of ['x','y','width','height']) expect(Math.abs(record.mirror.texts[i][key]-record.original.texts[i][key])).toBeLessThan(.6);
    }
  }
});

test('settings panel text fades at fixed coordinates without a moving glyph clip', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-07T06:30:00Z') });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1600);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()+1000)));
  for(const kind of ['income','schedule']) {
    const card=page.locator(`#${kind}SettingsCard`);
    await card.scrollIntoViewIfNeeded();
    await card.dispatchEvent('click');
    for(const closing of [false,true]) {
      if(closing) await page.keyboard.press('Escape');
      const frames=[];
      for(let i=0;i<24;i++) {
        await page.clock.runFor(16);
        frames.push(await page.evaluate(()=>{
          const sheet=document.querySelector('.settings-sheet');
          const title=document.querySelector('#settingsDialogTitle').getBoundingClientRect();
          return {x:title.x,y:title.y,opacity:Number(getComputedStyle(sheet).opacity),clip:getComputedStyle(sheet).clipPath,active:document.querySelector('#settingsDialog').classList.contains('income-shared-active')};
        }));
      }
      for(const frame of frames) {
        if(frame.active) expect(frame.clip).toBe('inset(0px)');
        expect(Math.abs(frame.x-frames[0].x)).toBeLessThan(.1);
        expect(Math.abs(frame.y-frames[0].y)).toBeLessThan(.1);
      }
      for(let i=1;i<frames.length;i++) {
        const delta=frames[i].opacity-frames[i-1].opacity;
        expect(closing ? delta<=.001 : delta>=-.001).toBe(true);
        expect(Math.abs(delta)).toBeLessThan(.3);
      }
      await page.clock.runFor(160);
    }
  }
});
