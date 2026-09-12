# 测试索引

| 范围 | 文件 | 边界 |
| --- | --- | --- |
| 启动与历史运动 | startup-history.spec.js | 后台是模拟，不代表实机锁屏 |
| 前台恢复 | foreground-resume.spec.js | 同日、跨日、上午开工及午休结束；模拟后台，不代表系统休眠 |
| 输入设备与刷新率 | input-acceptance.spec.js | 固定工作日业务时间，动画时钟继续 |
| 背景 | ambient-backdrop.spec.js | 空闲绘制、鼠标画布变化、降级；已知稳定性问题见维护记录 |
| 异常存储 | resilience.spec.js | 浏览器存储不可用与损坏 |
| 页面视觉 | visual.spec.js | 既有截图基线，不随测试失败重建 |
| WebKit | webkit.spec.js | 手机尺寸冒烟，不等于真实 iPhone |
| 发布与资源 | test_prepare_release.py、release_channel.test.mjs、readme_assets.test.mjs | 构建与资源一致性 |
| 部署结构 | workflow-contract.test.mjs | 静态约束；仍需 GitHub 实际运行验收 |

公共时钟辅助函数放在 helpers/clock.js，仅为内容稳定场景固定业务日期，不冻结动画时钟。启动与后台时间推进测试继续单独控制时钟，不强行统一。

执行入口保持 package.json 现有命令。失败不得通过减少断言、改截图或单纯增加重试掩盖。
