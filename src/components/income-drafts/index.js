function createIncomeDrafts({ modes, readFields }) {
  let drafts = null;
  const copy = values => JSON.parse(JSON.stringify(values));
  const valueKey = value => value.trim() === '' ? '' : Number.isFinite(Number(value)) ? Number(value) : value;

  function reset({ monthlyIncome, dailyIncome, annualWorkDays }) {
    drafts = Object.fromEntries(modes.map(mode => [mode, {
      amount: (mode === 'fixed-daily' ? dailyIncome : monthlyIncome).toFixed(2),
      days: String(annualWorkDays)
    }]));
  }

  function capture(mode) {
    if (!drafts) return;
    const { amount, days } = readFields();
    drafts[mode] = { amount, days };
  }

  function get(mode) {
    return { ...drafts[mode] };
  }

  function key(mode) {
    capture(mode);
    return JSON.stringify([mode, modes.map(name => {
      const draft = drafts?.[name];
      return draft ? [valueKey(draft.amount), name === 'fixed-monthly' ? null : valueKey(draft.days)] : null;
    })]);
  }

  function snapshot(mode) {
    capture(mode);
    return copy(drafts);
  }

  function accepts({ mode, modes: values }) {
    return modes.includes(mode) && modes.every(name => {
      const draft = values?.[name];
      return typeof draft?.amount === 'string' && draft.amount.length <= 64
        && typeof draft.days === 'string' && draft.days.length <= 16;
    });
  }

  function restore(values) {
    drafts = copy(values);
  }

  function clear() {
    drafts = null;
  }

  return Object.freeze({ reset, capture, get, key, snapshot, accepts, restore, clear });
}
