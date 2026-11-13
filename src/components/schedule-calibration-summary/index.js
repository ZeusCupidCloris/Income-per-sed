function createScheduleCalibrationSummary({ morning, afternoon, total, writeText }) {
  function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}小时${minutes}分`;
    if (hours > 0) return `${hours}小时`;
    return `${minutes}分钟`;
  }

  function update(morningSeconds, afternoonSeconds, valid) {
    writeText(morning, morningSeconds > 0 ? formatDuration(morningSeconds) : '—');
    writeText(afternoon, afternoonSeconds > 0 ? formatDuration(afternoonSeconds) : '—');
    writeText(total, valid ? formatDuration(morningSeconds + afternoonSeconds) : '等待校准');
  }

  return Object.freeze({ update });
}
