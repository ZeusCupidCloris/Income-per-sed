# 收入设置页签

“工资设置／日期估算”页签的结构在 `view.html`，页签专属外观在 `style.css`。保留选中下划线、键盘焦点和紧凑视口输入时的隐藏规则；样式仍在原位置展开。两个面板的内容、滚动区域和保存区布局仍归宿主。

`index.js` 不保存当前视图，只反映宿主传入的选择：

- `mount()`：读取本页签条内的按钮。
- `updateSelection(view, focus)`：更新 `aria-selected`、`tabIndex` 和对应面板显隐；只有收到焦点请求时才聚焦选中页签，且不滚动页面。
- `bind(listen, onSelect)`：转交点击和左右方向键、Home、End 的选择请求。保留循环顺序、键盘焦点与原事件拦截，不处理 Tab、Escape 或原生按钮激活；重复绑定先清理旧监听。
- `destroy()`：释放点击、键盘监听和页签引用，允许重新挂载。

`src/page.html` 中 `SettingsUI` 的 `setIncomeView` 仍负责视图值、日期滚轮的首次初始化与再次刷新、工资方式指示条和滚动边缘更新。页签组件不读取工资草稿、不调整日期、不计算收入，也不保存设置。`view.html` 中的 `aria-controls` 必须继续对应宿主面板的 ID。

运行 `npm run release:prepare` 生成两份独立 HTML。`tests/source-assembly.test.mjs` 检查组件依赖、实例隔离和监听释放；`tests/income-view-tabs.spec.js` 对照首次估算、键盘切页、工资草稿和保存。
