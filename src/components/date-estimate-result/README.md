# 日期估算结果

改日期、截至时间、主金额和三项辅助读数的结构，查看 `view.html`；改结果区的字号、间距、窄屏排版或高对比度边线，查看 `style.css`。片段仍在原级联位置展开，共享文字、表单、滚轮和设置面板样式留在 `src/page.html`。

`index.js` 只呈现宿主提供的六项已格式化文字：`dateLabel`、`stateLabel`、`income`、`work`、`daily`、`month`。不解析日期、不取当前时间、不计算工资，也不读取或保存设置。

- `mount()`：只查找本根节点中的读数，重复调用不重复挂载。
- `update(values)`：通过注入的原文字写入方法更新六项读数，再显示结果。
- `clear()`：隐藏结果，不清除原读数；输入变化和错误处理仍由宿主协调。
- `destroy()`：释放节点引用，之后的更新和隐藏不再写入；允许重新挂载。

日期选择、有效性检查、错误提示、计薪公式和保存逻辑继续在 `src/page.html` 的 `HistoryDateReview` 中维护。`data-private-readout`、标题关联和原 DOM 标识保持不变，不另造缓存、监听或时钟。

运行 `npm run release:prepare` 生成独立 HTML；`tests/source-assembly.test.mjs` 检查组件边界与生命周期，`tests/date-estimate-result.spec.js` 检查两份实际网页的结果、草稿与布局。离线与备份沿用原用例。
