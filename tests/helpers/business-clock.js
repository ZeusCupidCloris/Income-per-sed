// Freeze business time without freezing requestAnimationFrame or timers.
async function setWorkingTime(page) {
  await page.clock.setFixedTime(new Date('2026-09-07T06:30:00Z'));
}

module.exports = { setWorkingTime };
