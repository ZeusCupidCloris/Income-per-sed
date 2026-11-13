# 仓库地图与全文件用途

中文用途名帮助理解，不替换实际文件名。既有文件地址不变；新文件命名按 [维护规则](../docs/REPOSITORY_POLICY.md#文件命名规则)。这里覆盖 Git 管理的文件及本轮待提交文件，不列依赖目录、临时报告和缓存。

状态以 [验收索引](../docs/README.md) 为准；看到文件名或历史证据不代表当前已验收。脚本与测试的执行方式分别见 [脚本索引](scripts-index.md)、[测试索引](tests-index.md)。

## 交付与首页

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [.editorconfig](../.editorconfig) | 编辑器格式约定 | 维护 |
| [.gitattributes](../.gitattributes) | Git 文件换行约定 | 维护 |
| [.gitignore](../.gitignore) | 本地临时文件排除规则 | 维护 |
| [CHANGELOG.md](../CHANGELOG.md) | 产品变更总览 | 用户与维护 |
| [Income-per-sed-Develop.html](../Income-per-sed-Develop.html) | 自动组装的可读诊断网页 | 维护 |
| [Income-per-sed-Push.html](../Income-per-sed-Push.html) | 网页日常发布文件 | 用户 |
| [IncomeWidget.js](../IncomeWidget.js) | Scriptable 手机和平板小组件 | 用户 |
| [LICENSE](../LICENSE) | 版权与使用限制 | 用户 |
| [README.md](../README.md) | 产品首页与下载入口 | 用户 |
| [SHA256SUMS.txt](../SHA256SUMS.txt) | 四文件完整性校验清单 | 用户与维护 |
| [package-lock.json](../package-lock.json) | 维护工具依赖版本锁定 | 维护 |
| [package.json](../package.json) | 维护命令和工具依赖入口 | 维护 |
| [release-manifest.json](../release-manifest.json) | 产品版本与交付对应清单 | 维护 |

## 页面与组件源码

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [src/page.html](../src/page.html) | 单 HTML 组装入口与尚未迁移的页面实现 | 维护 |
| [src/components/fun-conversions/README.md](../src/components/fun-conversions/README.md) | 趣味换算卡维护入口与改动边界 | 维护 |
| [src/components/fun-conversions/view.html](../src/components/fun-conversions/view.html) | 趣味换算卡结构 | 维护 |
| [src/components/fun-conversions/style.css](../src/components/fun-conversions/style.css) | 按原位置组装的趣味换算专属样式片段 | 维护 |
| [src/components/fun-conversions/index.js](../src/components/fun-conversions/index.js) | 趣味数量与日期标题的独立生命周期 | 维护 |
| [src/components/fun-conversions/items.json](../src/components/fun-conversions/items.json) | 趣味商品名称、图标与单价 | 维护 |
| [src/components/work-summary/README.md](../src/components/work-summary/README.md) | 已工作卡修改入口、输入与检查边界 | 维护 |
| [src/components/work-summary/view.html](../src/components/work-summary/view.html) | 已工作卡结构与稳定根节点 | 维护 |
| [src/components/work-summary/style.css](../src/components/work-summary/style.css) | 已工作卡专属单位间距片段 | 维护 |
| [src/components/work-summary/index.js](../src/components/work-summary/index.js) | 已工作与剩余文案的独立呈现 | 维护 |
| [src/components/month-summary/README.md](../src/components/month-summary/README.md) | 月收入卡修改入口与协调边界 | 维护 |
| [src/components/month-summary/view.html](../src/components/month-summary/view.html) | 月累计、预计与日历提示结构 | 维护 |
| [src/components/month-summary/style.css](../src/components/month-summary/style.css) | 月收入卡专属长金额、布局与提示片段 | 维护 |
| [src/components/month-summary/index.js](../src/components/month-summary/index.js) | 月收入、工作日摘要和日历入口的呈现与清理 | 维护 |
| [src/components/hourly-summary/README.md](../src/components/hourly-summary/README.md) | 时薪卡修改入口与设置边界 | 维护 |
| [src/components/hourly-summary/view.html](../src/components/hourly-summary/view.html) | 时薪、日均和编辑入口结构 | 维护 |
| [src/components/hourly-summary/style.css](../src/components/hourly-summary/style.css) | 时薪卡专属单位与编辑图标样式 | 维护 |
| [src/components/hourly-summary/index.js](../src/components/hourly-summary/index.js) | 时薪读数呈现与编辑入口监听清理 | 维护 |
| [src/components/progress-readout/README.md](../src/components/progress-readout/README.md) | 进度读数、时间轴及设置边界 | 维护 |
| [src/components/progress-readout/view.html](../src/components/progress-readout/view.html) | 进度标题、编辑图标、百分比和剩余时长结构 | 维护 |
| [src/components/progress-readout/style.css](../src/components/progress-readout/style.css) | 进度读数区专属排版片段 | 维护 |
| [src/components/progress-readout/index.js](../src/components/progress-readout/index.js) | 状态和百分比显示、无障碍读数及编辑入口 | 维护 |
| [src/components/status-readout/README.md](../src/components/status-readout/README.md) | 顶部读数与回溯控制的维护边界 | 维护 |
| [src/components/status-readout/view.html](../src/components/status-readout/view.html) | 顶部状态文案和时间结构片段 | 维护 |
| [src/components/status-readout/style.css](../src/components/status-readout/style.css) | 顶部状态和时间专属文字样式 | 维护 |
| [src/components/status-readout/index.js](../src/components/status-readout/index.js) | 状态文案、时间及对应属性的写入 | 维护 |
| [src/components/history-date-seek/README.md](../src/components/history-date-seek/README.md) | 日期定位与表盘交互的维护边界 | 维护 |
| [src/components/history-date-seek/view.html](../src/components/history-date-seek/view.html) | 日期读数和定位表单 | 维护 |
| [src/components/history-date-seek/style.css](../src/components/history-date-seek/style.css) | 日期区专属样式片段 | 维护 |
| [src/components/history-date-seek/index.js](../src/components/history-date-seek/index.js) | 日期轮草稿、提交、错误及生命周期 | 维护 |
| [src/components/history-time-input/README.md](../src/components/history-time-input/README.md) | 精确时间输入与表盘控制的维护边界 | 维护 |
| [src/components/history-time-input/view.html](../src/components/history-time-input/view.html) | 精确时间字段及无障碍标签 | 维护 |
| [src/components/history-time-input/style.css](../src/components/history-time-input/style.css) | 时间字段专属样式片段 | 维护 |
| [src/components/history-time-input/index.js](../src/components/history-time-input/index.js) | 草稿、校验与取消编辑 | 维护 |
| [src/components/history-quick-buttons/README.md](../src/components/history-quick-buttons/README.md) | 回溯按钮接线与时间轴的维护边界 | 维护 |
| [src/components/history-quick-buttons/index.js](../src/components/history-quick-buttons/index.js) | 回溯按钮点击分发及输入草稿规则 | 维护 |
| [src/components/history-dial-geometry/README.md](../src/components/history-dial-geometry/README.md) | 表盘几何与拖动控制的维护边界 | 维护 |
| [src/components/history-dial-geometry/index.js](../src/components/history-dial-geometry/index.js) | 日内时间到坐标与圆弧的纯计算 | 维护 |
| [src/components/history-panel-focus/README.md](../src/components/history-panel-focus/README.md) | 面板焦点、关闭接线与动画收尾的维护边界 | 维护 |
| [src/components/history-panel-focus/index.js](../src/components/history-panel-focus/index.js) | 回溯面板键盘边界、关闭入口与焦点归还 | 维护 |
| [src/components/history-panel-controller/README.md](../src/components/history-panel-controller/README.md) | 回溯面板开关、视口切换和呈现器的协调边界 | 维护 |
| [src/components/history-panel-controller/index.js](../src/components/history-panel-controller/index.js) | 原开关状态、收尾、断点与后台立即关闭规则 | 维护 |
| [src/components/date-estimate-result/README.md](../src/components/date-estimate-result/README.md) | 日期估算结果与日期、计算、保存的维护边界 | 维护 |
| [src/components/date-estimate-result/view.html](../src/components/date-estimate-result/view.html) | 所选日期、主金额与辅助读数结构 | 维护 |
| [src/components/date-estimate-result/style.css](../src/components/date-estimate-result/style.css) | 估算结果专属排版及窄屏、高对比度片段 | 维护 |
| [src/components/date-estimate-result/index.js](../src/components/date-estimate-result/index.js) | 已格式化估算读数的呈现与隐藏 | 维护 |
| [src/components/income-rate-summary/README.md](../src/components/income-rate-summary/README.md) | 工资换算摘要与输入、公式及保存的维护边界 | 维护 |
| [src/components/income-rate-summary/view.html](../src/components/income-rate-summary/view.html) | 折合时薪、日均收入与日期工时说明结构 | 维护 |
| [src/components/income-rate-summary/style.css](../src/components/income-rate-summary/style.css) | 工资换算摘要专属排版 | 维护 |
| [src/components/income-rate-summary/index.js](../src/components/income-rate-summary/index.js) | 宿主格式化后的工资摘要呈现 | 维护 |
| [src/components/income-mode-switch/README.md](../src/components/income-mode-switch/README.md) | 工资方式按钮与草稿、指示条动效的维护边界 | 维护 |
| [src/components/income-mode-switch/view.html](../src/components/income-mode-switch/view.html) | 三种工资方式按钮结构 | 维护 |
| [src/components/income-mode-switch/style.css](../src/components/income-mode-switch/style.css) | 选择条与按钮专属外观片段 | 维护 |
| [src/components/income-mode-switch/index.js](../src/components/income-mode-switch/index.js) | 选中外观、点击转交与监听清理 | 维护 |
| [src/components/income-view-tabs/README.md](../src/components/income-view-tabs/README.md) | 收入页签与草稿、日期估算、保存的维护边界 | 维护 |
| [src/components/income-view-tabs/view.html](../src/components/income-view-tabs/view.html) | 工资设置与日期估算页签结构 | 维护 |
| [src/components/income-view-tabs/style.css](../src/components/income-view-tabs/style.css) | 页签专属外观、焦点与紧凑视口片段 | 维护 |
| [src/components/income-view-tabs/index.js](../src/components/income-view-tabs/index.js) | 页签选中、面板显隐、键盘切换及监听清理 | 维护 |
| [src/components/income-drafts/README.md](../src/components/income-drafts/README.md) | 三种工资方式的草稿接口与保存边界 | 维护 |
| [src/components/income-drafts/index.js](../src/components/income-drafts/index.js) | 原始字段、草稿比较、快照和恢复内容检查 | 维护 |
| [src/components/income-fields/README.md](../src/components/income-fields/README.md) | 工资输入区与草稿、隐私、校验的维护边界 | 维护 |
| [src/components/income-fields/view.html](../src/components/income-fields/view.html) | 工资说明、金额、工作日和错误提示结构 | 维护 |
| [src/components/income-fields/style.css](../src/components/income-fields/style.css) | 输入区专属布局、尺寸与遮蔽样式 | 维护 |
| [src/components/income-fields/index.js](../src/components/income-fields/index.js) | 字段名称、说明、显隐和传入数值的呈现 | 维护 |
| [src/components/income-settings/README.md](../src/components/income-settings/README.md) | 收入设置子组件索引和业务边界 | 维护 |
| [src/components/income-settings/index.js](../src/components/income-settings/index.js) | 收入设置组件创建、挂载、事件转交与清理 | 维护 |
| [src/components/schedule-calibration-summary/README.md](../src/components/schedule-calibration-summary/README.md) | 工时读数与滚轮、校验、播报的维护边界 | 维护 |
| [src/components/schedule-calibration-summary/view.html](../src/components/schedule-calibration-summary/view.html) | 每日、上午、下午的标题和读数结构 | 维护 |
| [src/components/schedule-calibration-summary/style.css](../src/components/schedule-calibration-summary/style.css) | 工时摘要专属样式和视口片段 | 维护 |
| [src/components/schedule-calibration-summary/index.js](../src/components/schedule-calibration-summary/index.js) | 显示宿主传入的时长和校准状态 | 维护 |
| [src/components/calendar-status/README.md](../src/components/calendar-status/README.md) | 日历状态展示与校验、保存的维护边界 | 维护 |
| [src/components/calendar-status/view.html](../src/components/calendar-status/view.html) | 工作日历标题、年份、来源与结果提示结构 | 维护 |
| [src/components/calendar-status/style.css](../src/components/calendar-status/style.css) | 日历标题、标记和提示的专属样式 | 维护 |
| [src/components/calendar-status/index.js](../src/components/calendar-status/index.js) | 来源、年份、辅助说明和操作提示的呈现 | 维护 |
| [src/components/schedule-settings/README.md](../src/components/schedule-settings/README.md) | 工时摘要、日历状态及操作的统一维护入口 | 维护 |
| [src/components/schedule-settings/index.js](../src/components/schedule-settings/index.js) | 装配工时与日历展示，连接日历按钮和宿主操作 | 维护 |
| [src/components/schedule-settings/view.html](../src/components/schedule-settings/view.html) | 工作日历按钮和文件输入结构 | 维护 |
| [src/components/schedule-settings/wheels.js](../src/components/schedule-settings/wheels.js) | 工时滚轮组的创建、重建和清理 | 维护 |
| [src/components/schedule-settings/validation.js](../src/components/schedule-settings/validation.js) | 工作时间面板的时长与违规判定 | 维护 |

## 自动维护与配置

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) | 修改提交检查模板 | 维护 |
| [.github/SECURITY.md](../.github/SECURITY.md) | 安全问题报告说明 | 维护 |
| [.github/dependabot.yml](../.github/dependabot.yml) | 依赖更新提醒配置 | 维护 |
| [.github/workflows/pages.yml](../.github/workflows/pages.yml) | 已验证网页部署流程 | 维护 |
| [.github/workflows/quality.yml](../.github/workflows/quality.yml) | 合并与发布质量检查流程 | 维护 |
| [.github/workflows/release.yml](../.github/workflows/release.yml) | 正式或候选版本附件发布流程 | 维护 |
| [config/playwright-edge.config.js](../config/playwright-edge.config.js) | Edge 自动测试配置 | 维护 |
| [config/playwright-webkit.config.js](../config/playwright-webkit.config.js) | WebKit 自动测试配置 | 维护 |
| [config/readme-previews.json](../config/readme-previews.json) | 首页截图尺寸与场景配置 | 维护 |
| [config/test-groups.cjs](../config/test-groups.cjs) | 五类测试的唯一归属与手动观察范围 | 维护 |
| [scripts/run-quality.mjs](../scripts/run-quality.mjs) | 快速、专项、完整验收和手动观察统一入口 | 维护 |
| [scripts/quality-scope.mjs](../scripts/quality-scope.mjs) | 改动分流、浏览器专项选择及失败关闭的汇总关卡 | 维护 |

