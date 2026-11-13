function createIncomeSettings({ root, resolvePanel, modes, readFields, writeText }) {
/* @include components/income-fields/index.js */
/* @include components/income-drafts/index.js */
/* @include components/income-mode-switch/index.js */
/* @include components/income-view-tabs/index.js */
/* @include components/income-rate-summary/index.js */

  const modeRoot = root.querySelector('.income-mode-segments');
  const fields = createIncomeFields({ root: root.querySelector('#incomeConfigView'), writeText });
  const drafts = createIncomeDrafts({ modes, readFields });
  const modeSwitch = createIncomeModeSwitch({ root: modeRoot });
  const tabs = createIncomeViewTabs({ root: root.querySelector('.income-view-tabs'), resolvePanel });
  const summary = createIncomeRateSummary({ root: root.querySelector('.income-rate-summary'), writeText });

  function mount() {
    fields.mount();
    modeSwitch.mount();
    tabs.mount();
    summary.mount();
  }

  function bind(listen, { onSelectView, onSelectMode }) {
    tabs.bind(listen, onSelectView);
    modeSwitch.bind(listen, onSelectMode);
  }

  function destroy() {
    fields.destroy();
    modeSwitch.destroy();
    tabs.destroy();
    summary.destroy();
  }

  return Object.freeze({ modeRoot, fields, drafts, modeSwitch, tabs, summary, mount, bind, destroy });
}
