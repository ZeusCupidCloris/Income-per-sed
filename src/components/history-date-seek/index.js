function createHistoryDateSeek({
  form, caption, error, clockEditor, writeText,
  initialValues, createPicker, dateKey, clockText, parseSelection,
  commitEditors, seekDate, syncDial,
}) {
  const day = form.querySelector('#historySeekDateInput');
  const time = form.querySelector('#historySeekTimeInput');
  const wheels = form.querySelector('#historySeekWheels');
  let picker = null;
  let dirty = false;
  let syncing = false;
  let unbind = null;

  function prepare() {
    dirty = false;
    syncing = true;
    initialValues(day, time);
    error.hidden = true;
    wheels.removeAttribute('aria-invalid');
    picker?.destroy();
    picker = createPicker(wheels, day, time, 'history-seek', () => {
      if (!syncing) dirty = true;
      if (!clockEditor.hasAttribute('aria-invalid')) error.hidden = true;
      wheels.removeAttribute('aria-invalid');
    });
    picker.refresh();
    syncing = false;
  }

  function syncClock(date, parts) {
    const text = clockText(date, parts);
    if (time.value !== text) time.value = text;
    if (!dirty) {
      const nextDay = dateKey(date, parts);
      if (day.value !== nextDay) {
        day.value = nextDay;
        syncing = true;
        picker?.refresh();
        syncing = false;
      }
    }
  }

  function readDate(text) {
    return parseSelection(day, { value: text });
  }

  function setCaption(value) {
    writeText(caption, value);
  }

  function submit(event) {
    event.preventDefault();
    if (!commitEditors()) return;
    error.hidden = true;
    try {
      const date = parseSelection(day, time);
      if (!seekDate(date)) throw new Error('所选时间不在可回溯范围内。');
      dirty = false;
      syncClock(date);
      syncDial(date);
    } catch (failure) {
      writeText(error, failure.message);
      error.hidden = false;
      wheels.setAttribute('aria-invalid', 'true');
    }
  }

  function bind(listen) {
    if (!unbind) unbind = listen(form, 'submit', submit);
  }

  function destroy() {
    unbind?.();
    unbind = null;
    picker?.destroy();
    picker = null;
  }

  return Object.freeze({ prepare, syncClock, readDate, setCaption, bind, destroy });
}
