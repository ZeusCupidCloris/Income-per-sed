# 工作日历状态

`view.html` 维护「工作日历」标题、来源标记、覆盖年份与结果提示，片段在构建时放回原位置。专属样式在 `style.css`；共用面板、日历按钮和文件输入仍在页面。

`createCalendarStatus({ root, writeText })` 只查找本日历区域的三个显示节点。`update(calendar, result)` 接收宿主已校验的日历，呈现单年或跨年范围、「内置／已导入」和原辅助说明；由 `result` 选择操作提示，未传时清空提示。

`setStatus(result, detail)` 只更新结果提示。导入、导出出错时用这个入口，已预览的来源和覆盖范围不会被重置。无障碍提示仍使用原 `role="status"` 和 `aria-live="polite"`。

组件不判断是否可导入、何时生效或是否已保存，也不读取、写入或回滚存储。导入校验、导出、草稿恢复、保存与回滚仍走原宿主流程。源码契约见 `tests/source-assembly.test.mjs`；界面、日历预览和失败回滚见 `tests/settings-refinements.spec.js`。
