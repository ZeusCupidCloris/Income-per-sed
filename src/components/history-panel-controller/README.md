# 回溯面板开关控制器

修改面板打开、关闭、反向打开、跨断点收起和后台立即关闭的规则，先看 `index.js`。这里沿用原 `historyQuickPanelState`，不复制时间轴状态，不自建计时器、观察器或动画。

## 接口

- `initialize()`：在宿主原初始化位置挂接面板层并同步可见视口。
- `setOpen(open)`：协调输入收尾或日期准备、原开关标记、遮罩、呈现器和焦点接口。关闭的输入收尾早于隐藏或 closing 判断，保持原取消语义。
- `toggle()`：仅根据现有 open 状态调用开关；关闭中再次点击仍可反向打开。
- `resize()`：先同步原视口变量；桌面同模式继续定位，跨 620/621px 断点按原规则关闭。没有额外测量、缓存或合并算法。
- `dismiss()`：供宿主原 visibilitychange、freeze、pagehide 与 suspend 接线调用，保留原立即收起和焦点意图取消顺序。

DOM 节点、状态、原呈现器、[焦点组件](../history-panel-focus/README.md)、原计时器清理和输入等跨组件回调都由宿主显式传入。回调只连接原函数，不复制草稿校验、视口计算或拖动算法。

关闭收尾先捕获焦点资格，再隐藏并释放原呈现器，最后复位拖动视觉和归还焦点。旧关闭回调在重新打开后不得清理新状态；同步完成关闭时不得再补上 closing 样式。

## 保留边界

开合动画仍在 `src/page.html` 的 `EntryPopovers`；视觉视口的读写、表盘拖动、播放、时间轴与计薪也留在原处。宿主保留 `setHistoryQuickPanelOpen` 薄入口，旧设置和隐私调用不必同时改写。全局监听仍由 `ComponentScopes.timeline` 注册和清理。

`tests/history-dial-refinement.spec.js` 的 placement 场景检查定位、断点、反向及视口读写；焦点、回溯联测和离线检查继续沿用原用例。`tests/source-assembly.test.mjs` 约束显式依赖与开关收尾顺序。
