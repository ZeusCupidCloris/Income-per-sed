const { test, expect } = require('@playwright/test');
const { fullDisplay } = require('./helpers/display-state');
const liveTime = new Date('2026-10-22T15:45:30+08:00');
for (const variant of ['Develop', 'Push']) {
  test(`${variant}: narrow history, date seek, mouse drag, play, pause, resize, live`, async ({ page }, info) => {
    const stages = [];
    const errors = [];
    const crashes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('crash', () => crashes.push(stages.at(-1)?.name || 'initial load'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install({ time: liveTime });
    await page.goto(`/Income-per-sed-${variant}.html`);
    await fullDisplay(page);
    const body = page.locator('body');
    const panel = page.locator('#historyQuickPanel');
    const dial = page.locator('#historyDialTrack');
    const clock = page.locator('#currentTime');
    const open = async () => {
      await page.locator('#historyQuickOpen').click();
      await expect(panel).toBeVisible();
      await page.waitForFunction(() => {
        const panel = document.getElementById('historyQuickPanel');
        return !panel.inert && !panel.hasAttribute('data-entry-animating');
      });
    };
    const state = name => expect(body).toHaveAttribute('data-timeline-state', name);
    const readout = () => dial.getAttribute('aria-valuetext');
    const stage = async name => {
      const view = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth }));
      expect(view.scrollWidth).toBeLessThanOrEqual(view.width + 1);
      stages.push({ name, view, time: await clock.getAttribute('datetime'), dial: await readout() });
    };

    try {
      await test.step('Open at 390px', async () => {
        await open();
        const box = await panel.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width).toBeLessThanOrEqual(391);
        await stage('open-390');
      });
      await test.step('Seek to the previous date', async () => {
        await page.locator('#historySeekWheels [data-date-part="day"]').press('ArrowUp');
        await page.locator('#historyDialTime').fill('09:30:15');
        await page.locator('#historySeekSubmit').click();
        await state('history-hold');
        await expect(clock).toHaveAttribute('datetime', '2026-10-21T01:30:15.000Z');
        await expect(dial).toHaveAttribute('aria-valuetext', '2026-10-21 09:30:15');
        await stage('seek');
      });
      await test.step('Drag the dial without changing its date', async () => {
        await dial.scrollIntoViewIfNeeded();
        const box = await dial.boundingBox();
        const point = hour => ({
          x: box.x + box.width / 2 + Math.sin(hour / 24 * Math.PI * 2) * box.width * .4,
          y: box.y + box.height / 2 - Math.cos(hour / 24 * Math.PI * 2) * box.height * .4,
        });
        await dial.evaluate(node => {
          node.addEventListener('pointerup', event => {
            const rect = node.getBoundingClientRect();
            window.__flowPointerEnd = {
              x: event.clientX, y: event.clientY,
              cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2,
            };
          }, { once: true, capture: true });
        });
        const from = point(9);
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
        await expect(dial).toHaveAttribute('data-dragging', '');
        for (let i = 1; i <= 12; i++) {
          const next = point(9 + i / 4);
          await page.mouse.move(next.x, next.y);
        }
        await page.mouse.up();
        await state('history-hold');
        await expect(dial).not.toHaveAttribute('data-dragging');
        await expect(dial).toHaveAttribute('aria-valuetext', /^2026-10-21 /);
        const seconds = Number(await dial.getAttribute('aria-valuenow'));
        const { x, y, cx, cy } = await page.evaluate(() => window.__flowPointerEnd);
        const angle = Math.atan2(x - cx, cy - y);
        const minute = Math.round(((angle / (Math.PI * 2) + 1) % 1) * 1440);
        expect(seconds).toBe(minute * 60);
        await stage('drag');
      });
      let pausedTime;
      await test.step('Play and pause', async () => {
        const before = Number(await dial.getAttribute('aria-valuenow'));
        const play = page.locator('#historyQuickPlay');
        await play.click();
        await state('history-play');
        await expect(play).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(async () => Number(await dial.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
        await stage('play');
        await play.click();
        await state('history-hold');
        await expect(play).toHaveAttribute('aria-pressed', 'false');
        pausedTime = await readout();
        await stage('pause');
      });
      await test.step('Resize across the breakpoint and reopen at 390px', async () => {
        await page.setViewportSize({ width: 768, height: 844 });
        await expect(page.locator('#historyQuickOpen')).toHaveAttribute('aria-expanded', 'false');
        await expect(panel).toHaveJSProperty('hidden', true);
        await expect(page.locator('#historyQuickOpen')).toBeVisible();
        await state('history-hold');
        await stage('resize-768');
        await page.setViewportSize({ width: 390, height: 844 });
        await open();
        await state('history-hold');
        await expect(dial).toHaveAttribute('aria-valuetext', pausedTime);
        await stage('reopen-390');
      });
      await test.step('Return to live', async () => {
        await page.locator('#historyQuickPanel [data-history-action="live"]').click();
        await state('live');
        await expect.poll(() => clock.evaluate(node => {
          const displayed = Date.parse(node.dateTime);
          return displayed <= Date.now() && Date.now() - displayed < 1000;
        })).toBe(true);
        await expect(dial).not.toHaveAttribute('data-dragging');
        await stage('live-390');
      });
      expect(crashes).toEqual([]);
      expect(errors).toEqual([]);
    } finally {
      await info.attach('flow-stages', { body: JSON.stringify({ stages, errors, crashes }, null, 2), contentType: 'application/json' });
    }
  });
}
