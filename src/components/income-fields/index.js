function createIncomeFields({ root, writeText }) {
  let nodes = null;
  const help = {
    'fixed-monthly': '按当月工作日折算',
    'annual-average': '按全年工作日均摊',
    'fixed-daily': '每个工作日固定计薪'
  };

  function mount() {
    if (nodes) return;
    nodes = {
      label: root.querySelector('#incomeAmountLabel'),
      amount: root.querySelector('#incomeAmountInput'),
      annualInput: root.querySelector('#annualWorkDaysInput'),
      annualField: root.querySelector('#annualWorkDaysField'),
      monthlyField: root.querySelector('#monthlyWorkDaysField'),
      monthlyValue: root.querySelector('#monthlyWorkDaysValue'),
      help: root.querySelector('#incomeModeHelp'),
    };
  }

  function update(mode, { amount, days }, limits) {
    if (!nodes) return;
    const monthly = mode === 'fixed-monthly';
    writeText(nodes.label, mode === 'fixed-daily' ? '日薪到手' : '月薪到手');
    nodes.amount.value = amount;
    nodes.annualInput.value = days;
    nodes.amount.min = limits.minimum.toFixed(limits.decimals);
    nodes.amount.max = String(limits.maximum);
    nodes.amount.step = (1 / (10 ** limits.decimals)).toFixed(limits.decimals);
    nodes.annualField.hidden = monthly;
    nodes.monthlyField.hidden = !monthly;
    root.toggleAttribute('data-monthly', monthly);
    writeText(nodes.help, help[mode]);
  }

  function updateMonthlyWorkdays(count) {
    if (nodes) writeText(nodes.monthlyValue, String(count));
  }

  function destroy() {
    nodes = null;
  }

  return Object.freeze({ mount, update, updateMonthlyWorkdays, destroy });
}
