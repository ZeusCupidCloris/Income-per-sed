function createHistoryPanelController({
  root, panel, opener, backdrop, state, presentation, focus, clearTimer,
  finishEditing, prepareDate, resetDrag, dismissNotice, syncPanel, viewport,
}) {
  const body = root.body;

  function portal() {
    if (!panel || !body) return;
    if (backdrop?.parentElement !== body) body.appendChild(backdrop);
    if (panel.parentElement !== body) body.appendChild(panel);
    body.dataset.historyQuickPortal = 'body';
  }

  function initialize() {
    portal();
    viewport.sync();
  }

  function finishClose() {
    if (state.open) return;
    const returnFocus = focus.captureCloseFocus();
    clearTimer(state.closeTimer);
    state.closeTimer = 0;
    state.closing = false;
    clearTimer(state.recentTimer);
    state.recentButton?.classList.remove('is-recent-source');
    state.recentButton = null;
    panel.hidden = true;
    presentation.release();
    state.desktop = false;
    panel.setAttribute('aria-modal', 'true');
    if (backdrop) backdrop.hidden = true;
    body.classList.remove('history-quick-panel-open', 'history-quick-panel-visible', 'history-quick-panel-closing');
    resetDrag();
    focus.restoreFocus(returnFocus);
  }

  function setOpen(open) {
    const nextOpen = Boolean(open);
    if (!nextOpen) finishEditing();
    if (nextOpen && !state.open) prepareDate();
    if (!panel || !opener) return;
    if (!nextOpen && (panel.hidden || state.closing)) return;
    clearTimer(state.closeTimer);
    state.closeTimer = 0;
    state.desktop = nextOpen ? viewport.desktop() : state.desktop;
    state.open = nextOpen;
    state.closing = !nextOpen;
    opener.setAttribute('aria-expanded', String(nextOpen));
    panel.setAttribute('aria-modal', String(!state.desktop));
    if (nextOpen) {
      portal();
      viewport.sync();
      resetDrag();
      dismissNotice();
      backdrop.hidden = state.desktop;
      body.classList.remove('history-quick-panel-closing');
      body.classList.add('history-quick-panel-open', 'history-quick-panel-visible');
      syncPanel();
      const openingActive = root.activeElement;
      presentation.show({ onfinish: () => focus.focusAfterOpen(openingActive) });
    } else {
      focus.rememberCloseFocus();
      presentation.hide({ onfinish: finishClose });
      if (!state.closing) return;
      body.classList.remove('history-quick-panel-visible');
      body.classList.add('history-quick-panel-closing');
    }
  }

  function toggle() {
    setOpen(!state.open);
  }

  function resize() {
    viewport.sync();
    if (state.desktop && viewport.desktop()) presentation.schedulePosition();
    else if (state.desktop || viewport.width() > 620) setOpen(false);
  }

  function dismiss() {
    if (!state.open && !state.closing) return;
    setOpen(false);
    focus.cancelReturnFocus();
    presentation.hide({ immediate: true, onfinish: finishClose });
  }

  return Object.freeze({ initialize, setOpen, toggle, resize, dismiss });
}
