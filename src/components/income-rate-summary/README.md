# 工资换算摘要

修改工资设置中的折合时薪、日均收入、日期与每日工时说明，查看本目录。`view.html` 管结构，`style.css` 管摘要专属排版；共享字体、设置面板、输入字段和主题仍在 `src/page.html`，本批不改变外观。

`index.js` 只接收三项已格式化文字：`context`、`daily`、`hourly`。使用宿主原文字写入方法，保持日期说明、日均收入、时薪的原写入顺序。输入无效时的“—”也由宿主传入，不在组件中判断工资是否有效。

- `mount()`：查找自身根节点内的三个读数，重复调用不会重复挂载。
- `update(values)`：更新已挂载的读数，不改面板可见性，也不改输入框。
- `destroy()`：清除读数节点引用，销毁后不再写入；允许重新挂载。

`src/page.html` 的 `renderIncomePreview` 和 `updateIncomeCalculation` 继续负责工资草稿、合法性检查、原计薪公式、格式化与本月工作日输入。工资方式切换、保存、取消和日期估算仍由原页面协调。组件不读取或保存设置，不引入监听、计时器或新的计算缓存。

运行 `npm run release:prepare` 生成两份独立 HTML。`tests/source-assembly.test.mjs` 检查显式依赖和组件生命周期；`tests/income-rate-summary.spec.js` 覆盖两份网页、两种宽度与深浅主题下的三种计薪方式、无效输入、取消和保存后刷新。
