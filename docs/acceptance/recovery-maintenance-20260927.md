# Recovery combinations and manual checksum maintenance

## Scope

This is a local follow-up to the September 24 cross-date month fix. The webpage remains 2.5.4-rc.2; no release tag or public download was changed. The existing delivery revision remains 2026-09-24-r1 until publication is approved. This record identifies the September 27 local verification, not a new published release.

The changes cover cross-date recovery combination tests and filename-based Word checksum maintenance. Hand and roller motion parameters, appearance, calculation rules, and IncomeWidget.js are unchanged. Push is rebuilt from the local Develop source for parity tests, not independently edited.

## Reproduced recovery defect

The added test opens September 7 at 15:30 Beijing time, simulates hiding until September 8 at 10:30, advances 320 ms into foreground recovery, then hides again for 60 seconds. Before the fix, the second resume could jump the monthly total because its snapshot date was already the current date, so the cross-date-only interpolation no longer applied.

The narrow fix uses the visible monthly snapshot on every foreground resume. It preserves the existing foreground interpolation progress and current-time target. No duration, easing, hand velocity, roller motion, or progress-track parameter was adjusted.

The new recovery matrix covers Develop and Push, fixed monthly income, annual average income, and fixed daily income. It checks next-day recovery, a holiday month boundary, a working month boundary, a second hide during recovery, and history input taking over before returning live. Expected final monthly income and progress use independent fixture arithmetic. Browser clocks are paused and explicitly advanced to keep interruption points deterministic.

## Manual maintenance

The manual now has one invisible Word bookmark for each source file checksum. Build and validation tools resolve hashes by filename, not paragraph order. Missing, duplicate, unknown, overlapping, unclosed, or malformed markers fail instead of guessing. Split text runs and reordered paragraphs are supported. Unrelated hashes, bookmarks, images, and other document parts are preserved.

The manual was exported read-only through Microsoft Word because the bundled LibreOffice renderer was unavailable. Before and after exports each contain 45 A4 pages. All 45 page images were inspected. Pixel comparison found 44 identical pages; the only difference on page 40 is the regenerated Develop and Push checksum text. No document layout or illustration was changed.

## Verification status

Environment: Windows, Playwright 1.62.1, installed Edge 154.0.4258.37, bundled WebKit 26.5 (revision 2336). Browser business timezone is Asia/Shanghai. The recorded Edge and WebKit results are separate test runs.

- Focused Develop recovery combinations and synchronized readouts: 7 passed during the fix.
- Manual and release preparation unit tests: 6 passed.
- Release channel and workflow contract tests: 5 passed.
- README tests: 3 passed; current preview source hashes validated.
- Existing widget settings tests: 7 passed; this is a test double, not physical Scriptable acceptance.
- Final full Edge run: 98 passed, including unchanged light/dark screenshot baselines and mobile viewport checks.
- Expanded WebKit run: 32 passed, including the dual-file recovery matrix and mobile history panel checks.
- Two-build byte repeatability: both rebuilds left all 6 tracked release artifacts identical (four deliverables, checksum list, and release manifest).

The complete `npm run quality:local` command exited successfully, followed by `npm run release:repeatability`. Local output logs are retained in the workspace outputs directory as `quality-local-20260927.log` and `release-repeatability-20260927.log`; they are not repository assets. `git diff --check` passed.

No screenshots are approved or rewritten merely to make a failing test pass.

## Local candidate hashes

| File | SHA-256 |
| --- | --- |
| Income-per-sed-Develop.html | dd54c87490734a05427900caa32e205a64a9c614eede7790d0ad1ec3fa480e8e |
| Income-per-sed-Push.html | 6dfa33ebe645346c90e77a133a86f7c4b885d237a8b4b6a42aa73656c51903b1 |
| IncomeWidget.js | 7e13ea0fe84860d9c0b3f55ef60914ed3b31c6789916d9f72dfad0e8cc460726 |
| docs/Income-per-sed（说明文档）.docx | 95909abccbed665349f185a5658935d55704d80a8e91a26c3b9b1eafa0713674 |

These hashes identify the local candidate only. The widget hash is unchanged from the previous batch.

## Evidence boundaries

These are local browser clock and visibility simulations, document rendering checks, and automated regression tests. They do not establish real overnight recovery, browser tab discard behavior, or physical iPhone acceptance. Real overnight testing remains paused. No GitHub commit, push, merge, or new Pages deployment was performed during that local validation stage.

The user authorized the publication follow-up on September 27. It uses a separate branch and requires the existing PR checks before merging into main, followed by deployed-byte verification. This record does not predeclare those remote gates successful; the corresponding PR conversation records their final result. No product tag is created by this maintenance publication.

The next separately scoped maintenance candidates remain widget settings write safety and a configurable long-running resource observation. Neither is implemented by this batch.
