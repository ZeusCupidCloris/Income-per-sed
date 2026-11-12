function bindHistoryQuickButtons({
  listen, panel, playButton, commitDraft, discardDraft,
  togglePlayback, syncPanel, applyAction,
}) {
  listen(playButton, 'click', () => {
    if (!commitDraft()) return;
    togglePlayback();
    syncPanel();
  });
  listen(panel, 'click', event => {
    const button = event.target.closest('button[data-history-seconds],button[data-history-action]');
    if (!(button instanceof HTMLButtonElement) || !panel.contains(button) || button.disabled) return;

    const seconds = Number(button.dataset.historySeconds);
    const action = button.dataset.historyAction || '';
    if (action === 'live') discardDraft();
    else if (!commitDraft()) return;
    applyAction(button, seconds, action);
  });
}
