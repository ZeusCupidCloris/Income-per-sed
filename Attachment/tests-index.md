# 测试索引

这里是维护工具，不是运行网页必需的文件。结果只适用于被测提交；模拟后台、模拟时钟及 Scriptable 替身均不等于实体设备通过。

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
| 局部动效预览 | motion-feedback.spec.js | 保存结果、反向开合、错误占位、码表暂停、连续回溯、默认关闭的吸附实验及多窗口；直接测试 Develop |
| 交叉操作 | recovery-cross-actions.spec.js | 恢复过程中设置与主题切换、历史播放保存设置、码表跨零点；模拟时间 |
| 双版本行为 | release-behavior.spec.js | 实际 Develop 与 Push 的设置持久化、移动端回溯恢复及计算结果一致性 |
| 小组件异常配置 | widget-settings.cjs | 缺失与损坏配置、保存和下载失败、标准文件名、刷新边界；使用 Scriptable 替身 |
| 小组件一致性 | widget-parity.spec.js | 三种工资模式、完整内置日历、金额缩写；Scriptable 日期接口使用测试适配 |
| 输入设备与刷新率 | input-device-motion.spec.js | 固定工作日业务时间，动画时钟继续 |
| 背景 | background-grid.spec.js | 空闲绘制、鼠标画布变化、降级；Develop/Push 十轮模拟后台恢复，检查后台零绘制、最多一个待执行帧、恢复交互与自然静止；Edge 与 WebKit |
| 异常存储 | storage-resilience.spec.js | 浏览器存储不可用与损坏 |
| 页面视觉 | visual.spec.js | 既有截图基线，不随测试失败重建 |
| WebKit | webkit-mobile.spec.js、background-grid.spec.js、cross-date-month.spec.js、recovery-combinations.spec.js | 默认发布检查包含手机尺寸冒烟、背景绘制与恢复组合；不等于真实 iPhone |
| 发布与资源 | test_prepare_delivery.py、release-channel.test.mjs、readme-preview-validation.test.mjs | 构建与资源一致性 |
| 文档有效性 | document-index-validation.test.mjs | 检查器的遗漏、重复、失效地址、章节及中文路径测试；不修改交付 |
| 文件命名 | release-naming.test.mjs | 既定对外名称、版本与交付编号规则 |
| 部署结构 | workflow-contract.test.mjs | 静态约束；仍需 GitHub 实际运行验收 |

公共时钟辅助函数放在 helpers/business-clock.js，仅为内容稳定场景固定业务日期，不冻结动画时钟。启动与后台时间推进测试继续单独控制时钟，不强行统一。

`helpers/background-recovery.js` 仅供恢复专项使用：测试时钟按固定步长推进，避免 CI 操作耗时改变中断位置；业务结果由测试固定日期和独立算式计算，不调用页面收入引擎。

执行入口保持 package.json 现有命令。失败不得通过减少断言、改截图或单纯增加重试掩盖。

文件中文用途名统一查 [全文件索引](repository-map.md)，命名与发布约定以 [维护规则](../docs/REPOSITORY_POLICY.md) 为准。此页只维护测试用途、运行入口和证据边界，不另定义版本规则。

仅验收 Develop 预览时，设置环境变量 `DEVELOP_PREVIEW=1` 再运行 `npm test` 和 `npm run test:webkit`。既有视觉及 WebKit 冒烟检查会指向 Develop，WebKit 同时运行局部动效测试。默认发布检查对恢复组合同时验证 Develop 和 Push，既有视觉及手机冒烟使用 Push，不更新截图。仅预览期间不要执行 `quality:local`，它会重新生成 Push。

发布前运行 `npm run release:repeatability`：要求已有发布包在连续两次生成后，四文件、发布清单和校验清单全部保持一致。此命令会执行构建，应串行运行，不与其他生成操作并发。
