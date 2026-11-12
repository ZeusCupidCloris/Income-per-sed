function createProgressReadout({ root, track, writeText, writeAttribute, formatDuration }) {
  let nodes = null;
  let editDispose = null;

  function mount() {
    if (nodes) return;
    nodes = {
      title: root.querySelector('#progressContextLabel'),
      readout: root.querySelector('#progressReadout'),
      percent: root.querySelector('#progressPercent'),
      phase: root.querySelector('#progressPhase'),
      remaining: root.querySelector('#progressRemaining'),
    };
    nodes.title.setAttribute('data-date-context', '');
  }

  function setContext(atLive, dateKey) {
    if (!nodes) return;
    const day = atLive ? '今日' : `${dateKey} 当日`;
    writeText(nodes.title, atLive ? '今日工作进度' : '当日工作进度');
    writeAttribute(track, 'aria-label', `${day}工作进度`);
    writeAttribute(nodes.readout, 'aria-label', `${day}工作进度读数`);
  }

  function setPercent(value) {
    if (!nodes) return;
    writeText(nodes.percent, `${value}%`);
    writeAttribute(track, 'aria-valuenow', value);
  }

  // The midnight handoff needs an immediate final write, not the batched writer.
  function resetPercent() {
    if (!nodes) return;
    nodes.percent.textContent = '0.0%';
    track.setAttribute('aria-valuenow', '0.0');
  }

  function updateStatus(status, remain, dayLabel, isMorning) {
    if (!nodes) return;
    let phase = '等待开始';
    let remaining = `全天 ${formatDuration(remain)}`;
    if (status === 'day-off') {
      phase = `${dayLabel}休息`;
      remaining = '不计工作进度';
    } else if (status === 'ended') {
      phase = `${dayLabel}完成`;
      remaining = '工时已落袋';
    } else if (status === 'break') {
      phase = '午间停表';
      remaining = `剩余 ${formatDuration(remain)}`;
    } else if (status === 'working') {
      phase = isMorning ? '上午班次' : '下午班次';
      remaining = `剩余 ${formatDuration(remain)}`;
    }
    writeText(nodes.phase, phase);
    writeText(nodes.remaining, remaining);
    writeAttribute(root, 'data-work-status', status);
    if (status === 'day-off') writeText(nodes.remaining, `${dayLabel}休息`);
    writeAttribute(track, 'aria-valuetext', status === 'day-off'
      ? `${dayLabel}休息，显示已设置的工作时段，不计工作进度`
      : `${phase}，${remaining}`);
  }

  function bindEdit(bindActivation, openSchedule) {
    if (!nodes) return;
    editDispose?.();
    editDispose = bindActivation(root, openSchedule);
  }

  function destroy() {
    editDispose?.();
    editDispose = null;
    nodes = null;
  }

  return Object.freeze({ mount, setContext, setPercent, resetPercent, updateStatus, bindEdit, destroy });
}
