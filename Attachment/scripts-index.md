# 脚本用途索引

网页与小组件用户无需安装或运行这些工具。这里只维护命令和写入边界；结果见[验收索引](../docs/README.md)。

## 三个主要入口

| 任务 | 命令 | 范围 |
| --- | --- | --- |
| 快速检查 | `npm run check` | 发布规则、小组件替身、索引与图片、生成一致性和校验值；不启动浏览器 |
| 功能专项 | `npm run check:focus -- --group settings --browser both` | 只选择相关功能，保留该组全部断言；两浏览器串行 |
| 完整验收 | `npm run check:full` | 快速检查、Edge 全量、WebKit 既有兼容性范围，串行运行 |

三者均不生成或改写四文件，会产生临时测试报告。功能组可选 `data`、`recovery`、`settings`、`layout`、`release`；浏览器可选 `edge`（默认）、`webkit`、`both`。WebKit 不是全量 Edge 的副本，实际范围仍由浏览器配置决定。

可附加 `--list`查看浏览器用例；非浏览器检查仍实际运行。首次维护或依赖锁文件变化后执行 `npm ci`。不要同时运行多个浏览器命令，它们共用本地端口。

Windows PowerShell 运行带参数的功能专项时使用 `npm.cmd run check:focus -- --group settings --browser both`，避免某些 npm PowerShell 包装器吞掉双横线参数。其他平台使用上表命令。

## 内部生成与专项工具

- 生成交付：`npm run release:prepare`。只有明确要更新 Push、手册校验值和清单时才运行。
- 重复构建：`npm run release:repeatability`，会执行生成，串行运行。
- 帧开销观察：`npm run test:observe`，手动 Edge 专项，不纳入默认完整回归；采样值用于同机对比，不当作跨设备评分。
- 长时资源观察：`node scripts/observe-runtime-resources.cjs <报告路径> --minutes 30 --sample-seconds 30`。模拟后台不等于系统冻结、实机后台或真实跨夜。
- Develop 预览：维护者可设置 `DEVELOP_PREVIEW=1`；生成版设置反馈检查可设置 `SETTINGS_RELEASE_CHANNEL=push`。这些是内部选择，不增加用户设置。
- 旧 `test:checks`、`test:recovery`、`test:layout`、`test:settings`、`npm test`、`test:webkit`保留供 CI 与既有调用使用，日常不需要记忆它们。
- `quality:local`是保留的交付生成流程，会修改交付，不属于三个只读检查入口。

## 全部脚本用途

| 文件 | 用途 | 写入行为 |
| --- | --- | --- |
| run-quality.mjs | 三个主要检查入口、五组专项及手动观察；顺序执行并遇错停止 | 测试报告，不生成交付 |
| quality-scope.mjs | CI 比较本次改动，选择原有专项；不能可靠识别时全测，汇总检查拒绝失败或缺失 | CI 摘要与测试报告，不改交付 |
| install-ci-dependencies.mjs | CI 安装有限重试与超时终止 | 依赖目录 |
| build-release-html.mjs | Develop 生成压缩 Push；--check 核对是否可复现 | --write 写 Push |
| prepare_delivery.py | 生成 Push，同步手册书签和校验清单 | 修改交付 |
| manual_checksum_bookmarks.py | 按文件名书签定位说明书校验值 | 由构建调用 |
| validate_delivery.py | 版本、语法、手册及校验清单检查 | 默认只读 |
| validate-document-index.mjs | 全文件用途、脚本测试遗漏、内部链接与章节检查 | 只读 |
| check_delivery_repeatability.py | 连续构建两次，检查是否完全一致 | 会生成交付 |
| capture-readme-previews.mjs | 首页三张实际浏览器截图及来源 | 修改图片与来源清单 |
| readme-preview-validation.mjs | 图片校验公共函数 | 不写入 |
| validate-readme-previews.mjs | 首页图片及来源检查 | 不写入 |
| verify_published_pages.py | 线上首页和 Push 与本地字节比较 | 不写交付 |
| release-channel.mjs | 判断候选或正式标签 | 不写入 |
| run-python.mjs | 选择 Python 并调用维护脚本 | 由被调用脚本决定 |
| serve-test-pages.mjs | 本地静态测试服务 | 不写入 |
| observe-runtime-resources.cjs | 空闲、历史播放、设置开关及恢复的资源采样 | 写报告 |

[维护策略](../docs/REPOSITORY_POLICY.md)定义发布规则；[测试索引](tests-index.md)定义覆盖职责；[仓库地图](repository-map.md)维护全部路径。文档检查不联网、不解析 Word 内部链接，也不把“没有引用”视为删除理由。
