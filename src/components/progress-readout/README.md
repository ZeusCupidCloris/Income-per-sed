# 工作进度读数

- 改标题、百分比、剩余时长的结构：`view.html`；改专属字号、间距和窄屏排版：`style.css`。共享主题、卡壳、悬停反馈和时间轴样式仍在 `src/page.html`。
- 改班次文案、历史日期、百分比及对应无障碍读数：`index.js`。页面提供时间状态和已计算的比例，不在组件内重算工时或开启定时器。
- `bindEdit` 通过已有激活逻辑请求打开工作时间设置；重新绑定或销毁会释放监听。设置内容、保存和焦点交接仍归页面协调。
- 时间轴、午休拨钮路径、恢复和跨日动画仍在 `src/page.html`。动画在原有时刻传入读数，午夜收尾仍直接归零。

修改后用 `npm run release:prepare` 生成单 HTML，再运行 `tests/progress-readout-contract.spec.js`。
