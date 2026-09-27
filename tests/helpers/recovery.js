const settings = {
  monthlyIncome: 6600, dailyIncome: 300, annualWorkDays: 264,
  schedule: { morningStart: '09:00', morningEnd: '11:30', afternoonStart: '13:30', afternoonEnd: '17:30' },
};

async function prepareRecovery(page, channel, incomeMode, start) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(value => localStorage.setItem('income-per-sed-settings', JSON.stringify(value)), { ...settings, incomeMode });
  await page.clock.install({ time: new Date(start) });
  await page.clock.pauseAt(new Date(new Date(start).getTime() + 1000));
  await page.goto(`/Income-per-sed-${channel}.html`);
  await page.clock.runFor(2200);
}

async function setHidden(page, hidden) {
  await page.evaluate(hidden => {
    if (hidden) {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    } else {
      delete document.hidden;
      delete document.visibilityState;
    }
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function resumeAt(page, end) {
  await setHidden(page, true);
  const delta = new Date(end).getTime() - await page.evaluate(() => Date.now());
  if (delta < 0) throw new Error('Recovery fixture must advance time');
  await page.clock.fastForward(delta);
  await setHidden(page, false);
}

function readRecovery() {
  return {
    now: Date.now(),
    month: Number(document.querySelector('#monthIncome').textContent.replace(/[^\d.]/g, '')),
    active: document.body.classList.contains('foreground-catchup-active'),
    midnight: document.body.classList.contains('midnight-reset-active'),
    history: document.body.classList.contains('timeline-history-hold'),
    historyActive: document.body.classList.contains('timeline-history-active'),
    state: document.body.dataset.timelineState,
    returning: document.body.classList.contains('timeline-returning-live'),
    progress: Number(document.querySelector('#progressTrack').getAttribute('aria-valuenow')),
  };
}

async function sampleRecovery(page, duration = 2600) {
  const frames = [await page.evaluate(readRecovery)];
  for (let t = 0; t < duration; t += 40) {
    await page.clock.runFor(40);
    frames.push(await page.evaluate(readRecovery));
  }
  return frames;
}

// Independent arithmetic for the fixed fixture dates, not the application's income engine.
function expectedMonth(now, mode, completedDays, monthWorkdays, restDay = false) {
  const date = new Date(now + 8 * 3600000);
  const second = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
  const clamp = (x, cap) => Math.max(0, Math.min(cap, x));
  const worked = restDay ? 0 : clamp(second - 9 * 3600, 9000) + clamp(second - 13.5 * 3600, 14400);
  const daily = mode === 'fixed-monthly' ? settings.monthlyIncome / monthWorkdays
    : mode === 'annual-average' ? settings.monthlyIncome * 12 / settings.annualWorkDays : settings.dailyIncome;
  return { income: (completedDays + worked / 23400) * daily, progress: worked / 23400 * 100 };
}

module.exports = { prepareRecovery, setHidden, resumeAt, readRecovery, sampleRecovery, expectedMonth };
