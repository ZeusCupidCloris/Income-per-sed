const { test, expect } = require('@playwright/test');
const { prepareRecovery, resumeAt, setHidden, readRecovery, sampleRecovery, expectedMonth } = require('./helpers/background-recovery');

for (const channel of process.env.DEVELOP_PREVIEW === '1' ? ['Develop'] : ['Develop', 'Push']) {
  for (const resizePhase of ['hidden', 'recovering']) {
    test(`${channel}: viewport resize while ${resizePhase} keeps recovery route aligned`, async ({page}, testInfo) => {
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.setViewportSize({width:1440,height:1000});
      await prepareRecovery(page,channel,'fixed-daily','2026-09-07T02:30:00Z');
      if(resizePhase==='hidden'){
        await setHidden(page,true);
        await page.setViewportSize({width:390,height:1000});
      }
      await resumeAt(page,'2026-09-07T07:30:00Z');
      await page.clock.runFor(160);
      await expect(page.locator('body')).toHaveClass(/foreground-catchup-active/);
      await page.setViewportSize({width:resizePhase==='hidden'?768:390,height:1000});
      await page.waitForTimeout(50);
      const frames=[];
      for(let elapsed=0;elapsed<4200;elapsed+=40){
        if(elapsed===480 || elapsed===1200){
          await page.setViewportSize({width:elapsed===480?900:1440,height:1000});
          await page.waitForTimeout(50);
        }
        // Sample a rendered clock frame, not a forced layout between frozen frames.
        await page.clock.runFor(40);
        const frame=await page.evaluate(()=>{
          const track=document.querySelector('#progressTrack');
          const fills=[...track.querySelectorAll('.segment-fill')];
          const segments=fills.map(fill=>fill.parentElement.getBoundingClientRect());
          const cursor=track.querySelector('.timeline-handoff-marker').getBoundingClientRect();
          return {
            active:document.body.classList.contains('foreground-catchup-active'),
            ratios:fills.map(fill=>new DOMMatrixReadOnly(getComputedStyle(fill).transform).a),
            ends:fills.map(fill=>fill.getBoundingClientRect().right),
            cursor:cursor.left+cursor.width/2,gapStart:segments[0].right,gapEnd:segments[1].left,
            trackWidth:track.getBoundingClientRect().width,layoutWidth:track.offsetWidth,
            segmentWidths:segments.map(segment=>segment.width),
            layoutSegments:fills.map(fill=>fill.parentElement.offsetWidth),
            inlineRatios:fills.map(fill=>fill.style.getPropertyValue('--progress-scale')),
            cursorStyle:track.style.getPropertyValue('--timeline-cursor-x'),
            transitions:fills.map(fill=>getComputedStyle(fill).transition),
            overflow:document.documentElement.scrollWidth-innerWidth
          };
        });
        frames.push(frame);
      }
      await testInfo.attach('resize-recovery-frames.json',{body:JSON.stringify(frames),contentType:'application/json'});
      expect(frames.some(frame=>frame.active)).toBe(true);
      for(const frame of frames){
        expect(frame.overflow).toBeLessThanOrEqual(1);
        expect(frame.ratios[0]<.999 && frame.ratios[1]>.001).toBe(false);
        const offset=frame.ratios[1]>.001 ? Math.abs(frame.cursor-frame.ends[1])
          : frame.ratios[0]<.999 ? Math.abs(frame.cursor-frame.ends[0])
          : Math.max(0,frame.gapStart-frame.cursor,frame.cursor-frame.gapEnd);
        expect(offset).toBeLessThan(2.5);
      }
      const last=await page.evaluate(readRecovery);
      const target=expectedMonth(last.now,'fixed-daily',4,22);
      expect(last.active).toBe(false);expect(last.state).toBe('live');
      expect(Math.abs(last.month-target.income)).toBeLessThan(.02);
      expect(Math.abs(last.progress-target.progress)).toBeLessThan(.11);
      await page.screenshot({path:testInfo.outputPath('resize-recovery.png')});
      expect(errors).toEqual([]);
    });
  }
}

