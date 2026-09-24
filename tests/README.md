# 测试索引

| 范围 | 文件 | 边界 |
| --- | --- | --- |
| 启动与历史运动 | startup-history.spec.js | 后台是模拟，不代表实机锁屏 |
| 前台恢复 | foreground-resume.spec.js | 同日、跨日、上午开工及午休结束；模拟后台，不代表系统休眠 |
| 连续接管 | interaction-handoff.spec.js | 前台恢复、历史播放、返回实时途中滚轮接管与显示值连续性 |
| 局部动效预览 | motion-feedback.spec.js | 保存结果、反向开合、错误占位、码表暂停、连续回溯、默认关闭的吸附实验及多窗口；直接测试 Develop |
| 交叉操作 | cross-actions.spec.js | 恢复过程中设置与主题切换、历史播放保存设置、码表跨零点；模拟时间 |
| 双版本行为 | release-behavior.spec.js | 实际 Develop 与 Push 的设置持久化、移动端回溯恢复及计算结果一致性 |
| 小组件异常配置 | widget-settings.cjs | 缺失与损坏配置、保存和下载失败、标准文件名、刷新边界；使用 Scriptable 替身 |
| 小组件一致性 | widget-parity.spec.js | 三种工资模式、完整内置日历、金额缩写；Scriptable 日期接口使用测试适配 |
| 输入设备与刷新率 | input-acceptance.spec.js | 固定工作日业务时间，动画时钟继续 |
| 背景 | ambient-backdrop.spec.js | 空闲绘制、鼠标画布变化、降级；已知稳定性问题见维护记录 |
| 异常存储 | resilience.spec.js | 浏览器存储不可用与损坏 |
| 页面视觉 | visual.spec.js | 既有截图基线，不随测试失败重建 |
| WebKit | webkit.spec.js | 手机尺寸冒烟，不等于真实 iPhone |
| 发布与资源 | test_prepare_release.py、release_channel.test.mjs、readme_assets.test.mjs | 构建与资源一致性 |
| 部署结构 | workflow-contract.test.mjs | 静态约束；仍需 GitHub 实际运行验收 |

公共时钟辅助函数放在 helpers/clock.js，仅为内容稳定场景固定业务日期，不冻结动画时钟。启动与后台时间推进测试继续单独控制时钟，不强行统一。

执行入口保持 package.json 现有命令。失败不得通过减少断言、改截图或单纯增加重试掩盖。

仅验收 Develop 预览时，设置环境变量 `DEVELOP_PREVIEW=1` 再运行 `npm test` 和 `npm run test:webkit`。既有视觉及 WebKit 冒烟检查会指向 Develop，WebKit 同时运行局部动效测试。默认发布检查仍使用 Push，不更新截图。预览期间不要执行 `quality:local`，它会重新生成 Push。

发布前运行 `npm run release:repeatability`：要求已有发布包在连续两次生成后，四文件、发布清单和校验清单全部保持一致。此命令会执行构建，应串行运行，不与其他生成操作并发。
