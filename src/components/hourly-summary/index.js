function createHourlySummary({ root, writeText, formatCurrency }) {
  let nodes = null;
  let editDispose = null;

  function mount() {
    if (nodes) return;
    nodes = {
      hourly: root.querySelector('#hourlyRateDisplay'),
      daily: root.querySelector('#dailyRateDisplay'),
    };
  }

  function update({ hourly, daily, modeLabel }) {
    if (!nodes) return;
    writeText(nodes.hourly, formatCurrency(hourly));
    writeText(nodes.daily, `日均 ${formatCurrency(daily)} · ${modeLabel}`);
  }

  function bindEdit(bindActivation, openIncome) {
    if (!nodes) return;
    editDispose?.();
    editDispose = bindActivation(root, openIncome);
  }

  function destroy() {
    editDispose?.();
    editDispose = null;
    nodes = null;
  }

  return Object.freeze({ mount, update, bindEdit, destroy });
}
