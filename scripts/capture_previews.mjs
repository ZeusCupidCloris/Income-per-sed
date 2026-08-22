import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'docs', 'images');
const appUrl = pathToFileURL(path.join(root, 'Income-per-sed-Push.html')).href;
const previews = JSON.parse(
  await readFile(path.join(root, 'config', 'readme-previews.json'), 'utf8'),
);

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });

async function capture(name, viewport, colorScheme = 'light') {
  const context = await browser.newContext({
    viewport,
    colorScheme,
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    timezoneId: 'Asia/Shanghai',
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-08-03T02:39:00.000Z'));
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#incomeMainCard').waitFor({ state: 'visible' });
  await page.waitForTimeout(1800);
  const session = await context.newCDPSession(page);
  await session.send('Page.setWebLifecycleState', { state: 'frozen' });
  await session.detach();
  await page.screenshot({
    path: path.join(output, name),
    animations: 'disabled',
    fullPage: false,
  });
  await context.close();
}

for (const { file, width, height, colorScheme } of previews) {
  await capture(file, { width, height }, colorScheme);
}
await browser.close();
