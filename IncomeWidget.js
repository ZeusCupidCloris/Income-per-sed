// Income-per-sed · Scriptable Widget
// Adapted from Pocket Watch v35 / R35 mobile-history-sheet build for iPhone widgets.
// Place this file and Income-per-sed-Push.html in iCloud Drive/Scriptable.

const APP = {
  version: "2.5.0",
  timeZone: "Asia/Shanghai",
  settingsFile: "IncomeWidget-settings.json",
  htmlCandidates: [
    "Income-per-sed-Push.html"
  ],
  settingsSchema: 3,
  transactionSchema: 2,
  sourceBuild: "pocket-watch-v35-r41-widget-adaptive-hierarchy-2026-08-01",
  refreshMinutes: {
    working: 1,
    transition: 3,
    idle: 12
  },
  design: "size-specific-income-hierarchy-r7"
}

const DEFAULTS = {
  monthlyIncome: 7296.70,
  dailyIncome: 336.77,
  annualWorkDays: 260,
  incomeMode: "fixed-monthly", // fixed-monthly | annual-average | fixed-daily
  schedule: {
    morningStart: "09:00",
    morningEnd: "11:30",
    afternoonStart: "13:30",
    afternoonEnd: "17:30"
  }
}

const SPECIAL_WORKDAYS = new Set([
  "2026-01-04", "2026-02-14", "2026-02-28",
  "2026-05-09", "2026-09-20", "2026-10-10"
])

const HOLIDAYS = new Set([
  "2026-01-01", "2026-01-02", "2026-01-03",
  "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-18",
  "2026-02-19", "2026-02-20", "2026-02-21", "2026-02-22", "2026-02-23",
  "2026-04-04", "2026-04-05", "2026-04-06",
  "2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05",
  "2026-06-19", "2026-06-20", "2026-06-21",
  "2026-09-25", "2026-09-26", "2026-09-27",
  "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
  "2026-10-05", "2026-10-06", "2026-10-07"
])

const C = {
  bg: Color.dynamic(new Color("#EEE8E0"), new Color("#20211F")),
  bg2: Color.dynamic(new Color("#FBF8F3"), new Color("#2C2D29")),
  bg3: Color.dynamic(new Color("#E7DED4"), new Color("#181A18")),
  primary: Color.dynamic(new Color("#292622"), new Color("#F3EEE7")),
  secondary: Color.dynamic(new Color("#615C55"), new Color("#CBC4BA")),
  muted: Color.dynamic(new Color("#858078"), new Color("#99938A")),
  green: Color.dynamic(new Color("#617C69"), new Color("#8EA391")),
  warm: Color.dynamic(new Color("#9B7657"), new Color("#C59B77")),
  rose: Color.dynamic(new Color("#A96F68"), new Color("#CA9189")),
  blue: Color.dynamic(new Color("#718392"), new Color("#9BABB8")),
  track: Color.dynamic(new Color("#D3CCC3", 0.82), new Color("#4A4B46", 0.86)),
  hairline: Color.dynamic(new Color("#C9C1B7", 0.72), new Color("#555650", 0.72))
}

const LAYOUT = {
  small: {
    progressWidth: 126
  },
  medium: {
    dialSize: 82
  },
  large: {
    dialSize: 104,
    contentWidth: 298,
    metricWidth: 92
  }
}

async function main() {
  const action = (args.queryParameters && args.queryParameters.action) || ""

  if (!config.runsInWidget) {
    if (action === "open") return await openFullPage()
    if (action === "settings") return await editSettings()
    return await showMenu()
  }

  const settings = loadSettings()
  const now = new Date()
  const data = calculateDashboard(settings, now)
  const widget = createWidget(data, settings, config.widgetFamily || "medium")
  widget.url = runURL("open")
  widget.refreshAfterDate = nextRefreshDate(data, now)
  Script.setWidget(widget)
  Script.complete()
}

function settingsFM() {
  return FileManager.local()
}

function htmlFM() {
  return FileManager.iCloud()
}

function settingsPath() {
  return settingsFM().joinPath(settingsFM().documentsDirectory(), APP.settingsFile)
}

function loadSettings() {
  const manager = settingsFM()
  const path = settingsPath()
  try {
    if (!manager.fileExists(path)) return deepCopy(DEFAULTS)
    if (!manager.isFileDownloaded(path)) manager.downloadFileFromiCloud(path)
    const parsed = JSON.parse(manager.readString(path))
    return normalizeSettings(parsed)
  } catch (error) {
    console.log(`设置读取失败，使用默认值：${error}`)
    return deepCopy(DEFAULTS)
  }
}

function saveSettings(value) {
  settingsFM().writeString(settingsPath(), JSON.stringify(normalizeSettings(value), null, 2))
}

