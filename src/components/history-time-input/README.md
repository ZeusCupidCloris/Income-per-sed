# 快速回溯的精确时间输入

- `view.html` 与 `style.css` 保留输入框、无障碍标签、错误下划线和窄屏排版。
- `index.js` 管理正在编辑的草稿、时间格式、提交阻断和 Esc 恢复。日期组合和可回溯上下限由页面传入；校验通过后才回调页面处理定位。
- 失焦目标为定位按钮时保留草稿，避免提交前的刷新覆盖输入。日期区仍负责定位表单与日期轮，表盘仍负责指针和拖动。
- 三个输入事件沿用页面的回溯监听作用域；组件没有独立时钟、播放状态或动画。

用 `npm run release:prepare` 生成两份单 HTML。输入、定位和返回实时的回归见 `tests/history-dial-refinement.spec.js` 与 `tests/daily-workflow.spec.js`。
