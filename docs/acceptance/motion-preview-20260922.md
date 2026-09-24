# Develop motion preview - 2026-09-22

## Scope

Develop-only preview. No release build or GitHub push. Push, widget and Word manual remain byte-identical to the fourfile-20260916 delivery.

Preview SHA-256: `D32815937A8A4B020556BDD30C2457C65CC7B957FC9724E68A314D24262F3308`.

Implemented localized save feedback, submitted-error repair, reversible panels, delayed editable-card hover, continuous quick-history targets, and task pause settling. History snap is a session-only Develop diagnostic experiment, disabled by default. Task summary, end-task and copy features are excluded.

## Evidence

- Latest full Edge regression: 59 passed. Existing light/dark screenshot baselines were not regenerated.
- WebKit preview suite: final test-results/.last-run.json reports passed with no failed tests. Suite contains 17 tests; the original process handle expired during interruption, so its final console summary was not retained.
- Mobile WebKit quick-panel screenshot inspected: controls and footer remain within the viewport. Settings-error screenshot inspected for layout overlap.
- git diff --check passed.
- Preview copy hash matches repository Develop exactly.
- An earlier Edge run reported a backdrop idle-draw failure; a subsequent complete run passed without changing that implementation or its threshold. Treat recurrence as a follow-up investigation, not a reason to relax the check.

These are browser automation and screenshot observations, not physical iPhone acceptance. Real overnight acceptance remains paused. User visual acceptance is pending.

## Preview checks

Try successful and invalid settings saves; interrupt panel opening/closing; click quick-history steps repeatedly in both directions; pause and immediately resume/reset the task timer. Open diagnostics with Ctrl+Alt+D to opt into the snap experiment. Reloading disables the experiment again.

Only after preview approval should Push and the manual be regenerated and release checks rerun.