## 文档与展示素材

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [Attachment/README.md](README.md) | 集中索引入口与目录边界 | 用户与维护 |
| [docs/maintainer/workflow-review.md](../docs/maintainer/workflow-review.md) | 工作流重复检查评估与待决策方案 | 维护 |
| [docs/maintainer/card-css-plan.md](../docs/maintainer/card-css-plan.md) | 按卡片分批整理重复样式与验收门槛 | 维护 |
| [docs/maintainer/global-css-audit.md](../docs/maintainer/global-css-audit.md) | 全局37条覆盖候选的逐项决定、兼容保留与反馈回归 | 维护 |
| [docs/maintainer/css-variable-audit.md](../docs/maintainer/css-variable-audit.md) | 自定义变量消费关系、动态入口和四批清理候选 | 维护 |
| [docs/maintainer/css-variable-layout.md](../docs/maintainer/css-variable-layout.md) | 第一批无用变量删除、外观对照与参考线独立修复预览 | 维护 |
| [docs/maintainer/webkit-stability.md](../docs/maintainer/webkit-stability.md) | WebKit 原崩溃的连续、同页、冷启动与原生记录排查 | 维护 |
| [docs/maintainer/css-variable-tuning.md](../docs/maintainer/css-variable-tuning.md) | 第二批七个无用旧参数删除与独立验收 | 维护 |
| [docs/maintainer/css-variable-display-color.md](../docs/maintainer/css-variable-display-color.md) | 第三批显示层级与旧配色的两组清理和逐组验收 | 维护 |
| [docs/maintainer/css-variable-metal-alias.md](../docs/maintainer/css-variable-metal-alias.md) | 最后四对金属别名删除、全量变量复核与完整业务回归 | 维护 |
| [docs/maintainer/persistence-webkit-repro.md](../docs/maintainer/persistence-webkit-repro.md) | 工资模式测试隔离、WebKit 恢复窄屏崩溃与未确认的缩减候选 | 维护 |
| [docs/maintainer/webkit-factor-controls.md](../docs/maintainer/webkit-factor-controls.md) | 前置负载、逐帧采样、主题和实时交接的有界单因素对照 | 维护 |
| [docs/maintainer/webkit-sampler-split.md](../docs/maintainer/webkit-sampler-split.md) | 几何、样式、仅记录及纯记录的隔离对照与负载核对 | 维护 |
| [docs/maintainer/trace-boundary-audit.md](../docs/maintainer/trace-boundary-audit.md) | 追踪开关对照、关键帧审计、全量现状及恢复修改条件 | 维护 |
| [docs/maintainer/keyframe-clock-preview.md](../docs/maintainer/keyframe-clock-preview.md) | 两份旧关键帧清理预览、时钟有界对照及重复读写核对 | 维护 |
| [docs/maintainer/timeline-label-writes.md](../docs/maintainer/timeline-label-writes.md) | 两个顶部无障碍标签去重、同秒状态回归和前后写入量 | 维护 |
| [docs/maintainer/frame-time-format.md](../docs/maintainer/frame-time-format.md) | 本次顶部同步的时间格式化复用及原完整验收 | 维护 |
| [docs/maintainer/patch-readiness.md](../docs/maintainer/patch-readiness.md) | 累计补丁清单、参考刻线观感、耗时样本及交付待办 | 维护 |
| [docs/maintainer/2.7x-review.md](../docs/maintainer/2.7x-review.md) | 2.7.0 起已交付改动、本地精简、问题处理及当前边界 | 维护 |
| [docs/maintainer/component-architecture-2.8.md](../docs/maintainer/component-architecture-2.8.md) | 2.8.x 分组件文件归属、共享规则、离线交付与分批重构计划 | 维护 |
| [docs/maintainer/component-source-first-batch.md](../docs/maintainer/component-source-first-batch.md) | 首批组件源码、单 HTML 构建与本地候选验收边界 | 维护 |
| [docs/maintainer/readout-components-second-batch.md](../docs/maintainer/readout-components-second-batch.md) | 已工作与月收入卡迁移、专项验证与保留风险 | 维护 |
| [docs/maintainer/hourly-summary-third-batch.md](../docs/maintainer/hourly-summary-third-batch.md) | 时薪卡迁移、验证与下一批边界 | 维护 |
| [docs/maintainer/progress-readout-fourth-batch.md](../docs/maintainer/progress-readout-fourth-batch.md) | 进度读数迁移及专项验证 | 维护 |
| [docs/maintainer/status-readout-fifth-batch.md](../docs/maintainer/status-readout-fifth-batch.md) | 窄屏测量、五组件联测和顶部读数迁移 | 维护 |
| [docs/maintainer/history-date-seek-sixth-batch.md](../docs/maintainer/history-date-seek-sixth-batch.md) | 日常流程回归与日期定位迁移 | 维护 |
| [docs/maintainer/history-time-input-seventh-batch.md](../docs/maintainer/history-time-input-seventh-batch.md) | 精确时间输入迁移及验证 | 维护 |
| [docs/maintainer/history-quick-buttons-eighth-batch.md](../docs/maintainer/history-quick-buttons-eighth-batch.md) | 回溯按钮接线迁移及验证 | 维护 |
| [docs/maintainer/history-dial-geometry-ninth-batch.md](../docs/maintainer/history-dial-geometry-ninth-batch.md) | 常规回溯联测、表盘几何迁移和拆分前后验证 | 维护 |
| [docs/maintainer/history-panel-focus-tenth-batch.md](../docs/maintainer/history-panel-focus-tenth-batch.md) | 面板焦点与关闭迁移、原完整验收边界及前后对照 | 维护 |
| [docs/maintainer/history-panel-controller-eleventh-batch.md](../docs/maintainer/history-panel-controller-eleventh-batch.md) | 回溯开关协调迁移及定位、断点与收尾对照 | 维护 |
| [docs/maintainer/date-estimate-result-twelfth-batch.md](../docs/maintainer/date-estimate-result-twelfth-batch.md) | 日期估算结果迁移及前后读数、布局对照 | 维护 |
| [docs/maintainer/income-rate-summary-thirteenth-batch.md](../docs/maintainer/income-rate-summary-thirteenth-batch.md) | 工资摘要迁移、三种计薪方式及前后呈现对照 | 维护 |
| [docs/maintainer/income-mode-switch-fourteenth-batch.md](../docs/maintainer/income-mode-switch-fourteenth-batch.md) | 工资方式选择条迁移、草稿及原动效对照 | 维护 |
| [docs/maintainer/income-view-tabs-fifteenth-batch.md](../docs/maintainer/income-view-tabs-fifteenth-batch.md) | 收入设置页签迁移、键盘与原日期异常证据 | 维护 |
| [docs/maintainer/date-wheel-visibility.md](../docs/maintainer/date-wheel-visibility.md) | 隐藏日期滚轮的回写来源、独立修复与回归 | 维护 |
| [docs/maintainer/income-drafts-sixteenth-batch.md](../docs/maintainer/income-drafts-sixteenth-batch.md) | 工资草稿迁移、恢复与保存后刷新对照 | 维护 |
| [docs/maintainer/income-fields-seventeenth-batch.md](../docs/maintainer/income-fields-seventeenth-batch.md) | 工资输入区迁移、布局及隐私回归 | 维护 |
| [docs/maintainer/income-settings-entry-eighteenth-batch.md](../docs/maintainer/income-settings-entry-eighteenth-batch.md) | 收入设置装配入口及行为对照 | 维护 |
| [docs/maintainer/schedule-calibration-summary-nineteenth-batch.md](../docs/maintainer/schedule-calibration-summary-nineteenth-batch.md) | 工时摘要迁移、布局与播报对照 | 维护 |
| [docs/maintainer/calendar-status-twentieth-batch.md](../docs/maintainer/calendar-status-twentieth-batch.md) | 工作日历状态、导出与保存回滚对照 | 维护 |
| [docs/maintainer/schedule-settings-entry-twenty-first-batch.md](../docs/maintainer/schedule-settings-entry-twenty-first-batch.md) | 工作时间设置入口与工时、日历联合验收 | 维护 |
| [docs/maintainer/schedule-wheels-twenty-second-batch.md](../docs/maintainer/schedule-wheels-twenty-second-batch.md) | 工时滚轮装配、重复开关和直接输入恢复验收 | 维护 |
| [docs/maintainer/schedule-validation-twenty-third-batch.md](../docs/maintainer/schedule-validation-twenty-third-batch.md) | 工作时间校验入口、午休边界与提示时机验收 | 维护 |
| [docs/Income-per-sed（说明文档）.docx](../docs/Income-per-sed（说明文档）.docx) | Income-per-sed 使用手册 | 用户 |
| [docs/README.md](../docs/README.md) | 当前交付与验收状态索引 | 维护 |
| [docs/acceptance/maintenance-simplification-20261006.md](../docs/acceptance/maintenance-simplification-20261006.md) | 索引、测试入口与维护收敛验收记录 | 维护 |
| [docs/REPOSITORY_POLICY.md](../docs/REPOSITORY_POLICY.md) | 命名及维护发布规则 | 维护 |
| [Attachment/repository-map.md](repository-map.md) | 按阅读对象分类的仓库地图与全文件用途表 | 用户与维护 |
| [docs/calendar-maintenance.md](../docs/calendar-maintenance.md) | 年度内置日历手动替换清单 | 维护 |
| [docs/manual-maintenance.md](../docs/manual-maintenance.md) | 使用手册内容、图片同步与校验书签维护规则 | 维护 |
| [docs/images/preview-dark.png](../docs/images/preview-dark.png) | 首页深色模式展示图 | 用户与维护 |
| [docs/images/preview-desktop.png](../docs/images/preview-desktop.png) | 首页桌面展示图 | 用户与维护 |
| [docs/images/preview-mobile.png](../docs/images/preview-mobile.png) | 首页手机展示图 | 用户与维护 |
| [docs/images/previews-manifest.json](../docs/images/previews-manifest.json) | 首页截图来源与校验值清单 | 用户与维护 |

