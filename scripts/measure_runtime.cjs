const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Shanghai', reducedMotion: 'no-preference' });
  const errors = [];
  const samples = [];
  const start = Date.now();
  const output = path.resolve(process.argv[2] || 'runtime-observation.json');
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.clock.setFixedTime(new Date('2026-09-07T06:30:00Z'));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../Income-per-sed-Develop.html')).href);
    const cdp = await page.context().newCDPSession(page);
    async function sample(label) {
      await cdp.send('HeapProfiler.collectGarbage');
      const counters = await cdp.send('Memory.getDOMCounters');
      const heap = await cdp.send('Runtime.getHeapUsage');
      const report = await page.evaluate(() => JSON.parse(window.__incomeClockDiagnostics.exportReport()));
      const row = { label, elapsedMs: Date.now() - start, counters, heap: heap.usedSize, lifecycle: report.lifecycle, scheduler: report.scheduler };
      samples.push(row);
      console.log(JSON.stringify({ label, heap: row.heap, ...counters }));
    }
    await page.waitForTimeout(3000);
    await sample('warm');
    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(30000);
      await sample(`idle-${i}`);
    }
    for (let i = 0; i < 30; i++) {
      await page.locator('#incomeSettingsCard').click();
      await page.keyboard.press('Escape');
      if (i % 10 === 9) await sample(`settings-${i + 1}`);
    }
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(5000);
    await sample('hidden');
    await page.evaluate(() => {
      delete document.hidden; delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(3000);
    await sample('resumed');
  } finally {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify({ realDurationMs: Date.now() - start, simulatedVisibility: true, errors, samples }, null, 2));
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
