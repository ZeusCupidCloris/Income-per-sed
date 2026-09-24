# Foreground progress correction 2026-09-23

## Reproduction before product edits

Confirmed Develop matched the 2026-09-22 delivery (D32815937A8A4B020556BDD30C2457C65CC7B957FC9724E68A314D24262F3308). Browser reproduction started at 2026-09-07 10:30 Beijing time, dispatched the hidden lifecycle state, advanced the browser clock five hours, and restored visibility. This is automated lifecycle/time simulation, not five hours of actual background operation.

Both unchanged Develop and Push failed the regression: independent morning/afternoon interpolation produced simultaneous filling while the cursor crossed the whole route. Maximum cursor-to-active-fill discrepancy was approximately 156px. Reproduction traces are retained under outputs/foreground-progress-20260923/before in the workspace.

## Narrow fix

Only the continuous foreground-resume path now derives both fills and cursor from one route coordinate. The coordinate crosses the lunch gap without filling the afternoon early, and also supports backward movement on next-day recovery. Dial, roller, duration and easing parameters are unchanged. Segment borders account for approximately 1px difference between outer geometry and the rendered fill edge.

## Verification

- Edge: 28 related tests passed, including four new progress cases, existing foreground recovery, input interruption, startup/history behavior, and unchanged light/dark visual baselines.
- WebKit: four progress cases passed (desktop across lunch, mobile dark across lunch, next morning reverse, resume during lunch).
- Every progress case had zero simultaneous-fill violations and maximum cursor discrepancy below 1px; terminal cursor checks and page-error checks passed.
- git diff --check passed.
- Develop preview SHA-256: 15F60D1EA34FB407B8355A6B62F39350E6DA30DB5904BA5BF61C49E0DA4502EE.
- Push, widget and manual remain identical to fourfile-20260922. No build, commit or GitHub push was performed.

Preview: outputs/foreground-progress-20260923/Income-per-sed-Develop.html. WebKit frame JSON and screenshots are retained in after-webkit beside the preview. Physical-device and real long-background confirmation remains pending; real overnight acceptance remains paused.
