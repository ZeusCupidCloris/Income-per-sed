const { test, expect } = require('@playwright/test');
const { openSettings } = require('./helpers/settings-page');

async function open(page, kind = 'income', motion = 'no-preference') {
  await openSettings(page, { kind, motion, settleMs: motion === 'reduce' ? 50 : 520, verifyShell: true });
}

for (const theme of ['light', 'dark']) {
  test(`${theme}: mode copy changes without moving input, actions or focus`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await page.locator('#incomeAmountInput').focus();
    const before = await page.locator('#incomeAmountInput').boundingBox();
    const actions = await page.locator('.settings-actions').boundingBox();
    for (const mode of ['fixed-monthly', 'fixed-daily', 'annual-average']) {
      await page.locator(`[data-income-mode="${mode}"]`).dispatchEvent('click');
      await expect(page.locator('#incomeAmountInput')).toBeFocused();
      const during = await page.locator('#incomeAmountInput').boundingBox();
      expect(Math.abs(during.x - before.x)).toBeLessThan(1);
      expect(Math.abs(during.y - before.y)).toBeLessThan(1);
      expect(Math.abs(during.width - before.width)).toBeLessThan(1);
      expect(Math.abs((await page.locator('.settings-actions').boundingBox()).y - actions.y)).toBeLessThan(1);
    }
    await expect(page.locator('.income-mode-previous')).toHaveCount(0);
    await expect(page.locator('#incomeModeHelp')).not.toHaveText('');
    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsDialog')).toBeHidden();
    await expect(page.locator('.income-mode-previous, .income-shared-shell')).toHaveCount(0);
  });
}

test('calendar reverses in place and retains full content after settling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'schedule');
  const toggle = page.locator('#calendarDataToggle');
  await toggle.scrollIntoViewIfNeeded();
  const before = await toggle.boundingBox();
  await toggle.dispatchEvent('click');
  await page.waitForTimeout(70);
  await toggle.dispatchEvent('click');
  await page.waitForTimeout(50);
  await toggle.dispatchEvent('click');
  await expect.poll(() => page.locator('.settings-data-content-inner').evaluate(element => getComputedStyle(element).transform), { timeout: 1000 }).toBe('none');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const after = await toggle.boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  const content = await page.locator('#calendarDataContent').evaluate(element => ({ height: element.clientHeight, full: element.scrollHeight, inert: element.inert, transform: getComputedStyle(element.firstElementChild).transform }));
  expect(content.height).toBeGreaterThanOrEqual(content.full - 1);
  expect(content.inert).toBe(false);
  expect(content.transform).toBe('none');
});

test('content stages share shell timing and clean up after interrupted closing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/Income-per-sed-Develop.html');
  await page.waitForTimeout(1200);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
  for (const kind of ['income', 'schedule']) {
    await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
    await page.clock.runFor(240);
    const state = await page.evaluate(kind => {
      const opacity = selector => Number(getComputedStyle(document.querySelector(selector)).opacity);
      return { header: opacity('.settings-sheet-header'), panel: opacity(`#${kind}SettingsPanel`), actions: opacity('.settings-actions'), backdrop: opacity('.settings-backdrop'), skin: Number(document.querySelectorAll('.income-shared-skin')[1].style.opacity) };
    }, kind);
    expect(state.header).toBeGreaterThan(state.panel);
    expect(state.panel).toBeGreaterThanOrEqual(state.actions);
    expect(state.backdrop).toBeCloseTo(state.skin, 5);
    await page.keyboard.press('Escape');
    await page.clock.runFor(40);
    await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
    await page.clock.runFor(600);
    await expect(page.locator('.income-shared-shell')).toHaveCount(0);
    expect(await page.locator(`#${kind}SettingsPanel`).evaluate(element => getComputedStyle(element).opacity)).toBe('1');
    await page.keyboard.press('Escape');
    await page.clock.runFor(600);
  }
});