## 验收证据与版本说明

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [docs/acceptance/cross-date-month-20260924.md](../docs/acceptance/cross-date-month-20260924.md) | 09-24 跨日期月收入验收证据 | 维护与历史 |
| [docs/acceptance/foreground-progress-20260923.md](../docs/acceptance/foreground-progress-20260923.md) | 09-23 恢复进度与拨钮验收证据 | 维护与历史 |
| [docs/acceptance/foreground-resume-20260909.md](../docs/acceptance/foreground-resume-20260909.md) | 09-09 前台恢复验收证据 | 维护与历史 |
| [docs/acceptance/fourfile-20260916.md](../docs/acceptance/fourfile-20260916.md) | 09-16 四文件交付验收证据 | 维护与历史 |
| [docs/acceptance/fourfile-20260922.md](../docs/acceptance/fourfile-20260922.md) | 09-22 四文件交付验收证据 | 维护与历史 |
| [docs/acceptance/fourfile-20260924.md](../docs/acceptance/fourfile-20260924.md) | 09-24 四文件交付验收证据 | 维护与历史 |
| [docs/acceptance/fourfile-20261021.md](../docs/acceptance/fourfile-20261021.md) | RC47 四文件同步与产品使用手册核对 | 维护与验收 |
| [docs/acceptance/fourfile-20261022.md](../docs/acceptance/fourfile-20261022.md) | 2.7.1 轻量化四文件同步与交付边界 | 维护与验收 |
| [docs/acceptance/fourfile-20261023.md](../docs/acceptance/fourfile-20261023.md) | 2.7.2 拨盘四文件同步与发布验收 | 维护与验收 |
| [docs/acceptance/fourfile-20261026.md](../docs/acceptance/fourfile-20261026.md) | 2.7.3 累计精简四文件、桌面及仓库交付验收 | 维护与验收 |
| [docs/acceptance/fourfile-20261027.md](../docs/acceptance/fourfile-20261027.md) | 2.7.4 定位优化、全量业务与备份恢复本地补丁验收 | 维护与验收 |
| [docs/acceptance/fourfile-20261028.md](../docs/acceptance/fourfile-20261028.md) | 2.7.5 午休进度衔接与四文件补丁验收 | 维护与验收 |
| [docs/acceptance/fourfile-20261101.md](../docs/acceptance/fourfile-20261101.md) | 2.7.6 本地留档、稳定性收尾与四文件交付状态 | 维护与验收 |
| [docs/acceptance/fourfile-20261112.md](../docs/acceptance/fourfile-20261112.md) | 2.8.0 冻结验收、离线试用与候选四文件核对 | 维护与验收 |
| [docs/acceptance/grid-idle-20260930.md](../docs/acceptance/grid-idle-20260930.md) | 09-30 背景空闲重绘修复证据 | 维护与历史 |
| [docs/acceptance/grid-recovery-20260930.md](../docs/acceptance/grid-recovery-20260930.md) | 09-30 模拟后台绘制循环检查证据 | 维护与历史 |
| [docs/acceptance/maintenance-20260915.md](../docs/acceptance/maintenance-20260915.md) | 09-15 仓库维护验收证据 | 维护与历史 |
| [docs/acceptance/maintenance-round2-20260908.md](../docs/acceptance/maintenance-round2-20260908.md) | 09-08 第二轮维护验收证据 | 维护与历史 |
| [docs/acceptance/motion-preview-20260922.md](../docs/acceptance/motion-preview-20260922.md) | 09-22 局部动效预览验收证据 | 维护与历史 |
| [docs/acceptance/naming-20260930.md](../docs/acceptance/naming-20260930.md) | 09-30 命名与交付整理验收证据 | 维护与历史 |
| [docs/acceptance/delivery-sync-20261001.md](../docs/acceptance/delivery-sync-20261001.md) | 10-01 四文件同步与恢复组合验收证据 | 维护与验收 |
| [docs/acceptance/lifecycle-install-20261002.md](../docs/acceptance/lifecycle-install-20261002.md) | 安装与生命周期检查及下一步动效研究 | 维护 |
| [docs/acceptance/delivery-settings-20261002.md](../docs/acceptance/delivery-settings-20261002.md) | 四文件交付与设置卡片动效检查及待验收边界 | 维护与验收 |
| [docs/acceptance/overnight-20260915.md](../docs/acceptance/overnight-20260915.md) | 09-15 真实跨夜验收安排与边界 | 维护与历史 |
| [docs/acceptance/readout-sync-20260924.md](../docs/acceptance/readout-sync-20260924.md) | 09-24 读数同步验收证据 | 维护与历史 |
| [docs/acceptance/recovery-maintenance-20260927.md](../docs/acceptance/recovery-maintenance-20260927.md) | 09-27 恢复组合维护验收证据 | 维护与历史 |
| [docs/acceptance/v2.5.2.md](../docs/acceptance/v2.5.2.md) | 2.5.2 版本验收证据 | 维护与历史 |
| [docs/acceptance/v2.5.4-rc.2-maintenance.md](../docs/acceptance/v2.5.4-rc.2-maintenance.md) | 2.5.4-rc.2 内部加固验收证据 | 维护与历史 |
| [docs/acceptance/v2.5.4-rc.2-startup.md](../docs/acceptance/v2.5.4-rc.2-startup.md) | 2.5.4-rc.2 启动恢复验收证据 | 维护与历史 |
| [docs/releases/v2.5.0.md](../docs/releases/v2.5.0.md) | 2.5.0 发布说明 | 维护与历史 |
| [docs/releases/v2.5.1.md](../docs/releases/v2.5.1.md) | 2.5.1 发布说明 | 维护与历史 |
| [docs/releases/v2.5.2.md](../docs/releases/v2.5.2.md) | 2.5.2 发布说明 | 维护与历史 |
| [docs/releases/v2.6.0.md](../docs/releases/v2.6.0.md) | 2.6.0 四文件同步与验证范围 | 用户与维护 |
| [docs/releases/v2.6.1.md](../docs/releases/v2.6.1.md) | 中号小组件窄屏修复与四文件同步 | 用户与维护 |
| [docs/releases/v2.7.0.md](../docs/releases/v2.7.0.md) | 2.7.0 用户交互与手册同步说明 | 用户与维护 |
| [docs/releases/v2.7.1.md](../docs/releases/v2.7.1.md) | 2.7.1 原卡片修复与读数优化说明 | 用户与维护 |
| [docs/releases/v2.7.2.md](../docs/releases/v2.7.2.md) | 2.7.2 拨盘与输入修复交付说明 | 用户与维护 |
| [docs/releases/v2.7.3.md](../docs/releases/v2.7.3.md) | 2.7.3 累计轻量化补丁交付说明与风险边界 | 用户与维护 |
| [docs/releases/v2.7.4.md](../docs/releases/v2.7.4.md) | 2.7.4 回溯定位优化本地补丁说明与交付边界 | 用户与维护 |
| [docs/releases/v2.7.5.md](../docs/releases/v2.7.5.md) | 2.7.5 午休进度衔接补丁说明 | 用户与维护 |
| [docs/releases/v2.7.6.md](../docs/releases/v2.7.6.md) | 2.7.6 保存、北京时间、焦点与长数字排版收尾说明 | 用户与维护 |
| [docs/releases/v2.8.0.md](../docs/releases/v2.8.0.md) | 2.8.0 组件化候选的使用方式与维护入口 | 用户与维护 |
| [docs/releases/v2.5.4-rc.2.md](../docs/releases/v2.5.4-rc.2.md) | 2.5.4-rc.2 候选发布说明 | 维护与历史 |

