function createMonthSummary({ root, writeText, writeAttribute, formatCurrency }) {
  let nodes = null;
  let calendarDispose = null;

  function mount() {
    if (nodes) return;
    nodes = {
      title: root.querySelector('#monthIncomeLabel'),
      income: root.querySelector('#monthIncome'),
      detail: root.querySelector('#monthDetail'),
      projectionTitle: root.querySelector('#estMonthLabel'),
      projection: root.querySelector('#estMonth'),
      warning: root.querySelector('#calendarWarning'),
      warningText: root.querySelector('#calendarWarningText'),
      calendarAction: root.querySelector('#calendarWarningSettings'),
    };
    nodes.title.setAttribute('data-date-context', '');
    nodes.projectionTitle.setAttribute('data-date-context', '');
  }

  function updateIncome(income) {
    if (nodes) writeText(nodes.income, formatCurrency(income));
  }

  function updateSummary({ projection, progress, totalWorkdays }) {
    if (!nodes) return;
    writeText(nodes.projection, formatCurrency(projection));
    writeText(nodes.detail, progress.todayIsWorkday
      ? `第 ${progress.currentWorkdayIndex} / ${totalWorkdays} 个工作日`
      : `已完成 ${progress.completedBeforeToday} / ${totalWorkdays} 个工作日`);
  }

  function updateCoverage(covered, year) {
    if (!nodes) return;
    nodes.warning.hidden = covered;
    if (!covered) writeText(nodes.warningText, `${year} 年节假日数据尚未更新，暂按周一至周五估算。`);
  }

  function setContext(atLive, { year, month }) {
    if (!nodes) return;
    writeText(nodes.title, atLive ? '本月累计收入' : '所在月份累计收入');
    writeText(nodes.projectionTitle, atLive ? '本月预计' : '该月预计');
    writeAttribute(root, 'aria-label', atLive ? '本月累计收入' : `${year} 年 ${month} 月累计收入`);
  }

  function bindCalendarAction(listen, openCalendar) {
    if (!nodes) return;
    calendarDispose?.();
    calendarDispose = listen(nodes.calendarAction, 'click', event => openCalendar(event.currentTarget));
  }

  function destroy() {
    calendarDispose?.();
    calendarDispose = null;
    nodes = null;
  }

  return Object.freeze({ mount, updateIncome, updateSummary, updateCoverage, setContext, bindCalendarAction, destroy });
}
