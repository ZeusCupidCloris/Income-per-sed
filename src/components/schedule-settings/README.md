# 工作时间设置入口

`index.js` 组装工时摘要和工作日历状态。`view.html` 集中存放工作日历的导出、导入、恢复内置按钮及文件输入。构建后均内联到单个 HTML。

| 要维护的内容 | 入口 |
| --- | --- |
| 每日、上午、下午的工时读数 | [工时摘要](../schedule-calibration-summary/README.md) |
| 日历来源、覆盖年份、操作结果 | [日历状态](../calendar-status/README.md) |
| 工作日历按钮的结构及操作接线 | 本目录的 `view.html`、`index.js` |
| 四组工时滚轮的创建、重建和清理 | [wheels.js](wheels.js) |
| 工时摘要和保存前检查共用的时间判定 | [validation.js](validation.js) |

`createScheduleSettings` 接收原工时读数节点、日历区域和文字写入方法。`bindCalendarActions` 通过原设置作用域登记监听，负责打开文件选择器并转交选中的文件；导出、校验、恢复内置草稿、取消和保存仍由 `SettingsUI` 处理。宿主沿用原文件输入和导入按钮，分别清空文件选择及转交焦点。

`createScheduleWheels` 根据宿主传入的时间点、工时草稿和滚轮工厂创建小时、分钟列。组件负责释放实例和节点，向宿主提供首列聚焦、恢复指定直接输入、动效状态和列数。宿主仍决定何时创建或清理、何时恢复草稿及播报；共用的 `TimeWheel` 滚动、拖动、直接输入和资源清理实现不变。

`evaluateScheduleDraft` 接收当前工时草稿和原时间解析器，一次返回上午、下午时长及首条违规。开始与结束不能相等，上午结束允许恰好等于下午开始。宿主仍决定何时提示、标记、聚焦与禁用保存；原 `ScheduleEngine.validate` 的保存和备份校验保留。

入口不增加草稿、存储或定时器。源码契约见 `tests/source-assembly.test.mjs`，联合使用和滚轮重建流程见 `tests/settings-refinements.spec.js`。
