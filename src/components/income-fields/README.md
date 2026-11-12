# 工资输入区

`view.html` 包含计薪方式说明、金额输入、工作日栏和原错误提示。字段名称、说明和显隐在 `index.js`，专属布局、遮蔽和尺寸在 `style.css`。样式分三段放回原级联位置，共用的焦点反馈、触摸目标规则与设置面板布局仍由页面管理。

- `mount()` 只在收入配置面板内查找本组件的节点。
- `update(mode, { amount, days }, limits)` 显示宿主传入的字段值和金额限制。固定月薪显示本月工作日；全年均摊和固定日薪显示全年工作日；固定日薪显示「日薪到手」。
- `updateMonthlyWorkdays(count)` 显示宿主已算出的天数，即使当前方式隐藏该栏也保留更新。
- `destroy()` 释放节点引用。

方式选择、[草稿](../income-drafts/README.md)、校验和保存仍由原宿主协调。隐私解锁及错误展示状态沿用原控制逻辑；组件只维护对应的结构和专属样式，不负责解锁、格式校验或计薪。

运行 `npm run release:prepare` 生成两份独立 HTML。源码契约见 `tests/source-assembly.test.mjs`，三种方式的字段、布局和草稿切换见 `tests/income-mode-switch.spec.js`，隐私解锁见 `tests/global-css-feedback.spec.js`。
