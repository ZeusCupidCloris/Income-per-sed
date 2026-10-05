# 脚本用途索引

日常网页和小组件不需要运行这些工具。

## 按任务选择

| 等级 | 什么时候用 | 命令 | 是否改文件 |
| --- | --- | --- | --- |
| 日常检查 | 仅整理文档、入口或索引 | `npm run test:docs` | 否 |
| 日常检查 | 首页文字、图片或图片来源变化 | `npm run test:readme`，已包含文档检查，不必再重复执行 | 否 |
| 日常检查 | 核查网页构建和当前交付一致性 | `npm run build:check`、`npm run validate` | 否 |
| 日常检查 | 发布规则、组件逻辑、文档和交付只读总检查 | `npm run test:checks` | 不生成交付，测试可写临时报告 |
| 完整验收 | 网页、组件、交付或维护工具发生实质修改；合并或交付前 | `npm run quality:local` | 会生成并同步交付，先保留原文件并检查差异 |
| 完整验收 | 确认生成产物可重复 | `npm run release:repeatability` | 连续构建写入，必须串行 |
| 专项排查 | 小组件设置异常 | `npm run test:widget` | 测试替身，不等于实机验证 |
| 专项排查 | 指定网页问题 | `npm test -- <测试文件>`；手机模拟用 `npm run test:webkit -- <测试文件>` | 可能写测试报告，不修改产品；文件范围见测试索引 |
| 专项排查 | 恢复、布局或设置问题 | `npm run test:recovery`、`npm run test:layout`、`npm run test:settings`，只选相关一类 | 筛选已有用例，完整测试已运行时不重复全跑 |
| 专项排查 | 设置展开帧和布局开销 | `npm run test:observe` | 写观察附件，不设跨设备统一帧率阈值 |
| 专项排查 | 运行资源或线上文件异常 | `node scripts/observe-runtime-resources.cjs <输出路径>`；线上校验使用 `verify_published_pages.py` | 观察可能写报告；线上核验不写交付 |

首次维护或依赖锁定文件变化后先运行 `npm ci`，它会写入依赖目录。上表不是绕过远程必需检查的许可：本地按改动选择，PR/main 仍沿用全部质量关卡。

截图采集、交付生成、校验清单写入属于有意更新操作，不列作日常只读检查。工具细项见下表；不要同时运行多个写入工具。

资源观察默认运行约 4 分钟；长时专项手动使用 `node scripts/observe-runtime-resources.cjs <报告路径> --minutes 30 --sample-seconds 30`，不加入每次 PR 的等待流程。四段分别观察空闲、历史播放、收入与工时设置反复开关、模拟隐藏与恢复。报告包含浏览器版本、被测文件 SHA-256、实际采样时间、强制回收后的堆内存、节点和监听器数量、绘制状态及页面错误。比较同类状态是否逐轮累积，不使用统一的绝对内存门槛；模拟隐藏不等于浏览器真正冻结、实机后台或真实跨夜验收。

## 全部脚本用途

| 文件 | 用途 | 写入行为 |
| --- | --- | --- |
| install-ci-dependencies.mjs | CI 依赖安装最多两次，npm 单次 5 分钟、WebKit 单次 7 分钟；失败保留错误，不重试测试 | 写依赖目录，不改四文件 |
| build-release-html.mjs | 从 Develop 生成压缩 Push | --write 写入；--check 只检查 |
| prepare_delivery.py | 生成 Push、同步手册校验值和清单 | 修改交付 |
| manual_checksum_bookmarks.py | 按文件名书签定位说明书校验值 | 供构建调用 |
| validate_delivery.py | 版本、语法、说明书及校验清单检查 | 默认只读；--write-checksums 写清单 |
| validate-document-index.mjs | 全文件用途表、脚本测试用途遗漏、Markdown 内部文件及章节链接检查 | 只读，不联网、不删除无引用文件 |
| check_delivery_repeatability.py | 连续构建两次检查一致性 | 执行构建，串行运行 |
| capture-readme-previews.mjs | 首页三张真实浏览器截图 | 写图片与来源清单 |
| readme-preview-validation.mjs | 图片校验公共函数 | 不写入 |
| validate-readme-previews.mjs | 校验首页图片及来源 | 不写入 |
| verify_published_pages.py | 比较线上与本地 Push 字节 | 不写入 |
| release-channel.mjs | 判断候选或正式标签 | 不写入 |
| run-python.mjs | 选择 Python 并调用维护脚本 | 由被调用脚本决定 |
| serve-test-pages.mjs | 本地静态测试服务 | 不写入 |
| observe-runtime-resources.cjs | 开发资源观察 | 不作为实机结论；详见脚本参数 |

执行顺序和命名规则仅在 [维护规则](../docs/REPOSITORY_POLICY.md) 定义。不要同时执行多个写入工具。全文件中文用途名见 [文件索引](repository-map.md)。

文档有效性运行 `npm run test:docs`，同时也由既有 `npm run test:readme` 执行，不修改工作流。覆盖文件用途表和 Git 管理或待提交文件、脚本与测试索引、Markdown 内部链接和章节、HTML 图片或链接、参考式链接；忽略代码块和行内代码。不联网检查外部网址，不推断“无人引用即无用”，不解析 Word 内部链接。不要在仓库内放未忽略的临时文件，否则检查会提示缺少用途条目。
