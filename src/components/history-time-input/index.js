function createHistoryTimeInput({
  input, error, submitButton, writeText, readDate, readBounds,
  readSelectionText, commitTarget, focusDial,
}) {
  let editing = false;

  function reset() {
    editing = false;
    error.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  function sync(text) {
    if (!editing && input.value !== text) input.value = text;
  }

  function restore() {
    reset();
    const text = readSelectionText();
    if (text !== undefined) input.value = text;
  }

  function commit({ apply = true } = {}) {
    if (!editing) return true;
    const text = input.value.trim();
    let target;
    try {
      if (!/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(text)) {
        throw new Error('请输入有效时间，例如 09:30 或 09:30:15。');
      }
      target = readDate(text);
      const bounds = readBounds();
      const timestamp = target.getTime();
      if (timestamp < bounds.lowerBound || timestamp > bounds.upperBound) {
        throw new Error('不能选择尚未发生或超出范围的时间。');
      }
    } catch (failure) {
      writeText(error, failure.message);
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    reset();
    commitTarget(target, apply);
    return true;
  }

  function bind(listen) {
    listen(input, 'focus', () => { editing = true; input.select(); });
    listen(input, 'blur', event => {
      // Keep the draft until the date form consumes it, including intervening renders.
      if (event.relatedTarget !== submitButton) commit();
    });
    listen(input, 'keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (commit()) input.blur();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        restore();
        input.blur();
        focusDial();
      }
    });
  }

  return Object.freeze({ reset, sync, restore, commit, bind });
}