## 维护脚本

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [Attachment/scripts-index.md](scripts-index.md) | 维护脚本用途与写入行为索引 | 维护 |
| [scripts/build-develop-html.mjs](../scripts/build-develop-html.mjs) | 组装单 HTML 诊断网页及回查源码行号 | 维护 |
| [scripts/build-release-html.mjs](../scripts/build-release-html.mjs) | 从组件源码生成两份独立网页 | 维护 |
| [scripts/capture-readme-previews.mjs](../scripts/capture-readme-previews.mjs) | 采集首页浏览器展示图 | 维护 |
| [scripts/check_delivery_repeatability.py](../scripts/check_delivery_repeatability.py) | 连续构建一致性检查 | 维护 |
| [scripts/manual_checksum_bookmarks.py](../scripts/manual_checksum_bookmarks.py) | 手册校验书签读取与更新工具 | 维护 |
| [scripts/observe-runtime-resources.cjs](../scripts/observe-runtime-resources.cjs) | 长时运行资源观察工具 | 维护 |
| [scripts/compare-runtime-resources.cjs](../scripts/compare-runtime-resources.cjs) | 双版本工作态耗时、文件与资源对比 | 维护 |
| [scripts/prepare_delivery.py](../scripts/prepare_delivery.py) | 四文件发布准备工具 | 维护 |
| [scripts/readme-preview-validation.mjs](../scripts/readme-preview-validation.mjs) | 首页图片完整性检查公共函数 | 维护 |
| [scripts/release-channel.mjs](../scripts/release-channel.mjs) | 正式与候选发布标签识别 | 维护 |
| [scripts/run-python.mjs](../scripts/run-python.mjs) | Python 维护解释器选择工具 | 维护 |
| [scripts/install-ci-dependencies.mjs](../scripts/install-ci-dependencies.mjs) | 安装超时与有限重试工具 | 维护 |
| [scripts/serve-test-pages.mjs](../scripts/serve-test-pages.mjs) | 本地测试静态服务 | 维护 |
| [scripts/validate-readme-previews.mjs](../scripts/validate-readme-previews.mjs) | 首页图片及来源有效性检查 | 维护 |
| [scripts/validate_delivery.py](../scripts/validate_delivery.py) | 交付版本与校验值检查 | 维护 |
| [scripts/validate-document-index.mjs](../scripts/validate-document-index.mjs) | 文件用途索引与内部链接检查 | 维护 |
| [scripts/verify_published_pages.py](../scripts/verify_published_pages.py) | 线上网页与发布文件字节核验 | 维护 |

