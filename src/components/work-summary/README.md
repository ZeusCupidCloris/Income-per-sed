# 已工作卡

负责“今日已工作 / 所选日期已工作”、已工作时长和实时剩余文案。它只显示主流程提供的数据，不计算工资、工作日、时区或动画时间。

## 修改入口

| 任务 | 文件 |
| --- | --- |
| 卡片结构与稳定根节点 `#workSummaryCard` | [view.html](view.html) |
| 工时单位间距，两条专属规则 | [style.css](style.css) |
| 工时、剩余文案与实时 / 历史标题 | [index.js](index.js) |

共享的字体、卡片壳体、首列布局和主题继续由 [page.html](../../page.html) 提供。样式片段在原位置展开，不独立加载，不搬到样式表末尾。

## 输入与生命周期

创建时传入 `root`、既有的 `writeText` 与 `formatDuration`。主流程继续控制同秒去重及动画采样，组件不另设缓存、定时器或计算公式。

- `mount()`：取得本卡节点并标记标题，重复挂载不重复创建内容。
- `update({ wholeWork, remain, totalWork, morningWork, status, dayLabel })`：接收统一显示时间对应的秒数和状态，保留开工前、工作中、午休、完成及休息日的原文案。
- `setContext(atLive)`：更新本卡日期口径标题，不修改其他卡片。
- `destroy()`：停止后续更新、释放节点句柄，保留静态视图；可重新挂载。

背景暂停和浏览器缓存返回沿用全局生命周期，不销毁本卡。共享排版控制器仍可只读测量工时与剩余节点，不复制一套测量或收入缓存。

## 检查与交付

[组件契约](../../../tests/readout-components-contract.spec.js)覆盖状态优先级、实例隔离、同值写入与生命周期。[读数同步](../../../tests/readout-sync.spec.js)继续验证工时、剩余和月金额使用同一帧，包含修改工时后的同步失效。

维护入口与 [单 HTML 组装规则](../../../docs/REPOSITORY_POLICY.md#单一源码入口)一致：编辑源码，再生成 Develop / Push；运行时不读取本目录。