test('wheel emphasis and cached styles retain physical position formulas after resize', async ({ page }) => {
  await open(page, 'schedule');
  const values = await page.locator('.time-wheel-column').first().evaluate(column => {
    column.scrollTop = 9.25 * 44;
    column.dispatchEvent(new Event('scroll'));
    return new Promise(resolve => requestAnimationFrame(() => {
      const style = value => {
        const item = column.querySelector(`[data-value="${value}"]`);
        const computed = getComputedStyle(item);
        return { opacity: Number(item.style.getPropertyValue('--wheel-opacity')), size: computed.fontSize, weight: computed.fontWeight };
      };
      resolve([style(9), style(10), style(11)]);
    }));
  });
  expect(values[0].opacity).toBeGreaterThan(values[1].opacity);
  expect(values[1].opacity).toBeGreaterThan(values[2].opacity);
  expect(values[0].size).toBe(values[1].size);
  expect(values[0].weight).toBe(values[1].weight);
  await page.waitForTimeout(30);
  for (const width of [1440, 320, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const value of [9.25, 10.75, 9.25]) {
      const mismatches = await page.locator('.time-wheel-column').first().evaluate((column, value) => {
        column.scrollTop = value * 44;
        column.dispatchEvent(new Event('scroll'));
        return new Promise(resolve => requestAnimationFrame(() => {
          const center = column.scrollTop + column.clientHeight / 2;
          const failures = [];
          for (const item of column.children) {
            const distance = (item.offsetTop + item.offsetHeight / 2 - center) / 44;
            const absolute = Math.abs(distance);
            const expected = {
              '--wheel-angle': `${(Math.max(-3.25, Math.min(3.25, distance)) * -19).toFixed(2)}deg`,
              '--wheel-depth': `${(-Math.min(38, absolute * 12)).toFixed(2)}px`,
              '--wheel-scale': Math.max(.76, 1 - absolute * .075).toFixed(3),
              '--wheel-opacity': (.10 + .90 * Math.exp(-absolute * absolute * .65)).toFixed(3),
              '--wheel-shade': Math.min(1, absolute / 3).toFixed(3)
            };
            for (const [property, value] of Object.entries(expected)) {
              if (item.style.getPropertyValue(property) !== value) failures.push({ item: item.dataset.value, property, expected: value, actual: item.style.getPropertyValue(property) });
            }
          }
          resolve(failures);
        }));
      }, value);
      expect(mismatches).toEqual([]);
    }
  }
});

test('reduced motion leaves no staged or copy animation', async ({ page }) => {
  await open(page, 'income', 'reduce');
  await page.locator('[data-income-mode="fixed-daily"]').dispatchEvent('click');
  await expect(page.locator('.income-mode-previous, .income-shared-shell')).toHaveCount(0);
  expect(await page.locator('#incomeAmountLabel').evaluate(element => element.getAnimations().length)).toBe(0);
});

test('rapid income mode reversal retains the currently visible text blend', async ({ page }) => {
  await open(page);
  await page.locator('[data-income-mode="fixed-daily"]').dispatchEvent('click');
  await page.waitForTimeout(60);
  const result = await page.evaluate(() => {
    const element = document.querySelector('#incomeAmountLabel');
    const read = () => {
      const values = {};
      for (const child of element.children) {
        const opacity = Number(getComputedStyle(child).opacity);
        if (child.classList.contains('income-mode-previous')) {
          for (const part of child.children) values[part.textContent] = (values[part.textContent] || 0) + opacity * Number(getComputedStyle(part).opacity);
        } else values[child.textContent] = (values[child.textContent] || 0) + opacity;
      }
      return values;
    };
    const before = read();
    document.querySelector('[data-income-mode="annual-average"]').click();
    return { before, after: read(), hidden: element.querySelector('.income-mode-previous')?.getAttribute('aria-hidden') };
  });
  for (const text of new Set([...Object.keys(result.before), ...Object.keys(result.after)])) {
    expect(Math.abs((result.before[text] || 0) - (result.after[text] || 0))).toBeLessThan(.02);
  }
  expect(result.hidden).toBe('true');
  await expect(page.locator('.income-mode-previous')).toHaveCount(0);
});

test('settled settings visual evidence across desktop/mobile and both themes', async ({ page }, testInfo) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const theme of ['light', 'dark']) {
      for (const kind of ['income', 'schedule']) {
        await open(page, kind);
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        await page.waitForTimeout(300);
        const bounds = await page.locator('.settings-sheet').evaluate(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, overflow: element.scrollWidth - element.clientWidth, width: innerWidth }));
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1);
        expect(bounds.overflow).toBeLessThanOrEqual(1);
        await page.screenshot({ path: testInfo.outputPath(`${kind}-${theme}-${width}.png`) });
      }
    }
  }
});
