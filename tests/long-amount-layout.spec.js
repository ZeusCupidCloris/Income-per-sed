const { fullDisplay, selectTheme } = require('./helpers/display-state');
const { test, expect } = require('@playwright/test');

async function progressOverflowLayout(page) {
  return page.locator('#scheduleSettingsCard').evaluate(card => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    nodes: [card, ...card.querySelectorAll('*')].map(node => {
      const box = node.getBoundingClientRect(), style = getComputedStyle(node);
      return { id: node.id, classes: node.className, left: box.left, right: box.right,
        width: box.width, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
        display: style.display, transform: style.transform, inset: style.left, inlineStyle: node.getAttribute('style') };
    }),
  }));
}

async function monthSummaryLayout(page) {
  return page.locator('#monthSummaryCard').evaluate(card => {
    const box = node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    };
    return {
      card: box(card),
      groups: [...card.children].map(box),
      overflow: document.documentElement.scrollWidth - innerWidth,
      overflowNodes: document.documentElement.scrollWidth > innerWidth + 1
        ? [...document.querySelectorAll('.main-container,.card,.info-value,.info-sub,.month-value,.month-projection-value,#funFact,.fun-item')].map(node => ({
          id: node.id, classes: node.className, ...box(node), scrollWidth: node.scrollWidth, clientWidth: node.clientWidth
        })).filter(node => node.right > innerWidth + 1 || node.left < -1 || node.scrollWidth > node.clientWidth + 1)
        : [],
      amounts: ['monthIncome', 'estMonth'].map(id => {
        const node = document.getElementById(id);
        const range = document.createRange();
        range.selectNodeContents(node);
        const style = getComputedStyle(node);
        return {
          id, text: node.textContent, box: box(node),
          lines: [...range.getClientRects()].filter(rect => rect.width > 0).map(rect => ({ left: rect.left, right: rect.right })),
          font: { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize }
        };
      })
    };
  });
}

function expectWholeMonthAmounts(layout) {
  expect(layout.overflow, JSON.stringify(layout)).toBeLessThanOrEqual(1);
  for (const amount of layout.amounts) {
    expect(amount.lines, `${amount.id}: ${amount.text}`).toHaveLength(1);
    expect(amount.lines[0].left).toBeGreaterThanOrEqual(layout.card.left - 1);
    expect(amount.lines[0].right).toBeLessThanOrEqual(layout.card.right + 1);
  }
}

