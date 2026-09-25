const { defineConfig } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig({
  ...base,
  testMatch: process.env.DEVELOP_PREVIEW === '1' ? ['webkit.spec.js', 'motion-feedback.spec.js', 'foreground-progress.spec.js', 'readout-sync.spec.js'] : 'webkit.spec.js',
  testIgnore: [],
  projects: [
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
