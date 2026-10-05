# 测试索引

这里是维护工具，不是运行网页必需的文件。结果只适用于被测提交；模拟后台、模拟时钟及 Scriptable 替身均不等于实体设备通过。

## 执行分级

- 日常只读检查：`npm run test:checks`。包含发布规则、小组件替身、首页和文档检查、Push 构建一致性及四文件校验，不重新生成交付。
- 专项排查：按修改范围选择 `test:recovery`（恢复）、`test:layout`（金额边界与页面布局）或 `test:settings`（设置交互与存储）。这些是已有用例的筛选入口，不是新的一套重复测试。
- 完整验收：依次运行 `npm test`、`npm run test:webkit`；发布前再执行日常检查。两个浏览器不要同时运行，它们共用测试端口。
- 性能观察：`npm run test:observe`，仅采集本机帧和布局开销，不作为跨设备帧率评分。半小时资源观察仍为手动专项，不加入每次 PR。

`test:readme` 已包含 `test:docs`，运行前者后无需重复运行后者。`quality:local` 会生成 Push，不属于只读检查。专项入口之间可以交叉；已经完整验收时，不必再重复全部专项入口。

## 覆盖职责与收敛原则

全部测试按下表归属；没有发现可以不损失独立断言而直接删除的整份测试。相似场景区分以下职责，不将它们当作重复：

- 恢复：`foreground-resume` 看运动交接；`foreground-progress` 看两段轨道和拨钮；`readout-sync` 看读数同帧；`cross-date-month` 看跨月独立算式；`recovery-combinations` 看中途操作；`browser-lifecycle` 看真实浏览器冻结与缓存。
- 设置：`motion-feedback` 看外壳路径和操作反馈；`settings-text-continuity` 看文字及最后一帧；`settings-local-motion` 看区域过渡；`settings-stability` 看滚动锚定与清理；`settings-input-safety` 看误触、手势与读屏；`storage-resilience` 看持久化失败和并发保存。
- 发布：`release-behavior` 核对生成后的行为，不能用只测 Develop 替代；Edge 和 WebKit 检查不同引擎，不合并成单浏览器。

后续新增回归优先放入已有职责文件，复用合适的时钟辅助函数，不再按每轮交付新建测试文件。不得为了减少数量删掉浏览器、工资模式或中断状态的独立覆盖。当前 CI 完整关卡、重试次数和截图基线不变。

## 偶发失败取证

两项 CI 首次失败分别记录了恢复交接反向约 5.89 度、长金额过程横向越界 5px。本地原版三轮共 12 次检查均通过，不能据此认定故障已修复。

恢复测试保留真实动画时钟检查，另补非整帧起点的固定推进用例；失败消息附交接前后帧。长金额采样附操作阶段、时间、视口和越界元素，停止时同时清理帧和延迟任务。原有边界断言未放宽。

补充取证后的 Edge 五轮共 20 次检查通过，包括原有真实时钟、非整帧恢复起点及 1440px 浅色长金额组合。恢复完成处的整秒写入是待核实路径，不是已经确认的故障根因：当前代码会预先对齐名义结束时间，还需失败帧的业务时钟与动画时钟证据判断实际交接。未调整主表盘、金额缩放、缓动、时长或截图。

WebKit 长金额运动四种尺寸/主题组合全部通过（390/1440px、浅/深主题）；只读发布检查通过。以上为本轮专项结果，不冒充完整 Edge/WebKit 全量复验；工作流取证改动仍未推送，尚待实际 CI 验证。

工作流在未取消时上传浏览器诊断，因此首次失败、重试成功也能保留证据。报告中的 flaky 不能写成首次通过；先查看原始轨迹再决定改页面还是测试时序。模拟通过不代表实机通过。

| 命令 | 用途 |
| --- | --- |
| npm run test:release | 构建、说明书、命名与工作流约束 |
| npm run test:widget | 小组件配置异常逻辑，测试替身 |
| npm test | Edge 业务、交互与截图对比 |
| npm run test:webkit | WebKit 手机尺寸与恢复行为，不代表 iPhone 实机 |
| npm run test:readme | 首页图片及来源完整性 |
| npm run test:docs | 文件用途表、目录用途索引与内部链接有效性；不联网检查外部地址 |
| npm run release:repeatability | 连续构建一致性，会写入交付 |

