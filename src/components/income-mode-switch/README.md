# 工资方式选择条

固定月薪、全年均摊、固定日薪三个按钮的结构在 `view.html`，按钮及选择条专属排版在 `style.css`。样式片段仍在原级联位置展开，方便调整这块内容时直接找到入口。

`index.js` 只维护本根节点内的按钮外观和点击接线，不保存当前工资方式：

- `mount()`：读取本选择条中的按钮，重复调用不会重复挂载。
- `updateSelection(mode)`：按宿主传入的方式更新原 `active` 类和 `aria-pressed`，不计算下一种方式、不触发点击。
- `bind(listen, onSelect)`：使用宿主已有监听管理器转交每次点击，重复绑定先释放旧监听。重复点击当前方式也照常转交，不能在组件中提前返回，否则会绕过宿主的草稿记录。
- `destroy()`：释放点击监听和按钮引用，允许重新挂载。

`src/page.html` 中 `SettingsUI` 的 `setIncomeMode` 校验并切换方式，向[工资草稿](../income-drafts/README.md)记录旧方式并读取新方式字段，再交给[工资输入区](../income-fields/README.md)呈现。输入校验、摘要计算、保存及取消仍由宿主管理。选择条不调用计薪引擎、不读取设置，也不自建时钟或状态副本。

选择指示条的创建、容器定位、尺寸测量、反向动画、窗口变化和资源清理仍在宿主；`has-moving-indicator` 仍由原逻辑维护。组件仅包含其上方按钮的原外观规则，不迁移动效。共享主题、焦点、按压反馈及按钮与指示条共用的圆角规则仍归共享样式，不拆开或复制选择器。

运行 `npm run release:prepare` 生成两份独立 HTML。`tests/source-assembly.test.mjs` 检查组件依赖、实例隔离和监听清理；`tests/income-mode-switch.spec.js` 检查原生键盘及鼠标切换、各方式草稿和取消保存。原 `settings-refinements.spec.js` 中的 `income selection reverses` 场景继续检查指示条动效。
