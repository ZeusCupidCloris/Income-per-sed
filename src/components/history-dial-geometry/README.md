# 回溯表盘几何

`index.js` 只有两个纯计算函数：`point` 将日内秒数映射到表盘坐标，`arc` 生成 SVG 圆弧路径。没有 DOM 读取、定时器或事件。

组装时两个函数插回原来的 `HistoryTimeDial` 作用域，不新增运行时依赖。拖动反算、坐标缓存、监听与动画仍由原控制器管理。

坐标与圆弧边界见 `tests/source-assembly.test.mjs`；完整回溯联测见 `tests/history-flow.spec.js`。
