const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');
const { fullDisplay } = require('./helpers/display-state');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/components/fun-conversions/index.js'), 'utf8');
const markup = '<div class="fun-title">initial</div><div class="fun-fact"></div>';

async function mountFixture(page) {
  await page.setContent(`<section id="first">${markup}</section><section id="second">${markup}</section><div id="unrelated">unchanged</div>`);
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    const writeText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
    window.first = createFunConversions({ root: document.getElementById('first'), items: [{ emoji: 'A', name: '拿铁', price: 40 }, { emoji: 'B', name: '柠檬水', price: 10 }], writeText });
    window.second = createFunConversions({ root: document.getElementById('second'), items: [{ emoji: 'C', name: '芝士', price: 20 }], writeText });
    first.mount(); second.mount();
  });
}

test('fun component only renders inside its own root and has independent instance state', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => { first.update({ income: 100 }); second.update({ income: 20 }); });
  await expect(page.locator('#first .fun-count')).toHaveText(['2', '10']);
  await expect(page.locator('#second .fun-count')).toHaveText(['1']);
  await page.evaluate(() => first.update({ income: 40 }));
  await expect(page.locator('#first .fun-count')).toHaveText(['1', '4']);
  await expect(page.locator('#second .fun-count')).toHaveText(['1']);
  await expect(page.locator('#unrelated')).toHaveText('unchanged');
});

test('fun component preserves floor boundaries, zero and whole long counts', async ({ page }) => {
  await mountFixture(page);
  for (const [income, counts] of [[39.99, ['0', '3']], [40, ['1', '4']], [1000000000, ['25000000', '100000000']], [0, ['0', '0']]]) {
    await page.evaluate(income => first.update({ income }), income);
    await expect(page.locator('#first .fun-count')).toHaveText(counts);
  }
  await expect(page.locator('#first .fun-copy')).toHaveText(['0 拿铁', '0 柠檬水']);
});

test('fun component does not rewrite unchanged counts or date labels', async ({ page }) => {
  await mountFixture(page);
  const mutations = await page.evaluate(async () => {
    first.update({ income: 100 }); first.setContext(true);
    const records = [];
    const observer = new MutationObserver(items => records.push(...items));
    observer.observe(document.getElementById('first'), { childList: true, subtree: true, characterData: true });
    for (let index = 0; index < 10; index++) { first.update({ income: 100 }); first.setContext(true); }
    await Promise.resolve();
    observer.disconnect();
    return records.length;
  });
  expect(mutations).toBe(0);
});

test('fun component owns its live and historical title without changing other instances', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => { first.setContext(false); second.setContext(true); });
  await expect(page.locator('#first .fun-title')).toHaveText('当日已赚可买…');
  await expect(page.locator('#second .fun-title')).toHaveText('今日已赚可买…');
  await expect(page.locator('#first .fun-title')).toHaveAttribute('data-date-context', '');
});

test('fun component can mount once, destroy and remount without retained nodes', async ({ page }) => {
  await mountFixture(page);
  await page.evaluate(() => { first.mount(); first.update({ income: 80 }); });
  await expect(page.locator('#first .fun-item')).toHaveCount(2);
  await page.evaluate(() => { first.destroy(); first.update({ income: 160 }); });
  await expect(page.locator('#first .fun-item')).toHaveCount(0);
  await expect(page.locator('#second .fun-item')).toHaveCount(1);
  await page.evaluate(() => { first.mount(); first.update({ income: 40 }); });
  await expect(page.locator('#first .fun-count')).toHaveText(['1', '4']);
});

for (const channel of ['Develop', 'Push']) {
  test(`${channel}: generated HTML works offline without component files at runtime`, async ({ browser, browserName }, testInfo) => {
    const standalone = testInfo.outputPath('standalone', `Income-per-sed-${channel}.html`);
    fs.mkdirSync(path.dirname(standalone), { recursive: true });
    fs.copyFileSync(path.join(root, `Income-per-sed-${channel}.html`), standalone);
    const entryUrl = pathToFileURL(standalone).href;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', timezoneId: 'Asia/Shanghai', locale: 'zh-CN', offline: browserName === 'chromium' });
    const requests = [], errors = [];
    try {
      if (browserName === 'webkit') await context.route(/^https?:\/\//, route => route.abort('internetdisconnected'));
      const page = await context.newPage();
      page.on('request', request => { if (request.url() !== entryUrl && !/^(?:data|blob):/.test(request.url())) requests.push(request.url()); });
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-10-20T08:30:00Z'));
      await page.goto(entryUrl);
      await fullDisplay(page);
      await expect(page.locator('#funFact .fun-count')).toHaveCount(4);
      await expect(page.locator('#funContextLabel')).toHaveText('今日已赚可买…');
      await page.locator('#historyQuickOpen').click();
      await page.waitForFunction(() => !document.getElementById('historyQuickPanel').dataset.entryAnimating);
      await page.locator('[data-history-seconds="-900"]').click();
      await expect(page.locator('#funContextLabel')).toHaveText('当日已赚可买…');
      await page.locator('#historyQuickPanel [data-history-action="live"]').click();
      await expect(page.locator('#funContextLabel')).toHaveText('今日已赚可买…');
      expect(requests).toEqual([]);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}
