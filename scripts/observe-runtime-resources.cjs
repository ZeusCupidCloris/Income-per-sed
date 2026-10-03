const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');

const args = process.argv.slice(2);
const output = path.resolve(args[0] && !args[0].startsWith('--') ? args.shift() : 'runtime-observation.json');
function option(name, fallback) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const value = args[index + 1];
  args.splice(index, 2);
  return value;
}
const minutes = Number(option('--minutes', 4));
const sampleSeconds = Number(option('--sample-seconds', 30));
const source = path.resolve(option('--source', path.join(__dirname, '../Income-per-sed-Develop.html')));
if (args.length || !Number.isFinite(minutes) || minutes < 1 || minutes > 120 || !Number.isFinite(sampleSeconds) || sampleSeconds < 1 || sampleSeconds > 300) {
  throw new Error('Usage: node observe-runtime-resources.cjs [report.json] [--minutes 1..120] [--sample-seconds 1..300] [--source Develop.html]');
}

(async () => {
  // Reject invalid sources before acquiring a browser process.
  const sourceSha256 = createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Shanghai', reducedMotion: 'no-preference' });
  const errors = [];
  const samples = [];
  const violations = [];
  const counts = { settingsCycles: 0, visibilityCycles: 0 };
  const start = Date.now();
  const metadata = { complete: false, browser: browser.version(), source, sourceSha256, startedAt: new Date(start).toISOString(), requestedMinutes: minutes, sampleSeconds, businessTime: '2026-09-07T06:30:00Z', simulatedVisibility: true, forcedGCBeforeSamples: true };
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.clock.setFixedTime(new Date('2026-09-07T06:30:00Z'));
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      const pending = new Map();
      const gridCallbacks = new WeakSet();
      let executing = null, draws = 0, maxPending = 0;
      const gridPending = () => [...pending.values()].filter(fn => gridCallbacks.has(fn)).length;
      window.requestAnimationFrame = callback => {
        const id = request(timestamp => {
          pending.delete(id);
          executing = callback;
          try { callback(timestamp); } finally { executing = null; }
        });
        pending.set(id, callback);
        maxPending = Math.max(maxPending, gridPending());
        return id;
      };
      window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
      CanvasRenderingContext2D.prototype.clearRect = function (...values) {
        if (this.canvas.id === 'ambientGridBackdrop') {
          draws++;
          if (executing) gridCallbacks.add(executing);
        }
        return clear.apply(this, values);
      };
      window.__resourceGridProbe = () => ({ draws, pending: gridPending(), maxPending });
    });
    await page.goto(pathToFileURL(source).href);
    const cdp = await page.context().newCDPSession(page);
    async function sample(label) {
      await cdp.send('HeapProfiler.collectGarbage');
      const counters = await cdp.send('Memory.getDOMCounters');
      const heap = await cdp.send('Runtime.getHeapUsage');
      const snapshot = await page.evaluate(() => ({ report: JSON.parse(window.__incomeClockDiagnostics.exportReport()), grid: window.__resourceGridProbe(), connectedNodes: document.querySelectorAll('*').length, shells: document.querySelectorAll('.income-shared-shell').length }));
      const report = snapshot.report;
      const row = { label, at: new Date().toISOString(), elapsedMs: Date.now() - start, counters, heap: heap.usedSize, lifecycle: report.lifecycle, scheduler: report.scheduler, timeline: report.timeline, grid: snapshot.grid, connectedNodes: snapshot.connectedNodes, shells: snapshot.shells, counts: { ...counts } };
      samples.push(row);
      if (row.grid.pending > 1 || row.grid.maxPending > 1) violations.push({ label, kind: 'duplicate-grid-loop', grid: row.grid });
      console.log(JSON.stringify({ label, elapsedMs: row.elapsedMs, heap: row.heap, ...counters, grid: row.grid, ...counts }));
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, JSON.stringify({ ...metadata, realDurationMs: Date.now() - start, complete: false, errors, violations, samples }, null, 2));
      return row;
    }
    await page.waitForTimeout(3000);
    await sample('warm');
    async function phase(name, action) {
      const deadline = Date.now() + minutes * 60000 / 4;
      await sample(`${name}-start`);
      let cycle = 0;
      while (Date.now() < deadline) {
        if (action) await action();
        await page.waitForTimeout(Math.max(0, Math.min(sampleSeconds * 1000, deadline - Date.now())));
        await sample(`${name}-${++cycle}`);
      }
    }
    await phase('idle');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#historyQuickOpen').click();
    await page.locator('[data-history-seconds="-3600"]').click();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__incomeClockDiagnostics.getTimelineState() === 'HISTORY_HOLD' && !window.__incomeClockDiagnostics.getHistoricalSeekState().active);
    await page.locator('#currentTime').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(() => window.__incomeClockDiagnostics.getTimelineState() === 'HISTORY_PLAY');
    await phase('history-playback');
    await page.locator('#liveAnchor').dispatchEvent('click');
    await page.waitForTimeout(2500);
    await phase('settings', async () => {
      for (const kind of ['income', 'schedule', 'income', 'schedule']) {
        await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(550);
        counts.settingsCycles++;
      }
    });
    await phase('visibility', async () => {
      await page.mouse.move(1200, 850, { steps: 3 });
      const hiddenDraws = await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        for (let i = 0; i < 3; i++) document.dispatchEvent(new Event('visibilitychange'));
        return window.__resourceGridProbe().draws;
      });
      await page.waitForTimeout(3000);
      const hidden = await sample(`hidden-${counts.visibilityCycles + 1}`);
      if (hidden.grid.draws !== hiddenDraws || hidden.grid.pending !== 0 || hidden.scheduler.running || hidden.scheduler.rafActive) violations.push({ label: hidden.label, kind: 'hidden-drawing-active' });
      await page.evaluate(() => {
        delete document.hidden; delete document.visibilityState;
        for (let i = 0; i < 3; i++) document.dispatchEvent(new Event('visibilitychange'));
        document.documentElement.dispatchEvent(new Event('pointerleave'));
      });
      counts.visibilityCycles++;
      await page.waitForTimeout(3000);
    });
    await page.evaluate(() => document.documentElement.dispatchEvent(new Event('pointerleave')));
    await page.waitForTimeout(5000);
    await sample('final-settled');
    metadata.complete = true;
  } finally {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify({ ...metadata, realDurationMs: Date.now() - start, counts, errors, violations, samples }, null, 2));
    await browser.close();
  }
  if (errors.length || violations.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
