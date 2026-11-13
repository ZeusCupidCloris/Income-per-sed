function createStatusReadout({ root, clock, writeText, writeAttribute }) {
  let nodes = null;

  function mount() {
    if (nodes) return;
    nodes = {
      main: root.querySelector('#statusLabelMain'),
      detail: root.querySelector('#statusLabelDetail'),
    };
  }

  function updateStatus(status, atLive) {
    if (!nodes) return;
    const day = atLive ? '今日' : '当日';
    const text = ({
      working: '工作中 · 时间正在积累价值',
      break: '午休中 · 收入暂时停表',
      ended: `${day}工作结束`,
      'not-started': `等待${day}工作开始`,
      'day-off': '休息日 · 好好生活',
    })[status] || '状态未知';
    const separator = text.indexOf(' · ');
    writeText(nodes.main, separator < 0 ? text : text.slice(0, separator));
    writeText(nodes.detail, separator < 0 ? '' : text.slice(separator));
    writeAttribute(root, 'aria-label', text);
  }

  function updateTime(text, datetime) {
    if (!nodes) return;
    writeText(clock, text);
    writeAttribute(clock, 'datetime', datetime);
  }

  function destroy() { nodes = null; }

  return Object.freeze({ mount, updateStatus, updateTime, destroy });
}
