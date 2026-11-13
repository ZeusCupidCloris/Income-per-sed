# 快速回溯按钮接线

`index.js` 只绑定面板内的步进、今日零点、播放／暂停和返回实时。它通过现有回溯作用域注册监听，不管理时间轴状态、焦点、动画或计时器。

播放和定位先提交时间草稿；校验失败就不执行动作。返回实时走单独的丢弃路径，再交给原有执行函数。面板焦点与关闭接线见[焦点组件](../history-panel-focus/README.md)，开关协调见[面板控制器](../history-panel-controller/README.md)；按钮反馈、全页时间轴快捷键和表盘拖动仍在 `src/page.html`。

生成单 HTML 后，用 `tests/history-dial-refinement.spec.js` 验证非法草稿及正常按钮路径。
