# Cross-date month recovery follow-up

The original September 24 Develop reproduced a month-income overshoot after simulated September 7 15:30 to September 8 10:30 recovery: 1556.32 before, 1887.93 peak, approximately 1735 at completion.

The fix snapshots the displayed month total. Same-month recovery interpolates from that total; a new month starts from zero. Both use the existing foreground easing and current-date income target, rather than adding the prior day's animated income to the new date's base. Core hand and roller motion parameters are unchanged.

Local verification: 15 Edge tests passed, covering Develop and Push next-day recovery, holiday and working month boundaries, progress cursor alignment, and readout synchronization. README checks and two identical rebuilds passed. The Word checksum fields were regenerated. Widget is unchanged.

These are simulated browser clock/visibility scenarios, not real overnight or physical iPhone acceptance. This follow-up supersedes the HTML/manual hashes in fourfile-20260924.md; SHA256SUMS.txt contains the current hashes. GitHub checks and deployed-byte verification remain separate release gates.
