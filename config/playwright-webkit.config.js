const { defineConfig } = require('@playwright/test');
const base = require('./playwright-edge.config');

module.exports = defineConfig({
  ...base,
  testMatch: process.env.DEVELOP_PREVIEW === '1'
    ? ['webkit-mobile.spec.js', 'background-grid.spec.js', 'motion-feedback.spec.js', 'settings-input-safety.spec.js', 'settings-local-motion.spec.js', 'settings-stability.spec.js', 'settings-text-continuity.spec.js', 'settings-scrollbar-handoff.spec.js', 'settings-refinements.spec.js', 'foreground-progress.spec.js', 'readout-sync.spec.js', 'cross-date-month.spec.js', 'recovery-combinations.spec.js', 'long-amount-layout.spec.js']
    : ['webkit-mobile.spec.js', 'background-grid.spec.js', 'foreground-progress.spec.js', 'readout-sync.spec.js', 'cross-date-month.spec.js', 'recovery-combinations.spec.js', 'long-amount-layout.spec.js', 'release-behavior.spec.js', 'settings-text-continuity.spec.js', 'settings-scrollbar-handoff.spec.js', 'settings-refinements.spec.js', 'storage-resilience.spec.js', 'settings-input-safety.spec.js'],
  testIgnore: [],
  projects: [
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