## 自动测试与辅助工具

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [tests/install-ci-dependencies.test.mjs](../tests/install-ci-dependencies.test.mjs) | 安装重试与真实子进程超时测试 | 维护 |
| [tests/source-assembly.test.mjs](../tests/source-assembly.test.mjs) | 源码组装、路径边界、组件数据与产物可复现检查 | 维护 |
| [tests/fun-conversions-contract.spec.js](../tests/fun-conversions-contract.spec.js) | 趣味换算卡实例隔离、生命周期与双网页离线契约 | 维护 |
| [tests/readout-components-contract.spec.js](../tests/readout-components-contract.spec.js) | 两张读数卡的状态、隔离、清理、跨月与日历入口契约 | 维护 |
| [tests/hourly-summary-contract.spec.js](../tests/hourly-summary-contract.spec.js) | 时薪卡读数、隔离、监听清理和真实入口契约 | 维护 |
| [tests/progress-readout-contract.spec.js](../tests/progress-readout-contract.spec.js) | 进度状态、百分比与无障碍同步、归零、回溯和编辑入口 | 维护 |
| [tests/component-joint.spec.js](../tests/component-joint.spec.js) | 趣味换算布局恢复、工时修改、跨日与跨月回溯、主题切换和顶部时间标签 | 维护 |
| [tests/daily-workflow.spec.js](../tests/daily-workflow.spec.js) | 工资与工时保存、首页读数、完整备份恢复、刷新及日期定位 | 维护 |
| [tests/browser-lifecycle.spec.js](../tests/browser-lifecycle.spec.js) | 真实冻结、缓存返回及模拟休眠时间差测试 | 维护 |
| [Attachment/tests-index.md](tests-index.md) | 自动测试用途与验收边界索引 | 维护 |
| [tests/background-grid.spec.js](../tests/background-grid.spec.js) | 背景交互与恢复绘制循环测试 | 维护 |
| [tests/recovery-cross-actions.spec.js](../tests/recovery-cross-actions.spec.js) | 设置主题与恢复交叉操作测试 | 维护 |
| [tests/cross-date-month.spec.js](../tests/cross-date-month.spec.js) | 跨日期月收入计算与过渡测试 | 维护 |
| [tests/document-index-validation.test.mjs](../tests/document-index-validation.test.mjs) | 文档索引与内部链接检查器测试 | 维护 |
| [tests/foreground-progress.spec.js](../tests/foreground-progress.spec.js) | 恢复进度与拨钮对齐测试 | 维护 |
| [tests/foreground-resume.spec.js](../tests/foreground-resume.spec.js) | 前台恢复与时间边界测试 | 维护 |
| [tests/helpers/business-clock.js](../tests/helpers/business-clock.js) | 业务时钟测试辅助工具 | 维护 |
| [tests/helpers/background-recovery.js](../tests/helpers/background-recovery.js) | 模拟后台恢复测试辅助工具 | 维护 |
| [tests/helpers/settings-page.js](../tests/helpers/settings-page.js) | 普通设置测试的共同页面与展开初始化 | 维护 |
| [tests/helpers/display-state.js](../tests/helpers/display-state.js) | 通过真实显示控件准备测试，等待设置交接及确认放弃草稿 | 维护 |
| [tests/helpers/settings-backup.js](../tests/helpers/settings-backup.js) | 完整设置备份的真实下载、上传和校验测试辅助工具 | 维护 |
| [tests/quality-entrypoints.test.mjs](../tests/quality-entrypoints.test.mjs) | 功能分组完整性与运行入口契约检查 | 维护 |
| [tests/input-device-motion.spec.js](../tests/input-device-motion.spec.js) | 输入设备与刷新率验收测试 | 维护 |
| [tests/interaction-handoff.spec.js](../tests/interaction-handoff.spec.js) | 连续操作接管测试 | 维护 |
| [tests/motion-feedback.spec.js](../tests/motion-feedback.spec.js) | 保存面板与局部动效反馈测试 | 维护 |
| [tests/settings-text-continuity.spec.js](../tests/settings-text-continuity.spec.js) | 设置卡片动画文字排版与显隐连续性测试 | 维护 |
| [tests/settings-local-motion.spec.js](../tests/settings-local-motion.spec.js) | 设置分层显现、口径文字交接、日历展开和滚轮明度测试 | 维护 |
| [tests/settings-scrollbar-handoff.spec.js](../tests/settings-scrollbar-handoff.spec.js) | 设置外壳交接期间的原生滚动条绘制与滚动空间检查 | 维护 |
| [tests/settings-refinements.spec.js](../tests/settings-refinements.spec.js) | 设置及回溯布局、工时读数、日历预览与保存失败回滚 | 维护 |
| [tests/settings-stability.spec.js](../tests/settings-stability.spec.js) | 设置滚动锚定、摘要布局、快速操作清理与读写耗时检查 | 维护 |
| [tests/settings-input-safety.spec.js](../tests/settings-input-safety.spec.js) | 不可见控件防误触、触屏手势意图及停靠后摘要播报测试 | 维护 |
| [tests/global-css-feedback.spec.js](../tests/global-css-feedback.spec.js) | 存储提示生命周期、隐私解锁触摸尺寸与键盘焦点视觉契约 | 维护 |
| [tests/settings-frame-budget.spec.js](../tests/settings-frame-budget.spec.js) | 设置卡片实际帧间隔与样式计算开销观察 | 维护 |
| [tests/release-naming.test.mjs](../tests/release-naming.test.mjs) | 对外名称与版本对应测试 | 维护 |
| [tests/readme-preview-validation.test.mjs](../tests/readme-preview-validation.test.mjs) | 首页图片检查器测试 | 维护 |
| [tests/readout-sync.spec.js](../tests/readout-sync.spec.js) | 表盘与金额工时读数、同帧北京时间复用及历史日期隔离测试 | 维护 |
| [tests/recovery-combinations.spec.js](../tests/recovery-combinations.spec.js) | 多状态后台恢复组合测试 | 维护 |
| [tests/release-behavior.spec.js](../tests/release-behavior.spec.js) | 双版本业务一致性、设备时区与夏令时边界 | 维护 |
| [tests/release-channel.test.mjs](../tests/release-channel.test.mjs) | 发布标签识别测试 | 维护 |
| [tests/storage-resilience.spec.js](../tests/storage-resilience.spec.js) | 异常存储、多窗口失败回滚与草稿恢复 | 维护 |
| [docs/acceptance/storage-runtime-20261003.md](../docs/acceptance/storage-runtime-20261003.md) | 保存可靠性与长时资源验收记录 | 维护 |
| [docs/acceptance/settings-delivery-20261005.md](../docs/acceptance/settings-delivery-20261005.md) | 设置局部反馈、输入安全与四文件交付验收 | 维护 |
| [docs/acceptance/runtime-observation-20261003.json](../docs/acceptance/runtime-observation-20261003.json) | 30 分钟资源观察原始采样证据 | 维护 |
| [tests/startup-history-playback.spec.js](../tests/startup-history-playback.spec.js) | 启动与历史播放运动测试 | 维护 |
| [tests/history-dial-refinement.spec.js](../tests/history-dial-refinement.spec.js) | 拨盘输入、模态焦点、坐标缓存与模拟恢复 | 维护 |
| [tests/history-flow.spec.js](../tests/history-flow.spec.js) | 窄屏定位、鼠标拖动、播放暂停、跨断点缩放与返回实时联测 | 维护 |
| [tests/history-panel-focus.spec.js](../tests/history-panel-focus.spec.js) | 回溯面板关闭入口、键盘隔离、焦点归还与反向打开 | 维护 |
| [tests/date-estimate-result.spec.js](../tests/date-estimate-result.spec.js) | 日期估算结果、未保存草稿隔离与桌面窄屏呈现 | 维护 |
| [tests/income-rate-summary.spec.js](../tests/income-rate-summary.spec.js) | 工资摘要、无效输入、取消及保存后刷新 | 维护 |
| [tests/income-mode-switch.spec.js](../tests/income-mode-switch.spec.js) | 工资方式切换、字段呈现、分方式草稿刷新恢复与取消 | 维护 |
| [tests/income-view-tabs.spec.js](../tests/income-view-tabs.spec.js) | 收入设置页签、键盘焦点、工资草稿与日期滚轮切页保值 | 维护 |
| [tests/live-reference-marker.spec.js](../tests/live-reference-marker.spec.js) | 回溯实时参考线的主题颜色、跟随实时和返回隐藏 | 维护 |
| [tests/history-dial-touch.spec.js](../tests/history-dial-touch.spec.js) | 拨盘原生触摸坐标映射与拖动模拟 | 维护 |
| [tests/test_prepare_delivery.py](../tests/test_prepare_delivery.py) | 交付生成与手册书签测试 | 维护 |
| [tests/visual.spec.js](../tests/visual.spec.js) | 页面截图回归测试 | 维护 |
| [tests/webkit-mobile.spec.js](../tests/webkit-mobile.spec.js) | WebKit 手机尺寸与基础行为测试 | 维护 |
| [tests/widget-parity.spec.js](../tests/widget-parity.spec.js) | 小组件与网页计算日历一致性测试 | 维护 |
| [tests/widget-settings.cjs](../tests/widget-settings.cjs) | 小组件配置异常读写测试 | 维护 |
| [tests/long-amount-layout.spec.js](../tests/long-amount-layout.spec.js) | 长金额窗格边界布局测试 | 维护 |
| [tests/workflow-contract.test.mjs](../tests/workflow-contract.test.mjs) | 自动发布门槛与工作流约束测试 | 维护 |
| [tests/visual.spec.js-snapshots/desktop-dark-edge-win32.png](../tests/visual.spec.js-snapshots/desktop-dark-edge-win32.png) | 桌面深色视觉回归基线 | 维护 |
| [tests/visual.spec.js-snapshots/desktop-light-edge-win32.png](../tests/visual.spec.js-snapshots/desktop-light-edge-win32.png) | 桌面浅色视觉回归基线 | 维护 |
| [tests/visual.spec.js-snapshots/mobile-history-panel-edge-win32.png](../tests/visual.spec.js-snapshots/mobile-history-panel-edge-win32.png) | 手机回溯面板视觉回归基线 | 维护 |
| [tests/visual.spec.js-snapshots/mobile-light-edge-win32.png](../tests/visual.spec.js-snapshots/mobile-light-edge-win32.png) | 手机浅色视觉回归基线 | 维护 |
