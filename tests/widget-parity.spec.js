const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
function widget() {
  const source = fs.readFileSync(path.join(root, 'IncomeWidget.js'), 'utf8');
  expect(source.trimEnd().endsWith('await main()')).toBe(true);
  class Color { static dynamic(a) { return a; } }
  class DateFormatter {
    string(date) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: this.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      }).formatToParts(date).map(p => [p.type, p.value]));
      return ['year', 'month', 'day', 'hour', 'minute', 'second'].map(k => parts[k]).join('-');
    }
  }
  const context = vm.createContext({ Color, DateFormatter, Intl, Date, console });
  vm.runInContext(source.replace(/await main\(\)\s*$/, '') +
    '\nglobalThis.api = { calculateDashboard, defaults: DEFAULTS, holidays: [...HOLIDAYS], workdays: [...SPECIAL_WORKDAYS], formatCurrency, formatCompactCurrency };', context);
  return context.api;
}

test.beforeEach(async ({ page }) => {
  const source = fs.readFileSync(path.join(root, 'Income-per-sed-Develop.html'), 'utf8');
  const marker = 'const IncomeClockModules = Object.freeze({';
  expect(source.split(marker)).toHaveLength(2);
  const hook = `window.parity = {
    calendar: () => ACTIVE_CALENDAR,
    calculate: (settings, iso) => {
      applyRuntimeSettings(settings);
      const date = new Date(iso), rates = getRates(date), elapsed = getWorkSeconds(date);
      const todayIncome = elapsed * rates.secondly;
      return { elapsed, todayIncome, monthEarned: getMonthProgress(date, todayIncome, rates).accumulated,
        daily: rates.daily, hourly: rates.hourly, secondly: rates.secondly,
        monthProjection: rates.monthProjection, annualProjection: rates.annualProjection,
        workdays: rates.monthCalendar.totalWorkdays };
    }
  };`;
  // Instrument only the browser response; shipping source remains unchanged.
  await page.route('**/Income-per-sed-Develop.html', route => route.fulfill({
    contentType: 'text/html', body: source.replace(marker, hook + marker)
  }));
  await page.goto('/Income-per-sed-Develop.html');
});

test('builtin calendars agree for every holiday and adjusted workday', async ({ page }) => {
  const api = widget();
  const calendar = await page.evaluate(() => window.parity.calendar());
  for (const [left, right] of [[api.holidays, calendar.holidays], [api.workdays, calendar.specialWorkdays]]) {
    expect([...left].sort()).toEqual([...right].sort());
    expect(new Set(left).size).toBe(left.length);
    for (const date of left) {
      expect(new Date(date).toISOString().slice(0, 10)).toBe(date);
      expect(date >= calendar.coverage.start && date <= calendar.coverage.end).toBe(true);
    }
  }
  expect(api.holidays.filter(date => api.workdays.includes(date))).toEqual([]);
});

test('widget and page agree on income and elapsed work across all modes', async ({ page }) => {
  const api = widget();
  const dates = ['2026-09-07T08:59:59', '2026-09-07T09:00:00', '2026-09-07T10:30:00',
    '2026-09-07T11:30:00', '2026-09-07T13:29:59', '2026-09-07T13:30:00',
    '2026-09-07T17:30:00', '2026-09-20T14:30:00', '2026-10-01T14:30:00', '2026-09-30T17:30:00'];
  for (const incomeMode of ['fixed-monthly', 'annual-average', 'fixed-daily']) {
    const settings = { ...api.defaults, incomeMode };
    for (const date of dates) {
      const iso = date + '+08:00';
      const expected = api.calculateDashboard(settings, new Date(iso));
      const actual = await page.evaluate(({ settings, iso }) => window.parity.calculate(settings, iso), { settings, iso });
      for (const key of Object.keys(actual)) expect(actual[key], `${incomeMode} ${date} ${key}`).toBeCloseTo(expected[key], 6);
    }
  }
});

test('widget currency promotion preserves grouping and rounded units', () => {
  const api = widget();
  for (const [value, expected] of [[999.995, '¥1,000'], [9999.5, '¥1万'], [99999999, '¥1亿'], [100000000, '¥1亿']]) {
    expect(api.formatCompactCurrency(value)).toBe(expected);
  }
  expect(api.formatCurrency(1234567.125)).toBe('¥1,234,567.13');
});