function normalizeSettings(value = {}) {
  const schedule = value.schedule || {}
  const modes = ["fixed-monthly", "annual-average", "fixed-daily"]
  const normalized = {
    monthlyIncome: finite(value.monthlyIncome, DEFAULTS.monthlyIncome, 0.01, 1e9),
    dailyIncome: finite(value.dailyIncome, DEFAULTS.dailyIncome, 0.01, 1e8),
    annualWorkDays: Math.round(finite(value.annualWorkDays, DEFAULTS.annualWorkDays, 1, 366)),
    incomeMode: modes.includes(value.incomeMode) ? value.incomeMode : DEFAULTS.incomeMode,
    schedule: {
      morningStart: validClock(schedule.morningStart) ? schedule.morningStart : DEFAULTS.schedule.morningStart,
      morningEnd: validClock(schedule.morningEnd) ? schedule.morningEnd : DEFAULTS.schedule.morningEnd,
      afternoonStart: validClock(schedule.afternoonStart) ? schedule.afternoonStart : DEFAULTS.schedule.afternoonStart,
      afternoonEnd: validClock(schedule.afternoonEnd) ? schedule.afternoonEnd : DEFAULTS.schedule.afternoonEnd
    }
  }
  const p = Object.values(normalized.schedule).map(clockToSeconds)
  if (!(p[0] < p[1] && p[1] <= p[2] && p[2] < p[3])) normalized.schedule = deepCopy(DEFAULTS.schedule)
  return normalized
}

function validateSettingsDraft(value = {}) {
  const errors = []
  const monthlyIncome = Number(value.monthlyIncome)
  const dailyIncome = Number(value.dailyIncome)
  const annualWorkDays = Number(value.annualWorkDays)
  const schedule = value.schedule || {}

  if (value.incomeMode === "fixed-daily") {
    if (!Number.isFinite(dailyIncome) || dailyIncome < 0.01 || dailyIncome > 1e8 || !hasCentPrecision(value.dailyIncome)) {
      errors.push("固定日薪应为 ¥0.01～¥100,000,000.00。")
    }
  } else if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0.01 || monthlyIncome > 1e9 || !hasCentPrecision(value.monthlyIncome)) {
    errors.push("每月收入应为 ¥0.01～¥1,000,000,000.00。")
  }

  if (!Number.isInteger(annualWorkDays) || annualWorkDays < 1 || annualWorkDays > 366) {
    errors.push("全年工作日应为 1～366 的整数。")
  }

  const clocks = [
    schedule.morningStart,
    schedule.morningEnd,
    schedule.afternoonStart,
    schedule.afternoonEnd
  ]
  if (!clocks.every(validClock)) {
    errors.push("工作时间应使用 HH:mm 格式。")
  } else {
    const points = clocks.map(clockToSeconds)
    if (!(points[0] < points[1] && points[1] <= points[2] && points[2] < points[3])) {
      errors.push("时间顺序应为：上午开始 ＜ 上午结束 ≤ 下午开始 ＜ 下午结束。")
    }
  }

  return errors
}

function hasCentPrecision(value) {
  return /^\d+(?:\.\d{1,2})?$/.test(String(value).trim())
}

function finite(value, fallback, min, max) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value))
}

function validClock(value) {
  return typeof value === "string" && /^([01]?\d|2[0-3]):[0-5]\d$/.test(value)
}

function clockToSeconds(value) {
  const [h, m] = value.split(":").map(Number)
  return h * 3600 + m * 60
}

function businessParts(date) {
  const formatter = new DateFormatter()
  formatter.locale = "en_US_POSIX"
  formatter.timeZone = APP.timeZone
  formatter.dateFormat = "yyyy-MM-dd-HH-mm-ss"
  const raw = formatter.string(date)
  const match = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/.exec(raw)
  if (!match) throw new Error(`无法读取北京时间：${raw}`)
  const [, y, mo, d, h, mi, s] = match
  return {
    year: Number(y), month: Number(mo), day: Number(d),
    hour: Number(h), minute: Number(mi), second: Number(s),
    dateKey: `${y}-${mo}-${d}`,
    clock: `${h}:${mi}`,
    secondsOfDay: Number(h) * 3600 + Number(mi) * 60 + Number(s)
  }
}

function weekday(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

function isWorkdayKey(key) {
  if (SPECIAL_WORKDAYS.has(key)) return true
  if (HOLIDAYS.has(key)) return false
  const [y, m, d] = key.split("-").map(Number)
  const w = weekday(y, m, d)
  return w !== 0 && w !== 6
}

function monthWorkdays(year, month) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  let count = 0
  for (let day = 1; day <= days; day++) {
    const key = `${year}-${pad(month)}-${pad(day)}`
    if (isWorkdayKey(key)) count++
  }
  return count
}

function completedWorkdaysBefore(year, month, day) {
  let count = 0
  for (let d = 1; d < day; d++) {
    const key = `${year}-${pad(month)}-${pad(d)}`
    if (isWorkdayKey(key)) count++
  }
  return count
}