for (const channel of ['Develop', 'Push']) {
  for (const width of [320, 390, 1440]) {
    for (const theme of ['light', 'dark']) {
      test(`${channel}: month summary keeps whole amounts at ${width} ${theme}`, async ({ page }, testInfo) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width, height: 1000 });
        const baseTime = Date.parse('2026-10-20T08:30:00Z');
        let second = 0;
        await page.clock.setFixedTime(new Date(baseTime));
        async function settleMeasurements() {
          for (let pass = 0; pass < 3; pass++) {
            second++;
            await page.clock.setFixedTime(new Date(baseTime + second * 1000));
            await expect(page.locator('#currentTime')).toHaveText(`16:30:${String(second).padStart(2, '0')}`);
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
          }
        }
        await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
        await page.goto(`/Income-per-sed-${channel}.html`);
        await fullDisplay(page);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('#monthSummaryCard').scrollIntoViewIfNeeded();
        // Fixed wall time must advance after each layout change, not only at startup.
        await settleMeasurements();
        await expect(page.locator('#monthSummaryCard')).toHaveAttribute('data-content-pressure', /^(normal|compact|critical)$/);
        const normal = await monthSummaryLayout(page);
        expectWholeMonthAmounts(normal);
        expect(normal.groups[1].top).toBeLessThan(normal.groups[0].bottom);

        await page.locator('#incomeSettingsCard').click();
        await page.waitForFunction(() => !document.querySelector('[data-settings-unready],.income-shared-shell'));
        await page.locator('[data-income-mode="annual-average"]').click();
        await page.locator('#incomeAmountInput').fill('1000000000');
        await page.locator('#annualWorkDaysInput').fill('1');
        await page.locator('#settingsSaveButton').click();
        await expect(page.locator('#settingsDialog')).toBeHidden();
        await settleMeasurements();
        await expect(page.locator('#estMonth')).toContainText(',000,000,000.00');
        const long = await monthSummaryLayout(page);
        expectWholeMonthAmounts(long);
        if (width <= 390) expect(long.groups[1].top).toBeGreaterThanOrEqual(long.groups[0].bottom - 1);
        for (let index = 0; index < long.amounts.length; index++) {
          expect(long.amounts[index].font.family).toBe(normal.amounts[index].font.family);
          expect(long.amounts[index].font.weight).toBe(normal.amounts[index].font.weight);
        }
        for (const nextWidth of [width <= 390 ? 1440 : 390, width]) {
          await page.setViewportSize({ width: nextWidth, height: 1000 });
          await page.locator('#monthSummaryCard').scrollIntoViewIfNeeded();
          await settleMeasurements();
          let layout;
          try {
            await expect.poll(async () => {
              layout = await monthSummaryLayout(page);
              return layout.overflow <= 1 && layout.amounts.every(amount => amount.lines.length === 1
                && amount.lines[0].left >= layout.card.left - 1 && amount.lines[0].right <= layout.card.right + 1);
            }).toBe(true);
          } catch (error) {
            console.log('month-resize-layout', JSON.stringify({ width: nextWidth, layout }));
            console.log('month-progress-overflow', JSON.stringify(await progressOverflowLayout(page)));
            throw error;
          }
        }
        await page.waitForTimeout(2200);
        expectWholeMonthAmounts(await monthSummaryLayout(page));
        await page.screenshot({ path: testInfo.outputPath('month-long-amount.png'), fullPage: true });

        await page.locator('#incomeSettingsCard').click();
        await page.waitForFunction(() => !document.querySelector('[data-settings-unready],.income-shared-shell'));
        await page.locator('[data-income-mode="fixed-monthly"]').click();
        await page.locator('#incomeAmountInput').fill('7296.70');
        await page.locator('#settingsSaveButton').click();
        await expect(page.locator('#settingsDialog')).toBeHidden();
        await settleMeasurements();
        await expect(page.locator('#estMonth')).toHaveText('¥7,296.70');
        await expect.poll(async () => {
          const layout = await monthSummaryLayout(page);
          return layout.groups[1].top < layout.groups[0].bottom;
        }).toBe(true);
        await expect.poll(async () => (await monthSummaryLayout(page)).amounts.map(amount => amount.font))
          .toEqual(normal.amounts.map(amount => amount.font));
        const restored = await monthSummaryLayout(page);
        expectWholeMonthAmounts(restored);
        expect(restored.amounts.map(amount => amount.font)).toEqual(normal.amounts.map(amount => amount.font));
        await page.locator('#privacyToggle').click();
        await expect(page.locator('#monthIncome')).toHaveCSS('visibility', 'hidden');
        await expect(page.locator('#estMonth')).toHaveCSS('visibility', 'hidden');
        expect(errors).toEqual([]);
      });
    }
  }
}

