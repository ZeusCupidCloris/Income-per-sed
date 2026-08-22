const path = require('node:path');
const { defineConfig } = require('@playwright/test');

const root = path.resolve(__dirname, '..');

module.exports = defineConfig({
  testDir: path.join(root, 'tests'),
  testIgnore: 'webkit.spec.js',
  fullyParallel: false,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.006,
    },
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    timezoneId: 'Asia/Shanghai',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/static_server.mjs',
    cwd: root,
    url: 'http://127.0.0.1:4173/Income-per-sed-Push.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'edge',
      use: { browserName: 'chromium', channel: 'msedge' },
    },
  ],
});
