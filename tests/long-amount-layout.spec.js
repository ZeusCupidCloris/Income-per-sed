const { test, expect } = require('@playwright/test');

for (const channel of ['Develop', 'Push']) {
  for (const width of [390, 1440]) {
    for (const theme of ['light', 'dark']) {
      test(`${channel}: long amounts remain inside windows at ${width} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.clock.setFixedTime(new Date('2026-09-07T10:00:00Z'));
        await page.goto(`/Income-per-sed-${channel}.html`);
        for (const sample of [
          { mode: 'fixed-daily', amount: '10000000', expected: '10,000,000.00' },
          { mode: 'fixed-daily', amount: '100000000', expected: '100,000,000.00' },
          { mode: 'annual-average', amount: '1000000000', days: '12', expected: '1,000,000,000.00' },
        ]) {
          await page.locator('#incomeSettingsCard').click();
          await page.locator(`[data-income-mode="${sample.mode}"]`).click();
          await page.locator('#incomeAmountInput').fill(sample.amount);
          if (sample.days) await page.locator('#annualWorkDaysInput').fill(sample.days);
          await page.locator('#settingsSaveButton').click();
          await expect(page.locator('#settingsDialog')).not.toBeVisible();
          await expect(page.locator('#incomeAccessible')).toContainText(sample.expected, { timeout: 10000 });
          await page.waitForTimeout(600);
          const bounds = await page.locator('#flipContainer').evaluate(el => {
            const box = el.getBoundingClientRect();
            const panel = el.closest('#incomeValuePanel').getBoundingClientRect();
            return {
              left: box.left, right: box.right, panelLeft: panel.left, panelRight: panel.right,
              cells: [...el.querySelectorAll('.flip-digit-container')].map(cell => {
                const r = cell.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width };
              }),
              documentOverflow: document.documentElement.scrollWidth - innerWidth,
            };
          });
          expect(bounds.cells.length).toBeGreaterThanOrEqual(10);
          expect(bounds.documentOverflow).toBeLessThanOrEqual(1);
          for (const cell of bounds.cells) {
            expect(cell.width).toBeGreaterThan(8);
            expect(cell.left).toBeGreaterThanOrEqual(bounds.panelLeft - 1);
            expect(cell.right).toBeLessThanOrEqual(bounds.panelRight + 1);
          }
        }
      });
    }
  }
}

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`Develop: long windows stay bounded during seek, theme and resize at ${width} ${theme}`, async ({ page }, testInfo) => {
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.setViewportSize({width,height:1000});
      await page.emulateMedia({colorScheme:theme,reducedMotion:'no-preference'});
      await page.addInitScript(() => localStorage.setItem('income-per-sed-settings',JSON.stringify({
        incomeMode:'annual-average',monthlyIncome:1000000000,dailyIncome:300,annualWorkDays:12,
        schedule:{morningStart:'09:00',morningEnd:'11:30',afternoonStart:'13:30',afternoonEnd:'17:30'}
      })));
      // Freeze business time, but retain native animation frames and ResizeObserver delivery.
      await page.clock.setFixedTime(new Date('2026-09-07T09:30:00Z'));
      await page.goto('/Income-per-sed-Develop.html');
      await page.waitForTimeout(2400);
      await page.evaluate(() => {
        window.__amountMotionFrames=[];
        // Observe after the frame's ResizeObserver callbacks, not intermediate pre-paint layout.
        const sample=()=>{window.__amountProbe=requestAnimationFrame(()=>{
          const frameViewport=innerWidth;
          setTimeout(()=>{
          // An old frame's deferred task can run after a viewport replacement; it is not a painted new frame.
          if(innerWidth!==frameViewport){sample();return;}
          const panel=document.querySelector('#incomeValuePanel').getBoundingClientRect();
          const cells=[...document.querySelectorAll('#flipContainer .flip-digit-container')].map(el=>{
            const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};
          });
          window.__amountMotionFrames.push({cells,left:panel.left,right:panel.right,
            viewport:innerWidth,clientWidth:document.querySelector('#incomeValuePanel').clientWidth,
            font:getComputedStyle(document.querySelector('#flipContainer')).fontSize,
            fit:document.querySelector('#flipContainer').style.getPropertyValue('--amount-runtime-fit'),
            overflow:document.documentElement.scrollWidth-innerWidth,
            transforms:[...document.querySelectorAll('#flipContainer .flip-digit-list')].map(el=>getComputedStyle(el).transform)});
          sample();
        },0);});};sample();
      });
      await page.locator('[data-history-seconds="-14400"]').dispatchEvent('click');
      await page.waitForTimeout(350);
      for (const deltaY of [-120,120,-120,120]) {
        await page.locator('#currentTime').dispatchEvent('wheel',{deltaY,bubbles:true,cancelable:true});
        await page.waitForTimeout(32);
      }
      await page.locator(`.theme-option[data-theme-mode="${theme==='light'?'dark':'light'}"]`).dispatchEvent('click');
      await page.setViewportSize({width:width===390?768:900,height:1000});
      await page.waitForTimeout(700);
      await page.locator('#liveAnchor').dispatchEvent('click');
      await page.waitForTimeout(4600);
      await page.setViewportSize({width,height:1000});
      await page.waitForTimeout(600);
      const frames=await page.evaluate(()=>{cancelAnimationFrame(window.__amountProbe);return window.__amountMotionFrames;});
      await testInfo.attach('long-money-motion.json',{body:JSON.stringify(frames),contentType:'application/json'});
      expect(frames.length).toBeGreaterThan(100);
      expect(new Set(frames.map(frame=>JSON.stringify(frame.transforms))).size).toBeGreaterThan(3);
      for(const frame of frames){
        expect(frame.overflow).toBeLessThanOrEqual(1);
        for(const cell of frame.cells){
          expect(cell.width).toBeGreaterThan(8);
          expect(cell.left).toBeGreaterThanOrEqual(frame.left-1);
          expect(cell.right).toBeLessThanOrEqual(frame.right+1);
        }
      }
      expect(await page.evaluate(()=>window.__incomeClockDiagnostics.getTimelineState())).toBe('LIVE');
      const cursorOffset=await page.locator('#progressTrack').evaluate(track=>{
        const fills=[...track.querySelectorAll('.segment-fill')];
        const active=fills.findLast(fill=>new DOMMatrixReadOnly(getComputedStyle(fill).transform).a>0.001);
        const cursor=track.querySelector('.timeline-handoff-marker').getBoundingClientRect();
        return Math.abs(cursor.left+cursor.width/2-active.getBoundingClientRect().right);
      });
      expect(cursorOffset).toBeLessThan(2.5);
      await page.screenshot({path:testInfo.outputPath('long-money-motion.png')});
      expect(errors).toEqual([]);
    });
  }
}
