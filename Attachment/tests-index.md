# 测试用途索引

只维护职责和覆盖边界，不保存每轮执行结果；结果见[验收索引](../docs/README.md)，命令参数见[脚本索引](scripts-index.md#三个主要入口)。

## 五类覆盖矩阵

| 功能组 | 参数 | 主要职责 | 不是重复的边界 |
| --- | --- | --- | --- |
| 计算与存储 | `data` | 收入算式、小组件一致性、网页和组件异常设置 | Scriptable 替身不等于浏览器存储，也不等于实体 iPhone |
| 恢复与回溯 | `recovery` | 后台交接、输入接管、跨日期、历史播放 | 轨道位置、读数同步、月收入算式及浏览器冻结是独立断言 |
| 设置交互 | `settings` | 开合、滚动、焦点、手势、错误反馈与清理 | 动画路径、文字交接、滚动锚定与输入安全不能只留一个截图 |
| 布局与视觉 | `layout` | 长金额、网格、页面截图、手机边界 | 几何断言与像素基线不是相同证据 |
| 发布一致性 | `release` | 构建、命名、校验、工具约束、双版本行为 | 只测 Develop 不能证明生成 Push 一致 |

唯一分组表为[config/test-groups.cjs](../config/test-groups.cjs)。每份可运行测试恰好属于一组，遗漏、重复或失效条目会被自动检查拒绝。按功能选择，不再按交付日期创建新测试套件。

Edge 保留全部功能断言；WebKit 保留[现有兼容性子集](../config/playwright-webkit.config.js)。双浏览器专项不代表两者有完全相同的文件数量。基于 CDP 的冻结专项只在 Edge 执行。帧开销 `settings-frame-budget.spec.js`明确为手动观察，归设置组但不进入默认完整回归。

## 初始化与断言收敛

三份设置测试共用 `helpers/settings-page.js`，只统一页面选择、动效模式和展开操作；原来的 520/550ms 等待与各自断言保留。使用暂停时钟、中间帧或特定视口的测试保留专用初始化，不强行套用共同函数。

未删除工资模式、两种网页版本、浅深主题、手机尺寸、输入反向、存储失败或最后一帧边界。相似测试只有在操作前提与断言完全等价时才合并，本轮没有发现可以安全删除的整份功能测试。

## 全部测试用途

| 范围 | 文件 | 边界 |
| --- | --- | --- |
| 启动与历史运动 | startup-history-playback.spec.js | 后台是模拟，不代表实机锁屏 |
| 前台恢复 | foreground-resume.spec.js | 同日、跨日、上午开工及午休结束；模拟后台，不代表系统休眠 |
| 恢复进度 | foreground-progress.spec.js | 两段工作轨道、拨钮位置及恢复交接的同帧边界 |
| 读数同步 | readout-sync.spec.js | 主针、金额、工时、剩余时间及月收入共同使用统一显示时间 |
| 跨日期月收入 | cross-date-month.spec.js | Develop/Push、三种工资模式、次日和工作日/休息日跨月；独立算式校验最终金额；Edge 与 WebKit |
| 恢复组合 | recovery-combinations.spec.js | 恢复中再次隐藏、跨日恢复中回溯后返回实时；三种工资模式及双版本；模拟后台，不代表实机 |
| 连续接管 | interaction-handoff.spec.js | 前台恢复、历史播放、返回实时途中滚轮接管与显示值连续性 |
| 局部动效预览 | motion-feedback.spec.js | 保存结果、反向开合、错误占位、码表暂停、连续回溯、默认关闭的吸附实验及多窗口；Develop 两种设置展开覆盖完整开合时长一致、遮罩同步、浅深主题、桌面手机、纵向先行、窗口调整、保存收回、错误修正、后台中断和清理；短视口与后台模拟不代表手机键盘或实机验收 |
| 设置文字连续性 | settings-text-continuity.spec.js | Develop 动画副本与原卡片的文字排版一致性、面板文字固定坐标和透明度连续性；桌面浏览器自动检查，不替代实机流畅度验收 |
| 设置局部动效 | settings-local-motion.spec.js | 分层显现、日历反向展开、收入口径文字交接和滚轮明度；设置 SETTINGS_RELEASE_CHANNEL=push 可验证生成的 Push |
| 设置滚动条交接 | settings-scrollbar-handoff.spec.js | Develop 展开及关闭期间隐藏滚动条绘制，保留滚动空间；桌面、手机宽度、中途反向和减少动态效果 |
| 设置细节精修 | settings-refinements.spec.js | 滚动条淡入、口径底板与日历反向接管、错误占位、快速回溯拖动归位及来源反馈、保存后读数交接、时间滚轮渐隐和滚动边界；原生动画时钟中间帧检查，SETTINGS_RELEASE_CHANNEL=push 验证生成版 |
| 设置稳定性 | settings-stability.spec.js | 日历及错误滚动锚定、摘要固定读数、高频操作清理和同帧几何读写；性能采样仅用于定位本机耗时 |
| 设置输入安全 | settings-input-safety.spec.js | 展开早期防误触、关闭接管、触屏意图及停靠后摘要播报；可用 SETTINGS_RELEASE_CHANNEL=push 检查 Push；模拟不替代 iPhone 和 VoiceOver 实机验收 |
| 设置帧开销观察 | settings-frame-budget.spec.js | Edge 中实际采样两种设置卡片的帧间隔与布局、样式计算开销；用于同机对比，不用固定帧率阈值判断所有设备 |
| 交叉操作 | recovery-cross-actions.spec.js | 恢复过程中设置与主题切换、历史播放保存设置、码表跨零点；模拟时间 |
| 双版本行为 | release-behavior.spec.js | 实际 Develop 与 Push 的两种设置展开轨迹、设置持久化、移动端回溯恢复及计算结果一致性；Edge 与 WebKit |
| 小组件异常配置 | widget-settings.cjs | 缺失与损坏配置、保存和下载失败、标准文件名、刷新边界；使用 Scriptable 替身 |
| 长内容布局 | long-amount-layout.spec.js | 真实设置驱动 8、9、10 位整数金额；双版本、浅深主题、390/1440px，检查窗格边缘；Edge 与 WebKit |
| 小组件一致性 | widget-parity.spec.js | 三种工资模式、完整内置日历、金额缩写；Scriptable 日期接口使用测试适配 |
| 输入设备与刷新率 | input-device-motion.spec.js | 固定工作日业务时间，动画时钟继续 |
| 背景 | background-grid.spec.js | 空闲绘制、鼠标画布变化、降级；Develop/Push 十轮模拟后台恢复，检查后台零绘制、最多一个待执行帧、恢复交互与自然静止；Edge 与 WebKit |
| 异常存储 | storage-resilience.spec.js | 浏览器存储不可用与损坏；Develop/Push 临时键及主键写入失败时保留旧配置、清理临时键并允许重试；收入/工时保存中关闭或模拟后台恢复；多窗口分别保存收入与工时后刷新核对；Edge 与 WebKit，不代表实机后台 |
| 页面视觉 | visual.spec.js | 既有截图基线，不随测试失败重建 |
| WebKit 冒烟 | webkit-mobile.spec.js | WebKit 专属基础启动和手机回溯面板边界；其余文件的浏览器范围以 config/playwright-webkit.config.js 中的 testMatch 为唯一来源，避免维护第二份容易遗漏的名单；默认发布与 Develop 预览范围不同，不等于真实 iPhone |
| 发布与资源 | test_prepare_delivery.py、release-channel.test.mjs、readme-preview-validation.test.mjs | 构建与资源一致性 |
| 文档有效性 | document-index-validation.test.mjs | 检查器的遗漏、重复、失效地址、章节及中文路径测试；不修改交付 |
| 文件命名 | release-naming.test.mjs | 既定对外名称、版本、交付编号，以及验收索引当前版本一致性 |
| 部署结构 | workflow-contract.test.mjs | 静态约束；仍需 GitHub 实际运行验收 |
| 安装稳定性 | install-ci-dependencies.test.mjs | 成功不重试、失败最多两次、真实子进程超时终止 |
| 浏览器生命周期 | browser-lifecycle.spec.js | Edge 实际 BFCache 冻结与返回、三轮计时器暂停证据、冻结结合模拟五小时墙钟差；不等于实体电脑休眠或真实跨夜 |
| 检查入口与分组 | quality-entrypoints.test.mjs | 每份用例唯一归属、组内断言不遗漏、手动观察不混入完整回归、参数错误直接失败 |

## 辅助工具

- `helpers/business-clock.js`：为内容稳定场景固定业务日期，不冻结动画时钟。
- `helpers/background-recovery.js`：恢复专项固定步长推进；最终业务值仍用独立算式计算。
- `helpers/settings-page.js`：普通设置测试的共同初始化；不处理暂停时钟和中间帧采样。

默认 Playwright 只收集 `*.spec.js`。Node `*.test.mjs`、小组件 `widget-settings.cjs`和 Python `test_prepare_delivery.py`由快速检查运行，避免在浏览器收集阶段重复执行或产生副作用。

## 失败处理

首次失败保存轨迹、交接帧、越界元素和页面错误；重试成功仍记为偶发，不写成首次通过。不得通过放宽断言、更新截图或增加重试掩盖问题。性能样本只用于同机定位，不以固定帧率评价所有设备。

自动浏览器、模拟后台和 Scriptable 替身不等于实体设备、真实睡眠或跨夜。旧调查结果移出用途索引，不据此认定当前故障仍存在或已修复。

[全文件用途](repository-map.md) · [当前验收状态](../docs/README.md) · [CI 评估](../docs/maintainer/workflow-review.md)
