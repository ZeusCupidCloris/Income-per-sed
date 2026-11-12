# 每小时收入卡

- 改卡片结构、标签和编辑图标：`view.html`。
- 改本卡货币单位间距、标题留白和编辑图标位置：`style.css`。和工作进度卡共用的悬停、聚焦及展开规则仍在 `src/page.html`。
- 改时薪、日均和工资方式的显示：`index.js`。它只接收已算好的 `hourly`、`daily`、`modeLabel`，使用页面提供的格式化和写入函数。
- `bindEdit` 使用页面已有的卡片激活逻辑，回调只请求打开收入设置。销毁和重绑时释放本卡的监听；面板开合、焦点返回、保存、隐私和跨卡布局仍由页面处理。

修改后用 `npm run release:prepare` 生成两份独立 HTML，再运行 `tests/hourly-summary-contract.spec.js`。不要直接修改 Develop 或 Push。
