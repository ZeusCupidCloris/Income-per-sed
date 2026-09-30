const { defineConfig } = require('@playwright/test');
const base = require('./playwright-edge.config');

module.exports = defineConfig({
  ...base,
  testMatch: process.env.DEVELOP_PREVIEW === '1'
    ? ['webkit-mobile.spec.js', 'background-grid.spec.js', 'motion-feedback.spec.js', 'foreground-progress.spec.js', 'readout-sync.spec.js', 'cross-date-month.spec.js', 'recovery-combinations.spec.js']
    : ['webkit-mobile.spec.js', 'background-grid.spec.js', 'cross-date-month.spec.js', 'recovery-combinations.spec.js'],
  testIgnore: [],
  projects: [
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
