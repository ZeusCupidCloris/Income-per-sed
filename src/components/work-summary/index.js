function createWorkSummary({ root, writeText, formatDuration }) {
  let nodes = null;

  function mount() {
    if (nodes) return;
    nodes = {
      title: root.querySelector('#workedTimeLabel'),
      worked: root.querySelector('#workedTime'),
      remaining: root.querySelector('#workedSub'),
    };
    nodes.title.setAttribute('data-date-context', '');
  }

  function update({ wholeWork, remain, totalWork, morningWork, status, dayLabel }) {
    if (!nodes) return;
    writeText(nodes.worked, formatDuration(wholeWork));
    let text = `剩余 ${formatDuration(remain)}`;
    if (status === 'day-off') text = `${dayLabel}不计工作收入`;
    else if (wholeWork >= totalWork) text = '已完成全天工作';
    else if (status === 'break' && wholeWork === morningWork) text = `午休后剩余 ${formatDuration(remain)}`;
    else if (status === 'not-started' && wholeWork === 0) text = `全天待完成 ${formatDuration(remain)}`;
    writeText(nodes.remaining, text);
  }

  function setContext(atLive) {
    if (nodes) writeText(nodes.title, atLive ? '今日已工作' : '所选日期已工作');
  }

  function destroy() { nodes = null; }

  return Object.freeze({ mount, update, setContext, destroy });
}