for (const width of [320, 390]) {
  for (const time of ['02:30:00', '08:30:00']) {
    test(`offscreen helper markers cannot widen ${width}px progress layout at ${time}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.clock.setFixedTime(new Date(`2026-10-20T${time}Z`));
      await page.addInitScript(() => {
        const NativeObserver = window.IntersectionObserver;
        let deferred = true;
        const callbacks = [];
        window.IntersectionObserver = class extends NativeObserver {
          constructor(callback, options) {
            super((entries, observer) => {
              for (const entry of entries) {
                if (entry.target.id === 'scheduleSettingsCard') callbacks.push({ callback, entry, observer });
              }
              callback(entries.map(entry => deferred && entry.target.id === 'scheduleSettingsCard'
                ? { target: entry.target, boundingClientRect: entry.boundingClientRect, isIntersecting: false, intersectionRatio: 0 }
                : entry), observer);
            }, options);
          }
        };
        window.restoreTimelineObservation = () => {
          deferred = false;
          for (const { callback, entry, observer } of callbacks) callback([{
            target: entry.target, boundingClientRect: entry.target.getBoundingClientRect(),
            isIntersecting: true, intersectionRatio: 1,
          }], observer);
        };
      });
      await page.goto('/Income-per-sed-Develop.html');
      await fullDisplay(page);
      await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getVisualComponentState().states.timeline)).toBe('hidden');
      await page.setViewportSize({ width, height: 1000 });
      try {
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      } catch (error) {
        console.log('progress-resize-layout', JSON.stringify(await progressOverflowLayout(page)));
        throw error;
      }
      const hiddenGeometry = await page.locator('#progressTrack').evaluate(track => {
        return {
          helpers: [...track.querySelectorAll('.progress-marker')].map(marker => {
            const rect = marker.getBoundingClientRect(), parent = marker.parentElement.getBoundingClientRect();
            return !marker.getClientRects().length || (rect.left >= parent.left - 4 && rect.right <= parent.right + 4);
          }),
        };
      });
      expect(hiddenGeometry.helpers).toEqual([true, true]);
      await expect.poll(() => page.locator('#progressTrack').evaluate(track => {
        const bounds = track.getBoundingClientRect(), cursor = track.querySelector('.timeline-handoff-marker').getBoundingClientRect();
        return Math.abs(cursor.left + cursor.width / 2 - bounds.left - parseFloat(track.style.getPropertyValue('--timeline-cursor-x')));
      })).toBeLessThan(2.5);
      await page.evaluate(() => window.restoreTimelineObservation());
      await expect.poll(() => page.evaluate(() => window.__incomeClockDiagnostics.getVisualComponentState().states.timeline)).toBe('visible');
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await expect(page.locator('.timeline-handoff-marker')).toBeVisible();
    });
  }
}

test('progress rendering refreshes geometry when resize notifications are delayed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.setFixedTime(new Date('2026-09-07T06:30:00Z'));
  await page.addInitScript(() => {
    const NativeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends NativeObserver {
      observe(element, options) {
        if (element.classList.contains('work-segment')) return;
        super.observe(element, options);
      }
    };
    window.addEventListener('resize', event => event.stopImmediatePropagation());
  });
  await page.goto('/Income-per-sed-Develop.html');
  await fullDisplay(page);
  await page.waitForTimeout(2400);
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.locator('[data-history-seconds="-14400"]').dispatchEvent('click');
  await page.waitForTimeout(350);
  await page.locator('#liveAnchor').dispatchEvent('click');
  const maxError = await page.locator('#progressTrack').evaluate(track => new Promise(resolve => {
    let frames = 0;
    let error = 0;
    let worst = null;
    const sample = () => {
      const fills = [...track.querySelectorAll('.segment-fill')];
      const active = fills.findLast(fill => new DOMMatrixReadOnly(getComputedStyle(fill).transform).a > 0.001);
      const marker = track.querySelector('.timeline-handoff-marker').getBoundingClientRect();
      const center = marker.left + marker.width / 2;
      const lunch = { left: fills[0].parentElement.getBoundingClientRect().right, right: fills[1].parentElement.getBoundingClientRect().left };
      if (active && (center < lunch.left || center > lunch.right)) {
        const distance = Math.abs(center - active.getBoundingClientRect().right);
        if (distance > error) {
          error = distance;
          worst = { center, right: active.getBoundingClientRect().right, lunch: [lunch.left, lunch.right], x: track.style.getPropertyValue('--timeline-cursor-x'), body: document.body.className };
        }
      }
      if (++frames < 100) requestAnimationFrame(sample);
      else resolve({ error, worst });
    };
    requestAnimationFrame(sample);
  }));
  expect(maxError.error, JSON.stringify(maxError.worst)).toBeLessThan(2.5);
});

for (const channel of ['Develop', 'Push']) {
  for (const width of [390, 1440]) {
    for (const theme of ['light', 'dark']) {
      test(`${channel}: long amounts remain inside windows at ${width} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.clock.setFixedTime(new Date('2026-09-07T10:00:00Z'));
        await page.goto(`/Income-per-sed-${channel}.html`);
        await fullDisplay(page);
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
      await fullDisplay(page);
      await page.waitForTimeout(2400);
      await page.evaluate(() => {
        window.__amountMotionFrames=[];
        window.__amountProbeStopped=false;
        window.__amountPhase='seek';
        // Observe after the frame's ResizeObserver callbacks, not intermediate pre-paint layout.
        const sample=()=>{if(window.__amountProbeStopped)return;window.__amountProbe=requestAnimationFrame(()=>{
          const frameViewport=innerWidth;
          window.__amountProbeTask=setTimeout(()=>{
          if(window.__amountProbeStopped)return;
          // An old frame's deferred task can run after a viewport replacement; it is not a painted new frame.
          if(innerWidth!==frameViewport){sample();return;}
          const panel=document.querySelector('#incomeValuePanel').getBoundingClientRect();
          const cells=[...document.querySelectorAll('#flipContainer .flip-digit-container')].map(el=>{
            const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};
          });
          const overflow=document.documentElement.scrollWidth-innerWidth;
          const offenders=overflow>1?[...document.body.querySelectorAll('*')].map(el=>{
            const r=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,classes:el.className?.toString(),left:r.left,right:r.right};
          }).filter(r=>r.right>innerWidth+1||r.left < -1).slice(0,30):[];
          window.__amountMotionFrames.push({t:performance.now(),phase:window.__amountPhase,offenders,cells,left:panel.left,right:panel.right,
            viewport:innerWidth,clientWidth:document.querySelector('#incomeValuePanel').clientWidth,
            font:getComputedStyle(document.querySelector('#flipContainer')).fontSize,
            fit:document.querySelector('#flipContainer').style.getPropertyValue('--amount-runtime-fit'),
            overflow,
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
      await selectTheme(page, theme === 'light' ? 'dark' : 'light');
      await page.evaluate(()=>window.__amountPhase='theme-resize');
      await page.setViewportSize({width:width===390?768:900,height:1000});
      await page.waitForTimeout(700);
      await page.locator('#liveAnchor').dispatchEvent('click');
      await page.evaluate(()=>window.__amountPhase='return-live');
      await page.waitForTimeout(4600);
      await page.setViewportSize({width,height:1000});
      await page.evaluate(()=>window.__amountPhase='resize-back');
      await page.waitForTimeout(600);
      const frames=await page.evaluate(()=>{window.__amountProbeStopped=true;cancelAnimationFrame(window.__amountProbe);clearTimeout(window.__amountProbeTask);return window.__amountMotionFrames;});
      await testInfo.attach('long-money-motion.json',{body:JSON.stringify(frames),contentType:'application/json'});
      expect(frames.length).toBeGreaterThan(100);
      expect(new Set(frames.map(frame=>JSON.stringify(frame.transforms))).size).toBeGreaterThan(3);
      for(const frame of frames){
        expect(frame.overflow,JSON.stringify({t:frame.t,phase:frame.phase,viewport:frame.viewport,offenders:frame.offenders})).toBeLessThanOrEqual(1);
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

async function funSummaryLayout(page) {
  return page.locator('#funSummaryCard').evaluate(card => {
    const box = node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, height: rect.height };
    };
    const lines = node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].filter(rect => rect.width > 0).map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }));
    };
    const font = node => {
      const style = getComputedStyle(node);
      return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize };
    };
    const fact = card.querySelector('#funFact');
    return {
      card: box(card), fact: box(fact), overflow: document.documentElement.scrollWidth - innerWidth,
      rowGap: getComputedStyle(fact).rowGap, columnGap: getComputedStyle(fact).columnGap, pressure: card.dataset.contentPressure,
      items: [...fact.children].map(node => {
        const copy = node.querySelector('.fun-copy');
        const count = node.querySelector('.fun-count');
        return {
          box: box(node), copy: box(copy), name: copy.lastChild.textContent.trim(), count: count.textContent,
          nameLines: lines(copy.lastChild), countLines: lines(count), lineHeight: parseFloat(getComputedStyle(copy).lineHeight),
          copyFont: font(copy), countFont: font(count),
        };
      }),
    };
  });
}

function wholeFunItems(layout) {
  return layout.overflow <= 1 && layout.items.length === 4 && layout.items.every(item => item.nameLines.length === 1
    && item.countLines.length === 1 && item.copy.height <= item.lineHeight + 1
    && item.box.left >= layout.fact.left - 1 && item.box.right <= layout.fact.right + 1
    && item.copy.left >= item.box.left - 1 && item.copy.right <= item.box.right + 1);
}

function expectWholeFunItems(layout) {
  expect(layout.overflow, JSON.stringify(layout)).toBeLessThanOrEqual(1);
  expect(layout.items).toHaveLength(4);
  for (const item of layout.items) {
    expect(item.nameLines, item.name).toHaveLength(1);
    expect(item.countLines, item.count).toHaveLength(1);
  }
  expect(wholeFunItems(layout), JSON.stringify(layout)).toBe(true);
}

function expectTwoFunColumns(layout) {
  expect(Math.abs(layout.items[0].box.top - layout.items[1].box.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.items[2].box.top - layout.items[3].box.top)).toBeLessThanOrEqual(1);
  expect(layout.items[2].box.top).toBeGreaterThan(layout.items[0].box.top);
}

async function saveFunIncome(page, amount, days) {
  await page.locator('#incomeSettingsCard').click();
  await page.waitForFunction(() => !document.querySelector('[data-settings-unready],.income-shared-shell'));
  await page.locator(`[data-income-mode="${days ? 'annual-average' : 'fixed-monthly'}"]`).click();
  await page.locator('#incomeAmountInput').fill(amount);
  if (days) await page.locator('#annualWorkDaysInput').fill(String(days));
  await page.locator('#settingsSaveButton').click();
  await expect(page.locator('#settingsDialog')).toBeHidden();
  await page.locator('#funSummaryCard').scrollIntoViewIfNeeded();
}

for (const channel of ['Develop', 'Push']) {
  for (const width of [320, 390, 1440]) {
    for (const theme of ['light', 'dark']) {
      // Wide-screen actions need independent budgets; narrow screens keep the complete sequence.
      for (const phase of (width === 1440 ? ['long', 'restore'] : ['complete'])) {
        const subject = phase === 'restore' ? 'restore zero and normal layout' : 'keep whole items';
        test(`${channel}: fun conversions ${subject} at ${width} ${theme}`, async ({ page }, testInfo) => {
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.setViewportSize({ width, height: 1000 });
          const baseTime = Date.parse('2026-10-20T08:30:00Z');
          let second = 0;
          await page.clock.setFixedTime(new Date(baseTime));
          async function settleMeasurements() {
            for (let pass = 0; pass < 3; pass++) {
              second++;
              // Stats run just after the second boundary; leave them due while native frames continue.
              await page.clock.setFixedTime(new Date(baseTime + second * 1000 + 500));
              await expect(page.locator('#currentTime')).toHaveText(`16:30:${String(second).padStart(2, '0')}`);
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            }
          }
          await page.addInitScript(theme => localStorage.setItem('income-per-sed-theme-v1', theme), theme);
          await page.goto(`/Income-per-sed-${channel}.html`);
          await fullDisplay(page);
          await page.evaluate(() => document.fonts.ready);
          await page.locator('#funSummaryCard').scrollIntoViewIfNeeded();
          await expect(page.locator('#funFact .fun-count')).toHaveCount(4);
          await settleMeasurements();
          const normal = await funSummaryLayout(page);
          expectWholeFunItems(normal);
          expectTwoFunColumns(normal);
          const fonts = layout => layout.items.map(item => ({ copy: item.copyFont, count: item.countFont }));
          const prices = [9.9, 4, 39, 69];
          const expectedCounts = days => prices.map(price => String(Math.floor((19800 + second + 0.5) * (12000000000 / days / 23400) / price)));

          if (phase !== 'restore') {
            for (const days of [12, 1]) {
              await saveFunIncome(page, '1000000000', days);
              await settleMeasurements();
              await expect.poll(() => page.locator('#funFact .fun-count').allTextContents()).toEqual(expectedCounts(days));
              const long = await funSummaryLayout(page);
              expectWholeFunItems(long);
              expect(fonts(long)).toEqual(fonts(normal));
            }
            await page.locator('#funSummaryCard').screenshot({ path: testInfo.outputPath('fun-long-counts.png') });
          } else {
            await saveFunIncome(page, '1000000000', 1);
            await settleMeasurements();
            await expect.poll(() => page.locator('#funFact .fun-count').allTextContents()).toEqual(expectedCounts(1));
            const long = await funSummaryLayout(page);
            expectWholeFunItems(long);
            expect(fonts(long)).toEqual(fonts(normal));
          }
          if (phase !== 'long') {
            for (const nextWidth of [width <= 390 ? 1440 : 320, width]) {
              await page.setViewportSize({ width: nextWidth, height: 1000 });
              await page.locator('#funSummaryCard').scrollIntoViewIfNeeded();
              await settleMeasurements();
              let layout;
              try {
                await expect.poll(async () => {
                  layout = await funSummaryLayout(page);
                  return wholeFunItems(layout);
                }).toBe(true);
              } catch (error) {
                console.log('fun-resize-layout', JSON.stringify({ width: nextWidth, layout }));
                throw error;
              }
            }

            await saveFunIncome(page, '0.01');
            await settleMeasurements();
            await expect.poll(() => page.locator('#funFact .fun-count').allTextContents()).toEqual(['0', '0', '0', '0']);
            const zero = await funSummaryLayout(page);
            expectWholeFunItems(zero);
            expectTwoFunColumns(zero);
            await saveFunIncome(page, '7296.70');
            await settleMeasurements();
            await expect.poll(() => page.locator('#funFact .fun-count').allTextContents())
              .toEqual(normal.items.map(item => item.count));
            const restored = await funSummaryLayout(page);
            expectWholeFunItems(restored);
            expectTwoFunColumns(restored);
            expect(fonts(restored)).toEqual(fonts(normal));
            expect({ rowGap: restored.rowGap, columnGap: restored.columnGap })
              .toEqual({ rowGap: normal.rowGap, columnGap: normal.columnGap });
            await page.locator('#funSummaryCard').screenshot({ path: testInfo.outputPath('fun-normal-counts.png') });
          }
          await page.locator('#privacyToggle').click();
          await expect(page.locator('#funFact')).toHaveCSS('visibility', 'hidden');
          expect(errors).toEqual([]);
        });
      }
    }
  }
}
