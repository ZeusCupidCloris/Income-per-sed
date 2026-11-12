# 工资草稿

`index.js` 集中维护固定月薪、全年均摊、固定日薪的未保存金额和工作日。由 `SettingsUI` 传入工资方式列表与读取当前输入值的函数，组件本身不操作页面。

- `reset(settings)` 从已保存设置建立三份草稿，`clear()` 在面板关闭后释放它们。
- `capture(mode)` 记录当前字段的原始字符串，`get(mode)` 返回该方式的字段副本。切换前先记录旧方式，重复点击当前方式也记录但不重填。
- `key(mode)` 先记录当前字段，再按原规则比较草稿：金额的等价数字写法不算变更，固定月薪不比较隐藏的全年工作日。
- `snapshot(mode)` 记录当前字段并返回原 `modes` 数据格式的副本。宿主调用 `accepts(entry)` 检查恢复记录的方式、字段类型和长度，再用 `restore(entry.modes)` 装入副本。无效或空白的原始输入可以恢复，是否能保存仍由原校验判断。

当前选中方式、恢复确认、存储读写、校验、计薪及保存由原宿主负责；字段外观与显隐由[工资输入区](../income-fields/README.md)维护。组件不增加存储键、监听或定时器。源码契约在 `tests/source-assembly.test.mjs`，切换、刷新恢复与取消在 `tests/income-mode-switch.spec.js`；三种方式的保存后刷新沿用 `tests/release-behavior.spec.js`。
