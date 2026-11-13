function evaluateScheduleDraft(schedule, parseTime) {
  const morningStart = parseTime(schedule.morningStart);
  const morningEnd = parseTime(schedule.morningEnd);
  const afternoonStart = parseTime(schedule.afternoonStart);
  const afternoonEnd = parseTime(schedule.afternoonEnd);

  let violation = null;
  if (!(morningStart < morningEnd)) {
    violation = Object.freeze({ key: 'morningEnd', message: '上午结束必须晚于上午开始。' });
  } else if (!(morningEnd <= afternoonStart)) {
    violation = Object.freeze({ key: 'afternoonStart', message: '下午开始不能早于上午结束。' });
  } else if (!(afternoonStart < afternoonEnd)) {
    violation = Object.freeze({ key: 'afternoonEnd', message: '下午结束必须晚于下午开始。' });
  }

  return {
    morningSeconds: Math.max(0, morningEnd - morningStart),
    afternoonSeconds: Math.max(0, afternoonEnd - afternoonStart),
    violation
  };
}