for (const channel of process.env.DEVELOP_PREVIEW === '1' ? ['Develop'] : ['Develop', 'Push']) {
 for (const mode of ['fixed-monthly', 'annual-average', 'fixed-daily']) {
  for (const action of ['hide again', 'history takeover']) {
    test(`${channel}: ${mode} cross-date recovery supports ${action}`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await prepareRecovery(page, channel, mode, '2026-09-07T07:30:00Z');
      await resumeAt(page, '2026-09-08T02:30:00Z');
      await page.clock.runFor(320);
      const before = await page.evaluate(readRecovery);
      expect(before.active).toBe(true);
      if (action === 'hide again') {
        await setHidden(page, true);
        await page.clock.fastForward(60000);
        await setHidden(page, false);
        const immediate = await page.evaluate(readRecovery);
        await testInfo.attach('second-resume.json', { body: JSON.stringify({ before, immediate }), contentType: 'application/json' });
        expect(Math.abs(immediate.month - before.month)).toBeLessThan(.02);
      } else {
        await page.locator('#currentTime').dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        const immediate = await page.evaluate(readRecovery);
        expect(immediate.historyActive).toBe(true);
        expect(immediate.state).not.toBe('live');
        expect(immediate.active).toBe(false);
        await page.clock.runFor(1200);
        expect((await page.evaluate(readRecovery)).historyActive).toBe(true);
        await page.locator('#liveAnchor').dispatchEvent('click');
      }
      const frames = await sampleRecovery(page, 4400);
      await testInfo.attach('interrupted-background-recovery.json', { body: JSON.stringify({ before, frames }), contentType: 'application/json' });
      const last = frames.at(-1);
      expect(last.active).toBe(false);
      expect(last.history).toBe(false);
      expect(last.historyActive).toBe(false);
      expect(last.state).toBe('live');
      expect(last.returning).toBe(false);
      expect(frames.some(f => f.midnight)).toBe(false);
      const target = expectedMonth(last.now, mode, 5, 22);
      expect(Math.abs(last.month - target.income)).toBeLessThan(.02);
      expect(Math.abs(last.progress - target.progress)).toBeLessThan(.11);
      if (action === 'hide again') {
        for (let i = 1; i < frames.length; i++) expect(frames[i].month).toBeGreaterThanOrEqual(frames[i - 1].month - .02);
        expect(Math.max(...frames.map(f => f.month))).toBeLessThanOrEqual(last.month + .02);
      }
      expect(errors).toEqual([]);
    });
  }
 }
}

for (const channel of process.env.DEVELOP_PREVIEW === '1' ? ['Develop'] : ['Develop','Push']) {
  for (const action of ['settings open','task running','return interrupted']) {
    test(`${channel}: foreground recovery while ${action} preserves UI and accounting`,async({page},testInfo)=>{
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await prepareRecovery(page,channel,'fixed-daily','2026-09-07T06:30:00Z');
      let taskBefore;
      if(action==='settings open'){
        await page.locator('#incomeSettingsCard').focus();
        await page.locator('#incomeSettingsCard').dispatchEvent('click');
        await page.clock.runFor(400);
        await page.locator('#incomeAmountInput').fill('456.78');
      } else if(action==='task running') {
        await page.locator('#taskStopwatch').dispatchEvent('click');
        await page.clock.runFor(500);
        if(channel==='Develop')taskBefore=await page.evaluate(()=>window.__incomeClockDiagnostics.getTaskStopwatchState());
      } else {
        await page.locator('[data-history-seconds="-14400"]').dispatchEvent('click');
        await page.clock.runFor(1500);
        await page.locator('#liveAnchor').dispatchEvent('click');
        await page.clock.runFor(150);
      }
      await resumeAt(page,'2026-09-07T07:30:00Z');
      const frames=await sampleRecovery(page,5000);
      await testInfo.attach('ui-recovery-combination.json',{body:JSON.stringify(frames),contentType:'application/json'});
      const last=frames.at(-1);
      expect(last.active).toBe(false);expect(last.returning).toBe(false);expect(last.state).toBe('live');
      const target=expectedMonth(last.now,'fixed-daily',4,22);
      expect(Math.abs(last.month-target.income)).toBeLessThan(.02);
      expect(Math.abs(last.progress-target.progress)).toBeLessThan(.11);
      if(action==='settings open'){
        await expect(page.locator('#settingsDialog')).toBeVisible();
        await expect(page.locator('#incomeAmountInput')).toHaveValue('456.78');
        await page.keyboard.press('Escape');await page.clock.runFor(350);
        await expect(page.locator('#settingsDialog')).toBeHidden();
        await expect(page.locator('#incomeSettingsCard')).toBeFocused();
      } else if(action==='task running'){
        if(channel==='Develop'){
          const after=await page.evaluate(()=>window.__incomeClockDiagnostics.getTaskStopwatchState());
          expect(after.elapsedMs-taskBefore.elapsedMs).toBeGreaterThan(3590000);
          expect(after.elapsedMs-taskBefore.elapsedMs).toBeLessThan(3610000);
        }
        await expect(page.locator('#taskStopwatch')).toHaveAttribute('aria-pressed','true');
      }
      await page.screenshot({path:testInfo.outputPath('recovery-combination.png')});
      expect(errors).toEqual([]);
    });
  }
}
