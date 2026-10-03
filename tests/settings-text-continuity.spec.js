const { test, expect } = require('@playwright/test');

async function assertSettledSheet(page, clockPaused = false) {
  const state = await page.evaluate(() => {
    const dialog = document.querySelector('#settingsDialog');
    const sheet = dialog.querySelector('.settings-sheet');
    const style = getComputedStyle(sheet);
    const save = document.querySelector('#settingsSaveButton');
    const saveRect = save.getBoundingClientRect();
    const hit = document.elementFromPoint(saveRect.left + saveRect.width / 2, saveRect.top + saveRect.height / 2);
    return { sheet: sheet.getBoundingClientRect().toJSON(), dialog: dialog.getBoundingClientRect().toJSON(), save: saveRect.toJSON(), saveHit: hit === save || save.contains(hit), overflow: sheet.scrollWidth - sheet.clientWidth, transform: style.transform, clip: style.clipPath };
  });
  expect(state.sheet.left).toBeGreaterThanOrEqual(state.dialog.left - 1);
  expect(state.sheet.right).toBeLessThanOrEqual(state.dialog.right + 1);
  expect(state.sheet.top).toBeGreaterThanOrEqual(state.dialog.top - 1);
  expect(state.sheet.bottom).toBeLessThanOrEqual(state.dialog.bottom + 1);
  expect(state.overflow).toBeLessThanOrEqual(1);
  expect(state.transform).toBe('none');
  expect(state.clip).toBe('inset(0px)');
  expect(state.save.left, JSON.stringify(state)).toBeGreaterThanOrEqual(state.dialog.left - 1);
  expect(state.save.right, JSON.stringify(state)).toBeLessThanOrEqual(state.dialog.right + 1);
  expect(state.save.top, JSON.stringify(state)).toBeGreaterThanOrEqual(state.dialog.top - 1);
  expect(state.save.bottom, JSON.stringify(state)).toBeLessThanOrEqual(state.dialog.bottom + 1);
  expect(state.saveHit, JSON.stringify(state)).toBe(true);
  await expect(page.locator('.income-shared-shell, .income-shared-origin')).toHaveCount(0);
  // Native intersection delivery needs live rendering after simulated suspension.
  if (clockPaused) await page.clock.resume();
  await expect(page.locator('#settingsSaveButton')).toBeInViewport();
  if (clockPaused) await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
}

