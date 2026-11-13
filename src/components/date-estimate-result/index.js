function createDateEstimateResult({ root, writeText }) {
  let nodes = null;

  function mount() {
    if (nodes) return;
    nodes = {
      dateLabel: root.querySelector('#historyDateHeading'),
      stateLabel: root.querySelector('#historyDateState'),
      income: root.querySelector('#historyDateIncome'),
      work: root.querySelector('#historyDateWork'),
      daily: root.querySelector('#historyDateDaily'),
      month: root.querySelector('#historyDateMonth'),
    };
  }

  function update(values) {
    if (!nodes) return;
    for (const [key, node] of Object.entries(nodes)) writeText(node, values[key]);
    root.hidden = false;
  }

  function clear() {
    if (nodes) root.hidden = true;
  }

  function destroy() {
    nodes = null;
  }

  return Object.freeze({ mount, update, clear, destroy });
}
