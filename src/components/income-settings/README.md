# 收入设置入口

`index.js` 是收入设置组件的统一装配入口。构建时将五个子组件内联到独立 HTML，运行时不读取其他文件。

| 要维护的内容 | 入口 |
| --- | --- |
| 工资设置、日期估算页签和键盘切换 | [收入页签](../income-view-tabs/README.md) |
| 三种计薪方式的按钮和选中状态 | [计薪方式](../income-mode-switch/README.md) |
| 金额与工作日的输入、说明和显隐 | [工资输入区](../income-fields/README.md) |
| 未保存的金额与工作日 | [工资草稿](../income-drafts/README.md) |
| 折合时薪、日均收入与计算日期 | [折算收入摘要](../income-rate-summary/README.md) |

`createIncomeSettings` 从原面板定位子组件的节点，传入工资方式、读取输入值、查找页签面板和写入文字的原方法。`mount()` 挂载四个有节点的子组件，`bind(listen, { onSelectView, onSelectMode })` 通过原监听管理器转交两个选择操作；`destroy()` 释放界面引用和监听，不清除草稿。草稿何时恢复、清除或写入存储仍由 `SettingsUI` 决定。

原弹窗开合、隐私解锁、指示条动画、输入校验、计薪和保存仍在页面的原处理函数内。返回的 `modeRoot` 是原指示条依附的节点。入口不增加样式、定时器或持久化数据。

源码组装及生命周期检查在 `tests/source-assembly.test.mjs`，常用交互沿用 `tests/income-mode-switch.spec.js` 和 `tests/income-view-tabs.spec.js`。
