module.exports = {
  data: {
    label: '计算与存储',
    files: ['widget-parity.spec.js', 'storage-resilience.spec.js', 'widget-settings.cjs', 'daily-workflow.spec.js'],
  },
  recovery: {
    label: '恢复与回溯',
    files: ['browser-lifecycle.spec.js', 'cross-date-month.spec.js', 'foreground-progress.spec.js',
      'foreground-resume.spec.js', 'input-device-motion.spec.js', 'interaction-handoff.spec.js',
      'readout-sync.spec.js', 'recovery-combinations.spec.js', 'recovery-cross-actions.spec.js',
      'startup-history-playback.spec.js', 'history-dial-refinement.spec.js', 'history-dial-touch.spec.js', 'history-flow.spec.js', 'history-panel-focus.spec.js',
      'live-reference-marker.spec.js', 'readout-components-contract.spec.js', 'progress-readout-contract.spec.js', 'component-joint.spec.js'],
  },
  settings: {
    label: '设置交互',
    files: ['motion-feedback.spec.js', 'settings-input-safety.spec.js', 'settings-local-motion.spec.js',
      'settings-refinements.spec.js', 'settings-scrollbar-handoff.spec.js', 'settings-stability.spec.js',
      'settings-text-continuity.spec.js', 'global-css-feedback.spec.js', 'hourly-summary-contract.spec.js', 'date-estimate-result.spec.js', 'income-rate-summary.spec.js', 'income-mode-switch.spec.js', 'income-view-tabs.spec.js'],
    manual: ['settings-frame-budget.spec.js'],
  },
  layout: {
    label: '布局与视觉',
    files: ['background-grid.spec.js', 'long-amount-layout.spec.js', 'visual.spec.js', 'webkit-mobile.spec.js', 'fun-conversions-contract.spec.js'],
  },
  release: {
    label: '发布一致性',
    files: ['release-behavior.spec.js', 'document-index-validation.test.mjs', 'install-ci-dependencies.test.mjs',
      'readme-preview-validation.test.mjs', 'release-channel.test.mjs', 'release-naming.test.mjs',
      'workflow-contract.test.mjs', 'test_prepare_delivery.py', 'quality-entrypoints.test.mjs', 'source-assembly.test.mjs'],
  },
};
