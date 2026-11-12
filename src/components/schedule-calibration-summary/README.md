# 工作时间工时摘要

`view.html` 集中维护「每日工时」「上午」「下午」三个标题与读数，三个片段仍分别位于原节点位置。`style.css` 中的专属样式按原顺序放回页面；共用的面板、主题、高对比度与滚轮样式不移动。

`createScheduleCalibrationSummary` 接收三个现有节点和 `writeText`。`update(morningSeconds, afternoonSeconds, valid)` 使用宿主算出的时长和有效状态，按原规则显示小时、分钟、占位或「等待校准」。不新增容器、节点查找、事件、计时器或状态。

`SettingsUI` 继续负责时间解析、区间校验、错误标记、滚轮和保存。读屏用的播报区仍由宿主维护，读取原来的三个读数节点；播报文案、合并等待和清理条件保持不变。

源码契约见 `tests/source-assembly.test.mjs`，工时与布局对照见 `tests/settings-refinements.spec.js`，播报及无效草稿回归见 `tests/settings-input-safety.spec.js`。
