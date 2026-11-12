function createCalendarStatus({ root, writeText }) {
  const meta = root?.querySelector('#calendarDataMeta');
  const badge = root?.querySelector('#calendarDataBadge');
  const status = root?.querySelector('#calendarDataStatus');
  const messages = {
    'validated-and-saved': version => `日历 ${version} 已校验并保存。`,
    'applied-for-page': version => `日历 ${version} 已在当前页面生效。`,
    'reset-builtin': '已恢复内置日历清单。',
    'reset-for-page': '已在当前页面恢复内置日历，但未能清除浏览器中的旧数据。',
    'draft-restored': '草稿已恢复，保存后生效。',
    'exported-draft': '已导出当前面板的日历。',
    'loaded-draft': '已载入日历，保存后生效。',
    'schedule-and-calendar-saved': '工作时间和日历已保存。',
    'selected-builtin': '已选择内置日历，保存后生效。',
    'already-builtin': '当前已是内置日历。',
    'export-failed': detail => `导出失败：${detail}`,
    'import-failed': detail => `导入失败：${detail}`,
  };

  function setStatus(result, detail) {
    const message = messages[result];
    writeText(status, typeof message === 'function' ? message(detail) : (message ?? ''));
  }

  function update(calendar, result) {
    if (!meta) return;
    const coverage = calendar.coverage;
    const startYear = coverage.start.slice(0, 4);
    const endYear = coverage.end.slice(0, 4);
    writeText(meta, startYear === endYear ? `${startYear} 年` : `${startYear}—${endYear} 年`);
    meta.setAttribute('aria-label', `${coverage.label}，${coverage.start} 至 ${coverage.end}，${calendar.holidays.length} 个休息日，${calendar.specialWorkdays.length} 个调休工作日`);
    writeText(badge, calendar.origin === 'builtin' ? '内置' : '已导入');
    setStatus(result, coverage.version);
  }

  return Object.freeze({ update, setStatus });
}
