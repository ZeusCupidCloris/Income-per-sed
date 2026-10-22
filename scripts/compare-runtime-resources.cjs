const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { gzipSync } = require('node:zlib');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
if (args.includes('--help') || args.length !== 3) {
  console.log('Usage: node scripts/compare-runtime-resources.cjs before-Develop.html after-Develop.html report.json');
  process.exitCode = args.includes('--help') ? 0 : 1;
} else {
  compare(...args.map(value => path.resolve(value))).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

function fileStats(file) {
  const data = fs.readFileSync(file);
  return { bytes: data.length, gzipBytes: gzipSync(data, { level: 9 }).length, sha256: createHash('sha256').update(data).digest('hex') };
}

function buildSizes(sources) {
  const root = path.resolve(__dirname, '..');
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'income-size-'));
  const scripts = path.join(folder, 'scripts');
  const modules = path.join(folder, 'node_modules');
  const develop = path.join(folder, 'Income-per-sed-Develop.html');
  const push = path.join(folder, 'Income-per-sed-Push.html');
  const builder = path.join(scripts, 'build-release-html.mjs');
  try {
    fs.mkdirSync(scripts);
    fs.copyFileSync(path.join(__dirname, 'build-release-html.mjs'), builder);
    fs.symlinkSync(path.join(root, 'node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir');
    return sources.map(source => {
      fs.copyFileSync(source, develop);
      execFileSync(process.execPath, [builder, '--write'], { cwd: folder, stdio: 'pipe', timeout: 120000 });
      return { develop: fileStats(source), push: fileStats(push) };
    });
  } finally {
    // Remove only the known files and link in this newly created temporary folder.
    for (const file of [develop, push, builder]) if (fs.existsSync(file)) fs.unlinkSync(file);
    if (fs.existsSync(modules)) {
      if (process.platform === 'win32') fs.rmdirSync(modules);
      else fs.unlinkSync(modules);
    }
    if (fs.existsSync(scripts)) fs.rmdirSync(scripts);
    fs.rmdirSync(folder);
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function compare(before, after, output) {
  assert.notEqual(before, after, 'The before and after paths must differ.');
  assert(![before, after].includes(output), 'The report must not overwrite an input.');
  const sources = [before, after];
  const sizes = buildSizes(sources);
  const report = {
    complete: false,
    startedAt: new Date().toISOString(),
    settings: { samplesPerVersion: 3, windowMs: 5000, settingsCyclesPerSample: 8, viewport: { width: 1440, height: 1000 }, motion: 'no-preference', timezone: 'Asia/Shanghai', forcedGCBeforeSnapshots: true },
    sources: sources.map((source, index) => ({ label: index ? 'after' : 'before', source, ...sizes[index] })),
    samples: [],
    limitations: ['Controlled local Edge run, not a real-device or overnight leak test.', 'Timing samples are observations, not a guaranteed speed improvement.', 'Push candidates are built in an isolated temporary folder; repository delivery files are untouched.'],
  };
  const save = () => {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  };
  save();
  const browser = await chromium.launch({ channel: 'msedge' });
  report.browser = browser.version();
  report.platform = { os: process.platform, arch: process.arch, node: process.version };
  try {
    for (let sample = 0; sample < report.settings.samplesPerVersion; sample++) {
      for (const index of sample % 2 ? [1, 0] : [0, 1]) {
        const row = await measure(browser, sources[index], report.settings);
        row.label = index ? 'after' : 'before';
        row.sample = sample + 1;
        report.samples.push(row);
        save();
        console.log(JSON.stringify({ label: row.label, sample: row.sample, idleTaskMs: row.idle.taskMs, workingTaskMs: row.working.taskMs, settingsListeners: row.resourcesAfter.lifecycle.scopes.find(scope => scope.name === 'settings-dialog').listenerCount }));
      }
    }
    report.summary = {};
    for (const label of ['before', 'after']) {
      const rows = report.samples.filter(row => row.label === label);
      report.summary[label] = Object.fromEntries(['idle', 'working'].map(state => [state, {
        medianTaskMs: median(rows.map(row => row[state].taskMs)),
        minTaskMs: Math.min(...rows.map(row => row[state].taskMs)),
        maxTaskMs: Math.max(...rows.map(row => row[state].taskMs)),
        medianLayoutMs: median(rows.map(row => row[state].layoutMs)),
        medianRecalcStyleMs: median(rows.map(row => row[state].recalcStyleMs)),
        longTasks: rows.map(row => row[state].longTasks),
      }]));
    }
    report.complete = true;
  } finally {
    report.finishedAt = new Date().toISOString();
    save();
    await browser.close();
  }
}

async function measure(browser, source, settings) {
  const context = await browser.newContext({ viewport: settings.viewport, reducedMotion: settings.motion, colorScheme: 'light', locale: 'zh-CN', timezoneId: settings.timezone });
  const errors = [];
  try {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-20T08:00:00+08:00') });
    await page.addInitScript(() => {
      window.__comparisonLongTasks = [];
      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        new PerformanceObserver(list => window.__comparisonLongTasks.push(...list.getEntries().map(entry => ({ startTime: entry.startTime, duration: entry.duration })))).observe({ type: 'longtask' });
      }
    });
    await page.goto(pathToFileURL(source).href);
    await page.waitForFunction(() => document.getElementById('currentTime').textContent !== '--:--:--');
    if (await page.locator('#focusToggle').getAttribute('aria-pressed') === 'true') await page.locator('#focusToggle').click();
    if (await page.locator('#privacyToggle').getAttribute('aria-pressed') === 'true') {
      await page.locator('#privacyToggle').click();
      await page.locator('#privacyKeepVisible').click();
    }
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-focus-restoring'));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(metric => [metric.name, metric.value]));
    async function windowSample(expectedStatus) {
      await page.waitForTimeout(2500);
      const status = await page.evaluate(() => document.getElementById('scheduleSettingsCard').dataset.workStatus);
      assert.equal(status, expectedStatus);
      const before = await metrics();
      const start = await page.evaluate(() => performance.now());
      await page.waitForTimeout(settings.windowMs);
      const end = await page.evaluate(() => performance.now());
      const after = await metrics();
      const longTasks = await page.evaluate(({ start, end }) => window.__comparisonLongTasks.filter(entry => entry.startTime >= start && entry.startTime < end), { start, end });
      return { status, durationMs: end - start, taskMs: (after.TaskDuration - before.TaskDuration) * 1000, layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000, recalcStyleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000, layoutCount: after.LayoutCount - before.LayoutCount, longTasks };
    }
    const idle = await windowSample('not-started');
    await page.clock.setSystemTime(new Date('2026-10-20T10:30:00+08:00'));
    const working = await windowSample('working');
    async function cycle(kind) {
      await page.locator(`#${kind}SettingsCard`).dispatchEvent('click');
      await page.waitForFunction(() => !document.getElementById('settingsDialog').hidden && !document.querySelector('[data-settings-unready],.income-shared-shell'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('settingsDialog').hidden && !document.querySelector('.income-shared-shell'));
    }
    await cycle('income');
    await cycle('schedule');
    async function resources() {
      await page.waitForTimeout(800);
      await cdp.send('HeapProfiler.collectGarbage');
      return {
        counters: await cdp.send('Memory.getDOMCounters'),
        heapBytes: (await cdp.send('Runtime.getHeapUsage')).usedSize,
        ...await page.evaluate(() => ({ lifecycle: JSON.parse(window.__incomeClockDiagnostics.exportReport()).lifecycle, connectedNodes: document.querySelectorAll('*').length, shells: document.querySelectorAll('.income-shared-shell,.settings-expanded-origin').length })),
      };
    }
    const resourcesBefore = await resources();
    for (let cycleIndex = 0; cycleIndex < settings.settingsCyclesPerSample; cycleIndex++) await cycle(cycleIndex % 2 ? 'schedule' : 'income');
    const resourcesAfter = await resources();
    const listenerTotal = row => row.lifecycle.listenerCount + row.lifecycle.scopes.reduce((sum, scope) => sum + scope.listenerCount, 0);
    assert.equal(listenerTotal(resourcesAfter), listenerTotal(resourcesBefore), 'Managed listener count must return to its warmed baseline.');
    assert.equal(resourcesAfter.lifecycle.scopeCount, resourcesBefore.lifecycle.scopeCount, 'Closed settings must not retain extra scopes.');
    assert.equal(resourcesAfter.connectedNodes, resourcesBefore.connectedNodes, 'Closed settings must not retain extra connected nodes.');
    assert.equal(resourcesAfter.shells, 0, 'Animated shells and origin flags must be released.');
    assert.deepEqual(errors, [], 'There must be no page script errors.');
    return { idle, working, resourcesBefore, resourcesAfter, errors };
  } finally {
    await context.close();
  }
}
