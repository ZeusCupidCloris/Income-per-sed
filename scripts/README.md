# 脚本用途索引

日常网页和小组件不需要运行这些工具。

| 文件 | 用途 | 写入行为 |
| --- | --- | --- |
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

执行顺序和命名规则仅在 [维护规则](../docs/REPOSITORY_POLICY.md) 定义。不要同时执行多个写入工具。全文件中文用途名见 [文件索引](../docs/repository-map.md)。

文档有效性运行 `npm run test:docs`，同时也由既有 `npm run test:readme` 执行，不修改工作流。覆盖文件用途表和 Git 管理或待提交文件、脚本与测试索引、Markdown 内部链接和章节、HTML 图片或链接、参考式链接；忽略代码块和行内代码。不联网检查外部网址，不推断“无人引用即无用”，不解析 Word 内部链接。不要在仓库内放未忽略的临时文件，否则检查会提示缺少用途条目。
