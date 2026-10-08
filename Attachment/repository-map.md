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
| [Income-per-sed-Develop.html](../Income-per-sed-Develop.html) | 网页开发与诊断源文件 | 维护 |
| [Income-per-sed-Push.html](../Income-per-sed-Push.html) | 网页日常发布文件 | 用户 |
| [IncomeWidget.js](../IncomeWidget.js) | Scriptable 手机和平板小组件 | 用户 |
| [LICENSE](../LICENSE) | 版权与使用限制 | 用户 |
| [README.md](../README.md) | 产品首页与下载入口 | 用户 |
| [SHA256SUMS.txt](../SHA256SUMS.txt) | 四文件完整性校验清单 | 用户与维护 |
| [package-lock.json](../package-lock.json) | 维护工具依赖版本锁定 | 维护 |
| [package.json](../package.json) | 维护命令和工具依赖入口 | 维护 |
| [release-manifest.json](../release-manifest.json) | 产品版本与交付对应清单 | 维护 |

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
| [docs/Income-per-sed（说明文档）.docx](../docs/Income-per-sed（说明文档）.docx) | Income-per-sed 使用手册 | 用户 |
| [docs/README.md](../docs/README.md) | 当前交付与验收状态索引 | 维护 |
| [docs/acceptance/maintenance-simplification-20261006.md](../docs/acceptance/maintenance-simplification-20261006.md) | 索引、测试入口与维护收敛验收记录 | 维护 |
| [docs/REPOSITORY_POLICY.md](../docs/REPOSITORY_POLICY.md) | 命名及维护发布规则 | 维护 |
| [Attachment/repository-map.md](repository-map.md) | 按阅读对象分类的仓库地图与全文件用途表 | 用户与维护 |
| [docs/calendar-maintenance.md](../docs/calendar-maintenance.md) | 年度内置日历手动替换清单 | 维护 |
| [docs/manual-maintenance.md](../docs/manual-maintenance.md) | 使用手册校验书签维护规则 | 维护 |
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
| [docs/releases/v2.5.4-rc.2.md](../docs/releases/v2.5.4-rc.2.md) | 2.5.4-rc.2 候选发布说明 | 维护与历史 |

## 维护脚本

| 实际路径 | 中文用途名 | 阅读对象 |
| --- | --- | --- |
| [Attachment/scripts-index.md](scripts-index.md) | 维护脚本用途与写入行为索引 | 维护 |
| [scripts/build-release-html.mjs](../scripts/build-release-html.mjs) | 从开发网页生成发布网页 | 维护 |
| [scripts/capture-readme-previews.mjs](../scripts/capture-readme-previews.mjs) | 采集首页浏览器展示图 | 维护 |
| [scripts/check_delivery_repeatability.py](../scripts/check_delivery_repeatability.py) | 连续构建一致性检查 | 维护 |
| [scripts/manual_checksum_bookmarks.py](../scripts/manual_checksum_bookmarks.py) | 手册校验书签读取与更新工具 | 维护 |
| [scripts/observe-runtime-resources.cjs](../scripts/observe-runtime-resources.cjs) | 长时运行资源观察工具 | 维护 |
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
| [tests/quality-entrypoints.test.mjs](../tests/quality-entrypoints.test.mjs) | 功能分组完整性与运行入口契约检查 | 维护 |
| [tests/input-device-motion.spec.js](../tests/input-device-motion.spec.js) | 输入设备与刷新率验收测试 | 维护 |
| [tests/interaction-handoff.spec.js](../tests/interaction-handoff.spec.js) | 连续操作接管测试 | 维护 |
| [tests/motion-feedback.spec.js](../tests/motion-feedback.spec.js) | 保存面板与局部动效反馈测试 | 维护 |
| [tests/settings-text-continuity.spec.js](../tests/settings-text-continuity.spec.js) | 设置卡片动画文字排版与显隐连续性测试 | 维护 |
| [tests/settings-local-motion.spec.js](../tests/settings-local-motion.spec.js) | 设置分层显现、口径文字交接、日历展开和滚轮明度测试 | 维护 |
| [tests/settings-scrollbar-handoff.spec.js](../tests/settings-scrollbar-handoff.spec.js) | 设置外壳交接期间的原生滚动条绘制与滚动空间检查 | 维护 |
| [tests/settings-refinements.spec.js](../tests/settings-refinements.spec.js) | 设置及快速回溯的局部反馈、拖动接管与滚动边界检查 | 维护 |
| [tests/settings-stability.spec.js](../tests/settings-stability.spec.js) | 设置滚动锚定、摘要布局、快速操作清理与读写耗时检查 | 维护 |
| [tests/settings-input-safety.spec.js](../tests/settings-input-safety.spec.js) | 不可见控件防误触、触屏手势意图及停靠后摘要播报测试 | 维护 |
| [tests/settings-frame-budget.spec.js](../tests/settings-frame-budget.spec.js) | 设置卡片实际帧间隔与样式计算开销观察 | 维护 |
| [tests/release-naming.test.mjs](../tests/release-naming.test.mjs) | 对外名称与版本对应测试 | 维护 |
| [tests/readme-preview-validation.test.mjs](../tests/readme-preview-validation.test.mjs) | 首页图片检查器测试 | 维护 |
| [tests/readout-sync.spec.js](../tests/readout-sync.spec.js) | 表盘与金额工时读数同步测试 | 维护 |
| [tests/recovery-combinations.spec.js](../tests/recovery-combinations.spec.js) | 多状态后台恢复组合测试 | 维护 |
| [tests/release-behavior.spec.js](../tests/release-behavior.spec.js) | 开发版与发布版业务一致性测试 | 维护 |
| [tests/release-channel.test.mjs](../tests/release-channel.test.mjs) | 发布标签识别测试 | 维护 |
| [tests/storage-resilience.spec.js](../tests/storage-resilience.spec.js) | 异常存储与页面恢复测试 | 维护 |
| [docs/acceptance/storage-runtime-20261003.md](../docs/acceptance/storage-runtime-20261003.md) | 保存可靠性与长时资源验收记录 | 维护 |
| [docs/acceptance/settings-delivery-20261005.md](../docs/acceptance/settings-delivery-20261005.md) | 设置局部反馈、输入安全与四文件交付验收 | 维护 |
| [docs/acceptance/runtime-observation-20261003.json](../docs/acceptance/runtime-observation-20261003.json) | 30 分钟资源观察原始采样证据 | 维护 |
| [tests/startup-history-playback.spec.js](../tests/startup-history-playback.spec.js) | 启动与历史播放运动测试 | 维护 |
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
