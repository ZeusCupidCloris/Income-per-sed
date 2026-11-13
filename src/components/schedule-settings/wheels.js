function createScheduleWheels({ grid, fields, createWheel, splitTime, onChange }) {
  let wheels = [];

  function destroy() {
    for (const wheel of wheels) wheel.destroy();
    wheels = [];
    for (const host of grid.querySelectorAll('.schedule-period-times')) host.replaceChildren();
  }

  function mount(schedule) {
    if (wheels.length) destroy();
    const owner = grid.ownerDocument;
    const fragments = { morning: owner.createDocumentFragment(), afternoon: owner.createDocumentFragment() };
    for (const field of fields) {
      const value = splitTime(schedule[field.key]);
      const card = owner.createElement('section');
      card.className = 'time-wheel-card';
      card.dataset.timeKey = field.key;
      const title = owner.createElement('div');
      title.className = 'time-wheel-title';
      title.textContent = field.key.endsWith('Start') ? '开始' : '结束';
      const picker = owner.createElement('div');
      picker.className = 'time-wheel-picker';
      const separator = owner.createElement('span');
      separator.className = 'time-wheel-separator';
      separator.textContent = ':';
      const hourWheel = createWheel({
        key: field.key,
        unit: 'hour',
        title: field.title,
        value: value.hour,
        onChange: (nextValue) => onChange(field.key, 'hour', nextValue)
      });
      const minuteWheel = createWheel({
        key: field.key,
        unit: 'minute',
        title: field.title,
        value: value.minute,
        onChange: (nextValue) => onChange(field.key, 'minute', nextValue)
      });
      wheels.push(hourWheel, minuteWheel);
      picker.append(hourWheel.element, separator, minuteWheel.element);
      picker.setAttribute('aria-describedby', 'scheduleSettingsError');
      card.append(title, picker);
      fragments[field.key.startsWith('morning') ? 'morning' : 'afternoon'].appendChild(card);
    }
    grid.querySelector('#scheduleMorningWheels').replaceChildren(fragments.morning);
    grid.querySelector('#scheduleAfternoonWheels').replaceChildren(fragments.afternoon);
  }

  return Object.freeze({
    mount,
    destroy,
    focusFirst: () => wheels[0]?.focus(),
    restoreEditor: ({ key, unit, text }) => wheels.find(wheel => wheel.key === key && wheel.unit === unit)?.openEditor(text),
    isMoving: () => wheels.some(wheel => wheel.animationFrame || wheel.dragState),
    getCount: () => wheels.length
  });
}
