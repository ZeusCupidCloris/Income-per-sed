function createIncomeModeSwitch({ root }) {
  let buttons = null;
  let dispose = null;

  function mount() {
    if (buttons) return;
    buttons = [...root.querySelectorAll('[data-income-mode]')];
  }

  function updateSelection(mode) {
    if (!buttons) return;
    for (const button of buttons) {
      const active = button.dataset.incomeMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }

  function bind(listen, onSelect) {
    if (!buttons) return;
    dispose?.();
    const stops = buttons.map(button => listen(button, 'click', () => onSelect(button.dataset.incomeMode)));
    dispose = () => stops.forEach(stop => stop());
  }

  function destroy() {
    dispose?.();
    dispose = null;
    buttons = null;
  }

  return Object.freeze({ mount, updateSelection, bind, destroy });
}
