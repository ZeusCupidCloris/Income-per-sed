function createScheduleSettings({ calibration, calendarRoot, writeText }) {
/* @include components/schedule-calibration-summary/index.js */
/* @include components/calendar-status/index.js */

  const summary = createScheduleCalibrationSummary({ ...calibration, writeText });
  const calendar = createCalendarStatus({ root: calendarRoot, writeText });
  const importButton = calendarRoot.querySelector('#calendarImportButton');
  const importInput = calendarRoot.querySelector('#calendarImportInput');

  function bindCalendarActions(listen, { onExport, onImport, onReset }) {
    listen(calendarRoot.querySelector('#calendarExportButton'), 'click', onExport);
    listen(importButton, 'click', () => importInput.click());
    listen(importInput, 'change', () => onImport(importInput.files?.[0]));
    listen(calendarRoot.querySelector('#calendarResetButton'), 'click', onReset);
  }

  return Object.freeze({ summary, calendar, importButton, importInput, bindCalendarActions });
}
