function createIncomeViewTabs({ root, resolvePanel }) {
  let tabs = null;
  let dispose = null;

  function mount() {
    if (tabs) return;
    tabs = [...root.querySelectorAll('[role="tab"]')];
  }

  function updateSelection(view, focus = false) {
    if (!tabs) return;
    for (const tab of tabs) {
      const selected = tab.dataset.incomeView === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      resolvePanel(tab.getAttribute('aria-controls')).hidden = !selected;
      if (selected && focus) tab.focus({ preventScroll: true });
    }
  }

  function bind(listen, onSelect) {
    if (!tabs) return;
    dispose?.();
    const stops = tabs.flatMap((tab, index) => [
      listen(tab, 'click', () => onSelect(tab.dataset.incomeView)),
      listen(tab, 'keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
          : (index + offset + tabs.length) % tabs.length;
        onSelect(tabs[next].dataset.incomeView, true);
      })
    ]);
    dispose = () => stops.forEach(stop => stop());
  }

  function destroy() {
    dispose?.();
    dispose = null;
    tabs = null;
  }

  return Object.freeze({ mount, updateSelection, bind, destroy });
}
