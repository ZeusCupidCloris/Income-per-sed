# 月收入卡

负责月累计、月预计、工作日摘要、月份口径与日历覆盖提示。金额、工作日和恢复过程的插值仍由原主流程统一计算，本卡不读取设置或日历存储。

## 修改入口

| 任务 | 文件 |
| --- | --- |
| 卡片、预计块与日历入口结构 | [view.html](view.html) |
| 31 条专属排版、长金额与提示样式 | [style.css](style.css) |
| 读数、日期标题、提示及入口清理 | [index.js](index.js) |

样式仍在 [page.html](../../page.html) 的原位置展开，保留媒体查询和层叠顺序。跨卡字体、主题、布局与圆角规则保留在共享层，不拆散选择器或复制到本卡。

## 输入与方法

创建时传入 `root`、既有的 `writeText`、`writeAttribute` 和 `formatCurrency`。

- `mount()`：取得本卡节点，重复挂载不重复创建内容。
- `updateIncome(income)`：只显示已经算好、需要时已经插值的月累计；原同秒采样键仍由主流程维护。
- `updateSummary({ projection, progress, totalWorkdays })`：显示月预计及工作日摘要，不重算工作日或金额。
- `setContext(atLive, { year, month })`：维护本卡标题、预计标签和无障碍月份名称，日期分量来自同一显示帧。
- `updateCoverage(covered, year)`：只显示或隐藏覆盖提示。覆盖判断、诊断与页面状态仍在主流程。
- `bindCalendarAction(listen, openCalendar)`：通过既有监听所有者绑定本卡按钮，通知设置协调者打开日历，保留返回焦点目标；重复绑定先释放旧绑定。
- `destroy()`：释放按钮监听及节点句柄，保留静态视图；重新挂载后由协调者重新绑定入口。

本卡不跨根节点更新 DOM，不独立解析时间、计算工资或启动调度器。日期提示只负责呈现，完整设置、导入和焦点收回仍归原设置协调者。

## 检查与交付

[组件契约](../../../tests/readout-components-contract.spec.js)覆盖累计与预计分离、工作日摘要、日期口径、提示、实例隔离和监听释放。[跨日期算式](../../../tests/cross-date-month.spec.js)、[读数同步](../../../tests/readout-sync.spec.js)与[长金额排版](../../../tests/long-amount-layout.spec.js)继续保留原有断言。

交付仍为独立 Develop / Push HTML，不在浏览器中加载本目录；规则见 [维护策略](../../../docs/REPOSITORY_POLICY.md#单一源码入口)。