function calculateDashboard(settings, now) {
  const p = businessParts(now)
  const sch = settings.schedule
  const ms = clockToSeconds(sch.morningStart)
  const me = clockToSeconds(sch.morningEnd)
  const as = clockToSeconds(sch.afternoonStart)
  const ae = clockToSeconds(sch.afternoonEnd)
  const morningSeconds = me - ms
  const afternoonSeconds = ae - as
  const totalWorkSeconds = morningSeconds + afternoonSeconds
  const workHours = totalWorkSeconds / 3600
  const workdays = monthWorkdays(p.year, p.month)

  let daily = 0
  let monthProjection = 0
  let annualProjection = 0
  if (settings.incomeMode === "fixed-monthly") {
    daily = settings.monthlyIncome / Math.max(1, workdays)
    monthProjection = settings.monthlyIncome
    annualProjection = settings.monthlyIncome * 12
  } else if (settings.incomeMode === "annual-average") {
    annualProjection = settings.monthlyIncome * 12
    daily = annualProjection / Math.max(1, settings.annualWorkDays)
    monthProjection = daily * workdays
  } else {
    daily = settings.dailyIncome
    monthProjection = daily * workdays
    annualProjection = daily * settings.annualWorkDays
  }

  const hourly = daily / workHours
  const secondly = hourly / 3600
  const workday = isWorkdayKey(p.dateKey)
  let elapsed = 0
  let status = "今日休息"
  let statusKey = "day-off"

  if (workday) {
    if (p.secondsOfDay < ms) {
      status = "尚未开始"
      statusKey = "not-started"
    } else if (p.secondsOfDay < me) {
      elapsed = p.secondsOfDay - ms
      status = "工作中"
      statusKey = "working"
    } else if (p.secondsOfDay < as) {
      elapsed = morningSeconds
      status = "午休中"
      statusKey = "break"
    } else if (p.secondsOfDay < ae) {
      elapsed = morningSeconds + p.secondsOfDay - as
      status = "工作中"
      statusKey = "working"
    } else {
      elapsed = totalWorkSeconds
      status = "今日完成"
      statusKey = "ended"
    }
  }

  const progress = workday ? clamp(elapsed / totalWorkSeconds, 0, 1) : 0
  const todayIncome = secondly * elapsed
  const prior = completedWorkdaysBefore(p.year, p.month, p.day)
  const monthEarned = daily * prior + todayIncome
  const monthProgress = clamp(monthEarned / Math.max(0.01, monthProjection), 0, 1)
  const nextAction = resolveNextAction(p, sch, workday, statusKey)

  return {
    ...p,
    workday,
    status,
    statusKey,
    progress,
    elapsed,
    daily,
    hourly,
    secondly,
    todayIncome,
    monthEarned,
    monthProjection,
    monthProgress,
    annualProjection,
    workdays,
    workHours,
    schedule: sch,
    nextAction,
    updatedLabel: `截至 ${p.clock}`,
    goalLabel: workday ? "今日目标" : "工作日目标",
    modeLabel: modeLabel(settings.incomeMode)
  }
}

function nextRefreshDate(data, now = new Date()) {
  const minutes = data.statusKey === "working"
    ? APP.refreshMinutes.working
    : (["not-started", "break"].includes(data.statusKey)
      ? APP.refreshMinutes.transition
      : APP.refreshMinutes.idle)
  let delayMs = minutes * 60 * 1000

  if (validClock(data.nextAction && data.nextAction.value)) {
    const boundarySeconds = clockToSeconds(data.nextAction.value)
    const untilBoundaryMs = (boundarySeconds - data.secondsOfDay) * 1000
    if (untilBoundaryMs > 0) {
      delayMs = Math.min(delayMs, untilBoundaryMs + 1500)
    }
  }

  return new Date(now.getTime() + Math.max(60 * 1000, delayMs))
}