for (const artifact of ['Develop', 'Push']) {
  for (const kind of ['income', 'schedule']) {
    test(`${artifact}: ${kind} expansion survives rotation, background and a reversed close`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.clock.install({ time: new Date('2026-09-07T06:30:00Z') });
      await page.goto(`/Income-per-sed-${artifact}.html`);
      await page.waitForTimeout(1200);
      await page.locator(`#${kind}SettingsCard`).focus();
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      await page.clock.runFor(96);
      await page.setViewportSize({ width: 844, height: 390 });
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.clock.runFor(2000);
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.clock.runFor(600);
      await assertSettledSheet(page, true);
      await page.keyboard.press('Escape');
      await page.clock.runFor(80);
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.clock.runFor(600);
      await assertSettledSheet(page, true);
      await expect(page.locator(`#${kind}SettingsPanel`)).toBeVisible();
      await page.keyboard.press('Escape');
      await page.clock.runFor(600);
      await expect(page.locator('#settingsDialog')).toBeHidden();
      await expect(page.locator(`#${kind}SettingsCard`)).toBeFocused();
      expect(await page.locator('main').evaluate(element => element.inert)).toBe(false);
      expect(errors).toEqual([]);
    });
  }

  test(`${artifact}: keyboard rotation and background preserve edited income and focus`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/Income-per-sed-${artifact}.html`);
    await page.locator('#incomeSettingsCard').dispatchEvent('click');
    await page.waitForTimeout(500);
    await page.locator('#annualWorkDaysInput').fill('277');
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 320 });
      window.visualViewport.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(200);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 220 });
      window.visualViewport.dispatchEvent(new Event('resize'));
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(400);
    await expect(page.locator('#annualWorkDaysInput')).toHaveValue('277');
    await expect(page.locator('#annualWorkDaysInput')).toBeFocused();
    const keyboardBounds = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
      return { input: rect('#annualWorkDaysInput'), header: rect('.settings-sheet-header'), actions: rect('.settings-actions'), visibleHeight: window.visualViewport.height };
    });
    expect(keyboardBounds.input.top).toBeGreaterThanOrEqual(keyboardBounds.header.bottom - 1);
    expect(keyboardBounds.input.bottom).toBeLessThanOrEqual(keyboardBounds.actions.top + 1);
    expect(keyboardBounds.actions.bottom).toBeLessThanOrEqual(keyboardBounds.visibleHeight + 1);
    await page.evaluate(() => {
      delete window.visualViewport.height;
      window.visualViewport.dispatchEvent(new Event('resize'));
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await assertSettledSheet(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDialog')).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('height-only keyboard resize keeps the focused control above the sticky actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.querySelector('#annualWorkDaysInput').focus({ preventScroll: true });
    Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 320 });
    window.visualViewport.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(400);
  const bounds = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return { input: rect('#annualWorkDaysInput'), header: rect('.settings-sheet-header'), actions: rect('.settings-actions'), sheet: rect('.settings-sheet'), rootScroll: window.scrollY };
  });
  expect(bounds.input.top).toBeGreaterThanOrEqual(bounds.header.bottom - 1);
  expect(bounds.input.bottom).toBeLessThanOrEqual(bounds.actions.top + 1);
  expect(bounds.actions.bottom).toBeLessThanOrEqual(bounds.sheet.bottom + 1);
  await page.evaluate(() => {
    delete window.visualViewport.height;
    window.visualViewport.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(bounds.rootScroll);
  await page.keyboard.press('Escape');
  await expect(page.locator('#settingsDialog')).toBeHidden();
});

test('a fully reopened settings panel starts at the top rather than its old scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Income-per-sed-Develop.html');
  for (const kind of ['schedule', 'income']) {
    await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
    await page.waitForTimeout(300);
    await page.locator('.settings-sheet').evaluate(sheet => { sheet.scrollTop = sheet.scrollHeight; });
    expect(await page.locator('.settings-sheet').evaluate(sheet => sheet.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
    await page.waitForTimeout(300);
    expect(await page.locator('.settings-sheet').evaluate(sheet => sheet.scrollTop)).toBeLessThan(2);
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDialog')).toBeHidden();
  }
});

test('reversing a close retains the editor scroll position after the final frame', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-09-07T06:30:00Z') });
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1200);
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.waitForTimeout(600);
  await page.locator('.settings-sheet').evaluate(sheet => { sheet.scrollTop = 180; });
  const before = await page.locator('.settings-sheet').evaluate(sheet => sheet.scrollTop);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  await page.keyboard.press('Escape');
  await page.clock.runFor(80);
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.clock.runFor(600);
  expect(await page.locator('.settings-sheet').evaluate(sheet => sheet.scrollTop)).toBe(before);
  await expect(page.locator('#settingsDialog')).toBeVisible();
});

test('long error text remains scrollable without covering the save controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Income-per-sed-Develop.html');
  await page.locator('#incomeSettingsCard').dispatchEvent('click');
  await page.waitForTimeout(300);
  const bounds = await page.evaluate(() => {
    const error = document.querySelector('#incomeSettingsError');
    error.textContent = 'Please check the income amount and try again. '.repeat(20);
    const sheet = document.querySelector('.settings-sheet');
    sheet.scrollTop = sheet.scrollHeight;
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return { error: error.getBoundingClientRect().toJSON(), actions: rect('.settings-actions'), save: rect('#settingsSaveButton'), sheet: sheet.getBoundingClientRect().toJSON(), overflow: sheet.scrollWidth - sheet.clientWidth };
  });
  expect(bounds.error.bottom).toBeLessThanOrEqual(bounds.actions.top + 1);
  expect(bounds.save.bottom).toBeLessThanOrEqual(bounds.sheet.bottom + 1);
  expect(bounds.overflow).toBeLessThanOrEqual(1);
});

test('opening cleanup preserves sheet transform, clip and viewport geometry', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-09-07T06:30:00Z') });
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1200);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 1000)));
  for (const kind of ['income', 'schedule']) {
    await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
    await page.clock.runFor(352);
    const measure = () => page.evaluate(() => {
      const sheet = document.querySelector('.settings-sheet');
      const style = getComputedStyle(sheet);
      return { rect: sheet.getBoundingClientRect().toJSON(), transform: style.transform, clip: style.clipPath, hint: style.willChange };
    });
    const before = await measure();
    await page.clock.runFor(80);
    const after = await measure();
    expect(after.transform).toBe(before.transform);
    expect(after.clip).toBe(before.clip);
    expect(after.hint).toBe(before.hint);
    for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(after.rect[key] - before.rect[key])).toBeLessThan(.1);
    await expect(page.locator('.income-shared-shell')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.clock.runFor(520);
    await expect(page.locator('#settingsDialog')).toBeHidden();
  }
});

test('settings fit a smaller visible viewport independently of layout breakpoints', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const width of [402, 980]) {
    await page.setViewportSize({ width, height: 874 });
    await page.goto('/Income-per-sed-Develop.html');
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      for (const [key, value] of Object.entries({ width: 344, height: 620, offsetTop: 100, offsetLeft: 0 })) {
        Object.defineProperty(window.visualViewport, key, { configurable: true, get: () => value });
      }
      window.visualViewport.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(100);
    for (const kind of ['income', 'schedule']) {
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      await page.waitForTimeout(600);
      const bounds = await page.evaluate(() => {
        const sheet = document.querySelector('.settings-sheet');
        const dialog = document.querySelector('#settingsDialog');
        return { sheet: sheet.getBoundingClientRect().toJSON(), dialog: dialog.getBoundingClientRect().toJSON(), overflow: sheet.scrollWidth - sheet.clientWidth };
      });
      expect(bounds.sheet.left).toBeGreaterThanOrEqual(bounds.dialog.left);
      expect(bounds.sheet.right).toBeLessThanOrEqual(bounds.dialog.right + 1);
      expect(bounds.sheet.top).toBeGreaterThanOrEqual(bounds.dialog.top);
      expect(bounds.sheet.bottom).toBeLessThanOrEqual(bounds.dialog.bottom + 1);
      expect(bounds.overflow).toBeLessThanOrEqual(1);
      await page.locator('#settingsSaveButton').scrollIntoViewIfNeeded();
      await expect(page.locator('#settingsSaveButton')).toBeInViewport();
      await page.keyboard.press('Escape');
      await expect(page.locator('#settingsDialog')).toBeHidden();
    }
  }
});

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
