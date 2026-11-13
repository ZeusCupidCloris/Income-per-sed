# 回溯面板焦点与关闭

修改 Esc、Tab、关闭后归还焦点，或关闭按钮、遮罩和外部点击的接线，先看 `index.js`。面板开关见[控制器](../history-panel-controller/README.md)；开合动画、拖动、播放和时间轴快捷键仍在 `src/page.html`，不在本组件复制。

`createHistoryPanelFocus` 显式接收文档根节点、面板、打开按钮、顶部时间控制区、遮罩、原面板状态、关闭回调和是否允许归还焦点的回调。文档根节点只用于面板键盘与外部点击边界，不读取其他卡片内容。`state.returnFocus` 沿用原状态，不另建缓存或计时器。

## 调用时机

- `bind(listen)`：宿主初始化时调用一次，绑定关闭按钮、遮罩、外部 pointerdown 和 focusin；监听交给原 `ComponentScopes.timeline` 清理，不另建监听生命周期。
- `handleKeyboard(event, editing)`：在宿主处理已消费事件和设置面板优先级后调用。返回 `true` 表示当前按键属于回溯面板，全页时间轴不再处理它；原生输入自己的 Esc 取消仍优先。
- `focusAfterOpen(openingActive)`：保留在原打开动画的完成回调中，用户已经移走焦点时不抢回。
- `rememberCloseFocus()`：在原关闭开始处记录归还意图。
- `captureCloseFocus()`：在关闭收尾的隐藏、释放之前读取当前资格并清除意图；返回值交给同次收尾末尾的 `restoreFocus()`。这两个调用之间由面板控制器完成原 DOM 清理，呈现器仍负责动画。
- `cancelReturnFocus()`：外部点击或原后台关闭路径取消原归还意图，不改变页面状态。

窄屏 Tab 在面板内循环，桌面面板保持非模态。关闭只请求宿主回调，不直接修改 open、closing 或 desktop；设置已打开时不得抢走它的焦点。

## 检查

`tests/history-panel-focus.spec.js` 检查两份 HTML 的关闭入口、外部目标、键盘设置入口、面板快捷键隔离及反向打开。原 `tests/history-dial-refinement.spec.js` 保留窄屏正反向 Tab、桌面非模态、非法时间及后台恢复检查；`tests/history-flow.spec.js` 继续覆盖拖动、播放和跨断点返回。