`release-naming.test.mjs` 检查标题、组件版本与交付编号。`readout-sync.spec.js` 检查读数与统一运动时间；`foreground-progress.spec.js` 检查恢复进度和拨钮。截图基线位于 `visual.spec.js-snapshots/`，辅助工具位于 `helpers/`。

| 范围 | 文件 | 边界 |
| --- | --- | --- |
| 启动与历史运动 | startup-history-playback.spec.js | 后台是模拟，不代表实机锁屏 |
| 前台恢复 | foreground-resume.spec.js | 同日、跨日、上午开工及午休结束；模拟后台，不代表系统休眠 |
| 跨日期月收入 | cross-date-month.spec.js | Develop/Push、三种工资模式、次日和工作日/休息日跨月；独立算式校验最终金额；Edge 与 WebKit |
| 恢复组合 | recovery-combinations.spec.js | 恢复中再次隐藏、跨日恢复中回溯后返回实时；三种工资模式及双版本；模拟后台，不代表实机 |
| 连续接管 | interaction-handoff.spec.js | 前台恢复、历史播放、返回实时途中滚轮接管与显示值连续性 |
| 局部动效预览 | motion-feedback.spec.js | 保存结果、反向开合、错误占位、码表暂停、连续回溯、默认关闭的吸附实验及多窗口；Develop 两种设置展开覆盖完整开合时长一致、遮罩同步、浅深主题、桌面手机、纵向先行、窗口调整、保存收回、错误修正、后台中断和清理；短视口与后台模拟不代表手机键盘或实机验收 |
| 设置文字连续性 | settings-text-continuity.spec.js | Develop 动画副本与原卡片的文字排版一致性、面板文字固定坐标和透明度连续性；桌面浏览器自动检查，不替代实机流畅度验收 |
| 设置局部动效 | settings-local-motion.spec.js | 分层显现、日历反向展开、收入口径文字交接和滚轮明度；设置 SETTINGS_RELEASE_CHANNEL=push 可验证生成的 Push |
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
| 文件命名 | release-naming.test.mjs | 既定对外名称、版本与交付编号规则 |
| 部署结构 | workflow-contract.test.mjs | 静态约束；仍需 GitHub 实际运行验收 |
| 安装稳定性 | install-ci-dependencies.test.mjs | 成功不重试、失败最多两次、真实子进程超时终止 |
| 浏览器生命周期 | browser-lifecycle.spec.js | Edge 实际 BFCache 冻结与返回、三轮计时器暂停证据、冻结结合模拟五小时墙钟差；不等于实体电脑休眠或真实跨夜 |

公共时钟辅助函数放在 helpers/business-clock.js，仅为内容稳定场景固定业务日期，不冻结动画时钟。启动与后台时间推进测试继续单独控制时钟，不强行统一。

`helpers/background-recovery.js` 仅供恢复专项使用：测试时钟按固定步长推进，避免 CI 操作耗时改变中断位置；业务结果由测试固定日期和独立算式计算，不调用页面收入引擎。

执行入口以 package.json 为准。失败不得通过减少断言、改截图或单纯增加重试掩盖。

文件中文用途名统一查 [全文件索引](repository-map.md)，命名与发布约定以 [维护规则](../docs/REPOSITORY_POLICY.md) 为准。此页只维护测试用途、运行入口和证据边界，不另定义版本规则。

仅验收 Develop 预览时，设置环境变量 `DEVELOP_PREVIEW=1` 再运行 `npm test` 和 `npm run test:webkit`。既有视觉及 WebKit 冒烟检查会指向 Develop，WebKit 同时运行局部动效测试。默认发布检查对恢复组合同时验证 Develop 和 Push，既有视觉及手机冒烟使用 Push，不更新截图。仅预览期间不要执行 `quality:local`，它会重新生成 Push。

发布前运行 `npm run release:repeatability`：要求已有发布包在连续两次生成后，四文件、发布清单和校验清单全部保持一致。此命令会执行构建，应串行运行，不与其他生成操作并发。
