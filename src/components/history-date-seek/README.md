# 快速回溯的日期与定位

- `view.html` 包含表盘日期和定位表单两个片段；`style.css` 保留两处显示的专属排版及原级联顺序。
- `index.js` 负责日期轮初始化、未提交日期的保留、表单提交与错误显示。它使用页面传入的时间格式化、校验和定位回调，不计算可回溯范围。
- 表盘拖动、时间直接输入、播放、动画和共享滚轮仍在 `src/page.html`。日期收入估算继续使用原日期校验。

用 `npm run release:prepare` 生成单 HTML。日常流程见 `tests/daily-workflow.spec.js`，定位错误与表盘交互见 `tests/history-dial-refinement.spec.js`。
