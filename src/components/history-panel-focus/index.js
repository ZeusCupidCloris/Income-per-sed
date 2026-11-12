function createHistoryPanelFocus({ root, panel, opener, control, backdrop, state, closePanel, canReturnFocus }) {
  function handleKeyboard(event, editing) {
    const target = event.target;
    const ownsKeyboard = panel.contains(target) || opener.contains(target) || (target === root.body && (panel.inert || panel.hasAttribute('data-entry-animating')));
    if (!(state.open || state.closing) || !(event.key === 'Escape' || ownsKeyboard)) return false;

    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
    } else if (!editing && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === 'Tab' && (panel.inert || panel.hasAttribute('data-entry-animating'))) { event.preventDefault(); return true; }
    if (event.key === 'Tab' && !state.desktop) {
      const controls = [...panel.querySelectorAll('button:not(:disabled):not([tabindex="-1"]),input:not([type="hidden"]),summary,[role="spinbutton"],[role="slider"]')].filter(node => !node.hidden && node.getClientRects().length && !node.closest('[inert]'));
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); return true; }
      if (event.shiftKey && (target === first || target === panel)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (target === last || target === panel)) { event.preventDefault(); first.focus(); }
    }
    return true;
  }

  function focusAfterOpen(openingActive) {
    const active = root.activeElement;
    if (state.open && (active === opener || active === openingActive || active === root.body)) panel.focus({ preventScroll: true });
  }

  function rememberCloseFocus() {
    state.returnFocus = panel.contains(root.activeElement) || root.activeElement === root.body;
  }

  function captureCloseFocus() {
    const active = root.activeElement;
    const shouldReturn = panel.contains(active) || (state.returnFocus && active === root.body);
    state.returnFocus = false;
    return shouldReturn;
  }

  function restoreFocus(shouldReturn) {
    if (shouldReturn && canReturnFocus()) opener.focus({ preventScroll: true });
  }

  function cancelReturnFocus() {
    state.returnFocus = false;
  }

  function bind(listen) {
    listen(backdrop, 'click', () => closePanel());
    listen(panel.querySelector('#historyQuickClose'), 'click', () => closePanel());
    listen(root, 'pointerdown', event => {
      if (state.open && !control.contains(event.target) && !panel.contains(event.target)) {
        closePanel();
        // The outside action owns focus, including unfocused Safari buttons.
        cancelReturnFocus();
      }
    }, { passive: true });
    listen(root, 'focusin', event => {
      if (state.open && !state.desktop && !panel.inert && !panel.hasAttribute('data-entry-animating') && !panel.contains(event.target)) {
        panel.focus({ preventScroll: true });
      }
    });
  }

  return Object.freeze({ bind, handleKeyboard, focusAfterOpen, rememberCloseFocus, captureCloseFocus, restoreFocus, cancelReturnFocus });
}
