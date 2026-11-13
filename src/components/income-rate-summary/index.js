function createIncomeRateSummary({ root, writeText }) {
  let nodes = null;

  function mount() {
    if (nodes) return;
    nodes = {
      context: root.querySelector('#incomeCalculationDate'),
      daily: root.querySelector('#incomeCalculationDaily'),
      hourly: root.querySelector('#incomeCalculationHourly'),
    };
  }

  function update(values) {
    if (!nodes) return;
    for (const [key, node] of Object.entries(nodes)) writeText(node, values[key]);
  }

  function destroy() {
    nodes = null;
  }

  return Object.freeze({ mount, update, destroy });
}
