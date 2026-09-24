# Readout synchronization preview

The user reported worked seconds, remaining time and month income updating separately from the main hand. Before editing, a browser test reproduced independently floored durations: worked plus remaining was 23399 seconds instead of the configured 23400.

The three readouts now update within the render frame as well as immediate settings refresh. LIVE uses the same whole working second that starts the main-hand tick. Remaining time is derived from that integer, avoiding the one-second discrepancy. During startup, history and recovery, the readouts use the displayed roller income instead of prematurely showing the final target. Mechanical hand motion and roller parameters are unchanged. Currency retains two-decimal formatting, so not every second necessarily changes a displayed cent.

## Evidence

- The preceding full Edge invocation contained 64 tests; after interruption its final .last-run.json reported passed with no failed tests. The original final console summary was not retained.
- On 2026-09-24, five WebKit tests passed: readout synchronization plus four foreground-progress recovery cases. The latter retained zero simultaneous-fill violations and cursor discrepancy below one pixel.
- The readout test checks LIVE tick targets, complementary durations and sampled recovery amounts.
- git diff --check passed.
- Preview SHA-256: 04E200AA7EBEE675A211E338119A570E6D1E6130AF233CE788759958D1D3CDA0.

Develop only; no Push build, manual/widget update or GitHub publication. Automated hidden-state/time simulation is not physical iPhone or real overnight acceptance.