function modeLabel(mode) {
  if (mode === "annual-average") return "全年均摊"
  if (mode === "fixed-daily") return "固定日薪"
  return "固定月薪"
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function pad(n) {
  return String(n).padStart(2, "0")
}

function nextWorkday(year, month, day) {
  for (let offset = 1; offset <= 370; offset++) {
    const date = new Date(Date.UTC(year, month - 1, day + offset))
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth() + 1
    const d = date.getUTCDate()
    const key = `${y}-${pad(m)}-${pad(d)}`
    if (isWorkdayKey(key)) {
      return { year: y, month: m, day: d, dateKey: key, weekday: date.getUTCDay() }
    }
  }
  return null
}

function shortWorkdayLabel(next, current) {
  if (!next) return "下次工作日"
  const today = new Date(Date.UTC(current.year, current.month - 1, current.day))
  const target = new Date(Date.UTC(next.year, next.month - 1, next.day))
  const diff = Math.round((target - today) / 86400000)
  if (diff === 1) return "明日"
  const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  if (diff <= 7) return names[next.weekday]
  return `${next.month}/${next.day}`
}

function resolveNextAction(parts, schedule, workday, statusKey) {
  if (workday && statusKey === "not-started") {
    return { label: "开始工作", value: schedule.morningStart }
  }
  if (workday && statusKey === "working" && parts.secondsOfDay < clockToSeconds(schedule.morningEnd)) {
    return { label: "进入午休", value: schedule.morningEnd }
  }
  if (workday && statusKey === "break") {
    return { label: "继续工作", value: schedule.afternoonStart }
  }
  if (workday && statusKey === "working") {
    return { label: "今日下班", value: schedule.afternoonEnd }
  }
  const next = nextWorkday(parts.year, parts.month, parts.day)
  return {
    label: "下次上班",
    value: `${shortWorkdayLabel(next, parts)} ${schedule.morningStart}`
  }
}

function statusColor(key) {
  if (key === "working") return C.green
  if (key === "break") return C.warm
  if (key === "ended") return C.rose
  if (key === "not-started") return C.blue
  return C.muted
}

function createWidget(data, settings, family) {
  if (family === "accessoryInline") return accessoryInline(data)
  if (family === "accessoryCircular") return accessoryCircular(data)
  if (family === "accessoryRectangular") return accessoryRectangular(data)
  if (family === "small") return smallWidget(data)
  if (family === "large") return largeWidget(data)
  return mediumWidget(data)
}

function baseWidget(data) {
  const widget = new ListWidget()
  const gradient = new LinearGradient()
  gradient.startPoint = new Point(0.08, 0)
  gradient.endPoint = new Point(0.94, 1)
  gradient.locations = [0, 0.58, 1]
  gradient.colors = [C.bg2, C.bg, C.bg3]
  widget.backgroundGradient = gradient
  widget.spacing = 0
  return widget
}

function addStatusHeader(widget, data, options = {}) {
  const compact = Boolean(options.compact)
  const showUpdated = options.showUpdated !== false
  const row = widget.addStack()
  row.centerAlignContent()

  const dot = row.addText("●")
  dot.font = Font.systemFont(compact ? 7 : 8)
  dot.textColor = statusColor(data.statusKey)

  row.addSpacer(6)
  const status = row.addText(data.status)
  status.font = Font.mediumSystemFont(compact ? 10 : 11)
  status.textColor = C.secondary
  status.lineLimit = 1

  row.addSpacer()
  const meta = row.addText(showUpdated ? data.updatedLabel : `${Math.round(effectiveWidgetProgress(data) * 100)}%`)
  meta.font = showUpdated
    ? Font.mediumMonospacedSystemFont(compact ? 9 : 9)
    : Font.semiboldRoundedSystemFont(compact ? 11 : 11)
  meta.textColor = C.muted
  meta.minimumScaleFactor = 0.86
  meta.lineLimit = 1
  return row
}

function effectiveWidgetProgress(data) {
  return data.statusKey === "day-off" ? data.monthProgress : data.progress
}

function primaryPresentation(data) {
  if (data.statusKey === "not-started") {
    return {
      label: "今日目标",
      value: data.daily,
      detail: `${data.nextAction.value} ${data.nextAction.label}`
    }
  }
  if (data.statusKey === "break") {
    return {
      label: "上午已收入",
      value: data.todayIncome,
      detail: `${data.nextAction.value} ${data.nextAction.label}`
    }
  }
  if (data.statusKey === "ended") {
    return {
      label: "今日最终收入",
      value: data.todayIncome,
      detail: "今日工作已完成"
    }
  }
  if (data.statusKey === "day-off") {
    return {
      label: "本月累计",
      value: data.monthEarned,
      detail: `${data.nextAction.value} ${data.nextAction.label}`
    }
  }
  return {
    label: "今日收入",
    value: data.todayIncome,
    detail: `${formatCurrency(data.secondly, 4)} / 秒`
  }
}

function addPrimaryAmount(parent, data, size, options = {}) {
  const presentation = primaryPresentation(data)
  const showDetail = options.showDetail !== false
  const compactAmount = Boolean(options.compactAmount)
  const centered = Boolean(options.centered)

  const label = parent.addText(presentation.label)
  label.font = Font.mediumSystemFont(options.labelSize || 10)
  label.textColor = C.muted
  label.lineLimit = 1
  if (centered) label.centerAlignText()

  parent.addSpacer(2)
  const amount = parent.addText(compactAmount
    ? formatCompactCurrency(presentation.value)
    : formatCurrency(presentation.value))
  amount.font = Font.semiboldRoundedSystemFont(size)
  amount.textColor = C.primary
  amount.minimumScaleFactor = 0.68
  amount.lineLimit = 1
  if (centered) amount.centerAlignText()

  if (showDetail) {
    parent.addSpacer(3)
    const detail = parent.addText(presentation.detail)
    detail.font = data.statusKey === "working"
      ? Font.mediumMonospacedSystemFont(10)
      : Font.mediumSystemFont(10)
    detail.textColor = C.secondary
    detail.minimumScaleFactor = 0.76
    detail.lineLimit = 1
    if (centered) detail.centerAlignText()
  }
}

function addContextFooter(parent, data) {
  const row = parent.addStack()
  row.centerAlignContent()

  const nextColumn = row.addStack()
  nextColumn.layoutVertically()
  const nextLabel = nextColumn.addText("下一节点")
  nextLabel.font = Font.mediumSystemFont(9)
  nextLabel.textColor = C.muted
  nextLabel.lineLimit = 1
  nextColumn.addSpacer(2)
  const nextValue = nextColumn.addText(`${data.nextAction.value} ${data.nextAction.label}`)
  nextValue.font = Font.semiboldSystemFont(11)
  nextValue.textColor = C.secondary
  nextValue.minimumScaleFactor = 0.72
  nextValue.lineLimit = 1

  row.addSpacer()

  const goalColumn = row.addStack()
  goalColumn.layoutVertically()
  const goalLabel = goalColumn.addText(data.goalLabel)
  goalLabel.font = Font.mediumSystemFont(9)
  goalLabel.textColor = C.muted
  goalLabel.rightAlignText()
  goalLabel.lineLimit = 1
  goalColumn.addSpacer(2)
  const goalValue = goalColumn.addText(formatCurrency(data.daily))
  goalValue.font = Font.semiboldMonospacedSystemFont(11)
  goalValue.textColor = C.secondary
  goalValue.minimumScaleFactor = 0.72
  goalValue.rightAlignText()
  goalValue.lineLimit = 1
}

function formatElapsed(seconds) {
  const totalMinutes = Math.max(0, Math.floor(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function currentMonthWorkday(data) {
  return Math.min(
    data.workdays,
    Math.max(0, completedWorkdaysBefore(data.year, data.month, data.day) + (data.workday ? 1 : 0))
  )
}

function addLargeMetrics(parent, data) {
  const row = parent.addStack()
  row.centerAlignContent()

  const metrics = [
    { label: "下一节点", value: `${data.nextAction.value} ${data.nextAction.label}`, align: "left" },
    { label: data.goalLabel, value: formatCurrency(data.daily), align: "center" },
    { label: "已工作", value: formatElapsed(data.elapsed), align: "right" }
  ]

  metrics.forEach((metric, index) => {
    const column = row.addStack()
    column.layoutVertically()
    column.size = new Size(LAYOUT.large.metricWidth, 31)

    const label = column.addText(metric.label)
    label.font = Font.mediumSystemFont(9)
    label.textColor = C.muted
    label.lineLimit = 1

    column.addSpacer(2)
    const value = column.addText(metric.value)
    value.font = metric.label === data.goalLabel
      ? Font.semiboldMonospacedSystemFont(10)
      : Font.semiboldSystemFont(10)
    value.textColor = C.secondary
    value.minimumScaleFactor = 0.68
    value.lineLimit = 1

    if (metric.align === "center") {
      label.centerAlignText()
      value.centerAlignText()
    } else if (metric.align === "right") {
      label.rightAlignText()
      value.rightAlignText()
    }

    if (index < metrics.length - 1) row.addSpacer(11)
  })
}

function smallWidget(data) {
  const widget = baseWidget(data)
  widget.setPadding(15, 15, 14, 15)
  addStatusHeader(widget, data, { compact: true, showUpdated: false })
  widget.addSpacer(11)

  const value = widget.addStack()
  value.layoutVertically()
  value.centerAlignContent()
  addPrimaryAmount(value, data, 31, {
    showDetail: false,
    compactAmount: true,
    centered: true,
    labelSize: 10
  })

  widget.addSpacer(10)
  addProgress(widget, effectiveWidgetProgress(data), LAYOUT.small.progressWidth, 3, statusColor(data.statusKey))
  widget.addSpacer()

  const next = widget.addText(`${data.nextAction.value} · ${data.nextAction.label}`)
  next.font = Font.semiboldSystemFont(10)
  next.textColor = C.secondary
  next.minimumScaleFactor = 0.72
  next.lineLimit = 1
  next.centerAlignText()
  return widget
}

function mediumWidget(data) {
  const widget = baseWidget(data)
  widget.setPadding(15, 16, 14, 16)
  addStatusHeader(widget, data)
  widget.addSpacer(8)

  const hero = widget.addStack()
  hero.centerAlignContent()

  const dial = hero.addImage(drawDial(data.progress, data.statusKey, 204))
  dial.imageSize = new Size(LAYOUT.medium.dialSize, LAYOUT.medium.dialSize)

  hero.addSpacer(16)
  const value = hero.addStack()
  value.layoutVertically()
  addPrimaryAmount(value, data, 34, { showDetail: true })

  widget.addSpacer(8)
  addContextFooter(widget, data)
  return widget
}

function largeWidget(data) {
  const widget = baseWidget(data)
  widget.setPadding(17, 17, 16, 17)
  addStatusHeader(widget, data)
  widget.addSpacer(12)

  const hero = widget.addStack()
  hero.centerAlignContent()

  const dial = hero.addImage(drawDial(data.progress, data.statusKey, 232))
  dial.imageSize = new Size(LAYOUT.large.dialSize, LAYOUT.large.dialSize)

  hero.addSpacer(20)
  const value = hero.addStack()
  value.layoutVertically()
  addPrimaryAmount(value, data, 40, { showDetail: true })

  widget.addSpacer(12)
  addLargeMetrics(widget, data)
  widget.addSpacer(10)
  addDivider(widget, LAYOUT.large.contentWidth)
  widget.addSpacer(8)

  const monthSummary = widget.addStack()
  monthSummary.centerAlignContent()
  const monthText = monthSummary.addText(`本月累计 ${formatCurrency(data.monthEarned)}`)
  monthText.font = Font.semiboldRoundedSystemFont(14)
  monthText.textColor = C.secondary
  monthText.minimumScaleFactor = 0.72
  monthText.lineLimit = 1
  monthSummary.addSpacer()
  const monthPct = monthSummary.addText(`${Math.round(data.monthProgress * 100)}%`)
  monthPct.font = Font.semiboldRoundedSystemFont(12)
  monthPct.textColor = C.muted
  monthPct.lineLimit = 1

  widget.addSpacer(6)
  addProgress(widget, data.monthProgress, LAYOUT.large.contentWidth, 3, C.warm)
  widget.addSpacer(6)

  const workdayText = widget.addText(`第 ${currentMonthWorkday(data)} / ${data.workdays} 个工作日`)
  workdayText.font = Font.mediumSystemFont(9)
  workdayText.textColor = C.muted
  workdayText.lineLimit = 1
  return widget
}

function accessoryInline(data) {
  const widget = new ListWidget()
  const text = widget.addText(`今日 ${formatCompactCurrency(data.todayIncome)} · ${Math.round(data.progress * 100)}%`)
  text.font = Font.semiboldRoundedSystemFont(12)
  return widget
}

function accessoryCircular(data) {
  const widget = new ListWidget()
  widget.addAccessoryWidgetBackground = true
  const stack = widget.addStack()
  stack.layoutVertically()
  stack.centerAlignContent()
  const amount = stack.addText(formatCompactCurrency(data.todayIncome))
  amount.font = Font.boldRoundedSystemFont(14)
  amount.centerAlignText()
  const pct = stack.addText(`${Math.round(data.progress * 100)}%`)
  pct.font = Font.mediumRoundedSystemFont(10)
  pct.centerAlignText()
  return widget
}

function accessoryRectangular(data) {
  const widget = new ListWidget()
  widget.addAccessoryWidgetBackground = true
  const amount = widget.addText(`今日 ${formatCurrency(data.todayIncome)}`)
  amount.font = Font.semiboldRoundedSystemFont(13)
  amount.minimumScaleFactor = 0.72
  amount.lineLimit = 1
  const context = widget.addText(`${Math.round(data.progress * 100)}% · ${data.nextAction.value} ${data.nextAction.label}`)
  context.font = Font.mediumSystemFont(10)
  context.minimumScaleFactor = 0.68
  context.lineLimit = 1
  return widget
}

function addDivider(parent, width = LAYOUT.large.contentWidth) {
  const line = parent.addStack()
  line.size = new Size(width, 1)
  line.backgroundColor = C.hairline
}

function addProgress(parent, progress, width, height, color = C.green) {
  const track = parent.addStack()
  track.size = new Size(width, height)
  track.backgroundColor = C.track
  track.cornerRadius = height / 2

  const fill = track.addStack()
  fill.size = new Size(Math.max(height, width * clamp(progress, 0, 1)), height)
  fill.backgroundColor = color
  fill.cornerRadius = height / 2
  track.addSpacer()
}

function drawDial(progress, statusKey, size, showValue = true) {
  const ctx = new DrawContext()
  ctx.size = new Size(size, size)
  ctx.opaque = false
  ctx.respectScreenScale = true

  const center = new Point(size / 2, size / 2)
  const outer = new Rect(2, 2, size - 4, size - 4)
  const bezel = new Rect(6, 6, size - 12, size - 12)
  const face = new Rect(11, 11, size - 22, size - 22)

  ctx.setFillColor(new Color("#A8A097", 0.90))
  ctx.fillEllipse(outer)
  ctx.setStrokeColor(new Color("#5C5852", 0.68))
  ctx.setLineWidth(2)
  ctx.strokeEllipse(outer)

  ctx.setFillColor(new Color("#D4CDC4", 0.92))
  ctx.fillEllipse(bezel)
  ctx.setStrokeColor(new Color("#F7F2EB", 0.72))
  ctx.setLineWidth(1.4)
  ctx.strokeEllipse(bezel)

  ctx.setFillColor(new Color("#272824"))
  ctx.fillEllipse(face)
  ctx.setStrokeColor(new Color("#131411", 0.82))
  ctx.setLineWidth(2.4)
  ctx.strokeEllipse(face)

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2
    const major = i % 5 === 0
    const r1 = size * (major ? 0.340 : 0.382)
    const r2 = size * 0.414
    const path = new Path()
    path.move(pointOnCircle(center, r1, angle))
    path.addLine(pointOnCircle(center, r2, angle))
    ctx.addPath(path)
    ctx.setStrokeColor(new Color(major ? "#F1EAE1" : "#A9A49C", major ? 0.80 : 0.40))
    ctx.setLineWidth(major ? 2.4 : 1)
    ctx.strokePath()
  }

  const ringPath = new Path()
  const steps = Math.max(1, Math.round(clamp(progress, 0, 1) * 120))
  for (let i = 0; i <= steps; i++) {
    const angle = (i / 120) * Math.PI * 2 - Math.PI / 2
    const point = pointOnCircle(center, size * 0.445, angle)
    if (i === 0) ringPath.move(point)
    else ringPath.addLine(point)
  }
  ctx.addPath(ringPath)
  ctx.setStrokeColor(dialAccentColor(statusKey))
  ctx.setLineWidth(3.4)
  ctx.strokePath()

  const angle = clamp(progress, 0, 1) * Math.PI * 2 - Math.PI / 2
  const hand = new Path()
  hand.move(pointOnCircle(center, size * 0.095, angle + Math.PI))
  hand.addLine(pointOnCircle(center, size * 0.292, angle))
  ctx.addPath(hand)
  ctx.setStrokeColor(new Color("#E85F32"))
  ctx.setLineWidth(3.1)
  ctx.strokePath()

  const hubOuter = size * 0.068
  const hubInner = size * 0.034
  ctx.setFillColor(new Color("#B9B1A8"))
  ctx.fillEllipse(new Rect(center.x - hubOuter, center.y - hubOuter, hubOuter * 2, hubOuter * 2))
  ctx.setFillColor(new Color("#3A3631"))
  ctx.fillEllipse(new Rect(center.x - hubInner, center.y - hubInner, hubInner * 2, hubInner * 2))
  ctx.setFillColor(new Color("#E85F32"))
  ctx.fillEllipse(new Rect(center.x - hubInner * 0.48, center.y - hubInner * 0.48, hubInner * 0.96, hubInner * 0.96))

  if (showValue) {
    ctx.setTextAlignedCenter()
    ctx.setFont(Font.semiboldRoundedSystemFont(size * 0.067))
    ctx.setTextColor(new Color("#D8D1C8", 0.92))
    ctx.drawTextInRect(`${Math.round(progress * 100)}%`, new Rect(0, size * 0.665, size, size * 0.12))
  }

  return ctx.getImage()
}

function dialAccentColor(statusKey) {
  if (statusKey === "working") return new Color("#829B87", 0.94)
  if (statusKey === "break") return new Color("#B78E68", 0.94)
  if (statusKey === "ended") return new Color("#B87870", 0.92)
  if (statusKey === "not-started") return new Color("#7E909F", 0.92)
  return new Color("#938C83", 0.86)
}

function pointOnCircle(center, radius, angle) {
  return new Point(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius)
}

function formatCurrency(value, digits = 2) {
  const n = Number.isFinite(value) ? value : 0
  return `¥${n.toFixed(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}

function formatCompactCurrency(value) {
  const n = Number.isFinite(value) ? value : 0
  const absolute = Math.abs(n)
  if (absolute >= 100000000) return `¥${trimCompactDecimal(n / 100000000)}亿`
  if (absolute >= 10000) return `¥${trimCompactDecimal(n / 10000)}万`
  if (absolute >= 1000) return `¥${Math.round(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
  return `¥${n.toFixed(2)}`
}

function trimCompactDecimal(value) {
  return value.toFixed(1).replace(/\.0$/, "")
}

function runURL(action) {
  return `scriptable:///run/${encodeURIComponent(Script.name())}?action=${encodeURIComponent(action)}`
}

async function showMenu() {
  const menu = new Alert()
  menu.title = "Income-per-sed 小组件"
  menu.message = "iPhone 17 Pro 建议使用中号组件：只保留今日收入、工作进度与下一时间节点；大号额外显示本月进度。"
  menu.addAction("预览中号组件")
  menu.addAction("修改收入与工作时间")
  menu.addAction("打开完整 HTML 页面")
  menu.addCancelAction("取消")
  const index = await menu.presentSheet()
  if (index === 0) {
    const data = calculateDashboard(loadSettings(), new Date())
    await mediumWidget(data).presentMedium()
  } else if (index === 1) {
    await editSettings()
  } else if (index === 2) {
    await openFullPage()
  }
}

async function editSettings() {
  const current = loadSettings()
  const modeSheet = new Alert()
  modeSheet.title = "收入计算方式"
  modeSheet.addAction("固定月薪")
  modeSheet.addAction("全年均摊")
  modeSheet.addAction("固定日薪")
  modeSheet.addCancelAction("取消")
  const modeIndex = await modeSheet.presentSheet()
  if (modeIndex < 0) return
  current.incomeMode = ["fixed-monthly", "annual-average", "fixed-daily"][modeIndex]

  const income = new Alert()
  income.title = "收入设置"
  income.message = current.incomeMode === "fixed-daily"
    ? "填写固定日薪与全年工作日。"
    : "填写每月到手收入与全年工作日。"
  income.addTextField("每月到手收入", String(current.monthlyIncome))
  income.addTextField("固定日薪", String(current.dailyIncome))
  income.addTextField("全年工作日", String(current.annualWorkDays))
  income.addAction("下一步")
  income.addCancelAction("取消")
  const incomeResult = await income.presentAlert()
  if (incomeResult < 0) return
  const draft = {
    ...current,
    monthlyIncome: income.textFieldValue(0).trim(),
    dailyIncome: income.textFieldValue(1).trim(),
    annualWorkDays: income.textFieldValue(2).trim()
  }

  const schedule = new Alert()
  schedule.title = "工作时间"
  schedule.message = "格式为 HH:mm，例如 09:00。"
  schedule.addTextField("上午开始", current.schedule.morningStart)
  schedule.addTextField("上午结束", current.schedule.morningEnd)
  schedule.addTextField("下午开始", current.schedule.afternoonStart)
  schedule.addTextField("下午结束", current.schedule.afternoonEnd)
  schedule.addAction("保存")
  schedule.addCancelAction("取消")
  const scheduleResult = await schedule.presentAlert()
  if (scheduleResult < 0) return
  draft.schedule = {
    morningStart: schedule.textFieldValue(0),
    morningEnd: schedule.textFieldValue(1),
    afternoonStart: schedule.textFieldValue(2),
    afternoonEnd: schedule.textFieldValue(3)
  }

  const errors = validateSettingsDraft(draft)
  if (errors.length) {
    const invalid = new Alert()
    invalid.title = "设置未保存"
    invalid.message = errors.join("\n")
    invalid.addAction("返回修改")
    await invalid.presentAlert()
    return await editSettings()
  }

  const normalized = normalizeSettings({
    ...draft,
    monthlyIncome: Number(draft.monthlyIncome),
    dailyIncome: Number(draft.dailyIncome),
    annualWorkDays: Number(draft.annualWorkDays)
  })
  saveSettings(normalized)

  const done = new Alert()
  done.title = "已保存"
  done.message = "小组件会在 iOS 下次刷新时读取新设置。中号组件是当前主设计。"
  done.addAction("预览")
  done.addCancelAction("完成")
  const index = await done.presentAlert()
  if (index === 0) {
    const data = calculateDashboard(normalized, new Date())
    await mediumWidget(data).presentMedium()
  }
}

function findLatestHtmlPath(manager, base) {
  for (const name of APP.htmlCandidates) {
    const candidate = manager.joinPath(base, name)
    if (manager.fileExists(candidate)) return candidate
  }

  let names = []
  try {
    names = manager.listContents(base)
      .filter(name => /^Income-per-sed-Push(?:\(\d+\))?\.html$/i.test(name))
      .sort((left, right) => {
        const leftPath = manager.joinPath(base, left)
        const rightPath = manager.joinPath(base, right)
        const leftDate = manager.modificationDate(leftPath)
        const rightDate = manager.modificationDate(rightPath)
        return Number(rightDate || 0) - Number(leftDate || 0)
      })
  } catch (error) {
    console.log(`扫描 HTML 文件失败：${error}`)
  }
  return names.length ? manager.joinPath(base, names[0]) : null
}

function htmlSettingsBootstrapScript(settings) {
  const normalized = normalizeSettings(settings)
  const payloadJson = JSON.stringify(normalized)
  return `(() => {
    const keys = [
      'income-per-sed-settings',
      'income-per-sed-settings-transaction-temp',
      'income-per-sed-settings-last-good'
    ];
    const stable = value => {
      if (value === null || typeof value !== 'object') return JSON.stringify(value);
      if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
      return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
    };
    const checksumText = text => {
      let hash = 0x811c9dc5;
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
      }
      return hash.toString(16).padStart(8, '0');
    };
    const existing = keys.map(key => {
      try { return JSON.parse(localStorage.getItem(key) || 'null'); }
      catch (_) { return null; }
    }).filter(value => value && typeof value === 'object');
    const revision = Math.max(0, ...existing.map(value => Number(value.revision) || 0)) + 1;
    const writerTerm = Math.max(0, ...existing.map(value => Number(value.writerTerm) || 0));
    const payload = {
      schemaVersion: ${APP.settingsSchema},
      settings: ${payloadJson},
      meta: {
        savedAt: new Date().toISOString(),
        reason: 'scriptable-widget-sync',
        release: '${APP.sourceBuild}'
      }
    };
    const envelope = {
      kind: 'income-per-sed-transaction',
      envelopeVersion: ${APP.transactionSchema},
      store: 'settings',
      schemaVersion: ${APP.settingsSchema},
      revision,
      writerTerm,
      updatedAt: Date.now(),
      deleted: false,
      payload
    };
    envelope.checksum = checksumText(stable({
      kind: envelope.kind,
      envelopeVersion: envelope.envelopeVersion,
      store: envelope.store,
      schemaVersion: envelope.schemaVersion,
      revision: envelope.revision,
      writerTerm: envelope.writerTerm,
      updatedAt: envelope.updatedAt,
      payload: envelope.payload,
      deleted: false
    }));
    const raw = JSON.stringify(envelope);
    localStorage.setItem(keys[0], raw);
    localStorage.setItem(keys[2], raw);
    localStorage.removeItem(keys[1]);
    return { revision, checksum: envelope.checksum };
  })()`
}

function htmlSettingsReadbackScript() {
  return `(() => {
    const keys = [
      'income-per-sed-settings',
      'income-per-sed-settings-transaction-temp',
      'income-per-sed-settings-last-good'
    ];
    const values = keys.map((key, order) => {
      try {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        return value ? { value, order } : null;
      } catch (_) { return null; }
    }).filter(Boolean).sort((left, right) =>
      (Number(right.value.revision) || 0) - (Number(left.value.revision) || 0) ||
      (Number(right.value.writerTerm) || 0) - (Number(left.value.writerTerm) || 0) ||
      (Number(right.value.updatedAt) || 0) - (Number(left.value.updatedAt) || 0) ||
      left.order - right.order
    );
    for (const item of values) {
      const value = item.value;
      if (value.kind === 'income-per-sed-transaction') {
        if (value.deleted === true) continue;
        if (value.payload && value.payload.settings) return JSON.stringify(value.payload.settings);
      } else if (value.settings) {
        return JSON.stringify(value.settings);
      } else if (typeof value === 'object') {
        return JSON.stringify(value);
      }
    }
    return '';
  })()`
}

async function openFullPage() {
  const manager = htmlFM()
  const base = manager.documentsDirectory()
  const path = findLatestHtmlPath(manager, base)

  if (!path) {
    const alert = new Alert()
    alert.title = "未找到 HTML 文件"
    alert.message = "请把 Income-per-sed-Push.html 与本脚本一起放入“文件 → iCloud Drive → Scriptable”目录。"
    alert.addAction("知道了")
    await alert.presentAlert()
    return
  }

  if (!manager.isFileDownloaded(path)) await manager.downloadFileFromiCloud(path)
  const web = new WebView()
  await web.loadFile(path)

  // Sync through the same revisioned transaction envelope used by the HTML page.
  const current = loadSettings()
  try {
    await web.evaluateJavaScript(htmlSettingsBootstrapScript(current))
    await web.evaluateJavaScript(`location.reload(); true;`)
    await web.waitForLoad()
  } catch (error) {
    console.log(`HTML 设置注入失败：${error}`)
  }

  await web.present(true)

  try {
    const raw = await web.evaluateJavaScript(htmlSettingsReadbackScript())
    if (raw) {
      const candidate = JSON.parse(raw)
      if (candidate && typeof candidate === 'object') saveSettings(candidate)
    }
  } catch (error) {
    console.log(`HTML 设置回读失败：${error}`)
  }
}

await main()
